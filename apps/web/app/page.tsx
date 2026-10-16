'use client';
import { FormEvent, useCallback, useEffect, useId, useRef, useState } from 'react';
import { AdminPanels, AdminView, OperationsSummary } from './admin-panels';

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type User = { id: string; name: string; role: string };
type Scope = { subject: string; phase: string; grades: number[]; variant: string; region: string; page_ranges?: { start: number; end: number }[] };
type Meta = {
  title: string; category: string; year: number | null; year_unknown: boolean;
  edition: string; publisher: string; source_url: string; internal_source: boolean;
  curriculum: string; topic: string; scopes: Scope[]; license_note: string; notes: string;
  original_phases?: string[]; original_level?: string;
};
type ReviewData = {
  content: string; rights: string; extraction: string; evidence: string;
  note: string; external_processing_allowed: boolean; reviewer?: string; reviewed_at?: string;
};
type Doc = {
  id: string; filename: string; size_bytes: number; metadata: Meta;
  auto_status: string; auto_issues: string[]; review: Partial<ReviewData>;
  revision: number; uploaded_by: string; created_at: string;
  pipeline: string; vector_status: string; processing_status: string;
  extraction: { status: string; characters: number; message: string; total_pages?: number; selected_pages?: number; sections?: { locator: string; text: string }[] };
  sha256?: string; history?: { action: string; actor: string; at: string }[];
};
type Need = {
  id: string; label: string;
  criteria: { category: string; scope: Scope; curriculum: string; minimum: number; required_phases?: string[]; original_phases?: string[]; source_url?: string };
  applicability: string; note: string; uploaded: number; reviewed: number;
  state: string; document_ids: string[];
};
type Catalog = { categories: Record<string, string>; subjects: string[]; phases: string[] };
type View = 'overview' | 'documents' | 'verified' | 'review' | 'requirements' | 'vectors' | AdminView;

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const initialScope: Scope = { subject: 'Matematika', phase: 'A', grades: [], variant: '', region: '' };
const initialMeta: Meta = {
  title: '', category: '', year: null, year_unknown: false, edition: '',
  publisher: '', source_url: '', internal_source: false, curriculum: '',
  topic: '', scopes: [], license_note: '', notes: '',
};
const initialReview: ReviewData = {
  content: 'unreviewed', rights: 'unreviewed', extraction: 'unreviewed',
  evidence: '', note: '', external_processing_allowed: false,
};
const NAV_LABELS: Record<View, string> = {
  overview: 'Ringkasan', documents: 'Semua Dokumen', verified: 'File Terverifikasi',
  review: 'Perlu Ditinjau', requirements: 'Kebutuhan Sumber', vectors: 'Indeks Vektor',
  models: 'Model LLM', users: 'Pengguna', activity: 'Riwayat Aktivitas', finance: 'Keuangan',
};

/* ══════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════ */
const date = (v: string) => new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtBytes = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
const processing = (d: Doc) => ['queued', 'running'].includes(d.processing_status);
const processLabel = (d: Doc) => d.processing_status === 'queued' ? 'Dalam antrean' : d.processing_status === 'running' ? 'Mengekstrak' : d.processing_status === 'failed' ? 'Ekstraksi gagal' : d.auto_status === 'passed' ? 'Lolos otomatis' : 'Perlu ditinjau';
const pipelineLabel: Record<string, string> = { awaiting_page_selection: 'Pilih halaman SD terlebih dahulu', outside_sd_scope: 'Cakupan di luar SD', blocked: 'Pemeriksaan belum lengkap', awaiting_review: 'Menunggu tinjauan admin', awaiting_external_permission: 'Izin pemrosesan eksternal belum disetujui', eligible_for_indexing: 'Memenuhi syarat persiapan indeks' };

async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const d = data.detail;
    throw new Error(typeof d === 'string' ? d : Array.isArray(d) ? d.map((i: { msg: string }) => i.msg).join('; ') : d?.message || 'Permintaan gagal.');
  }
  return data;
}

/* ══════════════════════════════════════════
   ICON COMPONENT
══════════════════════════════════════════ */
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    users: <><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3"/></>,
    models: <><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></>,
    activity: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    finance: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    documents: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></>,
    verified: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/></>,
    review: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/></>,
    requirements: <><rect x="5" y="4" width="15" height="17" rx="2"/><path d="M9 3h7v4H9zM9 12h7m-7 5h7"/></>,
    vectors: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 4 16 4 16 0V5M4 12v7c0 4 16 4 16 0v-7"/></>,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    plus: <path d="M12 4v16M4 12h16"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    logout: <><path d="M9 4H4v16h5m5-4 4-4-4-4m-6 4h12"/></>,
    check: <path d="m4 12 5 5 11-11"/>,
    warning: <><path d="m12 2 10 18H2z"/><path d="M12 9v5m0 3h.01"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 17v-6m0-4h.01"/></>,
    file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 19h16"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 2 2L10 15H8v-2z"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/></>,
    clipboard: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.documents}
    </svg>
  );
}

function Badge({ kind, children }: { kind?: string; children: React.ReactNode }) {
  return <span className={`badge ${kind || ''}`}>{children}</span>;
}

/* ══════════════════════════════════════════
   MODAL
══════════════════════════════════════════ */
function Modal({ title, subtitle, close, children }: { title: string; subtitle: string; close: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { ref.current?.showModal(); const d = ref.current; return () => d?.close(); }, []);
  return (
    <dialog ref={ref} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); close(); }}>
      <div className="modal-head">
        <div><h2 id={titleId}>{title}</h2><p>{subtitle}</p></div>
        <button className="icon-button" aria-label="Tutup" onClick={close}><Icon name="close" /></button>
      </div>
      {children}
    </dialog>
  );
}

/* ══════════════════════════════════════════
   SCOPE FIELDS
══════════════════════════════════════════ */
function ScopeFields({ value, onChange, catalog, pages = false }: { value: Scope; onChange: (s: Scope) => void; catalog: Catalog; pages?: boolean }) {
  const set = (k: keyof Scope, v: string | number[]) => onChange({ ...value, [k]: v });
  return (
    <div className="scope-fields">
      <label>Mata Pelajaran
        <select value={value.subject} onChange={e => set('subject', e.target.value)}>
          {[...catalog.subjects, 'Lintas mapel'].map(s => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label>Fase
        <select value={value.phase} onChange={e => set('phase', e.target.value)}>
          {catalog.phases.map(p => <option key={p}>{p}</option>)}
        </select>
      </label>
      <label>Varian (agama / seni / bahasa)
        <input value={value.variant} onChange={e => set('variant', e.target.value)} placeholder="Jika relevan" maxLength={120} />
      </label>
      <label>Wilayah / muatan lokal
        <input value={value.region} onChange={e => set('region', e.target.value)} placeholder="Kosong jika umum" maxLength={120} />
      </label>
      <fieldset className="grade-set">
        <legend>Kelas yang disebutkan dalam dokumen</legend>
        {[1, 2, 3, 4, 5, 6].map(g => (
          <label key={g}>
            <input type="checkbox" checked={value.grades.includes(g)}
              onChange={() => set('grades', value.grades.includes(g) ? value.grades.filter(x => x !== g) : [...value.grades, g])} />
            {g}
          </label>
        ))}
        <small>Kosongkan jika hanya fase yang disebutkan.</small>
      </fieldset>
      {pages && <div className="page-ranges">
        <p>Halaman PDF untuk cakupan ini</p>
        <small>Gunakan urutan halaman di pembaca PDF, mulai dari 1 (termasuk sampul). Jangan menebak nomor. Kosongkan untuk pratinjau seluruh file.</small>
        {(value.page_ranges || []).map((r, i) => <div className="range-row" key={i}>
          <label>Dari<input required type="number" min="1" max="2000" value={r.start || ''} onChange={e => onChange({ ...value, page_ranges: value.page_ranges!.map((x,n) => n === i ? {...x, start:Number(e.target.value)} : x) })} /></label>
          <label>Sampai<input required type="number" min={r.start || 1} max="2000" value={r.end || ''} onChange={e => onChange({ ...value, page_ranges: value.page_ranges!.map((x,n) => n === i ? {...x, end:Number(e.target.value)} : x) })} /></label>
          <button type="button" className="text-button" onClick={() => onChange({...value, page_ranges:value.page_ranges!.filter((_,n)=>n !== i)})}>Hapus</button>
        </div>)}
        <button type="button" className="text-button" disabled={(value.page_ranges?.length || 0) >= 30} onClick={() => onChange({...value, page_ranges:[...(value.page_ranges || []), {start:0,end:0}]})}>Tambah rentang halaman</button>
      </div>}
    </div>
  );
}

/* ══════════════════════════════════════════
   METADATA FORM (UPLOAD / EDIT)
══════════════════════════════════════════ */
function MetadataForm({ catalog, existing, preset, close, saved }: {
  catalog: Catalog; existing?: Doc; preset?: Need; close: () => void; saved: () => void;
}) {
  const [meta, setMeta] = useState<Meta>(existing?.metadata || {
    ...initialMeta,
    ...(preset ? { category: preset.criteria.category, curriculum: preset.criteria.curriculum, source_url: preset.criteria.source_url || '', original_phases: preset.criteria.original_phases || [], notes: preset.note, scopes: (preset.criteria.required_phases?.length ? preset.criteria.required_phases : [preset.criteria.scope.phase]).map(phase => ({...preset.criteria.scope, phase})) } : {}),
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Meta, v: unknown) => setMeta(m => ({ ...m, [k]: v }));
  const filenameTitle = (name: string) => name.replace(/\.(pdf|docx)$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 250);
  function chooseFile(selected: File | null) {
    const previousTitle = file ? filenameTitle(file.name) : '';
    setFile(selected);
    if (selected) setMeta(m => ({ ...m, title: !m.title || m.title === previousTitle ? filenameTitle(selected.name) : m.title }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (existing) {
        await api(`/documents/${existing.id}`, { method: 'PATCH', body: JSON.stringify({ expected_revision: existing.revision, metadata: meta }) });
      } else {
        if (!file) throw new Error('Pilih PDF atau DOCX terlebih dahulu.');
        if (file.size > 128 * 1024 * 1024) throw new Error('Berkas maksimal 128 MiB.');
        const data = new FormData(); data.set('file', file); data.set('metadata', JSON.stringify(meta));
        await api('/documents', { method: 'POST', body: data });
      }
      saved(); close();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <Modal
      title={existing ? 'Lengkapi detail dokumen' : 'Unggah dokumen'}
      subtitle={existing ? 'Buka bagian yang ingin diperiksa. Isian lain boleh dilengkapi nanti.' : 'Simpan dulu. Detail sumber diperiksa setelah file masuk.'}
      close={() => { if (!busy) close(); }}
    >
      <form onSubmit={submit} onInvalidCapture={e => {
        const section = (e.target as HTMLElement).closest('details');
        if (section) section.open = true;
      }}>
        <div className="modal-body">
          {!existing && (
            <label className="dropzone">
              <Icon name="upload" size={32} />
              <strong>{file ? file.name : 'Pilih file sumber'}</strong>
              <span>PDF atau DOCX · Maks. 128 MiB</span>
              {file && <span style={{ color: 'var(--green)', fontSize: '0.75rem' }}>&#10003; {fmtBytes(file.size)}</span>}
              <input aria-label="File dokumen" type="file" accept=".pdf,.docx" required onChange={e => chooseFile(e.target.files?.[0] || null)} />
            </label>
          )}
          {existing && (
            <div className="notice">
              <Icon name="info" size={16} />
              Mengubah metadata akan menghapus persetujuan lama dan dokumen perlu diperiksa ulang. File asli tidak berubah.
            </div>
          )}

          {preset && !existing && <p className="hint">Untuk target: <strong>{preset.label}</strong>. Mapel dan calon fase mengikuti daftar kebutuhan; tetap diperiksa setelah unggah.</p>}
          <div className="form-grid">
            <label className="wide">Judul dokumen
              <input required minLength={3} maxLength={250} value={meta.title}
                onChange={e => set('title', e.target.value)} placeholder="Terisi dari nama file; boleh diubah" />
              {!existing && <small className="hint">Nama untuk menemukan file di daftar. Judul asli dapat dicocokkan nanti.</small>}
            </label>
            <label className="wide">Jenis dokumen
              <select required value={meta.category} onChange={e => set('category', e.target.value)}>
                <option value="" disabled>Pilih jenis dokumen</option>
                {Object.entries(catalog.categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>
          {!existing && <details className="metadata-section">
            <summary>Tautan sumber (opsional)</summary>
            <div className="metadata-section-body"><label>URL sumber asli<input type="url" maxLength={2000} value={meta.source_url} onChange={e=>set('source_url',e.target.value)} placeholder="Tempel tautan tempat file diperoleh" /></label><p className="hint">Membantu tim menemukan kembali asal dokumen. Boleh dilengkapi nanti.</p></div>
          </details>}
          {existing && <>
          <details className="metadata-section">
            <summary>Identitas dan versi</summary>
            <div className="metadata-section-body">
            <p className="hint">Untuk membedakan edisi dokumen dan mencatat siapa penerbitnya.</p>
            <div className="form-grid">
            <label>Tahun Terbit
              <input type="number" min="1900" max="2100" disabled={meta.year_unknown}
                value={meta.year ?? ''} onChange={e => set('year', e.target.value ? Number(e.target.value) : null)}
                placeholder="Contoh: 2025" />
            </label>
            <label className="checkline">
                <input type="checkbox" checked={meta.year_unknown}
                  onChange={e => setMeta({ ...meta, year_unknown: e.target.checked, year: e.target.checked ? null : meta.year })} />
                Tahun tidak diketahui
            </label>
            <label>Penerbit / Instansi
              <input value={meta.publisher} maxLength={200} onChange={e => set('publisher', e.target.value)} placeholder="Kemendikbud, BSKAP, dll." />
            </label>
            <label>Edisi / Nomor Keputusan
              <input value={meta.edition} maxLength={120} onChange={e => set('edition', e.target.value)} placeholder="Isi jika tercantum" />
            </label>
            <label className="wide">Acuan Kurikulum
              <input value={meta.curriculum} maxLength={200} onChange={e => set('curriculum', e.target.value)}
                placeholder="Isi nama acuan dan versi yang tercantum dalam dokumen" />
            </label>
            <label className="wide">Topik / Materi Utama
              <input value={meta.topic} maxLength={250} onChange={e => set('topic', e.target.value)}
                placeholder="Opsional — untuk CP atau panduan umum bisa dikosongkan" />
            </label>
          </div>
          </div></details>
          <details className="metadata-section">
          <summary>Mapel, fase, dan halaman</summary>
          <div className="metadata-section-body">
          <p className="hint">Agar pencarian sumber tidak mencampur mapel, jenjang, atau bagian dokumen yang berbeda.</p>
          <label>Jenjang yang tercantum pada file asli<input value={meta.original_level || ''} maxLength={150} placeholder="Misalnya SD hingga SMA; isi sesuai dokumen" onChange={e => set('original_level', e.target.value)} /></label>
          <fieldset className="grade-set"><legend>Seluruh fase pada file asli</legend>{['A','B','C','D','E','F','F Tingkat Lanjut','Umum'].map(p => <label key={p}><input type="checkbox" checked={(meta.original_phases || []).includes(p)} onChange={e => set('original_phases', e.target.checked ? [...(meta.original_phases || []),p] : meta.original_phases!.filter(x=>x!==p))}/>{p}</label>)}</fieldset>
          <p className="hint">Cakupan di bawah hanya bagian SD yang akan disiapkan. Panduan A–F cukup diunggah sekali. Periksa fase dari PDF; pilihan awal dari daftar kebutuhan masih berupa calon cakupan.</p>
          {meta.scopes.map((scope, i) => (
            <div className="scope-card" key={i}>
              <div className="section-line">
                <strong style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Cakupan {i + 1}</strong>
                {meta.scopes.length > 0 && (
                  <button type="button" className="text-button danger" onClick={() => set('scopes', meta.scopes.filter((_, n) => n !== i))}>
                    Hapus cakupan
                  </button>
                )}
              </div>
              <ScopeFields catalog={catalog} value={scope} pages={(existing?.filename || file?.name || '').toLowerCase().endsWith('.pdf')}
                onChange={s => set('scopes', meta.scopes.map((x, n) => n === i ? s : x))} />
            </div>
          ))}
          <button type="button" className="secondary small" disabled={meta.scopes.length >= 40}
            onClick={() => set('scopes', [...meta.scopes, { ...initialScope }])}>
            <Icon name="plus" size={15} /> Tambah cakupan
          </button>
          </div></details>
          <details className="metadata-section">
          <summary>Asal, izin, dan catatan</summary>
          <div className="metadata-section-body">
          <p className="hint">Untuk menelusuri sumber dan mencatat ketentuan pemakaiannya. Persetujuan dilakukan di tab Tinjauan.</p>
          <div className="form-grid">
            <label className="wide">URL Sumber Asli
              <input type="url" value={meta.source_url} onChange={e => set('source_url', e.target.value)}
                placeholder="https://..." maxLength={2000} />
            </label>
            <label className="checkline wide">
              <input type="checkbox" checked={meta.internal_source} onChange={e => set('internal_source', e.target.checked)} />
              Dokumen disusun oleh tim sendiri (sumber internal)
            </label>
            <label className="wide">Catatan Lisensi / Ketentuan Penggunaan
              <textarea value={meta.license_note} maxLength={4000} onChange={e => set('license_note', e.target.value)}
                placeholder="Catat keterangan yang ditemukan. Belum jelas boleh ditulis untuk ditinjau admin." />
            </label>
            <label className="wide">Catatan Pengumpulan (internal)
              <textarea value={meta.notes} maxLength={4000} onChange={e => set('notes', e.target.value)}
                placeholder="Konteks tambahan bagi tim — tidak dilihat pengguna akhir." />
            </label>
          </div>
          </div></details>
          </>}

          {error && <div role="alert" className="error"><Icon name="warning" size={15} />{error}</div>}
        </div>
        <div className="modal-footer">
          <p>{busy ? 'Menyimpan file...' : existing ? 'Isian yang belum lengkap tetap dapat disimpan.' : 'File masuk sebagai belum ditinjau.'}</p>
          <button disabled={busy} className="primary" type="submit">
            <Icon name="upload" size={16} />
            {busy ? 'Menyimpan...' : existing ? 'Simpan Perubahan' : 'Simpan dokumen'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   DOCUMENT DETAIL
══════════════════════════════════════════ */
function Detail({ id, catalog, user, close, refresh }: { id: string; catalog: Catalog; user: User; close: () => void; refresh: () => void }) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<ReviewData>(initialReview);
  const [tab, setTab] = useState('metadata');

  const load = useCallback(async () => {
    try { const d = await api(`/documents/${id}`); setDoc(d); setReview({ ...initialReview, ...d.review }); }
    catch (e) { setError((e as Error).message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!doc || !processing(doc)) return;
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [doc, load]);

  async function save(e: FormEvent) {
    e.preventDefault(); if (!doc) return; setBusy(true); setError('');
    try {
      const { reviewer, reviewed_at, ...fields } = review; void reviewer; void reviewed_at;
      await api(`/documents/${id}/review`, { method: 'POST', body: JSON.stringify({ ...fields, expected_revision: doc.revision }) });
      await load(); refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  if (edit && doc) return <MetadataForm catalog={catalog} existing={doc} close={() => setEdit(false)} saved={() => { load(); refresh(); }} />;

  const isEligible = doc?.pipeline === 'eligible_for_indexing';

  return (
    <Modal
      title={doc?.metadata.title || 'Detail Dokumen'}
      subtitle={doc ? `${doc.filename} · ${fmtBytes(doc.size_bytes)} · revisi metadata ${doc.revision}` : 'Memuat...'}
      close={close}
    >
      <div className="tabs">
        {[['metadata', 'Detail'], ['text', 'Pratinjau Teks'], ['review', 'Tinjauan'], ['history', 'Riwayat']].map(([key, label]) => (
          <button className={tab === key ? 'active' : ''} onClick={() => setTab(key)} key={key}>{label}</button>
        ))}
      </div>
      <div className="modal-body">
        {error && <div className="error" role="alert"><Icon name="warning" size={15} />{error}</div>}
        {doc && <>
          <div className="notice"><Icon name="info" size={16}/><div>{processLabel(doc)} · {pipelineLabel[doc.pipeline] || doc.pipeline}
            {doc.extraction.total_pages != null && <p>{doc.extraction.selected_pages} dari {doc.extraction.total_pages} halaman PDF diekstrak.</p>}
          </div></div>
          {!processing(doc) && <button className="text-button" disabled={busy} onClick={async () => {
            setBusy(true); setError('');
            try { await api(`/documents/${id}/process`, {method:'POST'}); await load(); refresh(); }
            catch(e) { setError((e as Error).message); } finally { setBusy(false); }
          }}>Proses ulang teks (tinjauan akan direset)</button>}
          {tab === 'metadata' && <>
            <div className="section-line">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge kind={doc.auto_status === 'passed' ? 'green' : 'amber'}>
                  {doc.auto_status === 'passed' ? 'Lolos Otomatis' : 'Perlu Ditinjau'}
                </Badge>
                <Badge kind={isEligible ? 'green' : 'neutral'}>
                  {isEligible ? 'Siap Indeks' : 'Belum Lengkap'}
                </Badge>
                <Badge kind="blue">{catalog.categories[doc.metadata.category]}</Badge>
              </div>
              <button className="secondary small" onClick={() => setEdit(true)}>
                <Icon name="edit" size={14} /> Edit
              </button>
            </div>
            <div className="detail-grid">
              {[
                ['Kategori', catalog.categories[doc.metadata.category]],
                ['Tahun Terbit', doc.metadata.year ? String(doc.metadata.year) : 'Tidak diketahui'],
                ['Penerbit', doc.metadata.publisher || 'Belum diisi'],
                ['Acuan Kurikulum', doc.metadata.curriculum || 'Belum diisi'],
                ['Edisi', doc.metadata.edition || 'Belum diisi'],
                ['Format', doc.filename.split('.').pop()?.toUpperCase() || ''],
                ['Ukuran File', fmtBytes(doc.size_bytes)],
                ['Pengumpul', doc.uploaded_by],
                ['Diunggah', date(doc.created_at)],
                ['Jenjang asli', doc.metadata.original_level || 'Belum dicatat'],
                ['Fase asli', doc.metadata.original_phases?.join(', ') || 'Belum dicatat'],
              ].map(([k, v]) => (
                <div key={k}><small>{k}</small><strong>{v}</strong></div>
              ))}
            </div>
            {doc.metadata.topic && <><h3>Topik / Materi</h3><p style={{ fontSize: '0.875rem' }}>{doc.metadata.topic}</p></>}
            <h3>Cakupan</h3>
            {!doc.metadata.scopes.length && <p className="hint">Mapel dan fase belum ditentukan. Lengkapi saat pemeriksaan sumber.</p>}
            {doc.metadata.scopes.map((s, i) => (
              <div className="scope-summary" key={i}>
                <strong>{s.subject}</strong>{s.variant && ` / ${s.variant}`}
                {' \u00b7 '}{s.phase === 'Umum' ? 'Umum' : `Fase ${s.phase}`}
                {s.grades.length > 0 && ` \u00b7 Kelas ${s.grades.join(', ')}`}
                {s.region && ` \u00b7 ${s.region}`}
                {!!s.page_ranges?.length && ` · Halaman PDF ${s.page_ranges.map(r=>r.start === r.end ? r.start : `${r.start}–${r.end}`).join(', ')}`}
              </div>
            ))}
            <h3>Asal &amp; Izin</h3>
            {doc.metadata.source_url
              ? <a href={doc.metadata.source_url} target="_blank" rel="noreferrer" className="source-link">{doc.metadata.source_url}</a>
              : <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{doc.metadata.internal_source ? 'Disusun internal oleh tim' : 'URL belum diisi'}</p>}
            {doc.metadata.license_note && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{doc.metadata.license_note}</p>}
            <details>
              <summary>Identitas File (SHA-256)</summary>
              <code className="hash">{doc.sha256}</code>
            </details>
            <a className="secondary small download" href={`/api/v1/documents/${id}/file`}><Icon name="download" size={14} /> Unduh File Asli</a>
          </>}

          {tab === 'text' && <>
            <div className="notice">
              <Icon name="info" size={16} />
              Hasil ekstraksi otomatis &middot; {doc.extraction.characters.toLocaleString('id-ID')} karakter. Periksa terhadap file asli.
            </div>
            {doc.extraction.message && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{doc.extraction.message}</p>}
            {doc.extraction.sections?.length
              ? doc.extraction.sections.map((s, i) => (
                <div className="text-section" key={i}><strong>{s.locator}</strong><pre>{s.text || '(Tidak ada teks terbaca)'}</pre></div>
              ))
              : <div className="empty compact"><p>Belum ada teks yang dapat ditampilkan.</p></div>}
          </>}

          {tab === 'review' && <>
            <div className="notice">
              <Icon name="clipboard" size={16} />
              Pemeriksaan otomatis mencakup format, duplikasi, metadata, dan keterbacaan. Isi, izin, dan kualitas ekstraksi memerlukan peninjau admin.
            </div>
            {doc.auto_issues.length > 0 && (
              <ul className="issues">{doc.auto_issues.map((s, i) => <li key={i}>{s}</li>)}</ul>
            )}
            <form onSubmit={save}>
              <div className="form-grid">
                {(['content', 'rights', 'extraction'] as const).map(key => (
                  <label key={key}>
                    {key === 'content' ? 'Validasi Isi' : key === 'rights' ? 'Izin Penggunaan' : 'Kualitas Ekstraksi'}
                    <select disabled={user.role !== 'admin'} value={review[key]}
                      onChange={e => setReview({ ...review, [key]: e.target.value })}>
                      <option value="unreviewed">Belum diperiksa</option>
                      <option value="approved">Disetujui sesuai bukti</option>
                      {key !== 'rights' && <option value="needs_revision">Perlu revisi</option>}
                      {key === 'content' && <option value="rejected">Ditolak</option>}
                      {key === 'rights' && <>
                        <option value="noncommercial">Nonkomersial saja</option>
                        <option value="denied">Tidak diizinkan</option>
                      </>}
                    </select>
                  </label>
                ))}
                <label className="wide">Bukti / Rujukan Pemeriksaan
                  <input disabled={user.role !== 'admin'} value={review.evidence}
                    onChange={e => setReview({ ...review, evidence: e.target.value })}
                    placeholder="URL izin atau referensi catatan peninjau" maxLength={2000} />
                </label>
                <label className="wide">Catatan Peninjau
                  <textarea disabled={user.role !== 'admin'} value={review.note}
                    maxLength={4000} onChange={e => setReview({ ...review, note: e.target.value })} />
                </label>
                <label className="checkline wide">
                  <input disabled={user.role !== 'admin'} type="checkbox"
                    checked={review.external_processing_allowed}
                    onChange={e => setReview({ ...review, external_processing_allowed: e.target.checked })} />
                  Bukti izin mencakup pengiriman teks ke penyedia embedding eksternal.
                </label>
              </div>
              {review.reviewer && <p className="hint" style={{ marginTop: 8 }}>Terakhir ditinjau {review.reviewer} &middot; {date(review.reviewed_at!)}</p>}
              {error && <div role="alert" className="error" style={{ marginTop: 8 }}><Icon name="warning" size={15} />{error}</div>}
              {user.role === 'admin'
                ? <button className="primary" disabled={busy || processing(doc)} style={{ marginTop: 12 }}>{processing(doc) ? 'Menunggu ekstraksi' : busy ? 'Menyimpan...' : 'Simpan Tinjauan'}</button>
                : <p className="hint" style={{ marginTop: 8 }}>Akun pengumpul dapat melihat hasil. Persetujuan dilakukan admin.</p>}
              <p className="hint" style={{ marginTop: 6 }}>Persetujuan belum mengirim file ke Qdrant. Pengindeksan belum diaktifkan.</p>
            </form>
          </>}

          {tab === 'history' && (
            <div className="timeline">
              {doc.history?.map((h, i) => (
                <div key={i}>
                  <span className="timeline-dot" />
                  <div><strong>{h.action}</strong><p>{h.actor} &middot; {date(h.at)}</p></div>
                </div>
              ))}
            </div>
          )}
        </>}
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   REQUIREMENT FORM
══════════════════════════════════════════ */
function RequirementForm({ catalog, existing, close, saved }: {
  catalog: Catalog; existing?: Need; close: () => void; saved: () => void;
}) {
  const [value, setValue] = useState({
    label: existing?.label || '', category: existing?.criteria.category || 'CP',
    scope: existing?.criteria.scope || initialScope,
    curriculum: existing?.criteria.curriculum || '',
    minimum: existing?.criteria.minimum || 1,
    note: existing?.note || '',
    applicability: existing?.applicability || 'unconfirmed',
    required_phases: existing?.criteria.required_phases || [],
    original_phases: existing?.criteria.original_phases || [],
    source_url: existing?.criteria.source_url || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api(existing ? `/requirements/${existing.id}` : '/requirements', {
        method: existing ? 'PUT' : 'POST', body: JSON.stringify(value),
      });
      saved(); close();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <Modal title={existing ? 'Ubah Kebutuhan Sumber' : 'Tambah Kebutuhan Sumber'}
      subtitle="Tentukan target pengumpulan. Ketersediaan dihitung dari dokumen yang cocok." close={() => { if (!busy) close(); }}>
      <form onSubmit={submit}>
        <div className="modal-body">
          <div className="form-grid">
            <label className="wide">Nama Kebutuhan *
              <input required minLength={3} maxLength={200} value={value.label}
                onChange={e => setValue({ ...value, label: e.target.value })}
                placeholder="Contoh: CP Matematika Fase A" />
            </label>
            <label>Kategori *
              <select value={value.category} onChange={e => setValue({ ...value, category: e.target.value })}>
                {Object.entries(catalog.categories).map(([k, v]) => <option value={k} key={k}>{v}</option>)}
              </select>
            </label>
            <label>Target Jumlah File
              <input type="number" min="1" max="20" required value={value.minimum}
                onChange={e => setValue({ ...value, minimum: Number(e.target.value) })} />
            </label>
            <label className="wide">Acuan Kurikulum yang Dicari
              <input value={value.curriculum} maxLength={200}
                onChange={e => setValue({ ...value, curriculum: e.target.value })}
                placeholder="Kosong = hanya menghitung kandidat" />
            </label>
          </div>
          <h3>Cakupan Target</h3>
          <fieldset className="grade-set"><legend>Fase yang harus tersedia dalam satu file (opsional)</legend>{['A','B','C'].map(p=><label key={p}><input type="checkbox" checked={value.required_phases.includes(p)} onChange={e=>setValue({...value,required_phases:e.target.checked?[...value.required_phases,p]:value.required_phases.filter(x=>x!==p)})}/>{p}</label>)}</fieldset>
          <ScopeFields catalog={catalog} value={value.scope} onChange={scope => setValue({ ...value, scope })} />
          <div className="form-grid">
            <label className="wide">Status Penerapan
              <select value={value.applicability} onChange={e => setValue({ ...value, applicability: e.target.value })}>
                <option value="unconfirmed">Belum dikonfirmasi</option>
                <option value="applicable">Berlaku sesuai bukti</option>
                <option value="not_applicable">Tidak berlaku sesuai bukti</option>
              </select>
            </label>
            <label className="wide">Dasar Penerapan / Catatan
              <textarea maxLength={2000} value={value.note} onChange={e => setValue({ ...value, note: e.target.value })} />
            </label>
          </div>
          {error && <div className="error" role="alert"><Icon name="warning" size={15} />{error}</div>}
        </div>
        <div className="modal-footer">
          <p>Jumlah file tidak otomatis membuktikan kualitas.</p>
          <button className="primary" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan Kebutuhan'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [catalog, setCatalog] = useState<Catalog>({ categories: {}, subjects: [], phases: [] });
  const [docs, setDocs] = useState<Doc[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [view, setView] = useState<View>('overview');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [phase, setPhase] = useState('');
  const [upload, setUpload] = useState(false);
  const [preset, setPreset] = useState<Need | undefined>();
  const [needModal, setNeedModal] = useState(false);
  const [editNeed, setEditNeed] = useState<Need | undefined>();
  const [detail, setDetail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  useEffect(() => { api('/me').then(setUser).catch(() => {}).finally(() => setBooting(false)); }, []);
  useEffect(() => {
    const read = () => {
      const target = window.location.hash.slice(1) as View;
      const restricted = ['models', 'users', 'activity', 'finance'].includes(target);
      setView(target in NAV_LABELS && (!restricted || user?.role === 'admin') ? target : 'overview');
      setNotice('');
    };
    read(); window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [user]);

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [d, r, c] = await Promise.all([api('/documents'), api('/requirements'), api('/catalog')]);
      setDocs(d.items); setNeeds(r.items); setCatalog(c);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) refresh(); }, [user, refresh]);
  useEffect(() => {
    if (!user || !docs.some(processing)) return;
    const timer = setInterval(refresh, 4000);
    return () => clearInterval(timer);
  }, [user, docs, refresh]);

  const saved = () => { setNotice('Perubahan tersimpan.'); refresh(); };
  const navigate = (v: View) => { window.location.hash = v; setView(v); setQuery(''); setCategory(''); setPhase(''); setNotice(''); };

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setLoginBusy(true);
    const data = new FormData(e.currentTarget);
    try { setUser(await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) })); }
    catch (e) { setError((e as Error).message); }
    finally { setLoginBusy(false); }
  }

  const passed = docs.filter(d => d.auto_status === 'passed').length;
  const manual = docs.filter(d => d.review.content === 'approved' && d.review.rights === 'approved' && d.review.extraction === 'approved').length;
  const eligible = docs.filter(d => d.pipeline === 'eligible_for_indexing').length;
  const missing = needs.filter(n => n.state === 'missing').length;

  const rows = docs.filter(d =>
    (view !== 'verified' || d.auto_status === 'passed') &&
    (view !== 'review' || d.auto_status !== 'passed' || d.pipeline !== 'eligible_for_indexing') &&
    (!category || d.metadata.category === category) &&
    (!phase || d.metadata.scopes.some(s => s.phase === phase)) &&
    (`${d.metadata.title} ${d.filename} ${d.metadata.scopes.map(s => s.subject + ' ' + s.variant).join(' ')}`
      .toLowerCase().includes(query.toLowerCase()))
  );

  if (booting) return (
    <div className="loading-screen">
      <span className="brand-mark">r.</span>
      <p>Menyiapkan ruang kerja...</p>
    </div>
  );

  if (!user) return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-box">
          <div className="brand">Ruang<span>RPP</span></div>
          <h1>Masuk ke admin</h1>
          <p>Kelola sumber dan operasional RuangRPP.</p>
          <form onSubmit={login}>
            <label>Email<input name="email" type="email" autoComplete="username" required placeholder="nama@tim.id" /></label>
            <label>Kata Sandi<input name="password" type="password" autoComplete="current-password" required /></label>
            {error && <div role="alert" className="error"><Icon name="warning" size={15} />{error}</div>}
            <button className="primary" disabled={loginBusy}>
              {loginBusy ? 'Memeriksa...' : 'Masuk ke Ruang Kerja'}<Icon name="arrow" size={18} />
            </button>
          </form>
          <div className="login-note">
            <p>Akses khusus tim. Akun dibuat oleh pengelola RuangRPP; tidak ada pendaftaran publik.</p>
          </div>
        </div>
      </section>
    </main>
  );

  function docTable(list: Doc[]) {
    if (!list.length) return (
      <div className="empty">
        <span className="empty-icon"><Icon name="documents" size={32} /></span>
        <h3>{docs.length ? 'Tidak ada dokumen yang cocok' : 'Mulai dari sumber pertama'}</h3>
        <p>{docs.length ? 'Ubah filter atau kata pencarian Anda.' : 'Unggah CP, modul ajar, atau panduan. Setiap sumber tersimpan dengan detail dan hasil pemeriksaannya.'}</p>
        <button className="secondary" onClick={() => { setPreset(undefined); setUpload(true); }}><Icon name="plus" size={17} /> Unggah Dokumen</button>
      </div>
    );
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Dokumen</th>
              <th>Cakupan</th>
              <th>Fase</th>
              <th>Tahun</th>
              <th>Otomatis</th>
              <th>Tinjauan</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(d => (
              <tr key={d.id}>
                <td>
                  <div className="document-cell">
                    <span className={`file-icon ${d.metadata.category === 'CP' ? 'cp' : d.metadata.category === 'Modul_Ajar' ? 'modul' : d.metadata.category === 'Panduan' ? 'panduan' : ''}`}>
                      <Icon name="file" />
                    </span>
                    <button className="doc-title" onClick={() => setDetail(d.id)}>
                      {d.metadata.title}
                      <small>{catalog.categories[d.metadata.category]} &middot; {d.filename.split('.').pop()?.toUpperCase()}</small>
                    </button>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '0.875rem' }}>{d.metadata.scopes[0]?.subject || 'Belum ditentukan'}</span>
                  {d.metadata.scopes[0]?.variant && <small style={{ color: 'var(--text-muted)', display: 'block' }}>{d.metadata.scopes[0].variant}</small>}
                  {d.metadata.scopes.length > 1 && <small style={{ color: 'var(--text-muted)', display: 'block' }}>+{d.metadata.scopes.length - 1} lainnya</small>}
                </td>
                <td>
                  <div className="detail-chips">
                    {[...new Set(d.metadata.scopes.map(s => s.phase === 'Umum' ? 'Umum' : `Fase ${s.phase}`))].map(p => (
                      <span className="chip ok" key={p}>{p}</span>
                    ))}
                  </div>
                </td>
                <td style={{ fontSize: '0.875rem' }}>{d.metadata.year || (d.metadata.year_unknown ? 'Tidak diketahui' : 'Belum diisi')}</td>
                <td><Badge kind={d.auto_status === 'passed' ? 'green' : 'amber'}>{processLabel(d)}</Badge></td>
                <td><Badge kind={d.pipeline === 'eligible_for_indexing' ? 'green' : 'neutral'}>{d.pipeline === 'eligible_for_indexing' ? 'Siap' : 'Belum'}</Badge></td>
                <td><button className="icon-button" aria-label={`Buka ${d.metadata.title}`} onClick={() => setDetail(d.id)}><Icon name="arrow" size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function verifiedView() {
    return (
      <section className="panel">
        <div className="inline-note">
          <Icon name="verified" size={16} />
          File lolos otomatis berarti format, metadata, dan keterbacaan dasar terpenuhi. Isi, izin, dan kualitas ekstraksi tetap memerlukan tinjauan admin.
        </div>
        <div className="filters">
          <label className="search">
            <Icon name="search" size={16} />
            <input placeholder="Cari dokumen terverifikasi..." value={query} onChange={e => setQuery(e.target.value)} />
          </label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Semua kategori</option>
            {Object.entries(catalog.categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={phase} onChange={e => setPhase(e.target.value)}>
            <option value="">Semua fase</option>
            {catalog.phases.map(p => <option key={p} value={p}>{p === 'Umum' ? p : `Fase ${p}`}</option>)}
          </select>
          <a className="secondary small" href="/api/v1/inventory.csv"><Icon name="download" size={14} /> Ekspor CSV</a>
        </div>
        {docTable(rows)}
        <div className="table-foot">{rows.length} dokumen lolos pemeriksaan otomatis</div>
      </section>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">r.</span>Ruang<span>RPP</span></div>
        <div className="workspace-label">ADMIN RUANGRPP</div>
        <nav aria-label="Menu utama">
          {(['overview', 'documents', 'verified', 'review', 'requirements', 'vectors', ...(user.role === 'admin' ? ['users', 'activity', 'models', 'finance'] : [])] as View[]).map((v, i) => (
            <div key={v}>
              {i === 1 && <p className="nav-heading">SUMBER PEMBELAJARAN</p>}
              {i === 6 && <p className="nav-heading">OPERASIONAL</p>}
              <button onClick={() => navigate(v)} aria-current={view === v ? 'page' : undefined} className={view === v ? 'selected' : ''}>
                <Icon name={v} />
                <span>{NAV_LABELS[v]}</span>
                {v === 'review' && docs.length - manual > 0 && <b>{docs.length - manual}</b>}
              </button>
            </div>
          ))}
        </nav>
        <div className="profile">
          <span className="avatar">{user.name[0]?.toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role === 'admin' ? 'Admin & Peninjau' : 'Pengumpul Sumber'}</small>
          </div>
          <button className="icon-button" aria-label="Keluar" onClick={async () => {
            try { await api('/auth/logout', { method: 'POST' }); setUser(null); setDocs([]); setNeeds([]); setError(''); }
            catch (e) { setError((e as Error).message); }
          }}><Icon name="logout" size={18} /></button>
        </div>
      </aside>

      <div className="main-wrap">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Ruang Kerja <span>/</span></span>
            {NAV_LABELS[view]}
          </div>
          <div className="topbar-right">
            Koleksi tim
            <span className="topbar-divider" />
            <span>SD &middot; Kelas 1&ndash;6</span>
          </div>
        </header>

        <main className="content">
          <div className="page-heading">
            <div>
              <h1>{view === 'overview' ? 'Ringkasan' : NAV_LABELS[view]}</h1>
              <p>
                {view === 'overview' && 'Pantau sumber pembelajaran dan kesiapan operasional RuangRPP.'}
                {view === 'models' && 'Atur penyedia dan model yang akan digunakan oleh generator.'}
                {view === 'users' && 'Lihat akun tim dan kesiapan layanan untuk guru.'}
                {view === 'activity' && 'Telusuri aktivitas pengguna dan perubahan yang tersimpan.'}
                {view === 'finance' && 'Pantau pemasukan dan biaya setelah integrasi pembayaran tersedia.'}
                {view === 'documents' && 'Temukan, lengkapi, dan tinjau dokumen pembelajaran Anda.'}
                {view === 'verified' && 'File yang lolos pemeriksaan teknis — lengkap dengan detail dan status tinjauan per file.'}
                {view === 'review' && 'Dokumen yang memerlukan perhatian admin untuk ditinjau.'}
                {view === 'requirements' && 'Lihat sumber yang sudah terkumpul dan bagian yang masih perlu dilengkapi.'}
                {view === 'vectors' && 'Pantau kesiapan dokumen sebelum masuk ke tahap embedding dan pengindeksan.'}
              </p>
            </div>
            {!['models', 'users', 'activity', 'finance'].includes(view) && <button className="primary" onClick={() => { setPreset(undefined); setUpload(true); }}>
              <Icon name="plus" size={18} /> Unggah Dokumen
            </button>}
          </div>

          {error && (
            <div role="alert" className="error error-row">
              <Icon name="warning" size={15} />{error}
              <button className="text-button" style={{ marginLeft: 'auto' }} onClick={refresh}>Coba lagi</button>
            </div>
          )}
          {notice && (
            <div role="status" className="success">
              <Icon name="check" size={15} />{notice}
              <button className="text-button" style={{ marginLeft: 'auto' }} onClick={() => setNotice('')}>Tutup</button>
            </div>
          )}
          {loading && <p role="status" className="hint" style={{ marginBottom: 12 }}>Memuat data terbaru...</p>}

          {view === 'overview' && <>
            {user.role === 'admin' && <OperationsSummary api={api} navigate={navigate} />}
            <div className="stats">
              {[
                [docs.length, 'Total Dokumen', 'Sumber dalam koleksi', 'documents', ''],
                [passed, 'Lolos Otomatis', 'Format, metadata & keterbacaan', 'verified', 'var(--green)'],
                [manual, 'Ditinjau Lengkap', 'Isi, izin & ekstraksi disetujui', 'review', 'var(--accent)'],
                [missing, 'Belum Terkumpul', `${needs.length} kebutuhan dicatat`, 'requirements', 'var(--amber)'],
              ].map(([value, label, sub, icon, color]) => (
                <div className="stat" key={String(label)}>
                  <div><span>{String(label)}</span><Icon name={String(icon)} size={18} /></div>
                  <strong>{error ? '?' : value}</strong>
                  <small>{String(sub)}</small>
                </div>
              ))}
            </div>

            <div className="section-line section-heading">
              <div><h2>Koleksi Sumber</h2><p>Kelompok dokumen yang dibutuhkan tim.</p></div>
              <button className="text-button" onClick={() => navigate('requirements')}>Lihat kebutuhan <Icon name="arrow" size={16} /></button>
            </div>
            <div className="category-grid">
              {Object.entries(catalog.categories).map(([k, v]) => (
                <button className="category-card" key={k} onClick={() => { navigate('documents'); setCategory(k); }}>
                  <strong>{v}</strong>
                  <span>{docs.filter(d => d.metadata.category === k).length} dokumen <Icon name="arrow" size={14} /></span>
                </button>
              ))}
            </div>

            <section className="panel">
              <div className="panel-head">
                <div><h2>Dokumen Terbaru</h2><p>Unggahan terbaru dan status pemeriksaannya.</p></div>
                <button className="text-button" onClick={() => navigate('documents')}>Lihat semua <Icon name="arrow" size={16} /></button>
              </div>
              {docTable(docs.slice(0, 5))}
            </section>
          </>}

          {user.role === 'admin' && ['models', 'users', 'activity', 'finance'].includes(view) && <AdminPanels key={view} view={view as AdminView} api={api} openDocument={setDetail} />}
          {(['documents', 'review'] as View[]).includes(view) && (
            <section className="panel">
              <div className="filters">
                <label className="search">
                  <Icon name="search" size={16} />
                  <input aria-label="Cari dokumen" placeholder="Cari nama dokumen atau mata pelajaran..." value={query} onChange={e => setQuery(e.target.value)} />
                </label>
                <select aria-label="Filter kategori" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">Semua kategori</option>
                  {Object.entries(catalog.categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select aria-label="Filter fase" value={phase} onChange={e => setPhase(e.target.value)}>
                  <option value="">Semua fase</option>
                  {catalog.phases.map(p => <option key={p} value={p}>{p === 'Umum' ? p : `Fase ${p}`}</option>)}
                </select>
                <a className="secondary small" href="/api/v1/inventory.csv"><Icon name="download" size={14} /> Ekspor CSV</a>
              </div>
              {docTable(rows)}
              <div className="table-foot">{rows.length} dokumen &middot; File asli tetap tersimpan tanpa perubahan</div>
            </section>
          )}

          {view === 'verified' && verifiedView()}

          {view === 'requirements' && <>
            <div className="notice">
              <Icon name="info" size={16} />
              Kebutuhan adalah rencana pengumpulan. &quot;Lengkap&quot; berarti target file dan tinjauan terpenuhi, belum berarti sumber aktif di RAG.
            </div>
            <div className="section-line section-heading" style={{ marginTop: 16 }}>
              <h2>{needs.length} Kebutuhan Sumber</h2>
              {user.role === 'admin' && (
                <div className="button-group">
                  <button className="secondary small" onClick={async () => {
                    setError('');
                    try { const result = await api('/requirements/guides-sd', { method: 'POST' }); await refresh(); setCategory('Panduan_Mapel'); setNotice(`${result.added} target panduan ditambahkan. File PDF belum diunduh; versi dan izin tetap perlu diperiksa.`); }
                    catch (e) { setError((e as Error).message); }
                  }}>Tambahkan 20 Panduan Mapel</button>
                  <button className="secondary small" onClick={async () => {
                    setError('');
                    try { await api('/requirements/template', { method: 'POST' }); saved(); }
                    catch (e) { setError((e as Error).message); }
                  }}>Calon CP &amp; Modul</button>
                  <button className="primary small" onClick={() => { setEditNeed(undefined); setNeedModal(true); }}>
                    <Icon name="plus" size={15} /> Tambah Kebutuhan
                  </button>
                </div>
              )}
            </div>
            {needs.length ? (
              <section className="panel">
                <div className="filters">
                  <label className="search"><Icon name="search" size={16} /><input aria-label="Cari kebutuhan" placeholder="Cari mapel, fase, atau kategori…" value={query} onChange={e => setQuery(e.target.value)} /></label>
                  <select aria-label="Kategori kebutuhan" value={category} onChange={e => setCategory(e.target.value)}><option value="">Semua kategori</option>{Object.entries(catalog.categories).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select>
                </div>
                <div className="table-scroll">
                  <table className="requirements-table">
                    <thead><tr><th>Kebutuhan sumber</th><th>Penerapan</th><th>Terkumpul</th><th>Ditinjau</th><th>Status</th><th>Tindakan</th></tr></thead>
                    <tbody>{needs.filter(n => (!category || n.criteria.category === category) && `${n.label} ${n.criteria.scope.subject} ${n.criteria.scope.variant}`.toLowerCase().includes(query.toLowerCase())).map(n => (
                      <tr key={n.id}>
                        <td className="need-label"><strong>{n.label}</strong><small>{catalog.categories[n.criteria.category]} · {n.criteria.required_phases?.length ? `Target SD: ${n.criteria.required_phases.join(', ')}` : n.criteria.scope.phase === 'Umum' ? 'Umum' : `Fase ${n.criteria.scope.phase}`}{n.criteria.scope.grades.length > 0 && ` · Kelas ${n.criteria.scope.grades.join(', ')}`}{n.criteria.scope.variant && ` · ${n.criteria.scope.variant}`}{n.criteria.scope.region && ` · ${n.criteria.scope.region}`}</small>{n.criteria.curriculum && <small>{n.criteria.curriculum}</small>}{n.criteria.source_url && <a className="source-link" target="_blank" rel="noreferrer" href={n.criteria.source_url}>Halaman sumber resmi</a>}</td>
                        <td><span className="hint">{n.applicability === 'unconfirmed' ? 'Belum dikonfirmasi' : n.applicability === 'applicable' ? 'Berlaku' : 'Tidak berlaku'}</span></td>
                        <td>{n.uploaded} / {n.criteria.minimum}</td><td>{n.reviewed} / {n.criteria.minimum}</td>
                        <td><Badge kind={n.state === 'complete' ? 'green' : n.state === 'missing' ? 'amber' : 'neutral'}>{n.state === 'complete' ? 'Lengkap' : n.state === 'missing' ? 'Belum ada' : n.state === 'not_applicable' ? 'Tidak berlaku' : 'Perlu tinjauan'}</Badge></td>
                        <td><div className="button-group"><button className="text-button" disabled={n.state === 'not_applicable'} onClick={() => { setPreset(n); setUpload(true); }}>Unggah</button>{user.role === 'admin' && <button className="text-button muted" onClick={() => { setEditNeed(n); setNeedModal(true); }}>Edit</button>}{n.document_ids.length > 0 && <button className="text-button" onClick={() => setDetail(n.document_ids[0])}>Lihat file</button>}</div></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="table-foot">{needs.filter(n => (!category || n.criteria.category === category) && `${n.label} ${n.criteria.scope.subject} ${n.criteria.scope.variant}`.toLowerCase().includes(query.toLowerCase())).length} kebutuhan ditampilkan. Target panduan terpisah dari CP dan modul ajar. Satu file dapat mencakup beberapa fase.</div>
              </section>
            ) : (
              <div className="panel empty">
                <Icon name="requirements" size={32} />
                <h3>Susun Daftar Kebutuhan Tim</h3>
                <p>Buat daftar awal CP dan modul ajar SD, lalu sesuaikan varian, acuan, dan penerapannya.</p>
              </div>
            )}
          </>}

          {view === 'vectors' && (
            <section className="panel vector-panel">
                            <Badge kind="neutral">TAHAP BERIKUTNYA</Badge>
              <h2>Pengindeksan belum aktif</h2>
              <p>Pengindeksan Qdrant belum diaktifkan. Tidak ada file yang dikirim ke penyedia embedding dari dashboard ini.</p>
              <div className="vector-stats">
                <div><strong style={{ color: 'var(--green)' }}>{eligible}</strong><span>Memenuhi Syarat</span></div>
                <div><strong>0</strong><span>Dokumen Diindeks</span></div>
                <div><strong>{docs.length - eligible}</strong><span>Belum Memenuhi</span></div>
              </div>
              <div className="notice">
                <Icon name="info" size={16} />
                Sebelum aktif: pratinjau chunk, pilih model embedding, bangun indeks staging, lalu uji retrieval.
              </div>
              <button className="secondary" onClick={() => navigate('review')}>Buka Antrean Tinjauan <Icon name="arrow" size={16} /></button>
            </section>
          )}

          <footer className="page-footer">
            <span>RuangRPP · Pengelolaan sumber pembelajaran</span>
          </footer>
        </main>
      </div>

      {upload && <MetadataForm catalog={catalog} preset={preset} close={() => setUpload(false)} saved={saved} />}
      {detail && <Detail id={detail} catalog={catalog} user={user} close={() => setDetail(null)} refresh={saved} />}
      {needModal && <RequirementForm catalog={catalog} existing={editNeed} close={() => setNeedModal(false)} saved={saved} />}
    </div>
  );
}
