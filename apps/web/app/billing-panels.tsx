'use client';
import { useEffect, useState } from 'react';

type Setup = { environment: string; available: boolean; enabled: boolean; server_key_configured: boolean; app_url_valid: boolean };
type Plan = { id: string; name: string; amount: number; credits: number };
type Order = { id: string; plan_name: string; amount: number; credits: number; status: string; environment: string; created_at: string; checked_at: string | null; checkout_url: string | null; teacher_email?: string };
type Billing = { setup: Setup; plans: Plan[]; trial: { credits: number; claimed: boolean }; quota: Record<string, number>; orders: Order[]; total: number };
type Finance = { setup: Setup; environment: string; paid_amount: number; paid_count: number; review_count: number; orders: Order[]; total: number };
const money = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const time = (s: string) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
const labels: Record<string, string> = { creating: 'Menyiapkan checkout', creation_unknown: 'Perlu diperiksa', pending: 'Menunggu pembayaran', paid: 'Lunas · kuota aktif', failed: 'Tidak berhasil', expired: 'Kedaluwarsa', review: 'Dalam pemeriksaan', refunded: 'Dikembalikan · kuota ditahan', refund_review: 'Peninjauan pengembalian' };

async function request<T>(path: string, body?: object): Promise<T> {
  const response = await fetch('/api/v1' + path, { cache: 'no-store', ...(body !== undefined ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : {}) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path.startsWith('/teacher/')) window.location.replace('/login');
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Data pembayaran belum dapat dimuat. Silakan coba kembali.');
  }
  return data;
}

function useBillingData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true); setError(''); setData(null);
    request<T>(path).then(value => { if (live) setData(value); })
      .catch(e => { if (live) setError(e.message); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [path, revision]);
  useEffect(() => { const refresh = () => setRevision(r => r + 1); window.addEventListener('rr-quota-changed', refresh); return () => window.removeEventListener('rr-quota-changed', refresh); }, []);
  return { data, loading, error, reload: () => setRevision(r => r + 1) };
}

function OrderList({ orders, admin, busy, verify }: { orders: Order[]; admin?: boolean; busy: string; verify: (id: string) => void }) {
  return <div className="table-scroll"><table className="billing-table"><thead><tr><th>Pesanan</th>{admin && <th>Akun guru</th>}<th>Paket</th><th>Jumlah</th><th>Status</th><th><span className="sr-only">Tindakan</span></th></tr></thead>
    <tbody>{orders.map(order => <tr key={order.id}>
      <td><span className="billing-order-id">{order.id}</span><small className="cell-note">{time(order.created_at)}</small><small className="cell-note">{order.environment === 'sandbox' ? 'Sandbox · simulasi' : 'Produksi'}</small></td>
      {admin && <td>{order.teacher_email}</td>}
      <td>{order.plan_name}<small className="cell-note">{order.credits} kuota</small></td><td className="nowrap">{money(order.amount)}</td>
      <td><span className="badge">{labels[order.status] || 'Perlu diperiksa'}</span><small className="cell-note">{order.checked_at ? `Diperiksa ${time(order.checked_at)}` : 'Belum dikonfirmasi'}</small></td>
      <td><div className="billing-actions">{!admin && order.checkout_url && <a className="secondary small" href={order.checkout_url} referrerPolicy="no-referrer">Lanjut bayar</a>}
        <button className="text-button" disabled={!!busy} onClick={() => verify(order.id)}>{busy === order.id ? 'Memeriksa…' : 'Periksa pembayaran'}</button></div></td>
    </tr>)}</tbody></table>{!orders.length && <div className="empty compact"><p>Belum ada transaksi.</p></div>}</div>;
}

function Pagination({ page, total, size, disabled, change }: { page: number; total: number; size: number; disabled: boolean; change: (n: number) => void }) {
  return <div className="table-foot pagination"><span>{total} transaksi · Halaman {page} dari {Math.max(1, Math.ceil(total / size))}</span><div className="button-group"><button className="secondary small" disabled={disabled || page === 1} onClick={() => change(page - 1)}>Sebelumnya</button><button className="secondary small" disabled={disabled || page * size >= total} onClick={() => change(page + 1)}>Berikutnya</button></div></div>;
}

export function TeacherBilling() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useBillingData<Billing>(`/teacher/billing?page=${page}`);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [selected, setSelected] = useState<Plan | null>(null);
  async function claimTrial() {
    setBusy('trial'); setActionError(''); setMessage('');
    try {
      await request('/teacher/billing/trial', {});
      setMessage('Kuota percobaan sudah aktif. Anda dapat membuat draf di atas.');
      window.dispatchEvent(new Event('rr-quota-changed'));
    } catch (e) { setActionError((e as Error).message); }
    finally { setBusy(''); }
  }
  async function verify(id: string) {
    setBusy(id); setActionError(''); setMessage('');
    try {
      const order = await request<Order>(`/teacher/billing/orders/${encodeURIComponent(id)}/verify`, {});
      setMessage(order.status === 'paid' ? 'Pembayaran terverifikasi. Kuota sudah tercatat di akun Anda.' : `Status: ${labels[order.status] || 'Perlu diperiksa'}. Pemeriksaan ulang tersedia setiap 15 detik.`);
      reload();
    } catch (e) { setActionError((e as Error).message); }
    finally { setBusy(''); }
  }
  async function checkout(plan: Plan) {
    setBusy(plan.id); setActionError(''); setMessage('');
    try {
      // Persist across network errors/reloads. The server also reuses a pending order.
      const storageKey = `rr-checkout-${data?.setup.environment}-${plan.id}`;
      let id = sessionStorage.getItem(storageKey);
      if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(storageKey, id); }
      const order = await request<Order>('/teacher/billing/checkout', { plan_id: plan.id, request_id: id });
      if (order.checkout_url) { window.location.assign(order.checkout_url); return; }
      if (['paid', 'failed', 'expired', 'refunded', 'refund_review'].includes(order.status)) sessionStorage.removeItem(storageKey);
      setMessage(`Pesanan sebelumnya: ${labels[order.status] || order.status}. Periksa riwayat sebelum membeli lagi.`);
      setSelected(null); reload();
    } catch (e) { setActionError((e as Error).message); reload(); }
    finally { setBusy(''); }
  }
  return <section id="billing" className="billing-section">
    <div className="page-heading"><div><h2>Paket & kuota</h2><p>Kelola pembelian dan lihat status pembayaran Anda.</p></div><button className="secondary small" disabled={loading || !!busy} onClick={reload}>Muat ulang</button></div>
    {(error || actionError) && <div className="error" role="alert">{actionError || error}</div>}
    {message && <p className="inline-note" role="status">{message}</p>}
    {loading && <p role="status">Memuat pembayaran…</p>}
    {data && <>
      <div className="billing-balance"><div><span>Kuota produksi</span><strong>{data.quota.production}</strong></div><div><span>Kuota simulasi</span><strong>{data.quota.sandbox}</strong></div><p>Satu kuota dipakai setelah draf AI langsung atau draf berbasis sumber berhasil disimpan.</p></div>
      <section className="panel teacher-section"><h3>Coba dulu</h3><p>{data.trial.credits} kuota gratis satu kali per akun, tanpa pembayaran. Mode AI langsung dapat digunakan tanpa dokumen sumber.</p><button className="secondary" disabled={!!busy || data.trial.claimed} onClick={claimTrial}>{data.trial.claimed ? 'Kuota percobaan sudah diaktifkan' : busy === 'trial' ? 'Mengaktifkan…' : 'Aktifkan 3 kuota gratis'}</button></section>
      <p className="inline-note">{data.setup.environment === 'sandbox' ? 'Mode sandbox. Pembayaran dan kuota di sini hanya untuk simulasi.' : 'Mode produksi. Pembayaran menggunakan uang nyata.'} {!data.setup.available && 'Pembelian belum dibuka oleh pengelola.'}</p>
      <div className="billing-plans">{data.plans.map(plan => <article key={plan.id} className="panel billing-plan"><h3>{plan.name}</h3><p className="billing-price">{money(plan.amount)}</p><p>{plan.credits} kuota · satu kali pembelian</p><button className="secondary" disabled={!data.setup.available || !!busy} onClick={() => { setSelected(plan); setActionError(''); }}>{data.setup.available ? 'Pilih paket' : 'Belum tersedia'}</button></article>)}</div>
      {selected && <section className="panel teacher-section billing-confirm" aria-label="Konfirmasi pembelian"><h3>Konfirmasi paket {selected.name}</h3><p>{selected.credits} kuota seharga <strong>{money(selected.amount)}</strong>. Anda akan diarahkan ke Midtrans untuk memilih metode pembayaran. Tidak ada tagihan berulang.</p><p className="hint">{data.setup.environment === 'sandbox' ? 'Ini transaksi simulasi. Jangan gunakan informasi pembayaran nyata.' : 'Periksa pilihan pembelajaran yang tersedia sebelum membeli kuota.'}</p><div className="button-group"><button className="primary" disabled={!!busy || !data.setup.available} onClick={() => checkout(selected)}>{busy === selected.id ? 'Menyiapkan…' : 'Lanjut ke Midtrans'}</button><button className="secondary" disabled={!!busy} onClick={() => setSelected(null)}>Batal</button></div></section>}
      <section className="panel"><div className="panel-head"><div><h3>Riwayat pembayaran</h3><p>Kuota aktif setelah konfirmasi server, bukan hanya setelah kembali dari halaman pembayaran.</p></div></div><OrderList orders={data.orders} busy={busy} verify={verify} /><Pagination page={page} total={data.total} size={20} disabled={loading || !!busy} change={setPage} /></section>
      <p className="hint">Jika status masih menunggu setelah dibayar, pilih Periksa pembayaran. Jangan membayar ulang. Kuota dari transaksi yang dikembalikan atau disengketakan ditahan untuk pemeriksaan.</p>
    </>}
  </section>;
}

export function AdminFinance() {
  const [env, setEnv] = useState('sandbox');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useBillingData<Finance>(`/admin/finance?env=${env}&page=${page}`);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  async function verify(id: string) {
    setBusy(id); setMessage(''); setActionError('');
    try {
      const order = await request<Order>(`/admin/finance/orders/${encodeURIComponent(id)}/verify`, {});
      setMessage(`Status pesanan: ${labels[order.status] || order.status}.`); reload();
    } catch (e) { setActionError((e as Error).message); }
    finally { setBusy(''); }
  }
  return <>
    <div className="billing-toolbar"><label>Lingkungan transaksi<select value={env} disabled={!!busy} onChange={e => { setEnv(e.target.value); setPage(1); setMessage(''); }}><option value="sandbox">Sandbox · simulasi</option><option value="production">Produksi · uang nyata</option></select></label><button className="secondary small" disabled={loading || !!busy} onClick={reload}>Muat ulang</button></div>
    {(error || actionError) && <p className="error" role="alert">{actionError || error}</p>}{message && <p className="inline-note" role="status">{message}</p>}{loading && <p role="status">Memuat transaksi…</p>}
    {data && <>
      <div className="stats"><div className="stat"><div>{env === 'sandbox' ? 'Pembayaran simulasi' : 'Pembayaran terverifikasi'}</div><strong>{money(data.paid_amount)}</strong><small>Bruto, sebelum biaya penyedia</small></div><div className="stat"><div>Transaksi lunas</div><strong>{data.paid_count}</strong><small>Tidak termasuk pengembalian</small></div><div className="stat"><div>Perlu ditinjau</div><strong>{data.review_count}</strong><small>Checkout atau pengembalian</small></div></div>
      <section className="panel"><div className="panel-head"><div><h2>Transaksi</h2><p>{env === 'sandbox' ? 'Data simulasi tidak masuk laporan produksi.' : 'Data terverifikasi dari Midtrans, bukan laporan pencairan ke rekening.'}</p></div></div><OrderList orders={data.orders} admin busy={busy} verify={verify} /><Pagination page={page} total={data.total} size={25} disabled={loading || !!busy} change={setPage} /><div className="table-foot">Transaksi refund dan peninjauan refund tidak dihitung pada jumlah bruto di atas. Rekonsiliasi biaya dan pencairan bank belum tersedia.</div></section>
      <section className="panel"><div className="panel-head"><h2>Konfigurasi checkout</h2><span className="badge">{data.setup.available ? 'Dibuka' : 'Belum dibuka'}</span></div><div className="status-list"><div><strong>Mode checkout</strong><span>{data.setup.environment}</span></div><div><strong>Server key</strong><span>{data.setup.server_key_configured ? 'Tersedia' : 'Belum diisi'}</span></div><div><strong>Pembelian diizinkan</strong><span>{data.setup.enabled ? 'Ya' : 'Belum'}</span></div><div><strong>Alamat aplikasi</strong><span>{data.setup.app_url_valid ? 'Format sesuai' : 'Perlu diperbaiki'}</span></div></div><div className="table-foot">Notifikasi Midtrans: <code>/api/v1/payments/midtrans/notification</code>. Gunakan domain HTTPS yang dapat dijangkau Midtrans. Kredensial tetap berada di server.</div></section>
    </>}
  </>;
}
