'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';

type Scope = { id: string; subject: string; phase: string; grade: number; curriculum: string; variant: string; ready: boolean; missing: string[] };
type Subject = { name: string; grades: number[]; variant_required: boolean };
type Reference = { id: string; title: string; locator: string; text: string; category: string; source_url: string; score?: number; scope?: { subject: string; phase: string } };
type Objective = { text: string; source_ids: string[] };
type Section = Objective & { heading: string; kind: 'curriculum' | 'adaptation' };
type Result = { title: string; objectives: Objective[]; sections: Section[] };
type Draft = { id?: string; mode: 'ai' | 'rag'; result: Result; references: Reference[]; revision?: number; model: { provider: string; model: string }; credits_used?: number };
type Index = { id: string; status: string; count: number; error: string; tested: boolean; embedding: { model: string } };
type Source = { document_id: string; title: string; eligible: boolean; index: Index | null };
type AdminData = { items: Source[]; key_configured: boolean; embedding: { model: string }; scopes: Scope[] };
const indexLabels: Record<string, string> = { preview: 'Pratinjau', queued: 'Dalam antrean', processing: 'Membuat embedding', ready: 'Siap diuji', active: 'Aktif', inactive: 'Nonaktif', stale: 'Perlu disiapkan ulang', failed: 'Gagal' };

async function request<T>(path: string, body?: object, method = 'POST'): Promise<T> {
  const r = await fetch('/api/v1' + path, { cache: 'no-store', ...(body !== undefined ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  const value = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof value.detail === 'string' ? value.detail : 'Permintaan belum berhasil. Periksa isian atau muat ulang.');
  return value;
}

function References({ items }: { items: Reference[] }) {
  return <div className="rag-references">{items.map((r, i) => <details key={r.id}><summary>{i + 1}. {r.title} · {r.locator}</summary><p className="hint">{r.category}{r.scope && ` · ${r.scope.subject} · Fase ${r.scope.phase}`}{typeof r.score === 'number' && ` · Skor kemiripan ${r.score.toFixed(3)}`}</p><p className="rag-text">{r.text}</p>{r.source_url && <a className="text-button" href={r.source_url} target="_blank" rel="noreferrer">Buka sumber asli</a>}</details>)}</div>;
}

function DraftView({ draft, saved }: { draft: Draft; saved?: (d: Draft) => void }) {
  const [value, setValue] = useState(draft.result);
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setValue(draft.result); setEdit(false); setError(''); }, [draft]);
  const ai = draft.mode === 'ai';
  const refs = (ids: string[]) => ids.map(id => draft.references.findIndex(r => r.id === id) + 1).filter(n => n > 0).join(', ');
  async function save() {
    setBusy(true); setError('');
    try { const d = await request<Draft>(`/teacher/drafts/${draft.id}`, { expected_revision: draft.revision, result: value }, 'PATCH'); saved?.(d); setEdit(false); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <section className="panel teacher-section rag-draft"><div className="panel-head"><span className="badge">{ai ? 'Draf AI · tanpa sumber' : 'Draf berbasis sumber'}</span>{draft.id && <button className="secondary small" disabled={busy} onClick={() => { setValue(draft.result); setEdit(!edit); }}>{edit ? 'Batalkan suntingan' : 'Edit draf'}</button>}</div>
    <p className="inline-note">{ai ? 'Belum diverifikasi terhadap CP. Tujuan, materi, dan kegiatan merupakan usulan AI. Periksa kesesuaiannya dengan kurikulum dan kondisi kelas sebelum digunakan.' : 'Perlu tinjauan guru. Rujukan menunjukkan sumber yang dipakai, bukan jaminan isi draf benar.'}</p>
    <p className="hint">{draft.model.provider} / {draft.model.model}.{(draft.revision || 1) > 1 && ' Draf sudah disunting; periksa kembali isinya.'}</p>
    {edit ? <label>Judul<input maxLength={250} value={value.title} onChange={e => setValue({ ...value, title: e.target.value })} /></label> : <h2>{value.title}</h2>}
    <h3>{ai ? 'Usulan tujuan pembelajaran' : 'Tujuan pembelajaran'}</h3>{value.objectives.map((o, i) => <div key={i}>{edit ? <label>Tujuan {i + 1}<textarea maxLength={1500} value={o.text} onChange={e => setValue({ ...value, objectives: value.objectives.map((x, n) => n === i ? { ...x, text: e.target.value } : x) })} /></label> : <p className="rag-text">{i + 1}. {o.text}</p>}{!ai && <small className="hint">Sumber: {refs(o.source_ids)}</small>}</div>)}
    {value.sections.map((s, i) => <section key={i} className="rag-draft-section">{edit ? <><label>Judul bagian<input value={s.heading} maxLength={150} onChange={e => setValue({ ...value, sections: value.sections.map((x, n) => n === i ? { ...x, heading: e.target.value } : x) })} /></label><label>Isi bagian<textarea rows={8} maxLength={6000} value={s.text} onChange={e => setValue({ ...value, sections: value.sections.map((x, n) => n === i ? { ...x, text: e.target.value } : x) })} /></label></> : <><h3>{s.heading}</h3><p className="rag-text">{s.text}</p></>}<small className="hint">{ai ? 'Usulan AI · belum diverifikasi terhadap CP' : <>{s.kind === 'adaptation' ? 'Usulan/adaptasi guru · dasar sumber' : 'Berbasis sumber'}: {refs(s.source_ids)}</>}</small></section>)}
    {error && <p className="error" role="alert">{error}</p>}{edit && <button className="primary" disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : 'Simpan perubahan'}</button>}
    {!ai && <><h3>Referensi yang digunakan</h3><References items={draft.references} /></>}
  </section>;
}

function GeneratorForm({ scopes, subjects = [], ragIssue = '', admin = false, disabled = false, onResult, quotaRequired = true }: { scopes: Scope[]; subjects?: Subject[]; ragIssue?: string; admin?: boolean; disabled?: boolean; onResult: (d: Draft) => void; quotaRequired?: boolean }) {
  const [mode, setMode] = useState<'ai' | 'rag'>(admin ? 'rag' : 'ai');
  const [grade, setGrade] = useState(1);
  const [subject, setSubject] = useState('Bahasa Indonesia');
  const [variant, setVariant] = useState('');
  const [scope, setScope] = useState('');
  const [topic, setTopic] = useState('');
  const [minutes, setMinutes] = useState(70);
  const [context, setContext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ready = scopes.filter(s => s.ready);
  const selected = ready.find(s => s.id === scope)?.id || ready[0]?.id || '';
  const choices = subjects.filter(s => s.grades.includes(grade));
  const chosen = choices.find(s => s.name === subject) || choices[0];
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const input = mode === 'ai' ? { mode, subject: chosen?.name, grade, variant: chosen?.variant_required ? variant : '', topic, minutes, context } : { mode, scope_id: selected, topic, minutes, context };
      const key = 'rr-draft-request';
      let id = crypto.randomUUID();
      if (!admin) {
        const previous = sessionStorage.getItem(key);
        if (previous) { const old = JSON.parse(previous); if (old.input === JSON.stringify(input)) id = old.id; }
        sessionStorage.setItem(key, JSON.stringify({ input: JSON.stringify(input), id }));
      }
      const draft = await request<Draft>(admin ? '/admin/rag/preview-draft' : '/teacher/drafts', admin ? input : { ...input, request_id: id });
      if (!admin) sessionStorage.removeItem(key);
      onResult(draft);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <section className="panel teacher-section"><h2>{admin ? 'Uji draf dari sumber aktif' : 'Buat draf modul ajar'}</h2><p className="hint">{admin ? 'Memakai API berbayar. Hasil uji tidak memotong kuota guru dan tidak masuk pustaka guru.' : quotaRequired ? 'Satu kuota dipakai setelah draf berhasil disimpan. Jika gagal, kuota aplikasi tidak dipotong.' : 'Pilot sandbox: kuota tidak dipotong, tetapi pemakaian API tetap berbayar.'}</p>
    {!admin && <label>Dasar penyusunan<select disabled={busy} value={mode} onChange={e => { setMode(e.target.value as 'ai' | 'rag'); setError(''); }}><option value="ai">Draf AI langsung · tanpa sumber</option><option value="rag">Draf berbasis sumber</option></select></label>}
    {mode === 'ai' && <p className="inline-note">Bisa digunakan sambil sumber dikumpulkan. Hasil belum diverifikasi terhadap CP. Pilih pelajaran yang diterapkan di sekolah Anda; daftar ini bukan pernyataan dukungan kurikulum terverifikasi.</p>}
    {mode === 'rag' && ragIssue && <p className="inline-note">{ragIssue}</p>}
    {mode === 'rag' && !ready.length ? <p className="inline-note">Sumber rujukan belum lengkap. Anda dapat beralih ke Draf AI langsung sambil menunggu peninjauan sumber.</p> : <form onSubmit={submit}>
      <fieldset className="generator-fields" disabled={busy}>
        <div className="form-grid">
          {mode === 'ai' ? <>
            <label>Kelas<select value={grade} onChange={e => { setGrade(Number(e.target.value)); setVariant(''); }}>{[1, 2, 3, 4, 5, 6].map(n => <option value={n} key={n}>Kelas {n}</option>)}</select></label>
            <label>Mata pelajaran<select value={chosen?.name || ''} onChange={e => { setSubject(e.target.value); setVariant(''); }}>{choices.map(s => <option key={s.name}>{s.name}</option>)}</select></label>
            {chosen?.variant_required && <label className="wide">{chosen.name === 'Seni' ? 'Cabang seni' : chosen.name === 'Pendidikan Agama dan Budi Pekerti' ? 'Agama' : chosen.name === 'Muatan Lokal/Bahasa Daerah' ? 'Bahasa atau muatan lokal dan daerahnya' : 'Nama pelajaran atau kebutuhan pembelajaran'}<input required maxLength={160} value={variant} onChange={e => setVariant(e.target.value)} /></label>}
          </> : <label className="wide">Pilihan pembelajaran<select value={selected} onChange={e => setScope(e.target.value)}>{ready.map(s => <option key={s.id} value={s.id}>{s.subject}{s.variant ? ` (${s.variant})` : ''} · Kelas {s.grade} · {s.curriculum}</option>)}</select></label>}
          <label className="wide">Topik atau materi<input required minLength={3} maxLength={250} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Contoh: memahami isi cerita pendek" /></label>
          <label>Alokasi waktu (menit)<input required type="number" min={15} max={480} value={minutes} onChange={e => setMinutes(Number(e.target.value))} /></label>
        </div>
        <details className="metadata-section"><summary>Konteks kelas (opsional)</summary><label><textarea maxLength={1000} value={context} onChange={e => setContext(e.target.value)} placeholder="Kebutuhan belajar dan sarana. Jangan masukkan nama atau data pribadi murid." /></label></details>
        <p className="hint">Topik dan konteks yang diisi akan dikirim ke penyedia AI untuk menyusun draf.</p>
        <button className="primary" disabled={disabled || (mode === 'ai' && !chosen)}>{busy ? 'Menyusun draf…' : admin ? 'Jalankan uji draf' : 'Buat draf'}</button>
      </fieldset>
    </form>}
    {scopes.some(s => !s.ready) && <details className="metadata-section"><summary>Cakupan yang belum siap</summary>{scopes.filter(s => !s.ready).map(s => <p key={s.id}>{s.subject} kelas {s.grade}: belum tersedia {s.missing.join(', ')}.</p>)}</details>}{error && <p className="error" role="alert">{error}</p>}
  </section>;
}

export function TeacherGenerator() {
  const [catalog, setCatalog] = useState<{ scopes: Scope[]; subjects: Subject[]; rag_issue: string; enabled: boolean; model_issue: string; quota_required: boolean } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [history, setHistory] = useState<{ id: string; mode: 'ai' | 'rag'; title: string; created_at: string }[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => { let live = true; setError(''); Promise.all([request<typeof catalog>('/teacher/rag/catalog'), request<{ items: typeof history }>(`/teacher/drafts?page=${page}`)]).then(([c, h]) => { if (live) { setCatalog(c); setHistory(h.items); } }).catch(e => { if (live) setError(e.message); }); return () => { live = false; }; }, [page, revision]);
  return <div className="rag-layout">{error && <p className="error" role="alert">{error}<button className="text-button" onClick={() => setRevision(v => v + 1)}>Coba lagi</button></p>}{!catalog && !error && <p>Memuat ruang modul…</p>}{catalog && <>{(!catalog.enabled || catalog.model_issue) && <p className="inline-note">{catalog.model_issue || 'Generator sedang ditutup pengelola.'}</p>}<GeneratorForm scopes={catalog.scopes} subjects={catalog.subjects} ragIssue={catalog.rag_issue} disabled={!catalog.enabled || !!catalog.model_issue} quotaRequired={catalog.quota_required} onResult={d => { setDraft(d); setRevision(v => v + 1); window.dispatchEvent(new Event('rr-quota-changed')); }} /></>}
    {draft && <DraftView draft={draft} saved={d => { setDraft(d); setRevision(v => v + 1); }} />}
    <section className="panel"><div className="panel-head"><h2>Draf tersimpan</h2><button className="secondary small" onClick={() => setRevision(v => v + 1)}>Muat ulang</button></div>{history.length ? <div className="status-list">{history.map(d => <div key={d.id}><button className="text-button" onClick={async () => { try { setDraft(await request<Draft>(`/teacher/drafts/${d.id}`)); } catch (e) { setError((e as Error).message); } }}>{d.title}</button><span>{d.mode === 'ai' ? 'AI tanpa sumber' : 'Berbasis sumber'} · {new Date(d.created_at).toLocaleDateString('id-ID')}</span></div>)}</div> : <p className="teacher-section hint">Belum ada draf pada halaman ini.</p>}<div className="table-foot pagination"><button className="secondary small" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</button><span>Halaman {page}</span><button className="secondary small" disabled={history.length < 20} onClick={() => setPage(p => p + 1)}>Berikutnya</button></div></section>
  </div>;
}

export function AdminRag({ canManage, openDocument }: { canManage: boolean; openDocument: (id: string) => void }) {
  const [data, setData] = useState<AdminData | null>(null);
  const [selected, setSelected] = useState('');
  const [items, setItems] = useState<Reference[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [searchResults, setSearchResults] = useState<Reference[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const load = useCallback(async () => { try { setData(await request<AdminData>('/admin/rag')); } catch (e) { setError((e as Error).message); } }, []);
  useEffect(() => { if (canManage) void load(); }, [canManage, load]);
  useEffect(() => { if (!data?.items.some(d => ['queued', 'processing'].includes(d.index?.status || ''))) return; const timer = setInterval(load, 4000); return () => clearInterval(timer); }, [data, load]);
  const current = data?.items.find(d => d.document_id === selected);
  useEffect(() => { let live = true; setItems([]); if (selected && current?.index) request<{ items: Reference[]; total: number }>(`/admin/rag/documents/${selected}/chunks?page=${page}`).then(r => { if (live) { setItems(r.items); setTotal(r.total); } }).catch(e => { if (live) setError(e.message); }); return () => { live = false; }; }, [selected, page, current?.index?.id]);
  async function action(doc: Source, kind: string) {
    setBusy(true); setError(''); setMessage('');
    try { await request(`/admin/rag/documents/${doc.document_id}/${kind}`, kind === 'activate' ? { index_id: doc.index?.id, note } : kind === 'index' ? { index_id: doc.index?.id } : {}); setSelected(doc.document_id); setPage(1); setSearchResults(null); await load(); setMessage(kind === 'index' ? 'Embedding masuk antrean. Hasil tidak langsung aktif.' : 'Perubahan tersimpan.'); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  if (!canManage) return <div className="panel teacher-section"><h2>Indeks sumber</h2><p>Peninjau admin mengelola embedding, uji pencarian, dan aktivasi sumber. Anda tetap dapat mengumpulkan dokumen.</p></div>;
  return <div className="rag-layout"><p className="inline-note">1. Periksa sumber → 2. Pratinjau potongan → 3. Buat embedding → 4. Coba pencarian → 5. Aktifkan. Embedding dan uji pencarian menggunakan API berbayar.</p>{error && <p className="error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <section className="panel"><div className="panel-head"><div><h2>Sumber untuk RAG</h2><p>{data ? `Embedding: ${data.embedding.model} · ${data.key_configured ? 'kunci tersedia' : 'kunci belum diisi'}` : 'Memuat…'}</p></div><button className="secondary small" disabled={busy} onClick={load}>Muat ulang</button></div><div className="table-scroll"><table><thead><tr><th>Dokumen</th><th>Status</th><th>Potongan</th><th>Tindakan</th></tr></thead><tbody>{data?.items.map(d => <tr key={d.document_id}><td><button className="text-button" onClick={() => openDocument(d.document_id)}>{d.title}</button>{d.index?.error && <small className="cell-note">{d.index.error}</small>}</td><td>{d.index ? indexLabels[d.index.status] || d.index.status : d.eligible ? 'Siap disiapkan' : 'Menunggu tinjauan'}</td><td>{d.index?.count || '—'}</td><td><div className="button-group"><button className="secondary small" disabled={busy || !d.eligible || ['queued', 'processing'].includes(d.index?.status || '')} onClick={() => action(d, 'prepare')}>{d.index ? 'Siapkan ulang' : 'Siapkan potongan'}</button>{d.index && <button className="text-button" disabled={busy} onClick={() => { setSelected(d.document_id); setPage(1); setSearchResults(null); setNote(''); }}>Buka</button>}{d.index?.status === 'active' && <button className="text-button" disabled={busy} onClick={() => action(d, 'deactivate')}>Nonaktifkan</button>}</div></td></tr>)}</tbody></table></div>{data?.items.length === 0 && <p className="teacher-section">Unggah dan periksa sumber pertama untuk memulai.</p>}</section>
    {current?.index && <section className="panel teacher-section"><h2>{current.title}</h2><p className="hint">Lokasi mengikuti PDF/paragraf asli. Periksa apakah potongan mencampur fase atau kehilangan bagian penting.</p><References items={items} /><div className="table-foot pagination"><button className="secondary small" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</button><span>Halaman {page} · {total} potongan</span><button className="secondary small" disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>Berikutnya</button></div>
      {current.index.status === 'preview' && <button className="primary" disabled={busy || !data?.key_configured} onClick={() => action(current, 'index')}>Kirim {current.index.count} potongan ke API embedding</button>}
      {['ready', 'active'].includes(current.index.status) && <form onSubmit={async e => { e.preventDefault(); setBusy(true); setError(''); try { const r = await request<{ items: Reference[] }>(`/admin/rag/documents/${selected}/search`, { query }); setSearchResults(r.items); await load(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}><label>Pertanyaan uji pencarian<input required minLength={5} maxLength={500} value={query} onChange={e => setQuery(e.target.value)} /></label><button className="secondary" disabled={busy}>Cari dalam dokumen ini</button></form>}
      {searchResults && <><h3>Hasil pencarian</h3><p className="hint">Skor kemiripan bukan nilai kebenaran. Cocokkan isi dan halaman dengan pertanyaan.</p><References items={searchResults} />{!searchResults.length && <p>Tidak ditemukan potongan.</p>}</>}
      {current.index.status === 'ready' && current.index.tested && <div className="rag-activation"><label>Catatan pemeriksaan<textarea minLength={10} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder="Catat mengapa hasil pencarian relevan dan bagian sumber sudah tepat." /></label><button className="primary" disabled={busy || note.trim().length < 10} onClick={() => action(current, 'activate')}>Simpan tinjauan & aktifkan sumber</button></div>}
    </section>}
    {data && <GeneratorForm scopes={data.scopes} admin onResult={setDraft} />}{draft && <DraftView draft={draft} />}
  </div>;
}
