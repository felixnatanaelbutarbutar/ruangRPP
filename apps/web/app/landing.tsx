import React, { useState, useEffect, useRef } from 'react';

export type Plan = {
  id: string;
  name: string;
  badge?: string;
  price: string;
  period: string;
  priceNumber: number;
  desc: string;
  features: string[];
  recommended?: boolean;
};

export type SampleModule = {
  id: string;
  title: string;
  subject: string;
  phase: string;
  duration: string;
  cpRef: string;
  tp: string;
  meaningful: string;
  triggerQ: string;
  activities: { step: string; desc: string }[];
  assessment: string;
};

const SAMPLE_MODULES: Record<string, SampleModule> = {
  ipas: {
    id: 'ipas',
    title: 'Siklus Air dan Pelestarian Sumber Daya Air',
    subject: 'IPAS (Ilmu Pengetahuan Alam & Sosial)',
    phase: 'Fase C · Kelas 5 SD',
    duration: '2 Pertemuan (4 JP x 35 Menit)',
    cpRef: 'Keputusan Kepala BSKAP No. 046/H/KR/2025 (Elemen Pemahaman IPAS Sains & Lingkungan)',
    tp: 'Peserta didik mengidentifikasi urutan siklus hidrologi (evaporasi, kondensasi, presipitasi) dan menganalisis peran daerah resapan air dalam menjaga ketersediaan air bersih di lingkungan tempat tinggalnya.',
    meaningful: 'Air yang mengalir hari ini adalah bagian dari siklus alamiah bumi. Menjaga daerah resapan dan kebersihan sungai berarti menjamin ketersediaan air bagi generasi penerus.',
    triggerQ: 'Mengapa air sumur di perkotaan bisa berkurang saat kemarau panjang padahal bumi kita didominasi 70% air?',
    activities: [
      { step: 'Pembuka (10 Menit)', desc: 'Orientasi fenomena: Guru meletakkan air hangat di wadah tertutup berisi es batu di atas penutupnya, mengajak murid mengamati embun dan tetesan air buatan.' },
      { step: 'Inti — Diferensiasi (50 Menit)', desc: 'Kelompok Visual menganalisis diagram infografis perjalanan molekul air; Kelompok Kinestetik melakukan simulasi peragaan model siklus air mini menggunakan toples dan tanah resapan.' },
      { step: 'Penutup (10 Menit)', desc: 'Refleksi komitmen "Satu Tindakan Hemat Air di Rumah" dan pengisian lembar jurnal refleksi mandiri.' },
    ],
    assessment: 'Formatif: Lembar ceklis observasi keterlibatan diskusi dan rubrik pemahaman tahapan siklus air.',
  },
  matematika: {
    id: 'matematika',
    title: 'Makna Pecahan Sederhana (1/2 dan 1/4)',
    subject: 'Matematika Dasar',
    phase: 'Fase A · Kelas 2 SD',
    duration: '2 Pertemuan (4 JP x 35 Menit)',
    cpRef: 'Keputusan Kepala BSKAP No. 046/H/KR/2025 (Elemen Bilangan Fase A)',
    tp: 'Peserta didik mampu menunjukkan makna pecahan setengah (1/2) dan seperempat (1/4) menggunakan benda konkret berbentuk lingkaran dan persegi secara adil.',
    meaningful: 'Berbagi makanan atau barang secara adil kepada saudara dan teman berlandaskan pada pemahaman pembagian bagian yang sama besar.',
    triggerQ: 'Bagaimana cara memotong satu kue terang bulan agar kamu dan adikmu mendapat bagian yang sama persis tanpa berebut?',
    activities: [
      { step: 'Pembuka (10 Menit)', desc: 'Apersepsi cerita bergambar tentang dua anak yang membagi satu buah roti bolu sama besar.' },
      { step: 'Inti — Eksplorasi (50 Menit)', desc: 'Eksperimen melipat kertas origami menjadi 2 dan 4 bagian simetris; memotong plastisin dan membedakan potongan adil (pecahan sah) dengan potongan tidak adil.' },
      { step: 'Penutup (10 Menit)', desc: 'Menempelkan karya lipatan di "Papan Pecahan Ceria" di dinding kelas dan apresiasi hasil karya kawan.' },
    ],
    assessment: 'Unjuk kerja: Kemampuan mendemonstrasikan pembagian 1/2 dan 1/4 menggunakan peraga kertas lipat.',
  },
  bindo: {
    id: 'bindo',
    title: 'Menulis Teks Eksplanasi Sebab-Akibat Fenomena Alam',
    subject: 'Bahasa Indonesia',
    phase: 'Fase C · Kelas 5 SD',
    duration: '3 Pertemuan (6 JP x 35 Menit)',
    cpRef: 'Keputusan Kepala BSKAP No. 046/H/KR/2025 (Elemen Menulis Fase C)',
    tp: 'Peserta didik mampu menulis draf teks eksplanasi sebab-akibat fenomena alam dengan susunan runut (pernyataan umum, rangkaian penjelas, simpulan) dan penggunaan konjungsi kausalitas yang tepat.',
    meaningful: 'Menjelaskan fenomena secara runut melatih cara berpikir ilmiah, kritis, dan logis dalam menyampaikan gagasan.',
    triggerQ: 'Dari mana asal air hujan di langit dan mengapa hujan lebat di hulu bisa menyebabkan banjir di pemukiman hilir?',
    activities: [
      { step: 'Pembuka (15 Menit)', desc: 'Menyimak rekaman suara badai hujan dan tanya jawab mengenai pengalaman murid menghadapi cuaca ekstrem.' },
      { step: 'Inti — Penulisan Draf (45 Menit)', desc: 'Menyusun kerangka paragraf sebab-akibat menggunakan bagan alur pikiran; menulis draf pertama secara mandiri dengan bimbingan guru.' },
      { step: 'Penutup (10 Menit)', desc: 'Saling membaca kalimat pembuka dengan teman sebangku (peer correction) untuk menyunting ejaan.' },
    ],
    assessment: 'Rubrik penulisan: Struktur paragraf (pembuka, penjelas, penutup), ketepatan konjungsi kausalitas, dan ejaan baku.',
  },
};

const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Paket Uji Coba',
    price: 'Rp 0',
    period: 'gratis 3 hari',
    priceNumber: 0,
    desc: 'Untuk mengenal dan menguji kualitas draf modul ajar terstruktur ruangRPP.',
    features: [
      '3 Draf Modul Ajar SD Lengkap',
      'Akses Fase A, B, dan C',
      'Rujukan Capaian Pembelajaran resmi',
      'Pratinjau struktur modul terstandar',
    ],
  },
  {
    id: 'mandiri',
    name: 'Guru Mandiri',
    badge: 'Paling Hemat',
    price: 'Rp 29.000',
    period: 'sekali bayar / 15 draf',
    priceNumber: 29000,
    desc: 'Sangat cocok untuk persiapan unit pembelajaran mata pelajaran tertentu.',
    features: [
      '15 Draf Modul Ajar Lengkap',
      'Seluruh Mapel SD (Fase A, B, C)',
      'Ekspor format DOCX (Word) & PDF',
      'Panduan diferensiasi & asesmen terlampir',
      'Riwayat tersimpan permanen',
      'Aktivasi instan otomatis',
    ],
  },
  {
    id: 'semester',
    name: 'Guru Profesional',
    badge: 'Paling Populer',
    price: 'Rp 79.000',
    period: 'per semester (6 bulan)',
    priceNumber: 79000,
    desc: 'Akses tanpa batas untuk 1 semester penuh bagi guru wali kelas maupun mapel.',
    features: [
      'Draf Modul Ajar Tanpa Batas',
      'Seluruh Kelas 1–6 SD',
      'Ekspor dokumen siap cetak & telaah',
      'Generator instrumen rubrik asesmen',
      'Pembaruan otomatis regulasi BSKAP',
      'Dukungan prioritas via WhatsApp',
    ],
    recommended: true,
  },
  {
    id: 'sekolah',
    name: 'Satuan Pendidikan & KKG',
    badge: 'Multi-Guru',
    price: 'Rp 249.000',
    period: 'per tahun ajaran',
    priceNumber: 249000,
    desc: 'Lisensi multi-guru untuk sekolah dasar, gugus, atau kelompok kerja guru.',
    features: [
      'Hingga 10 Akun Guru Terdaftar',
      'Akses tak terbatas selama 1 tahun',
      'Standarisasi perangkat ajar sekolah',
      'Format identitas & kop surat sekolah',
      'Faktur pajak / invoice resmi instansi',
      'Sesi orientasi penggunaan platform',
    ],
  },
];

const FAQS = [
  {
    q: 'Apakah hasilnya bisa saya edit?',
    a: 'Tentu saja. Hasil yang disusun ruangRPP adalah draf kerja awal. Anda memiliki kendali pedagogis penuh untuk menyesuaikan kalimat, menambah kegiatan lokal sekolah, atau mengubah instrumen asesmen langsung di editor sebelum diunduh.',
  },
  {
    q: 'Sesuai kurikulum apa?',
    a: 'Sesuai Kurikulum Nasional (Kurikulum Merdeka). Kami berlandaskan secara ketat pada regulasi resmi Capaian Pembelajaran terbaru (Keputusan Kepala BSKAP No. 046/H/KR/2025) sehingga setiap tujuan pembelajaran memiliki rujukan elemen yang sah.',
  },
  {
    q: 'Format apa yang bisa diunduh?',
    a: 'Anda dapat mengunduh dokumen dalam format Microsoft Word (.DOCX) dan PDF. Tata letak dan penomoran telah disesuaikan dengan format standar dinas pendidikan agar siap dicetak atau ditelaah kepala sekolah.',
  },
  {
    q: 'Apakah data kelas saya disimpan?',
    a: 'Ya, draf yang telah Anda buat tersimpan dengan aman di akun Anda. Anda dapat membuka kembali, menggandakan untuk kelas paralel, atau memperbaruinya di tahun ajaran berikutnya tanpa harus mengetik ulang.',
  },
  {
    q: 'Apa saya masih perlu memeriksa hasilnya?',
    a: 'Ya, Anda sangat disarankan memeriksa hasilnya. AI di ruangRPP berfungsi merangkai draf awal agar Bapak/Ibu tidak memulai dari kertas kosong. Namun, penyesuaian terhadap karakteristik dan kebutuhan unik murid di kelas tetap membutuhkan kebijaksanaan guru.',
  },
  {
    q: 'Berapa biayanya?',
    a: 'Tersedia Paket Uji Coba Gratis untuk mencoba kualitas draf. Untuk penggunaan rutin, kami menyediakan Paket Guru Mandiri (Rp 29.000 untuk 15 draf), Paket Guru Profesional (Rp 79.000 per semester tanpa batas), dan Paket Sekolah/KKG.',
  },
];

export function LandingView({ onOpenLogin }: { onOpenLogin: () => void }) {
  // Demo State
  const [activePreset, setActivePreset] = useState<'ipas' | 'matematika' | 'bindo'>('ipas');
  const [demoStep, setDemoStep] = useState<number>(4); // 0: init, 1: tp, 2: activities, 3: assessment, 4: complete
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Annotated Section Tab State
  const [activeAnnotatedKey, setActiveAnnotatedKey] = useState<'ipas' | 'matematika' | 'bindo'>('ipas');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Checkout Simulator Modal
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'va' | 'card'>('qris');
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', school: '' });

  // Legal Modal State
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | 'refund' | null>(null);

  const currentHeroMod = SAMPLE_MODULES[activePreset];
  const currentAnnotatedMod = SAMPLE_MODULES[activeAnnotatedKey];

  // Function to run hero generation demo
  const runDemoAnimation = (presetKey?: 'ipas' | 'matematika' | 'bindo') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (presetKey) setActivePreset(presetKey);

    setDemoStep(0);
    setIsDemoPlaying(true);

    const step1 = setTimeout(() => setDemoStep(1), 800);
    const step2 = setTimeout(() => setDemoStep(2), 1800);
    const step3 = setTimeout(() => setDemoStep(3), 2800);
    const step4 = setTimeout(() => {
      setDemoStep(4);
      setIsDemoPlaying(false);
    }, 3800);

    timerRef.current = step4;
  };

  useEffect(() => {
    // Only run animation on desktop if motion is not reduced
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop && !prefersReduced) {
      runDemoAnimation('ipas');
    } else {
      setDemoStep(4);
      setIsDemoPlaying(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleOpenCheckout = (plan: Plan) => {
    setSelectedPlan(plan);
    setCheckoutStep('form');
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('processing');
    setTimeout(() => {
      setCheckoutStep('success');
    }, 1200);
  };

  return (
    <div className="landing-scope">
      {/* ── 1. NAVBAR (Sticky, Putih, Border Bawah Garis) ── */}
      <header className="lp-navbar">
        <div className="lp-container lp-navbar-inner">
          <a href="#" className="lp-brand-link" aria-label="ruangRPP Beranda">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-ruangRPP-transparent.png"
              alt="ruangRPP"
              className="lp-brand-logo"
            />
          </a>

          <nav className="lp-nav-links" aria-label="Navigasi Utama">
            <a href="#contoh">Contoh Dokumen</a>
            <a href="#cara-kerja">Cara Kerja</a>
            <a href="#kendali">Keunggulan</a>
            <a href="#harga">Paket &amp; Biaya</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="lp-nav-actions">
            <button
              type="button"
              className="lp-btn-ghost"
              onClick={onOpenLogin}
              title="Akses masuk untuk tim pengelola dan peninjau"
            >
              Masuk Pengelola
            </button>
            <a href="#harga" className="lp-btn-primary">
              Coba Gratis
            </a>
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION (Demo Nyata Hidup, Asimetris 5:7) ── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-hero-grid">
            {/* Kiri (5 Kolom) */}
            <div className="lp-hero-copy">
              <h1 className="lp-display">
                RPP siap dipakai, tinggal Bapak/Ibu sesuaikan.
              </h1>
              <p className="lp-body-lg">
                Isi mata pelajaran, kelas, dan topik. ruangRPP menyusun draf lengkap dengan tujuan pembelajaran, kegiatan, dan asesmen. Anda tinggal memeriksa dan mengedit.
              </p>

              <div className="lp-hero-cta-group">
                <a href="#harga" className="lp-btn-primary">
                  Coba Gratis
                </a>
                <a href="#contoh" className="lp-btn-secondary">
                  Lihat Contoh RPP
                </a>
              </div>

              <div className="lp-hero-trust">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Bisa diedit dan diunduh sebagai Word (.docx) atau PDF</span>
              </div>
            </div>

            {/* Kanan (7 Kolom): Demo Form + Lembar RPP */}
            <div className="lp-demo-container" id="demo">
              {/* Form Input Sederhana */}
              <div className="lp-demo-form-panel">
                <div className="lp-demo-panel-header">
                  <span className="lp-demo-panel-title">Data Pembelajaran</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="lp-chip"
                      onClick={() => runDemoAnimation('ipas')}
                      title="Ulangi simulasi penulisan draf"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                    >
                      {isDemoPlaying ? 'Menyusun...' : 'Ulangi Contoh'}
                    </button>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="lp-quick-presets">
                  <button
                    type="button"
                    className={`lp-chip ${activePreset === 'ipas' ? 'active' : ''}`}
                    onClick={() => runDemoAnimation('ipas')}
                  >
                    IPAS: Siklus Air
                  </button>
                  <button
                    type="button"
                    className={`lp-chip ${activePreset === 'matematika' ? 'active' : ''}`}
                    onClick={() => runDemoAnimation('matematika')}
                  >
                    Matematika: Pecahan
                  </button>
                  <button
                    type="button"
                    className={`lp-chip ${activePreset === 'bindo' ? 'active' : ''}`}
                    onClick={() => runDemoAnimation('bindo')}
                  >
                    B. Indonesia: Teks Eksplanasi
                  </button>
                </div>

                <div className="lp-demo-form-row">
                  <div className="lp-input-group">
                    <label htmlFor="hp-mapel">Mata Pelajaran</label>
                    <input
                      id="hp-mapel"
                      type="text"
                      className="lp-input"
                      value={currentHeroMod.subject}
                      readOnly
                    />
                  </div>
                  <div className="lp-input-group">
                    <label htmlFor="hp-fase">Fase &amp; Kelas</label>
                    <input
                      id="hp-fase"
                      type="text"
                      className="lp-input"
                      value={currentHeroMod.phase}
                      readOnly
                    />
                  </div>
                </div>

                <div className="lp-input-group" style={{ marginBottom: 14 }}>
                  <label htmlFor="hp-topik">Topik Pembelajaran</label>
                  <input
                    id="hp-topik"
                    type="text"
                    className="lp-input"
                    value={currentHeroMod.title}
                    readOnly
                  />
                </div>

                <button
                  type="button"
                  className="lp-btn-primary"
                  style={{ width: '100%', height: 42, fontSize: 15 }}
                  onClick={() => runDemoAnimation(activePreset)}
                  disabled={isDemoPlaying}
                >
                  {isDemoPlaying ? 'Menyusun Draf RPP...' : 'Buat Draf RPP'}
                </button>
              </div>

              {/* Lembar RPP (§6: Kertas putih, sudut kanan terlipat teal, Source Serif 4) */}
              <div className="rpp-sheet-wrap">
                <article className="rpp-sheet" aria-live="polite">
                  <div className="rpp-sheet-top-bar">
                    <span>Draf Perangkat Ajar Kurikulum Nasional</span>
                    <span>{isDemoPlaying ? 'Sedang disusun...' : 'Selesai disusun'}</span>
                  </div>

                  {/* Header Identitas */}
                  <div className="rpp-doc-header">
                    <div className="rpp-doc-meta">MODUL AJAR / RPP KURIKULUM MERDEKA</div>
                    <h2 className="rpp-doc-title">{currentHeroMod.title}</h2>
                    <div className="rpp-doc-badges">
                      <span className="rpp-doc-badge-item">{currentHeroMod.subject}</span>
                      <span className="rpp-doc-badge-item">{currentHeroMod.phase}</span>
                      <span className="rpp-doc-badge-item">{currentHeroMod.duration}</span>
                    </div>
                  </div>

                  {/* Bagian 1: Rujukan Capaian & Tujuan */}
                  <div className="rpp-section-block">
                    <h3 className="rpp-section-heading">
                      <span>1. Capaian &amp; Tujuan Pembelajaran</span>
                      {demoStep === 1 && (
                        <span className="rpp-sparkle-indicator" title="Sedang menyusun...">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        </span>
                      )}
                    </h3>
                    <p className="rpp-section-text" style={{ fontSize: 13, color: '#4A5568', marginBottom: 6 }}>
                      <em>Rujukan: {currentHeroMod.cpRef}</em>
                    </p>
                    <p className="rpp-section-text">
                      {demoStep >= 1 ? currentHeroMod.tp : 'Menyusun rumusan tujuan pembelajaran berdasarkan kompetensi...'}
                    </p>
                  </div>

                  {/* Bagian 2: Alur Kegiatan Berdiferensiasi */}
                  {demoStep >= 2 && (
                    <div className="rpp-section-block">
                      <h3 className="rpp-section-heading">
                        <span>2. Rencana Kegiatan Pembelajaran</span>
                        {demoStep === 2 && (
                          <span className="rpp-sparkle-indicator" title="Sedang menyusun...">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          </span>
                        )}
                      </h3>
                      <div>
                        {currentHeroMod.activities.map((act, i) => (
                          <div key={i} className="rpp-activity-step">
                            <strong>{act.step}:</strong> {act.desc}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bagian 3: Asesmen */}
                  {demoStep >= 3 && (
                    <div className="rpp-section-block" style={{ marginBottom: 0 }}>
                      <h3 className="rpp-section-heading">
                        <span>3. Asesmen &amp; Kriteria Penilaian</span>
                        {demoStep === 3 && (
                          <span className="rpp-sparkle-indicator" title="Sedang menyusun...">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          </span>
                        )}
                      </h3>
                      <p className="rpp-section-text">
                        {currentHeroMod.assessment}
                      </p>
                    </div>
                  )}
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CARA KERJA (§5.3: Tiga Langkah Berurutan) ── */}
      <section className="lp-section" id="cara-kerja">
        <div className="lp-container">
          <h2 className="lp-h2">Cara kerja</h2>
          <p className="lp-body">
            Tiga langkah sederhana dari topik pembelajaran ke dokumen draf siap pakai.
          </p>

          <div className="lp-steps-container">
            <div className="lp-step-row">
              <div className="lp-step-num">Langkah 1</div>
              <h3 className="lp-step-title">Isi data kelas</h3>
              <p className="lp-step-desc">
                Tentukan mata pelajaran, fase/kelas, topik pembelajaran yang akan diajarkan, dan alokasi waktu pertemuan.
              </p>
            </div>

            <div className="lp-step-row">
              <div className="lp-step-num">Langkah 2</div>
              <h3 className="lp-step-title">Biarkan draf ditulis</h3>
              <p className="lp-step-desc">
                Sistem menyusun tujuan pembelajaran berlandaskan regulasi resmi BSKAP, skenario kegiatan pembuka-inti-penutup, serta asesmen.
              </p>
            </div>

            <div className="lp-step-row">
              <div className="lp-step-num">Langkah 3</div>
              <h3 className="lp-step-title">Periksa dan unduh</h3>
              <p className="lp-step-desc">
                Sesuaikan draf dengan kebutuhan murid di kelas Anda, lalu ekspor langsung ke format Microsoft Word atau PDF siap cetak.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. ISI RPP YANG DIHASILKAN (§5.4: Lembar Besar + Anotasi) ── */}
      <section className="lp-section lp-section-mint" id="contoh">
        <div className="lp-container">
          <h2 className="lp-h2">Isi RPP yang dihasilkan</h2>
          <p className="lp-body">
            Bukan sekadar ringkasan singkat, melainkan draf perangkat ajar lengkap yang terstruktur dan siap ditelaah.
          </p>

          {/* Subject Switcher Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            <button
              type="button"
              className={`lp-chip ${activeAnnotatedKey === 'ipas' ? 'active' : ''}`}
              onClick={() => setActiveAnnotatedKey('ipas')}
            >
              IPAS Kelas 5 SD
            </button>
            <button
              type="button"
              className={`lp-chip ${activeAnnotatedKey === 'matematika' ? 'active' : ''}`}
              onClick={() => setActiveAnnotatedKey('matematika')}
            >
              Matematika Kelas 2 SD
            </button>
            <button
              type="button"
              className={`lp-chip ${activeAnnotatedKey === 'bindo' ? 'active' : ''}`}
              onClick={() => setActiveAnnotatedKey('bindo')}
            >
              Bahasa Indonesia Kelas 5 SD
            </button>
          </div>

          <div className="lp-annotated-wrap">
            {/* Lembar Besar */}
            <div className="rpp-sheet-wrap">
              <article className="rpp-sheet">
                <div className="rpp-doc-header">
                  <div className="rpp-doc-meta">DRAF PERANGKAT AJAR LENGKAP</div>
                  <h3 className="rpp-doc-title">{currentAnnotatedMod.title}</h3>
                  <div className="rpp-doc-badges">
                    <span className="rpp-doc-badge-item">{currentAnnotatedMod.subject}</span>
                    <span className="rpp-doc-badge-item">{currentAnnotatedMod.phase}</span>
                    <span className="rpp-doc-badge-item">{currentAnnotatedMod.duration}</span>
                  </div>
                </div>

                <div className="rpp-section-block">
                  <h4 className="rpp-section-heading">Rujukan Capaian Pembelajaran</h4>
                  <p className="rpp-section-text" style={{ fontSize: 13.5, color: '#4A5568' }}>
                    {currentAnnotatedMod.cpRef}
                  </p>
                </div>

                <div className="rpp-section-block">
                  <h4 className="rpp-section-heading">Tujuan Pembelajaran</h4>
                  <p className="rpp-section-text">{currentAnnotatedMod.tp}</p>
                </div>

                <div className="rpp-section-block">
                  <h4 className="rpp-section-heading">Pemahaman Bermakna &amp; Pertanyaan Pemantik</h4>
                  <p className="rpp-section-text" style={{ marginBottom: 6 }}>
                    <strong>Bermakna:</strong> {currentAnnotatedMod.meaningful}
                  </p>
                  <p className="rpp-section-text">
                    <strong>Pemantik:</strong> &ldquo;{currentAnnotatedMod.triggerQ}&rdquo;
                  </p>
                </div>

                <div className="rpp-section-block">
                  <h4 className="rpp-section-heading">Rencana Langkah Kegiatan</h4>
                  <div>
                    {currentAnnotatedMod.activities.map((act, i) => (
                      <div key={i} className="rpp-activity-step">
                        <strong>{act.step}:</strong> {act.desc}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rpp-section-block" style={{ marginBottom: 0 }}>
                  <h4 className="rpp-section-heading">Asesmen &amp; Bukti Ketercapaian</h4>
                  <p className="rpp-section-text">{currentAnnotatedMod.assessment}</p>
                </div>
              </article>
            </div>

            {/* Anotasi Samping (4 Hal Penting) */}
            <div className="lp-annotated-points">
              <div className="lp-annotated-item">
                <h4>Rujukan Regulasi BSKAP</h4>
                <p>
                  Setiap dokumen menautkan rujukan resmi Capaian Pembelajaran (BSKAP 046/2025) untuk menjaga keabsahan administratif telaah pengawas.
                </p>
              </div>

              <div className="lp-annotated-item">
                <h4>Tujuan Pembelajaran Terukur</h4>
                <p>
                  Menggunakan kata kerja operasional dan konsep esensial yang sesuai dengan tahapan perkembangan kognitif fase peserta didik.
                </p>
              </div>

              <div className="lp-annotated-item">
                <h4>Aktivitas Berdiferensiasi</h4>
                <p>
                  Skenario pembelajaran memfasilitasi variasi gaya belajar murid (visual, auditori, kinestetik) agar kelas tetap aktif dan bermakna.
                </p>
              </div>

              <div className="lp-annotated-item">
                <h4>Instrumen Asesmen Konkret</h4>
                <p>
                  Dilengkapi rubrik observasi formatif yang realistis dan praktis dinilai guru saat kegiatan belajar mengajar berlangsung.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. ANDA YANG MENGATUR (§5.5) ── */}
      <section className="lp-section" id="kendali">
        <div className="lp-container">
          <h2 className="lp-h2">Guru tetap memegang kendali penuh</h2>
          <p className="lp-body">
            ruangRPP adalah pendamping penyusun draf awal, bukan pengganti penilaian profesional guru di kelas.
          </p>

          <div className="lp-control-grid">
            <div className="lp-control-card">
              <h3>Edit langsung tiap bagian</h3>
              <p>
                Anda bebas mengubah redaksi kalimat, menyesuaikan urutan kegiatan dengan karakteristik murid, atau menambahkan media ajar khas sekolah Anda.
              </p>
            </div>

            <div className="lp-control-card">
              <h3>Ekspor Word (.docx) &amp; PDF</h3>
              <p>
                Draf yang telah selesai dapat langsung diunduh dalam format rapi standar dinas pendidikan, siap cetak dan siap dilampirkan ke perangkat kurikulum.
              </p>
            </div>

            <div className="lp-control-card">
              <h3>Simpan &amp; gunakan kembali</h3>
              <p>
                Setiap dokumen yang dibuat tersimpan di akun Anda. Bisa dipakai ulang untuk kelas paralel, atau diperbarui dengan cepat di semester berikutnya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. PAKET & HARGA ── */}
      <section className="lp-section" id="harga">
        <div className="lp-container">
          <h2 className="lp-h2">Pilihan paket berlangganan</h2>
          <p className="lp-body">
            Pilih paket yang sesuai dengan kebutuhan persiapan mengajar Anda. Pembayaran instan otomatis via Midtrans.
          </p>

          <div className="lp-pricing-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`lp-price-card ${plan.recommended ? 'recommended' : ''}`}
              >
                <div>
                  {plan.recommended && (
                    <span className="lp-badge-rec">Paling Populer</span>
                  )}
                  <h3 className="lp-price-name">{plan.name}</h3>
                  <div className="lp-price-val">{plan.price}</div>
                  <div className="lp-price-period">{plan.period}</div>
                  <p className="lp-small" style={{ marginBottom: 20 }}>
                    {plan.desc}
                  </p>

                  <ul className="lp-price-features">
                    {plan.features.map((feat, idx) => (
                      <li key={idx}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className={plan.recommended ? 'lp-btn-primary' : 'lp-btn-secondary'}
                  style={{ width: '100%', height: 44, fontSize: 15 }}
                  onClick={() => handleOpenCheckout(plan)}
                >
                  {plan.priceNumber === 0 ? 'Mulai Uji Coba' : 'Pilih Paket'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. FAQ ACCORDION (§5.6, §9) ── */}
      <section className="lp-section" id="faq">
        <div className="lp-container">
          <h2 className="lp-h2">Pertanyaan yang sering diajukan</h2>
          <p className="lp-body">
            Hal-hal yang sering ditanyakan para pendidik mengenai cara kerja dan kepemilikan draf modul ajar.
          </p>

          <div className="lp-faq-container">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="lp-faq-item">
                  <button
                    type="button"
                    className="lp-faq-question"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms ease',
                        flexShrink: 0,
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="lp-faq-answer">
                      <p style={{ margin: 0 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 8. CTA PENUTUP & FOOTER (§5.7: SATU-SATUNYA BAGIAN GELAP #172B55) ── */}
      <footer className="lp-dark-block">
        <div className="lp-container">
          {/* CTA Penutup */}
          <div className="lp-cta-inner">
            <h2 className="lp-display">
              Siap menyusun RPP tanpa lembur?
            </h2>
            <p className="lp-body-lg">
              Mulai buat draf modul ajar pertama Anda hari ini. Rapi, terstruktur, dan bisa langsung diunduh.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="#harga" className="lp-btn-primary" style={{ background: '#16A596', borderColor: '#16A596' }}>
                Coba Gratis Sekarang
              </a>
              <a href="#demo" className="lp-btn-secondary" style={{ borderColor: '#ffffff', color: '#ffffff' }}>
                Coba Demo Interaktif
              </a>
            </div>
          </div>

          {/* Footer Grid */}
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-ruangRPP-dark.png"
                alt="ruangRPP"
                style={{ height: 32, width: 'auto', display: 'block' }}
              />
              <p>
                Platform pendamping guru Sekolah Dasar dalam menyusun perangkat ajar terstruktur berlandaskan Capaian Pembelajaran Kurikulum Nasional.
              </p>
            </div>

            <div className="lp-footer-col">
              <h5>Halaman</h5>
              <ul>
                <li><a href="#contoh">Contoh Dokumen</a></li>
                <li><a href="#cara-kerja">Cara Kerja</a></li>
                <li><a href="#harga">Paket &amp; Harga</a></li>
                <li><a href="#faq">Tanya Jawab</a></li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h5>Ketentuan &amp; Akses</h5>
              <ul>
                <li>
                  <button type="button" onClick={() => setLegalModal('terms')}>
                    Syarat &amp; Ketentuan
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalModal('privacy')}>
                    Kebijakan Privasi
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalModal('refund')}>
                    Garansi Pengembalian Dana
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenLogin}>
                    Masuk Tim Pengelola
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            &copy; 2026 ruangRPP. Seluruh hak cipta dilindungi.
          </div>
        </div>
      </footer>

      {/* ── MODAL: SIMULATOR MIDTRANS PAYMENT ── */}
      {selectedPlan && (
        <div className="lp-modal-overlay" onClick={() => setSelectedPlan(null)}>
          <div className="lp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal-header">
              <h3 className="lp-modal-title">
                {checkoutStep === 'success' ? 'Pembayaran Berhasil' : `Langganan: ${selectedPlan.name}`}
              </h3>
              <button
                type="button"
                className="lp-modal-close"
                onClick={() => setSelectedPlan(null)}
                aria-label="Tutup"
              >
                &times;
              </button>
            </div>

            {checkoutStep === 'form' && (
              <form onSubmit={handleProcessPayment}>
                <div style={{ background: 'var(--mint-tipis)', padding: '12px 16px', borderRadius: 10, marginBottom: 18, border: '1px solid var(--garis)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--navy-rpp)' }}>{selectedPlan.name}</strong>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--teal-dalam)' }}>{selectedPlan.price}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--abu-tinta)' }}>{selectedPlan.period}</div>
                </div>

                <div className="lp-input-group" style={{ marginBottom: 12 }}>
                  <label htmlFor="cust-name">Nama Lengkap Guru</label>
                  <input
                    id="cust-name"
                    type="text"
                    required
                    className="lp-input"
                    placeholder="mis. Budi Santoso, S.Pd."
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  />
                </div>

                <div className="lp-input-group" style={{ marginBottom: 12 }}>
                  <label htmlFor="cust-email">Alamat Email Aktif</label>
                  <input
                    id="cust-email"
                    type="email"
                    required
                    className="lp-input"
                    placeholder="email@sekolah.sch.id"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  />
                </div>

                <div className="lp-input-group" style={{ marginBottom: 16 }}>
                  <label htmlFor="cust-phone">Nomor WhatsApp</label>
                  <input
                    id="cust-phone"
                    type="tel"
                    required
                    className="lp-input"
                    placeholder="08123456789"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  />
                </div>

                {selectedPlan.priceNumber > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy-rpp)', display: 'block', marginBottom: 8 }}>
                      Metode Pembayaran (Midtrans)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      <button
                        type="button"
                        className={`lp-chip ${paymentMethod === 'qris' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('qris')}
                      >
                        QRIS Instan
                      </button>
                      <button
                        type="button"
                        className={`lp-chip ${paymentMethod === 'va' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('va')}
                      >
                        Virtual Account
                      </button>
                      <button
                        type="button"
                        className={`lp-chip ${paymentMethod === 'card' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                      >
                        Kartu Kredit
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="lp-btn-primary"
                  style={{ width: '100%', height: 46 }}
                >
                  {selectedPlan.priceNumber === 0 ? 'Aktifkan Akun Gratis' : `Bayar Sekarang (${selectedPlan.price})`}
                </button>
              </form>
            )}

            {checkoutStep === 'processing' && (
              <div style={{ textAlign: 'center', padding: '36px 0' }}>
                <p style={{ fontWeight: 600, color: 'var(--navy-rpp)', marginBottom: 8 }}>
                  Menghubungkan ke Gerbang Pembayaran Midtrans...
                </p>
                <p className="lp-small">Mohon tunggu sebentar.</p>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--mint-tipis)', color: 'var(--teal-dalam)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h4 style={{ fontSize: 20, color: 'var(--navy-rpp)', margin: '0 0 8px 0' }}>
                  Aktivasi Paket Berhasil!
                </h4>
                <p className="lp-body" style={{ margin: '0 auto 20px', maxWidth: 420 }}>
                  Terima kasih, Bapak/Ibu {customer.name || 'Guru'}. Akun dan kuota draf Anda telah aktif. Detail akses telah dikirimkan ke email Anda.
                </p>
                <button
                  type="button"
                  className="lp-btn-primary"
                  onClick={() => setSelectedPlan(null)}
                >
                  Mulai Gunakan ruangRPP
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: LEGAL KETENTUAN, PRIVASI, & GARANSI ── */}
      {legalModal && (
        <div className="lp-modal-overlay" onClick={() => setLegalModal(null)}>
          <div className="lp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal-header">
              <h3 className="lp-modal-title">
                {legalModal === 'terms' && 'Syarat & Ketentuan Penggunaan'}
                {legalModal === 'privacy' && 'Kebijakan Privasi'}
                {legalModal === 'refund' && 'Garansi Pengembalian Dana (Refund)'}
              </h3>
              <button
                type="button"
                className="lp-modal-close"
                onClick={() => setLegalModal(null)}
                aria-label="Tutup"
              >
                &times;
              </button>
            </div>

            <div style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--abu-tinta)' }}>
              {legalModal === 'terms' && (
                <div>
                  <p>1. <strong>Peran Platform:</strong> ruangRPP menyediakan sistem kecerdasan buatan terpandu untuk membantu pendidik menyusun draf dokumen pembelajaran.</p>
                  <p>2. <strong>Tanggung Jawab Pedagogis:</strong> Seluruh draf perangkat ajar yang dihasilkan berstatus draf kerja. Pendidik bertanggung jawab penuh memeriksa dan menyesuaikan isi dokumen dengan kondisi peserta didik di satuan pendidikannya.</p>
                  <p>3. <strong>Hak Cipta Dokumen:</strong> Dokumen yang telah diunduh sepenuhnya menjadi hak milik pendidik dan sekolah bersangkutan untuk keperluan pembelajaran non-komersial.</p>
                </div>
              )}

              {legalModal === 'privacy' && (
                <div>
                  <p>1. <strong>Kerahasiaan Data:</strong> Kami menghormati privasi Bapak/Ibu guru. Data identitas sekolah dan nomor kontak yang Anda daftarkan hanya digunakan untuk keperluan aktivasi akun dan layanan pelanggan.</p>
                  <p>2. <strong>Keamanan Transaksi:</strong> Data pembayaran diproses secara aman dan terenkripsi melalui Midtrans. Kami tidak pernah menyimpan nomor kartu kredit atau detail perbankan Anda di server kami.</p>
                </div>
              )}

              {legalModal === 'refund' && (
                <div>
                  <p>1. <strong>Jaminan 3x24 Jam:</strong> Kami memberikan garansi pengembalian dana 100% jika terjadi kendala teknis sistemik pada platform kami yang membuat layanan tidak dapat digunakan sama sekali.</p>
                  <p>2. <strong>Proses Klaim:</strong> Cukup hubungi tim dukungan melalui nomor kontak resmi dengan melampirkan bukti transaksi pembayaran.</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <button
                type="button"
                className="lp-btn-secondary"
                style={{ height: 40, padding: '0 18px', fontSize: 14 }}
                onClick={() => setLegalModal(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
