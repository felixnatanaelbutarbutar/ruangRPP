'use client';
import { useEffect, useState } from 'react';
import { TeacherBilling } from '../billing-panels';
type Teacher = { id: string; name: string; email: string };

export default function Dashboard() {
  const [user, setUser] = useState<Teacher | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    fetch('/api/v1/teacher/me', { cache: 'no-store' }).then(async r => {
      if (r.status === 401) { if (live) window.location.replace('/login'); return; }
      if (!r.ok) throw new Error('Akun belum berhasil dimuat. Silakan muat ulang halaman.');
      const data = await r.json(); if (live) setUser(data);
    }).catch(e => { if (live) setError(e.message); });
    return () => { live = false; };
  }, []);
  async function logout() {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/v1/teacher/auth/logout', { method: 'POST' });
      if (!r.ok && r.status !== 401) throw new Error('Belum berhasil keluar. Silakan coba kembali.');
      window.location.replace('/login');
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return <div className="teacher-shell">
    <header className="teacher-header"><a href="/" aria-label="Beranda RuangRPP"><img src="/logo-ruangRPP-transparent.png" alt="RuangRPP" height="34" /></a><div className="button-group"><span className="hint">Ruang guru</span>{user && <button className="secondary small" disabled={busy} onClick={logout}>{busy ? 'Keluar...' : 'Keluar'}</button>}</div></header>
    <main className="teacher-content">
      {error && <div className="error" role="alert">{error}<button className="text-button" onClick={() => window.location.reload()}>Muat ulang</button></div>}
      {!user && !error && <p role="status">Memuat ruang guru...</p>}
      {user && <>
        <div className="page-heading"><div><h1>Selamat datang, {user.name}</h1><p>Akun Bapak/Ibu sudah tersimpan. Persiapan ruang kerja pembelajaran dimulai di sini.</p></div></div>
        <section className="panel"><div className="panel-head"><h2>Modul ajar</h2><span className="badge">Sedang disiapkan</span></div><div className="teacher-section"><h3>Sumber diperiksa sebelum digunakan</h3><p>Tim sedang mengumpulkan dokumen kurikulum, meninjau contoh modul ajar, dan menguji pencarian sumber. Pembuatan draf belum dibuka.</p><a className="secondary" href="/#contoh">Lihat ilustrasi dokumen</a></div></section>
        <section className="panel"><div className="panel-head"><h2>Akun saya</h2></div><dl className="account-details"><div><dt>Nama</dt><dd>{user.name}</dd></div><div><dt>Email Google</dt><dd>{user.email}</dd></div><div><dt>Metode masuk</dt><dd>Google</dd></div></dl></section>
        <TeacherBilling />
        <p className="hint">Hasil pembelajaran nantinya tetap berupa draf untuk ditinjau guru.</p>
      </>}
    </main>
  </div>;
}
