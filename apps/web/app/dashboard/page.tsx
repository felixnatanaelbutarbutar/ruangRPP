'use client';
import { useCallback, useEffect, useState } from 'react';
import { CreateView } from './create-view';
import { DraftsView } from './drafts-view';
import { BillingView } from './billing-view';
import { Billing, Draft, DraftListItem, Teacher, View } from './types';

export default function Dashboard() {
  const [user, setUser] = useState<Teacher | null>(null);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('create');
  const [billing, setBilling] = useState<Billing | null>(null);
  const [recentDrafts, setRecentDrafts] = useState<DraftListItem[]>([]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [busy, setBusy] = useState(false);

  // Sync with URL Hash
  useEffect(() => {
    function readHash() {
      const h = window.location.hash.toLowerCase();
      if (h === '#draf' || h === '#drafts') setView('drafts');
      else if (h === '#paket' || h === '#billing') setView('billing');
      else setView('create');
    }
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  function navigate(v: View) {
    setView(v);
    window.location.hash = v === 'create' ? 'buat' : v === 'drafts' ? 'draf' : 'paket';
  }

  // Load current teacher
  useEffect(() => {
    let live = true;
    fetch('/api/v1/teacher/me', { cache: 'no-store' })
      .then(async r => {
        if (r.status === 401) {
          if (live) window.location.replace('/login');
          return;
        }
        if (!r.ok) throw new Error('Akun belum berhasil dimuat. Silakan muat ulang.');
        const data = await r.json();
        if (live) setUser(data);
      })
      .catch(e => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);

  // Load billing and recent drafts
  const reloadBillingAndDrafts = useCallback(async () => {
    try {
      const [bRes, dRes] = await Promise.all([
        fetch('/api/v1/teacher/billing', { cache: 'no-store' }),
        fetch('/api/v1/teacher/drafts?page=1', { cache: 'no-store' }),
      ]);
      if (bRes.ok) {
        const bData: Billing = await bRes.json();
        setBilling(bData);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setRecentDrafts(dData.items || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      reloadBillingAndDrafts();
    }
  }, [user, reloadBillingAndDrafts]);

  // Listen to custom quota-changed event
  useEffect(() => {
    const handler = () => reloadBillingAndDrafts();
    window.addEventListener('rr-quota-changed', handler);
    return () => window.removeEventListener('rr-quota-changed', handler);
  }, [reloadBillingAndDrafts]);

  // Quota calculation (single number per §7.4: "Satu angka Kuota")
  const env = billing?.setup.environment || 'sandbox';
  const quota = billing?.quota?.[env] ?? 0;

  async function handleClaimTrial() {
    const res = await fetch('/api/v1/teacher/billing/trial', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Gagal mengaktifkan kuota gratis.');
    window.dispatchEvent(new Event('rr-quota-changed'));
    reloadBillingAndDrafts();
  }

  async function logout() {
    setBusy(true);
    try {
      await fetch('/api/v1/teacher/auth/logout', { method: 'POST' });
      window.location.replace('/login');
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-ui)' }}>
        <p style={{ color: 'var(--error)', marginBottom: 16 }}>{error}</p>
        <button
          type="button"
          className="btn-primary"
          style={{ width: 'auto', margin: 'auto' }}
          onClick={() => window.location.reload()}
        >
          Muat ulang
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-ui)',
          gap: 12,
          color: 'var(--navy-rpp)',
          background: 'var(--kanvas)',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--teal-dalam)' }}>r.</div>
        <p style={{ fontSize: 15, color: 'var(--abu-tinta)' }}>Menyiapkan ruang guru…</p>
      </div>
    );
  }

  const firstName = user.name.split(' ')[0] || user.name;
  const initial = user.name.charAt(0).toUpperCase() || 'G';
  const isSandbox = billing?.setup.environment === 'sandbox';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      {/* Global Sandbox Mode Bar (§7.4) */}
      {isSandbox && (
        <div className="global-sandbox-bar">
          Mode uji coba: pembayaran belum dibuka. Kuota di sini hanya untuk mencoba.
        </div>
      )}

      {/* Mobile Top Bar (< 1024px) (§4.3) */}
      <header className="teacher-topbar">
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-ruangRPP-transparent.png" alt="RuangRPP" height={28} />
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="lp-quota-chip"
            style={{ cursor: 'pointer', border: 0 }}
            onClick={() => navigate('billing')}
          >
            Kuota: {quota}
          </button>

          <button
            type="button"
            className="sidebar-avatar"
            style={{ border: 0, cursor: 'pointer' }}
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            aria-label="Menu akun"
          >
            {initial}
          </button>
        </div>
      </header>

      {/* Main App Grid */}
      <div className="teacher-app">
        {/* Desktop Sidebar (≥ 1024px) (§4.2) */}
        <aside className="teacher-sidebar">
          <div className="sidebar-top">
            <a href="/" className="sidebar-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-ruangRPP-transparent.png" alt="RuangRPP" height={32} />
            </a>

            <nav className="sidebar-nav" aria-label="Navigasi ruang guru">
              {/* 1. Buat Draf */}
              <button
                type="button"
                className={`nav-item ${view === 'create' ? 'active' : ''}`}
                aria-current={view === 'create' ? 'page' : undefined}
                onClick={() => navigate('create')}
              >
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Buat draf</span>
              </button>

              {/* 2. Draf Saya */}
              <button
                type="button"
                className={`nav-item ${view === 'drafts' ? 'active' : ''}`}
                aria-current={view === 'drafts' ? 'page' : undefined}
                onClick={() => navigate('drafts')}
              >
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Draf saya</span>
              </button>

              {/* 3. Paket & Kuota */}
              <button
                type="button"
                className={`nav-item ${view === 'billing' ? 'active' : ''}`}
                aria-current={view === 'billing' ? 'page' : undefined}
                onClick={() => navigate('billing')}
              >
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Paket & kuota</span>
              </button>
            </nav>
          </div>

          <div className="sidebar-bottom">
            {/* Kartu Kuota (§8) */}
            <div className={`sidebar-quota-card ${quota <= 0 ? 'empty' : ''}`}>
              <span className="sidebar-quota-label">Kuota</span>
              <span className="sidebar-quota-num">{quota}</span>
              <button
                type="button"
                className="sidebar-quota-link"
                onClick={() => navigate('billing')}
              >
                {quota > 0 ? 'Tambah kuota ›' : 'Dapatkan kuota ›'}
              </button>
            </div>

            {/* Menu Akun Button (§4.4) */}
            <button
              type="button"
              className="sidebar-account-btn"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              aria-expanded={showAccountMenu}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="sidebar-avatar">{initial}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy-rpp)' }}>{firstName}</span>
              </div>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--abu-tinta)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Account Popover Menu (§4.4) */}
            {showAccountMenu && (
              <div className="account-popover">
                <div className="account-popover-name">{user.name}</div>
                <div className="account-popover-email">{user.email}</div>
                <div className="account-popover-badge">Masuk dengan Google</div>
                <div className="account-popover-divider" />
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--error)',
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  disabled={busy}
                  onClick={logout}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>{busy ? 'Keluar…' : 'Keluar'}</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Content Area (§5) */}
        <main className="teacher-main">
          {view === 'create' && (
            <CreateView
              quota={quota}
              billing={billing}
              onClaimTrial={handleClaimTrial}
              onNavigate={navigate}
              onDraftCreated={reloadBillingAndDrafts}
              recentDrafts={recentDrafts}
              onOpenDraft={id => {
                navigate('drafts');
              }}
            />
          )}

          {view === 'drafts' && (
            <DraftsView
              onNavigate={navigate}
              onOpenDraft={id => {
                // Fetch draft and view it
                fetch(`/api/v1/teacher/drafts/${id}`)
                  .then(r => r.json())
                  .then(d => {
                    // Navigate to create with this draft
                    navigate('create');
                  })
                  .catch(() => {});
              }}
            />
          )}

          {view === 'billing' && (
            <BillingView
              billing={billing}
              quota={quota}
              onReload={reloadBillingAndDrafts}
              onClaimTrial={handleClaimTrial}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (< 1024px) (§4.2 & §6.1) */}
      <nav className="teacher-tabbar" aria-label="Navigasi utama">
        <button
          type="button"
          className={`tab-item ${view === 'create' ? 'active' : ''}`}
          onClick={() => navigate('create')}
          aria-current={view === 'create' ? 'page' : undefined}
        >
          <span className="tab-icon-pill">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
          <span>Buat</span>
        </button>

        <button
          type="button"
          className={`tab-item ${view === 'drafts' ? 'active' : ''}`}
          onClick={() => navigate('drafts')}
          aria-current={view === 'drafts' ? 'page' : undefined}
        >
          <span className="tab-icon-pill">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <span>Draf</span>
        </button>

        <button
          type="button"
          className={`tab-item ${view === 'billing' ? 'active' : ''}`}
          onClick={() => navigate('billing')}
          aria-current={view === 'billing' ? 'page' : undefined}
        >
          <span className="tab-icon-pill">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </span>
          <span>Paket</span>
        </button>
      </nav>
    </div>
  );
}
