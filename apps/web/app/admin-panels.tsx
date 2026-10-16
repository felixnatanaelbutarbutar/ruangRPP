'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';

type Requester = (path: string, options?: RequestInit) => Promise<any>;
type Account = { id: string; name: string; email: string; role: string; uploads: number; last_login: string | null };
type Event = { id: string; actor: string; actor_id: string | null; action: string; at: string; document_id: string | null };
type Profile = { id: string; provider: string; model: string };
type ModelData = { items: Profile[]; default_id: string | null; providers: { id: string; label: string; credential_configured: boolean }[] };
export type AdminView = 'models' | 'users' | 'activity' | 'finance';
const timestamp = (v: string | null) => v ? new Date(v).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Belum tercatat';

export function AdminPanels({ view, api, openDocument }: { view: AdminView; api: Requester; openDocument: (id: string) => void }) {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Account[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [models, setModels] = useState<ModelData | null>(null);
  const [finance, setFinance] = useState<{ status: string } | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [actor, setActor] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('');
  const [adding, setAdding] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    async function load() {
      if (view === 'models') {
        const data = await api('/admin/models'); if (current) setModels(data);
      } else if (view === 'finance') {
        const data = await api('/admin/finance'); if (current) setFinance(data);
      } else {
        const accounts = await api('/admin/users'); if (current) setUsers(accounts.items);
        if (view === 'activity') {
          const data = await api(`/admin/activity?${new URLSearchParams({ q: search, actor_id: actor, page: String(page) })}`);
          if (current) { setEvents(data.items); setTotal(data.total); }
        }
      }
    }
    load().catch(e => { if (current) setError(e.message); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [view, api, search, actor, page, revision]);

  async function mutate(path: string, method: string, body?: object) {
    setBusy(true); setError(''); setMessage('');
    try {
      await api(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      setRevision(r => r + 1); setMessage('Pengaturan tersimpan.'); return true;
    } catch (e) { setError((e as Error).message); return false; }
    finally { setBusy(false); }
  }

  return <div className="admin-panels">
    {error && <div role="alert" className="error">{error}<button className="text-button" onClick={() => setRevision(r => r + 1)}>Muat ulang</button></div>}
    {message && <div role="status" className="success">{message}</div>}
    {loading && <p role="status" className="hint">Memuat data...</p>}

    {view === 'models' && models && <>
      <div className="notice">Profil tersimpan sebagai persiapan generator. Koneksi dan kemampuan model belum diuji; memilih default belum menjalankan AI.</div>
      <section className="panel">
        <div className="panel-head"><div><h2>Model bahasa</h2><p>Pilih satu default untuk rancangan generator modul ajar.</p></div><button className="secondary" onClick={() => setAdding(!adding)} disabled={busy}>{adding ? 'Tutup formulir' : 'Tambah model'}</button></div>
        {adding && <form className="settings-form" onSubmit={async (e: FormEvent) => {
          e.preventDefault(); if (await mutate('/admin/models', 'POST', { provider, model: model.trim() })) { setModel(''); setAdding(false); }
        }}>
          <div className="form-grid">
            <label>Penyedia<select value={provider} onChange={e => setProvider(e.target.value)} disabled={busy}>{models.providers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
            <label>ID model<input required maxLength={150} value={model} disabled={busy} onChange={e => setModel(e.target.value)} placeholder="Salin ID dari penyedia Anda" /></label>
          </div>
          <p className="hint">Gunakan ID model dari akun penyedia. Daftar model dan harga belum disinkronkan.</p>
          <div className="button-group"><button className="primary" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan profil'}</button><button type="button" className="secondary" disabled={busy} onClick={() => setAdding(false)}>Batal</button></div>
        </form>}
        {models.items.length ? <div className="table-scroll"><table><thead><tr><th>Model</th><th>Penyedia</th><th>Pilihan</th><th>Koneksi</th><th>Tindakan</th></tr></thead><tbody>{models.items.map(p => <tr key={p.id}>
          <td className="model-name">{p.model}</td><td>{models.providers.find(v => v.id === p.provider)?.label}</td><td>{models.default_id === p.id ? <span className="badge">Default</span> : '—'}</td><td>Belum diuji</td>
          <td><div className="button-group">{models.default_id !== p.id && <><button className="secondary small" disabled={busy || loading} onClick={() => mutate(`/admin/models/${p.id}/default`, 'PUT')}>Jadikan default</button><button className="text-button" disabled={busy || loading} onClick={() => mutate(`/admin/models/${p.id}`, 'DELETE')}>Hapus profil</button></>}</div></td>
        </tr>)}</tbody></table></div> : <div className="empty"><h3>Belum ada model tersimpan</h3><p>Tambahkan penyedia dan ID model yang ingin digunakan. Profil dapat diganti sebelum generator dihubungkan.</p></div>}
      </section>
      <section className="panel"><div className="panel-head"><div><h2>Kredensial penyedia</h2><p>Kunci API dikelola melalui konfigurasi server Docker.</p></div></div><div className="status-list">{models.providers.map(p => <div key={p.id}><strong>{p.label}</strong><span>{p.credential_configured ? 'Kunci tersedia di server · belum diuji' : 'Kunci belum dikonfigurasi'}</span></div>)}</div><div className="table-foot">Kunci API tidak dikirim ke browser. Penyedia lain masih memerlukan adapter pada tahap generator.</div></section>
    </>}

    {view === 'users' && <>
      <section className="panel"><div className="panel-head"><div><h2>Tim internal</h2><p>Admin dan pengumpul sumber yang sudah memiliki akun.</p></div><span className="badge">{loading ? 'Memuat' : `${users.length} akun`}</span></div>
        <div className="table-scroll"><table><thead><tr><th>Nama</th><th>Email</th><th>Akses</th><th>Unggahan</th><th>Terakhir masuk</th></tr></thead><tbody>{users.map(u => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role === 'admin' ? 'Admin' : 'Pengumpul'}</td><td>{u.uploads}</td><td>{timestamp(u.last_login)}</td></tr>)}</tbody></table></div>
        <div className="table-foot">Pembuatan akun masih melalui pengelola server. Waktu masuk lama tanpa identitas akun tidak disimpulkan dari nama.</div>
      </section>
      <section className="panel"><div className="panel-head"><h2>Akun guru</h2><span className="badge">Belum tersedia</span></div><div className="empty compact"><p>Pendaftaran guru, paket, dan kuota akan dihubungkan setelah generator siap diuji.</p></div></section>
    </>}

    {view === 'activity' && <section className="panel">
      <div className="panel-head"><div><h2>Aktivitas tercatat</h2><p>Login, pengelolaan sumber, dan perubahan pengaturan oleh tim.</p></div><span className="badge">{loading ? 'Memuat' : `${total} aktivitas`}</span></div>
      <form className="filters" onSubmit={e => { e.preventDefault(); setSearch(query.trim()); setPage(1); }}>
        <label className="search"><input aria-label="Cari aktivitas" placeholder="Cari aktivitas..." value={query} onChange={e => setQuery(e.target.value)} /></label>
        <select aria-label="Filter pengguna" value={actor} onChange={e => { setActor(e.target.value); setPage(1); }}><option value="">Semua pengguna dan sistem</option>{users.map(u => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}</select><button className="secondary" disabled={loading}>Cari</button>
      </form>
      <div className="table-scroll"><table><thead><tr><th>Waktu</th><th>Pelaku</th><th>Aktivitas</th><th>Sumber</th></tr></thead><tbody>{!loading && events.map(e => <tr key={e.id}><td className="nowrap">{timestamp(e.at)}</td><td>{e.actor}<small className="cell-note">{e.actor_id ? 'Akun internal' : 'Catatan lama / sistem'}</small></td><td>{e.action}</td><td>{e.document_id ? <button className="text-button" onClick={() => openDocument(e.document_id!)}>Buka dokumen</button> : '—'}</td></tr>)}</tbody></table></div>
      {!loading && !events.length && <div className="empty compact"><p>Tidak ada aktivitas yang sesuai filter.</p></div>}
      <div className="table-foot pagination"><span>Halaman {page} dari {Math.max(1, Math.ceil(total / 25))}</span><div className="button-group"><button className="secondary small" disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</button><button className="secondary small" disabled={loading || page * 25 >= total} onClick={() => setPage(p => p + 1)}>Berikutnya</button></div></div>
      <div className="inline-note">Riwayat pembuatan modul oleh guru belum tersedia karena generator belum terhubung.</div>
    </section>}

    {view === 'finance' && finance && <>
      <div className="stats">{['Uang masuk', 'Pembayaran berhasil', 'Pengembalian dana', 'Biaya pemakaian AI'].map(label => <div className="stat" key={label}><div>{label}</div><strong>—</strong><small>Data belum terhubung</small></div>)}</div>
      <section className="panel"><div className="panel-head"><div><h2>Transaksi</h2><p>Pencatatan pembayaran pelanggan RuangRPP.</p></div><span className="badge">Belum terhubung</span></div><div className="empty"><h3>Belum ada sumber data pembayaran</h3><p>Pemasukan akan ditampilkan setelah penyedia pembayaran dan pencatatan transaksi diintegrasikan. Tanda — berarti data belum tersedia.</p></div></section>
      <section className="panel"><div className="panel-head"><h2>Kesiapan pencatatan</h2></div><div className="status-list"><div><strong>Pembayaran & langganan</strong><span>Belum diintegrasikan</span></div><div><strong>Penggunaan token & biaya AI</strong><span>Menunggu integrasi generator</span></div><div><strong>Rekonsiliasi & pengembalian dana</strong><span>Tahap monetisasi</span></div></div></section>
    </>}
  </div>;
}

export function OperationsSummary({ api, navigate }: { api: Requester; navigate: (view: AdminView) => void }) {
  const [data, setData] = useState<{ users: number; model: string | null } | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    setFailed(false);
    return Promise.all([api('/admin/users'), api('/admin/models')]);
  }, [api]);
  useEffect(() => { let live = true; load().then(([u, m]) => { if (live) setData({ users: u.items.length, model: m.items.find((p: Profile) => p.id === m.default_id)?.model || null }); }).catch(() => { if (live) setFailed(true); }); return () => { live = false; }; }, [load]);
  return <section className="panel operations-summary"><div className="panel-head"><div><h2>Operasional platform</h2><p>Sumber sedang dikumpulkan. Generator dan pembayaran belum terhubung.</p></div></div>{failed ? <div className="inline-note" role="alert">Ringkasan operasional gagal dimuat. Buka menu terkait untuk mencoba lagi.</div> : <div className="operation-links">
    <button onClick={() => navigate('users')}><span>Tim internal</span><strong>{data ? `${data.users} akun` : 'Memuat...'}</strong><small>Lihat akun tim →</small></button>
    <button onClick={() => navigate('models')}><span>Model default</span><strong>{data ? data.model || 'Belum dipilih' : 'Memuat...'}</strong><small>Pengaturan LLM →</small></button>
    <button onClick={() => navigate('finance')}><span>Uang masuk</span><strong>Belum tersedia</strong><small>Lihat keuangan →</small></button>
    <button onClick={() => navigate('activity')}><span>Riwayat</span><strong>Aktivitas tim</strong><small>Lihat catatan →</small></button>
  </div>}</section>;
}
