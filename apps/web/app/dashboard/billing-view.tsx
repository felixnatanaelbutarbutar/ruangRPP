'use client';
import { useState } from 'react';
import { Billing, Order, Plan } from './types';

const money = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

const time = (s: string) =>
  new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

const statusLabels: Record<string, { label: string; kind: 'ok' | 'warn' | 'err' }> = {
  creating: { label: 'Menyiapkan', kind: 'warn' },
  creation_unknown: { label: 'Perlu diperiksa', kind: 'warn' },
  pending: { label: 'Menunggu pembayaran', kind: 'warn' },
  paid: { label: 'Lunas · kuota aktif', kind: 'ok' },
  failed: { label: 'Tidak berhasil', kind: 'err' },
  expired: { label: 'Kedaluwarsa', kind: 'err' },
  review: { label: 'Dalam pemeriksaan', kind: 'warn' },
  refunded: { label: 'Dikembalikan', kind: 'err' },
  refund_review: { label: 'Peninjauan', kind: 'warn' },
};

export function BillingView({
  billing,
  quota,
  onReload,
  onClaimTrial,
}: {
  billing: Billing | null;
  quota: number;
  onReload: () => void;
  onClaimTrial: () => Promise<void>;
}) {
  const [busy, setBusy] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const plans = billing?.plans || [];
  const orders = billing?.orders || [];
  const trialClaimed = billing?.trial.claimed;
  const isAvailable = billing?.setup.available ?? false;
  const hasPendingOrders = orders.some(o => o.status === 'pending');

  async function handleClaim() {
    setBusy('trial');
    setError('');
    setMessage('');
    try {
      await onClaimTrial();
      setMessage('3 kuota gratis berhasil diaktifkan! Anda dapat langsung membuat draf.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function handleVerify(orderId: string) {
    setBusy(orderId);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/v1/teacher/billing/orders/${encodeURIComponent(orderId)}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Verifikasi belum berhasil.');
      if (data.status === 'paid') {
        setMessage('Pembayaran terverifikasi! Kuota sudah bertambah di akun Anda.');
      } else {
        setMessage(`Status pembayaran saat ini: ${statusLabels[data.status]?.label || data.status}.`);
      }
      onReload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function handleCheckout(plan: Plan) {
    setBusy(plan.id);
    setError('');
    setMessage('');
    try {
      const storageKey = `rr-checkout-${billing?.setup.environment}-${plan.id}`;
      let id = sessionStorage.getItem(storageKey);
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(storageKey, id);
      }
      const res = await fetch('/api/v1/teacher/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: plan.id, request_id: id }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.detail || 'Gagal memulai checkout.');

      if (order.checkout_url) {
        window.location.assign(order.checkout_url);
        return;
      }
      if (['paid', 'failed', 'expired', 'refunded'].includes(order.status)) {
        sessionStorage.removeItem(storageKey);
      }
      setMessage(`Pesanan sebelumnya: ${statusLabels[order.status]?.label || order.status}.`);
      setSelectedPlan(null);
      onReload();
    } catch (e) {
      setError((e as Error).message);
      onReload();
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="teacher-page">
      <div className="page-head">
        <div>
          <h1>Paket & kuota</h1>
          <p>Pantau sisa kuota, aktifkan kuota coba gratis, dan kelola pembelian.</p>
        </div>
      </div>

      {error && <div className="rpp-banner error">{error}</div>}
      {message && <div className="rpp-banner info">{message}</div>}

      {/* 1. Kuota Anda Card (§7.6) */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid var(--garis)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--abu-tinta)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Kuota Anda
          </span>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--navy-rpp)', marginTop: 4 }}>
            {quota} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--abu-tinta)' }}>kuota tersisa</span>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--abu-tinta)', maxWidth: 360, lineHeight: 1.5 }}>
          Satu kuota dipakai setelah draf berhasil disusun dan disimpan. Jika terjadi kegagalan sistem, kuota tidak terpotong.
        </p>
      </section>

      {/* 2. Coba Dulu Card (§7.6) */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid var(--garis)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy-rpp)', margin: 0 }}>Coba dulu</h3>
          <p style={{ fontSize: 14, color: 'var(--abu-tinta)', margin: '4px 0 0 0' }}>
            3 kuota gratis, sekali per akun, tanpa memerlukan informasi kartu pembayaran.
          </p>
        </div>

        {trialClaimed ? (
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--teal-dalam)',
              background: 'var(--mint-tipis)',
              padding: '6px 14px',
              borderRadius: 8,
            }}
          >
            ✓ 3 kuota gratis sudah diaktifkan
          </span>
        ) : (
          <button
            type="button"
            className="btn-primary"
            style={{ width: 'auto', padding: '0 20px', height: 40 }}
            disabled={busy === 'trial'}
            onClick={handleClaim}
          >
            {busy === 'trial' ? 'Mengaktifkan…' : 'Aktifkan 3 kuota gratis'}
          </button>
        )}
      </section>

      {/* 3. Pilih Paket (§7.6) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy-rpp)', margin: 0 }}>Pilih paket</h2>
          <p style={{ fontSize: 14, color: 'var(--abu-tinta)', margin: '4px 0 0 0' }}>
            Beli kuota sekali bayar saat dibutuhkan. Tidak ada biaya langganan otomatis.
          </p>
        </div>

        {!isAvailable && (
          <div className="rpp-banner info" style={{ margin: 0 }}>
            <span>Pembelian paket saat ini belum dibuka oleh pengelola. Kami kabari setelah transaksi tersedia.</span>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {plans.map(p => {
            const isRecommended = p.name.toLowerCase().includes('semester') || p.credits >= 50;
            const unitPrice = Math.round(p.amount / p.credits);

            return (
              <div
                key={p.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  border: isRecommended ? '2px solid var(--teal-ruang)' : '1px solid var(--garis)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  position: 'relative',
                }}
              >
                {isRecommended && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--teal-dalam)',
                      background: 'var(--mint-tipis)',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    Disarankan
                  </span>
                )}

                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy-rpp)', margin: 0 }}>
                    {p.name}
                  </h3>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy-rpp)', marginTop: 6 }}>
                    {money(p.amount)}
                  </div>
                </div>

                <div style={{ fontSize: 14, color: 'var(--abu-tinta)', lineHeight: 1.6 }}>
                  <div>
                    <strong>{p.credits} kuota</strong> modul ajar
                  </div>
                  <div>±{money(unitPrice)} per draf</div>
                  <div>Sekali beli, tanpa langganan</div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  {isAvailable ? (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy === p.id}
                      onClick={() => setSelectedPlan(p)}
                    >
                      Beli paket
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ width: '100%', opacity: 0.65, cursor: 'not-allowed' }}
                      disabled
                    >
                      Segera dibuka
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Confirmation Modal */}
      {selectedPlan && (
        <div className="rpp-dialog-backdrop" onClick={() => !busy && setSelectedPlan(null)}>
          <div className="rpp-dialog" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy-rpp)', margin: 0 }}>
              Konfirmasi pembelian
            </h3>
            <p style={{ fontSize: 14, color: 'var(--abu-tinta)', lineHeight: 1.5, margin: 0 }}>
              Paket <strong>{selectedPlan.name}</strong> berisi {selectedPlan.credits} kuota seharga{' '}
              <strong>{money(selectedPlan.amount)}</strong>. Anda akan diarahkan ke halaman pembayaran Midtrans.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={!!busy}
                onClick={() => setSelectedPlan(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 24px' }}
                disabled={!!busy}
                onClick={() => handleCheckout(selectedPlan)}
              >
                {busy === selectedPlan.id ? 'Menyiapkan…' : 'Lanjut ke pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Riwayat Pembayaran (§7.6) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy-rpp)', margin: 0 }}>
          Riwayat pembayaran
        </h2>

        {hasPendingOrders && (
          <div className="rpp-banner warn">
            <span>
              Sudah membayar tapi status masih menunggu? Pilih <strong>Periksa pembayaran</strong>. Jangan membayar ulang.
            </span>
          </div>
        )}

        {orders.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid var(--garis)',
              padding: 24,
              textAlign: 'center',
              fontSize: 14,
              color: 'var(--abu-tinta)',
            }}
          >
            Belum ada transaksi.
          </div>
        ) : (
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid var(--garis)',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 640 }}>
              <thead>
                <tr style={{ background: '#FAFCFC', borderBottom: '1px solid var(--garis)' }}>
                  <th style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--abu-tinta)' }}>
                    Pesanan
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--abu-tinta)' }}>
                    Paket
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--abu-tinta)' }}>
                    Jumlah
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--abu-tinta)' }}>
                    Status
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--abu-tinta)', textAlign: 'right' }}>
                    Tindakan
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const sInfo = statusLabels[order.status] || { label: order.status, kind: 'warn' };
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--garis)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{order.id}</span>
                        <div style={{ fontSize: 12, color: 'var(--abu-tinta)', marginTop: 2 }}>
                          {time(order.created_at)}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--navy-rpp)' }}>
                        <strong>{order.plan_name}</strong>
                        <div style={{ fontSize: 12.5, color: 'var(--abu-tinta)' }}>{order.credits} kuota</div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: 'var(--navy-rpp)' }}>
                        {money(order.amount)}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background:
                              sInfo.kind === 'ok'
                                ? 'var(--mint-tipis)'
                                : sInfo.kind === 'err'
                                ? '#FDECEA'
                                : '#FDF3E6',
                            color:
                              sInfo.kind === 'ok'
                                ? 'var(--teal-dalam)'
                                : sInfo.kind === 'err'
                                ? 'var(--error)'
                                : 'var(--peringatan)',
                          }}
                        >
                          {sInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                          {order.checkout_url && order.status === 'pending' && (
                            <a
                              href={order.checkout_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rpp-action-btn"
                            >
                              Lanjut bayar
                            </a>
                          )}
                          <button
                            type="button"
                            className="rpp-action-btn"
                            disabled={busy === order.id}
                            onClick={() => handleVerify(order.id)}
                          >
                            {busy === order.id ? 'Memeriksa…' : 'Periksa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ fontSize: 12.5, color: 'var(--abu-tinta)', lineHeight: 1.5 }}>
          Kuota aktif setelah pembayaran terkonfirmasi di server. Transaksi yang dikembalikan atau disengketakan ditahan untuk pemeriksaan.
        </div>
      </section>
    </div>
  );
}
