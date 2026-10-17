'use client';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

type GoogleIdentity = {
  initialize: (config: { client_id: string; nonce: string; auto_select: boolean; callback: (response: { credential: string }) => void }) => void;
  renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string; shape: string; width: number; locale: string }) => void;
};
declare global { interface Window { google?: { accounts: { id: GoogleIdentity } } } }

async function request(path: string, body?: object) {
  const response = await fetch(`/api/v1/teacher${path}`, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Login belum berhasil. Silakan coba kembali.');
  return data;
}

export default function LoginPage() {
  const [config, setConfig] = useState<{ google_enabled: boolean; client_id: string | null } | null>(null);
  const [ready, setReady] = useState(false);
  const [buttonReady, setButtonReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const button = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);
  useEffect(() => {
    let live = true;
    request('/auth/config').then(data => { if (live) setConfig(data); }).catch(e => { if (live) setError(e.message); });
    fetch('/api/v1/teacher/me', { cache: 'no-store' }).then(r => { if (live && r.ok) window.location.replace('/dashboard'); }).catch(() => {});
    return () => { live = false; };
  }, []);
  useEffect(() => {
    if (!ready || !config?.client_id) return;
    let live = true;
    setButtonReady(false); setError('');
    request('/auth/challenge', {}).then(({ nonce }) => {
      if (!live || !button.current || !window.google) return;
      window.google.accounts.id.initialize({ client_id: config.client_id!, nonce, auto_select: false, callback: async ({ credential }) => {
        if (!live || submitting.current) return;
        submitting.current = true; setBusy(true); setError('');
        try { await request('/auth/google', { credential }); window.location.replace('/dashboard'); }
        catch (e) { if (live) setError((e as Error).message); }
        finally { submitting.current = false; if (live) setBusy(false); }
      } });
      window.google.accounts.id.renderButton(button.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: Math.min(400, button.current.clientWidth), locale: 'id' });
      setButtonReady(true);
    }).catch(e => { if (live) setError(e.message); });
    return () => { live = false; button.current?.replaceChildren(); };
  }, [ready, config, retry]);
  return <main className="teacher-login">
    <a href="/" className="text-button">← Kembali ke beranda</a>
    <section className="teacher-login-box">
      <a href="/" aria-label="Beranda RuangRPP"><img src="/logo-ruangRPP-transparent.png" alt="RuangRPP" height="38" /></a>
      <h1>Masuk ke ruang guru</h1>
      <p>Gunakan akun Google Bapak/Ibu. Akun RuangRPP dibuat saat pertama kali masuk.</p>
      {!config && !error && <p role="status" className="hint">Memeriksa ketersediaan login...</p>}
      {config?.google_enabled && <>
        <Script src="https://accounts.google.com/gsi/client?hl=id" strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setError('Tombol Google gagal dimuat. Periksa koneksi lalu muat ulang halaman.')} />
        <div ref={button} className={busy ? 'google-button busy' : 'google-button'} aria-busy={busy} />
        {(!buttonReady || busy) && !error && <p role="status" className="hint">{busy ? 'Memverifikasi akun...' : 'Menyiapkan tombol Google...'}</p>}
      </>}
      {config && !config.google_enabled && <div className="notice">Login Google sedang disiapkan. Pendaftaran akun belum dibuka; silakan kembali setelah pengelola mengaktifkannya.</div>}
      {error && <div className="teacher-feedback"><p role="alert" className="error">{error}</p><button className="secondary" disabled={busy} onClick={() => ready && config ? setRetry(v => v + 1) : window.location.reload()}>Coba lagi</button></div>}
      <div className="login-note"><p>Nama, email, dan identitas akun Google digunakan untuk akun RuangRPP. Kata sandi Google tidak diterima RuangRPP.</p><a href="/privasi">Penggunaan data akun</a></div>
      <p className="hint">Generator modul ajar masih dalam persiapan sumber dan pengujian.</p>
    </section>
    <a className="text-button" href="/admin">Masuk sebagai pengelola</a>
  </main>;
}
