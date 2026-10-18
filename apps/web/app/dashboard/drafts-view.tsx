'use client';
import { useEffect, useState } from 'react';
import { Draft, DraftListItem, exportDraftToWord } from './types';

export function DraftsView({
  onNavigate,
  onOpenDraft,
}: {
  onNavigate: (view: 'create' | 'billing') => void;
  onOpenDraft: (id: string) => void;
}) {
  const [items, setItems] = useState<DraftListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<DraftListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    fetch(`/api/v1/teacher/drafts?page=${page}`, { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error('Draf belum berhasil dimuat.');
        const data = await r.json();
        if (live) {
          setItems(data.items || []);
          setTotal(data.total ?? data.items?.length ?? 0);
        }
      })
      .catch(e => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [page, refreshKey]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/teacher/drafts/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus draf.');
      setDeleteTarget(null);
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload(id: string) {
    try {
      const res = await fetch(`/api/v1/teacher/drafts/${id}`);
      if (!res.ok) throw new Error('Gagal mengunduh dokumen.');
      const draft: Draft = await res.json();
      exportDraftToWord(draft);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  // Filter items locally based on search & grade
  const filtered = items.filter(d => {
    const matchQuery = !query || d.title.toLowerCase().includes(query.toLowerCase());
    const matchGrade = !filterGrade || String(d.grade) === filterGrade;
    const matchSubj = !filterSubject || (d.subject && d.subject.toLowerCase().includes(filterSubject.toLowerCase()));
    return matchQuery && matchGrade && matchSubj;
  });

  return (
    <div className="teacher-page">
      <div className="page-head">
        <div>
          <h1>Draf saya</h1>
          <p>Koleksi rancangan pembelajaran yang telah Anda susun.</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{ width: 'auto', padding: '0 20px', height: 42 }}
          onClick={() => onNavigate('create')}
        >
          + Buat draf
        </button>
      </div>

      {error && <div className="rpp-banner error">{error}</div>}

      {/* Filter and Search Bar (§7.5) */}
      {(items.length > 0 || query || filterGrade || filterSubject) && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            background: '#ffffff',
            padding: 16,
            borderRadius: 14,
            border: '1px solid var(--garis)',
          }}
        >
          <div style={{ flex: '1 1 240px' }}>
            <input
              className="rpp-input"
              style={{ height: 42 }}
              placeholder="Cari judul draf…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          <div style={{ width: 140 }}>
            <select
              className="rpp-select"
              style={{ height: 42 }}
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
            >
              <option value="">Semua kelas</option>
              {[1, 2, 3, 4, 5, 6].map(g => (
                <option key={g} value={String(g)}>
                  Kelas {g} SD
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: 180 }}>
            <select
              className="rpp-select"
              style={{ height: 42 }}
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
            >
              <option value="">Semua mata pelajaran</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              <option value="Matematika">Matematika</option>
              <option value="IPAS">IPAS</option>
              <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
              <option value="Seni">Seni</option>
              <option value="Pendidikan Agama">Agama</option>
              <option value="PJOK">PJOK</option>
              <option value="Bahasa Inggris">Bahasa Inggris</option>
            </select>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="rpp-sheet-empty" style={{ minHeight: 380 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'var(--mint-tipis)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--teal-dalam)',
            }}
          >
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy-rpp)', margin: 0 }}>
            Belum ada draf. Buat yang pertama.
          </h3>
          <p style={{ fontSize: 14, color: 'var(--abu-tinta)', margin: 0, maxWidth: 320 }}>
            Draf yang Anda buat akan tersimpan di sini dan dapat dibuka kembali kapan saja.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ width: 'auto', padding: '0 24px', marginTop: 12 }}
            onClick={() => onNavigate('create')}
          >
            Buat draf pertama
          </button>
        </div>
      )}

      {/* Table (Desktop) / Cards (Mobile) */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid var(--garis)',
            overflow: 'hidden',
          }}
        >
          {/* Desktop Table View */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 640 }}>
              <thead>
                <tr style={{ background: '#FAFCFC', borderBottom: '1px solid var(--garis)' }}>
                  <th style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--abu-tinta)' }}>
                    Judul
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--abu-tinta)' }}>
                    Mapel · Kelas
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--abu-tinta)' }}>
                    Dibuat
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: 'var(--abu-tinta)', textAlign: 'right' }}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr
                    key={d.id}
                    style={{
                      borderBottom: '1px solid var(--garis)',
                      transition: 'background 120ms',
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: 'var(--navy-rpp)',
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: 'pointer',
                          textAlign: 'left',
                          lineHeight: 1.3,
                        }}
                        onClick={() => onOpenDraft(d.id)}
                      >
                        {d.title}
                      </button>
                      <div style={{ fontSize: 12.5, color: 'var(--abu-tinta)', marginTop: 2 }}>
                        {d.mode === 'ai' ? 'AI tanpa sumber' : 'Berbasis sumber'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, color: 'var(--navy-rpp)' }}>
                      {d.subject || 'Modul Ajar'} {d.grade ? `· Kelas ${d.grade}` : ''}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 13.5, color: 'var(--abu-tinta)' }}>
                      {new Date(d.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="rpp-action-btn"
                          onClick={() => onOpenDraft(d.id)}
                        >
                          Buka
                        </button>
                        <button
                          type="button"
                          className="rpp-action-btn"
                          onClick={() => handleDownload(d.id)}
                        >
                          Word
                        </button>
                        <button
                          type="button"
                          style={{
                            height: 36,
                            padding: '0 10px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            background: '#fff',
                            border: '1px solid var(--garis)',
                            color: 'var(--error)',
                            cursor: 'pointer',
                          }}
                          onClick={() => setDeleteTarget(d)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (§7.5 - hanya tampil bila lebih dari 1 halaman) */}
          {total > 10 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderTop: '1px solid var(--garis)',
                background: '#FAFCFC',
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                style={{ height: 36, fontSize: 13 }}
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ‹ Sebelumnya
              </button>
              <span style={{ fontSize: 13.5, color: 'var(--abu-tinta)' }}>
                Halaman {page} dari {Math.max(1, Math.ceil(total / 10))}
              </span>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: 36, fontSize: 13 }}
                disabled={page * 10 >= total}
                onClick={() => setPage(p => p + 1)}
              >
                Berikutnya ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog (§8 Dialog) */}
      {deleteTarget && (
        <div className="rpp-dialog-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="rpp-dialog" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy-rpp)', margin: 0 }}>
              Hapus draf ini?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--abu-tinta)', lineHeight: 1.5, margin: 0 }}>
              Draf &ldquo;<strong>{deleteTarget.title}</strong>&rdquo; akan dihapus permanen. Draf yang dihapus tidak dapat dikembalikan dan tidak mengembalikan kuota.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                Batal
              </button>
              <button
                type="button"
                style={{
                  height: 44,
                  borderRadius: 10,
                  background: 'var(--error)',
                  color: '#fff',
                  border: 0,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: '0 20px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Menghapus…' : 'Hapus draf'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
