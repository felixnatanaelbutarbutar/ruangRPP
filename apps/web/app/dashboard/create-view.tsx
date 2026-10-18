'use client';
import { FormEvent, useEffect, useState } from 'react';
import {
  Billing,
  Draft,
  DraftListItem,
  exportDraftToWord,
  Objective,
  Scope,
  Section,
  Subject,
} from './types';

export function CreateView({
  quota,
  billing,
  onClaimTrial,
  onNavigate,
  onDraftCreated,
  recentDrafts = [],
  onOpenDraft,
}: {
  quota: number;
  billing: Billing | null;
  onClaimTrial: () => Promise<void>;
  onNavigate: (view: 'drafts' | 'billing') => void;
  onDraftCreated: () => void;
  recentDrafts?: DraftListItem[];
  onOpenDraft: (id: string) => void;
}) {
  const [catalog, setCatalog] = useState<{
    scopes: Scope[];
    subjects: Subject[];
    rag_issue: string;
    enabled: boolean;
    model_issue: string;
    quota_required: boolean;
  } | null>(null);

  const [mode, setMode] = useState<'ai' | 'rag'>('ai');
  const [grade, setGrade] = useState<number>(1);
  const [subject, setSubject] = useState('Bahasa Indonesia');
  const [variant, setVariant] = useState('');
  const [scopeId, setScopeId] = useState('');
  const [topic, setTopic] = useState('');
  const [minutes, setMinutes] = useState(70);
  const [showContext, setShowContext] = useState(false);
  const [context, setContext] = useState('');

  // Mobile Bottom Sheet state for Mata Pelajaran (§4.4)
  const [openSubjectSheet, setOpenSubjectSheet] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState<Draft['result'] | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [trialBusy, setTrialBusy] = useState(false);

  // Restore form state from localStorage (§4.4 & §6.2)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rr_draft_form_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.grade) setGrade(Number(parsed.grade));
        if (parsed.subject) setSubject(parsed.subject);
        if (parsed.variant) setVariant(parsed.variant);
        if (parsed.topic) setTopic(parsed.topic);
        if (parsed.minutes) setMinutes(Number(parsed.minutes));
        if (parsed.context) {
          setContext(parsed.context);
          setShowContext(true);
        }
      }
    } catch {}
  }, []);

  // Persist form state to localStorage (§4.4 & §6.2)
  useEffect(() => {
    try {
      localStorage.setItem(
        'rr_draft_form_state',
        JSON.stringify({ mode, grade, subject, variant, topic, minutes, context })
      );
    } catch {}
  }, [mode, grade, subject, variant, topic, minutes, context]);

  // Close sheet on Escape or history Back (§4.3)
  useEffect(() => {
    if (!openSubjectSheet) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenSubjectSheet(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSubjectSheet]);

  // Load catalog on mount
  useEffect(() => {
    let live = true;
    fetch('/api/v1/teacher/rag/catalog', { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error('Katalog mata pelajaran belum dapat dimuat.');
        const data = await r.json();
        if (live) setCatalog(data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const readyScopes = catalog?.scopes.filter(s => s.ready) || [];
  const selectedScope = readyScopes.find(s => s.id === scopeId) || readyScopes[0];
  const availableSubjects = (catalog?.subjects || []).filter(s => s.grades.includes(grade));
  const chosenSubject = availableSubjects.find(s => s.name === subject) || availableSubjects[0];
  const filteredSubjects = availableSubjects.filter(s =>
    s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const phaseLabel = grade <= 2 ? 'Fase A' : grade <= 4 ? 'Fase B' : 'Fase C';

  async function handleClaimTrial() {
    setTrialBusy(true);
    try {
      await onClaimTrial();
    } finally {
      setTrialBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (quota <= 0) return;
    setGenerating(true);
    setGenerateError('');
    setCurrentDraft(null);

    try {
      const input =
        mode === 'ai'
          ? {
              mode,
              subject: chosenSubject?.name || subject,
              grade,
              variant: chosenSubject?.variant_required ? variant : '',
              topic,
              minutes,
              context,
            }
          : {
              mode,
              scope_id: selectedScope?.id || scopeId,
              topic,
              minutes,
              context,
            };

      const key = 'rr-draft-request';
      let id = crypto.randomUUID();
      const previous = sessionStorage.getItem(key);
      if (previous) {
        try {
          const old = JSON.parse(previous);
          if (old.input === JSON.stringify(input)) id = old.id;
        } catch {}
      }
      sessionStorage.setItem(key, JSON.stringify({ input: JSON.stringify(input), id }));

      const res = await fetch('/api/v1/teacher/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, request_id: id }),
      });
      sessionStorage.removeItem(key);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : 'Gagal menyusun draf.');
      }

      setCurrentDraft(data);
      setEditValue(data.result);
      try {
        localStorage.removeItem('rr_draft_form_state');
      } catch {}
      onDraftCreated();
    } catch (err) {
      setGenerateError((err as Error).message || 'Draf gagal disimpan.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveEdit() {
    if (!currentDraft?.id || !editValue) return;
    setEditBusy(true);
    try {
      const res = await fetch(`/api/v1/teacher/drafts/${currentDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expected_revision: currentDraft.revision || 1,
          result: editValue,
        }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.detail || 'Gagal menyimpan perubahan.');
      setCurrentDraft(updated);
      setEditValue(updated.result);
      setEditMode(false);
      onDraftCreated();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setEditBusy(false);
    }
  }

  function handleCopyText() {
    if (!currentDraft) return;
    const text = [
      currentDraft.result.title,
      '\nTUJUAN PEMBELAJARAN:',
      ...currentDraft.result.objectives.map((o, i) => `${i + 1}. ${o.text}`),
      '\nLANGKAH KEGIATAN & ASESMEN:',
      ...currentDraft.result.sections.map(s => `\n${s.heading}\n${s.text}`),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  }

  // Quota banner determination
  const trialClaimed = billing?.trial.claimed;
  const isOutOfQuota = quota <= 0;
  const purchasingOpen = billing?.setup.available ?? false;

  return (
    <div className="teacher-page">
      <div className="page-head">
        <div>
          <h1>Buat draf modul ajar</h1>
          <p>Isi data kelas, tinjau hasilnya, lalu sesuaikan.</p>
        </div>
      </div>

      {/* Quota & Status Banners (§7.2) */}
      {isOutOfQuota && !trialClaimed && (
        <div className="rpp-banner info" role="status">
          <div>
            <strong>Mulai dengan 3 kuota gratis</strong> (sekali per akun, tanpa pembayaran).
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ width: 'auto', height: 38, padding: '0 16px', fontSize: 13 }}
            disabled={trialBusy}
            onClick={handleClaimTrial}
          >
            {trialBusy ? 'Mengaktifkan…' : 'Aktifkan 3 kuota gratis'}
          </button>
        </div>
      )}

      {isOutOfQuota && trialClaimed && (
        <div className="rpp-banner warn" role="alert">
          <div>
            <strong>Kuota habis.</strong> Satu kuota terpakai setiap kali draf berhasil dibuat.
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ height: 38, padding: '0 16px', fontSize: 13 }}
            onClick={() => onNavigate('billing')}
          >
            Lihat paket
          </button>
        </div>
      )}

      {!purchasingOpen && isOutOfQuota && trialClaimed && (
        <div className="rpp-banner info" role="status">
          <div>Pembelian paket belum dibuka oleh pengelola. Kami kabari setelah tersedia.</div>
        </div>
      )}

      <div className="workbench">
        {/* Form Card (5/12) */}
        <section className="form-card" aria-label="Formulir draf">
          {/* 1. Cara menyusun */}
          <div className="field">
            <label id="mode-label">Cara menyusun</label>
            <div className="segmented-control" role="radiogroup" aria-labelledby="mode-label">
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'ai'}
                className={`segment-btn ${mode === 'ai' ? 'active' : ''}`}
                onClick={() => setMode('ai')}
                disabled={generating}
              >
                Langsung dari AI
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={mode === 'rag'}
                className={`segment-btn ${mode === 'rag' ? 'active' : ''}`}
                onClick={() => setMode('rag')}
                disabled={generating}
              >
                Dari dokumen sumber
              </button>
            </div>
            <p className="helper">
              {mode === 'ai'
                ? 'Cepat, tanpa dokumen. Hasil belum dicocokkan dengan Capaian Pembelajaran (CP).'
                : 'Menyusun berdasarkan dokumen kurikulum resmi yang telah diverifikasi di sistem.'}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}
          >
            {mode === 'ai' ? (
              <>
                {/* 2. Kelas & Mata Pelajaran */}
                <div className="form-grid-2">
                  <div className="field">
                    <div className="field-header">
                      <label htmlFor="select-grade">Kelas</label>
                      <span className="fase-pill">{phaseLabel}</span>
                    </div>
                    <select
                      id="select-grade"
                      className="rpp-select"
                      value={grade}
                      onChange={e => {
                        setGrade(Number(e.target.value));
                        setVariant('');
                      }}
                      disabled={generating}
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option value={n} key={n}>
                          Kelas {n} SD
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <div className="field-header">
                      <label htmlFor="btn-subject">Mata pelajaran</label>
                    </div>
                    <button
                      id="btn-subject"
                      type="button"
                      className="rpp-field-button"
                      onClick={() => setOpenSubjectSheet(true)}
                      disabled={generating}
                      aria-haspopup="dialog"
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chosenSubject?.name || subject}
                      </span>
                      <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        style={{ flexShrink: 0, color: 'var(--abu-tinta)' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Sub-variant if required */}
                {chosenSubject?.variant_required && (
                  <div className="field">
                    <div className="field-header">
                      <label htmlFor="input-variant">
                        {chosenSubject.name === 'Seni'
                          ? 'Cabang seni (mis. Seni Rupa, Musik, Tari, Teater)'
                          : chosenSubject.name === 'Pendidikan Agama dan Budi Pekerti'
                          ? 'Pilihan agama'
                          : chosenSubject.name === 'Muatan Lokal/Bahasa Daerah'
                          ? 'Nama bahasa atau muatan lokal dan daerahnya'
                          : 'Nama pelajaran / kebutuhan khusus'}
                      </label>
                    </div>
                    <input
                      id="input-variant"
                      className="rpp-input"
                      required
                      maxLength={160}
                      placeholder="Tuliskan varian pelajaran"
                      value={variant}
                      onChange={e => setVariant(e.target.value)}
                      disabled={generating}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Mode RAG / Berbasis Sumber */
              <div className="field">
                <div className="field-header">
                  <label htmlFor="select-scope">Pilihan pembelajaran terverifikasi</label>
                </div>
                {readyScopes.length ? (
                  <select
                    id="select-scope"
                    className="rpp-select"
                    value={selectedScope?.id || scopeId}
                    onChange={e => setScopeId(e.target.value)}
                    disabled={generating}
                  >
                    {readyScopes.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.subject}
                        {s.variant ? ` (${s.variant})` : ''} · Kelas {s.grade} · {s.curriculum}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="helper" style={{ color: 'var(--peringatan)' }}>
                    Sumber rujukan belum ada yang aktif. Anda dapat memakai opsi &ldquo;Langsung dari AI&rdquo; terlebih dahulu.
                  </p>
                )}
              </div>
            )}

            {/* 3. Topik atau materi */}
            <div className="field">
              <div className="field-header">
                <label htmlFor="input-topic">Topik atau materi</label>
              </div>
              <input
                id="input-topic"
                type="text"
                className="rpp-input"
                required
                minLength={3}
                maxLength={250}
                placeholder="Contoh: Memahami isi cerita pendek"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                disabled={generating}
                enterKeyHint="next"
                autoCapitalize="sentences"
                autoComplete="off"
              />
            </div>

            {/* 4. Alokasi waktu */}
            <div className="field">
              <div className="field-header">
                <label htmlFor="input-minutes">Alokasi waktu</label>
              </div>
              <div className="input-with-suffix">
                <input
                  id="input-minutes"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="rpp-input"
                  required
                  min={15}
                  max={480}
                  value={minutes}
                  onChange={e => setMinutes(Number(e.target.value))}
                  disabled={generating}
                />
                <span className="input-suffix">menit</span>
              </div>
              <div className="quick-chips" role="group" aria-label="Pilihan cepat alokasi waktu">
                {[
                  { val: 35, jp: 1 },
                  { val: 70, jp: 2 },
                  { val: 105, jp: 3 },
                  { val: 140, jp: 4 },
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    className={`quick-chip ${minutes === item.val ? 'active' : ''}`}
                    onClick={() => setMinutes(item.val)}
                    disabled={generating}
                  >
                    {item.val} menit ({item.jp} JP)
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Konteks kelas (Collapsible) */}
            <div className="field">
              <button
                type="button"
                className="context-toggle-btn"
                onClick={() => setShowContext(!showContext)}
              >
                <span>{showContext ? '− Tutup konteks kelas' : '+ Tambah konteks kelas (opsional)'}</span>
              </button>
              {showContext && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, width: '100%' }}>
                  <textarea
                    className="rpp-input"
                    rows={4}
                    maxLength={1000}
                    placeholder="mis. 28 siswa, ada proyektor, banyak siswa visual. Jangan masukkan nama atau data pribadi murid."
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    disabled={generating}
                    enterKeyHint="done"
                  />
                  <span className="helper">
                    Konteks membantu AI menyesuaikan kegiatan dengan fasilitas dan karakteristik murid Anda.
                  </span>
                </div>
              )}
            </div>

            {/* 6. Tombol Buat draf & Microcopy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={generating || isOutOfQuota || !topic.trim()}
              >
                {generating ? (
                  <>
                    <span className="rpp-sparkle">✦</span> Menyusun draf…
                  </>
                ) : (
                  'Buat draf modul ajar'
                )}
              </button>

              <div style={{ fontSize: 13, color: 'var(--abu-tinta)', lineHeight: 1.45, textAlign: 'center' }}>
                <p style={{ margin: '4px 0 2px 0' }}>Memakai 1 kuota. Jika gagal, kuota tidak terpotong.</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--abu-tinta)' }}>
                  🔒 Topik dan konteks dikirim ke penyedia AI untuk menyusun draf.
                </p>
              </div>
            </div>
          </form>
        </section>

        {/* Panel Hasil (7/12) */}
        <section className="panel-hasil" aria-label="Hasil modul ajar">
          {/* Keadaan 1: Kosong (Empty) */}
          {!generating && !currentDraft && !generateError && (
            <div className="rpp-sheet-empty">
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: 'var(--mint-tipis)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--teal-dalam)',
                  marginBottom: 8,
                }}
              >
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy-rpp)', margin: 0 }}>
                Draf modul ajar Anda tampil di sini
              </h3>
              <p style={{ fontSize: 14, color: 'var(--abu-tinta)', margin: 0, maxWidth: 360 }}>
                Berisi usulan tujuan pembelajaran, rencana kegiatan berdeferensiasi, dan asesmen formatif.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 280, marginTop: 16 }}>
                <div className="skeleton-box" style={{ width: '85%' }} />
                <div className="skeleton-box" style={{ width: '100%' }} />
                <div className="skeleton-box" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {/* Keadaan 2: Menyusun (Generating) */}
          {generating && (
            <div className="rpp-sheet-empty" style={{ borderColor: 'var(--teal-ruang)', background: '#FAFCFC' }}>
              <span className="rpp-sparkle" style={{ fontSize: 32 }}>✦</span>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy-rpp)', margin: 0 }}>
                Menyusun draf pembelajaran…
              </h3>
              <p style={{ fontSize: 14, color: 'var(--abu-tinta)', margin: 0 }}>
                Merumuskan tujuan, kegiatan pembuka-inti-penutup, dan asesmen kelas.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320, marginTop: 20 }}>
                <div className="skeleton-box" style={{ width: '90%' }} />
                <div className="skeleton-box" style={{ width: '100%' }} />
                <div className="skeleton-box" style={{ width: '75%' }} />
              </div>
            </div>
          )}

          {/* Keadaan 4: Gagal (Failed) */}
          {!generating && generateError && (
            <div className="rpp-sheet-empty" style={{ borderColor: 'var(--error)' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#FDECEA',
                  color: 'var(--error)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                !
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--error)', margin: 0 }}>
                Draf gagal disimpan. Kuota Anda tidak terpotong.
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--abu-tinta)', margin: 0, maxWidth: 380 }}>
                {generateError}
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: 12 }}
                onClick={() => setGenerateError('')}
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* Keadaan 3: Selesai (Completed) — Lembar RPP */}
          {!generating && currentDraft && (
            <article className="rpp-sheet-box">
              <div className="rpp-sheet-fold" />

              {/* Bar Atas Lembar */}
              <div className="rpp-sheet-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      background: 'var(--mint-tipis)',
                      color: 'var(--teal-dalam)',
                      fontSize: 12.5,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 6,
                    }}
                  >
                    Draf tersimpan · 1 kuota terpakai
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--abu-tinta)' }}>
                    {currentDraft.mode === 'ai' ? 'Draf AI langsung' : 'Berbasis sumber'}
                  </span>
                </div>

                <div className="rpp-actions-bar">
                  <button
                    type="button"
                    className="rpp-action-btn"
                    onClick={() => {
                      if (!editMode) setEditValue(currentDraft.result);
                      setEditMode(!editMode);
                    }}
                  >
                    {editMode ? 'Batal edit' : 'Edit draf'}
                  </button>

                  <button
                    type="button"
                    className="rpp-action-btn"
                    onClick={handleCopyText}
                  >
                    {copySuccess ? 'Tersalin ✓' : 'Salin teks'}
                  </button>

                  <button
                    type="button"
                    className="rpp-action-btn"
                    onClick={() => exportDraftToWord(currentDraft)}
                  >
                    Unduh Word (.doc)
                  </button>

                  <button
                    type="button"
                    className="rpp-action-btn"
                    onClick={() => window.print()}
                  >
                    Cetak
                  </button>
                </div>
              </div>

              {/* Isi Lembar Dokumen */}
              <div className="rpp-sheet-body">
                {editMode && editValue ? (
                  /* Form Edit Draf */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="field">
                      <label>Judul Modul</label>
                      <input
                        className="rpp-input"
                        value={editValue.title}
                        onChange={e => setEditValue({ ...editValue, title: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>Tujuan Pembelajaran</label>
                      {editValue.objectives.map((obj, i) => (
                        <textarea
                          key={i}
                          className="rpp-input"
                          rows={2}
                          value={obj.text}
                          onChange={e => {
                            const updated = [...editValue.objectives];
                            updated[i] = { ...updated[i], text: e.target.value };
                            setEditValue({ ...editValue, objectives: updated });
                          }}
                        />
                      ))}
                    </div>

                    {editValue.sections.map((sec, i) => (
                      <div key={i} className="field">
                        <label>{sec.heading}</label>
                        <textarea
                          className="rpp-input"
                          rows={6}
                          value={sec.text}
                          onChange={e => {
                            const updated = [...editValue.sections];
                            updated[i] = { ...updated[i], text: e.target.value };
                            setEditValue({ ...editValue, sections: updated });
                          }}
                        />
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ width: 'auto', padding: '0 24px' }}
                        disabled={editBusy}
                        onClick={handleSaveEdit}
                      >
                        {editBusy ? 'Menyimpan…' : 'Simpan perubahan'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setEditMode(false)}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Tampilan Dokumen Modul Ajar */
                  <>
                    <h2
                      style={{
                        fontFamily: 'var(--font-doc)',
                        fontSize: 22,
                        fontWeight: 700,
                        color: 'var(--navy-rpp)',
                        margin: '0 0 16px 0',
                        lineHeight: 1.3,
                        borderBottom: '2px solid var(--teal-dalam)',
                        paddingBottom: 8,
                      }}
                    >
                      {currentDraft.result.title}
                    </h2>

                    <div style={{ marginBottom: 20 }}>
                      <h4
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--teal-dalam)',
                          margin: '0 0 8px 0',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        Tujuan Pembelajaran
                      </h4>
                      <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 1.7, fontSize: 15 }}>
                        {currentDraft.result.objectives.map((obj, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>
                            {obj.text}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {currentDraft.result.sections.map((sec, i) => (
                      <div key={i} style={{ marginBottom: 20 }}>
                        <h4
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: 'var(--teal-dalam)',
                            margin: '0 0 8px 0',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          {sec.heading}
                        </h4>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.75, fontSize: 15 }}>
                          {sec.text}
                        </p>
                      </div>
                    ))}

                    {currentDraft.references && currentDraft.references.length > 0 && (
                      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--garis)' }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--abu-tinta)', margin: '0 0 8px 0' }}>
                          Referensi Sumber yang Digunakan
                        </h4>
                        <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: 'var(--abu-tinta)' }}>
                          {currentDraft.references.map((r, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>
                              <strong>{r.title}</strong> — {r.locator}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </article>
          )}
        </section>
      </div>

      {/* Draf Terakhir (§7.1) */}
      {recentDrafts.length > 0 && (
        <section style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy-rpp)', margin: 0 }}>
              Draf terakhir
            </h2>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--teal-dalam)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
              onClick={() => onNavigate('drafts')}
            >
              Lihat semua →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {recentDrafts.slice(0, 3).map(d => (
              <div
                key={d.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--garis)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'border-color 120ms',
                }}
                onClick={() => onOpenDraft(d.id)}
              >
                <strong style={{ fontSize: 15, color: 'var(--navy-rpp)', lineHeight: 1.3 }}>{d.title}</strong>
                <span style={{ fontSize: 13, color: 'var(--abu-tinta)' }}>
                  {d.subject || 'Modul'} {d.grade ? `· Kelas ${d.grade}` : ''}
                </span>
                <span style={{ fontSize: 12, color: 'var(--abu-tinta)' }}>
                  {new Date(d.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom Sheet Pemilih Mata Pelajaran (§4.3 & §4.4) */}
      {openSubjectSheet && (
        <>
          <div
            className="bottom-sheet-scrim"
            onClick={() => {
              setOpenSubjectSheet(false);
              setSubjectSearch('');
            }}
          />
          <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Pilih mata pelajaran">
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-header">
              <h3 className="bottom-sheet-title">Pilih mata pelajaran</h3>
              <button
                type="button"
                className="bottom-sheet-close"
                onClick={() => {
                  setOpenSubjectSheet(false);
                  setSubjectSearch('');
                }}
                aria-label="Tutup pemilih"
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <input
                type="text"
                className="rpp-input"
                placeholder="Cari mata pelajaran…"
                value={subjectSearch}
                onChange={e => setSubjectSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="bottom-sheet-list">
              {filteredSubjects.map(s => {
                const isSelected = (chosenSubject?.name || subject) === s.name;
                return (
                  <button
                    key={s.name}
                    type="button"
                    className={`bottom-sheet-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSubject(s.name);
                      setVariant('');
                      setOpenSubjectSheet(false);
                      setSubjectSearch('');
                    }}
                  >
                    <span>{s.name}</span>
                    {isSelected && (
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                        style={{ color: 'var(--teal-dalam)' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
              {filteredSubjects.length === 0 && (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--abu-tinta)', fontSize: 14 }}>
                  Mata pelajaran tidak ditemukan.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
