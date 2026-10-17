import React, { useState, useEffect, useRef } from 'react';

export type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  quota: string;
  unitPrice: string;
  priceNumber: number;
  desc: string;
  features: string[];
  recommended?: boolean;
};

export type SampleModule = {
  id: string;
  title: string;
  subjectShort: string;
  phaseShort: string;
  duration: string;
  elementRef: string;
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
    subjectShort: 'IPAS (Sains & Lingkungan)',
    phaseShort: 'Fase C / Kelas 5 SD',
    duration: '2 pertemuan (4 JP × 35 menit)',
    elementRef: 'Pemahaman IPAS (Sains & Lingkungan)',
    tp: 'Peserta didik mengidentifikasi urutan siklus hidrologi (evaporasi, kondensasi, presipitasi) dan menganalisis peran daerah resapan air dalam menjaga ketersediaan air bersih di lingkungan tempat tinggalnya.',
    meaningful: 'Air yang mengalir hari ini adalah bagian dari siklus alamiah bumi. Menjaga daerah resapan dan kebersihan sungai berarti menjamin ketersediaan air bagi generasi penerus.',
    triggerQ: 'Mengapa air sumur di perkotaan bisa berkurang saat kemarau panjang padahal bumi kita didominasi 70% air?',
    activities: [
      { step: 'Pembuka (10 menit)', desc: 'Orientasi fenomena: Guru mengajak murid mengamati embun pada penutup wadah air hangat berselimut es batu.' },
      { step: 'Inti — Diferensiasi (50 menit)', desc: 'Kelompok visual menganalisis diagram infografis perjalanan air; kelompok kinestetik membuat simulasi toples resapan air tanah sederhana.' },
      { step: 'Penutup (10 menit)', desc: 'Refleksi komitmen "Satu Tindakan Hemat Air di Rumah" dan pengisian lembar jurnal refleksi mandiri.' },
    ],
    assessment: 'Formatif: Lembar ceklis observasi keterlibatan diskusi dan rubrik pemahaman tahapan siklus air.',
  },
  matematika: {
    id: 'matematika',
    title: 'Makna Pecahan Sederhana (1/2 dan 1/4)',
    subjectShort: 'Matematika Dasar',
    phaseShort: 'Fase A / Kelas 2 SD',
    duration: '2 pertemuan (4 JP × 35 menit)',
    elementRef: 'Bilangan Fase A',
    tp: 'Peserta didik mampu menunjukkan makna pecahan setengah (1/2) dan seperempat (1/4) menggunakan benda konkret berbentuk lingkaran dan persegi secara adil.',
    meaningful: 'Berbagi makanan atau barang secara adil kepada saudara dan teman berlandaskan pada pemahaman pembagian bagian yang sama besar.',
    triggerQ: 'Bagaimana cara memotong satu kue terang bulan agar kamu dan adikmu mendapat bagian yang sama persis tanpa berebut?',
    activities: [
      { step: 'Pembuka (10 menit)', desc: 'Apersepsi cerita bergambar tentang dua anak yang membagi satu buah roti bolu sama besar.' },
      { step: 'Inti — Eksplorasi (50 menit)', desc: 'Eksperimen melipat kertas origami menjadi 2 dan 4 bagian simetris; memotong plastisin dan membedakan potongan adil (pecahan sah) dengan tidak adil.' },
      { step: 'Penutup (10 menit)', desc: 'Menempelkan karya lipatan di "Papan Pecahan Ceria" di dinding kelas dan apresiasi hasil karya kawan.' },
    ],
    assessment: 'Unjuk kerja: Kemampuan mendemonstrasikan pembagian 1/2 dan 1/4 menggunakan peraga kertas lipat.',
  },
  bindo: {
    id: 'bindo',
    title: 'Menulis Teks Eksplanasi Sebab-Akibat Fenomena Alam',
    subjectShort: 'Bahasa Indonesia',
    phaseShort: 'Fase C / Kelas 5 SD',
    duration: '3 pertemuan (6 JP × 35 menit)',
    elementRef: 'Menulis Fase C',
    tp: 'Peserta didik mampu menulis draf teks eksplanasi sebab-akibat fenomena alam dengan susunan runut (pernyataan umum, rangkaian penjelas, simpulan) dan penggunaan konjungsi kausalitas yang tepat.',
    meaningful: 'Menjelaskan fenomena secara runut melatih cara berpikir ilmiah, kritis, dan logis dalam menyampaikan gagasan.',
    triggerQ: 'Dari mana asal air hujan di langit dan mengapa hujan lebat di hulu bisa menyebabkan banjir di pemukiman hilir?',
    activities: [
      { step: 'Pembuka (15 menit)', desc: 'Menyimak rekaman suara badai hujan dan tanya jawab mengenai pengalaman murid menghadapi cuaca ekstrem.' },
      { step: 'Inti — Penulisan Draf (45 menit)', desc: 'Menyusun kerangka paragraf sebab-akibat menggunakan bagan alur pikiran; menulis draf pertama secara mandiri dengan bimbingan guru.' },
      { step: 'Penutup (10 menit)', desc: 'Saling membaca kalimat pembuka dengan teman sebangku (peer correction) untuk menyunting ejaan.' },
    ],
    assessment: 'Rubrik penulisan: Struktur paragraf (pembuka, penjelas, penutup), ketepatan konjungsi kausalitas, dan ejaan baku.',
  },
};

// Skema Harga Berbasis Kuota Per-Generate (§5.6)
const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Paket Uji Coba',
    price: 'Rp 0',
    period: 'sekali pakai · langsung aktif',
    quota: '3x Generate Draf',
    unitPrice: 'Gratis',
    priceNumber: 0,
    desc: 'Untuk menguji langsung kualitas draf modul ajar terstruktur ruangRPP.',
    features: [
      '3 Kuota Generate Draf RPP Lengkap',
      'Akses Seluruh Fase (A, B, C / Kelas 1–6 SD)',
      'Pratinjau struktur modul terstandar',
      'Ekspor format Word (.docx) & PDF',
      'Tanpa batas waktu (kuota tidak hangus)',
    ],
  },
  {
    id: 'mandiri',
    name: 'Guru Mandiri',
    price: 'Rp 25.000',
    period: 'sekali bayar · kuota permanen',
    quota: '15x Generate Draf',
    unitPrice: 'Rp 1.660 / draf',
    priceNumber: 25000,
    desc: 'Paling pas untuk persiapan 1 semester satu mata pelajaran tertentu.',
    features: [
      '15 Kuota Generate Draf RPP',
      'Hanya Rp 1.660 per draf modul',
      'Kuota aktif permanen (tanpa tanggal kedaluwarsa)',
      'Ekspor Word (.docx) & PDF siap cetak',
      'Instrumen asesmen & rubrik terlampir',
      'Arsip draf tersimpan selamanya di akun',
    ],
    recommended: true, // Rekomendasi dengan border teal 2px (§5.6)
  },
  {
    id: 'semester',
    name: 'Paket Semester Penuh',
    price: 'Rp 65.000',
    period: 'sekali bayar · kuota permanen',
    quota: '50x Generate Draf',
    unitPrice: 'Rp 1.300 / draf',
    priceNumber: 65000,
    desc: 'Pilihan hemat untuk guru wali kelas yang mengampu banyak mata pelajaran.',
    features: [
      '50 Kuota Generate Draf RPP',
      'Tarif paling hemat (Rp 1.300 per draf)',
      'Bebas digunakan untuk semua kelas & mapel',
      'Ekspor dokumen resmi siap telaah pengawas',
      'Panduan diferensiasi belajar lengkap',
      'Dukungan prioritas pembaruan kurikulum',
    ],
  },
];

const FAQS = [
  {
    q: 'Apakah hasilnya bisa saya edit?',
    a: 'Editor draf sedang direncanakan. Saat generator tersedia, guru tetap perlu memeriksa dan menyesuaikan hasil dengan kebutuhan kelas.',
  },
  {
    q: 'Sesuai kurikulum apa?',
    a: 'Tim sedang memeriksa dokumen kurikulum nasional untuk SD. Cakupan mata pelajaran dan fase baru diaktifkan setelah sumber dan template ditinjau.',
  },
  {
    q: 'Format apa yang bisa diunduh?',
    a: 'Ekspor Word (.DOCX) dan PDF direncanakan setelah generator dan editor stabil. Contoh di halaman ini masih berupa ilustrasi tampilan.',
  },
  {
    q: 'Apakah data kelas dan kuota saya disimpan?',
    a: 'Akun yang berhasil masuk dengan Google tersimpan di RuangRPP. Penyimpanan draf dan pengelolaan kuota belum diaktifkan.',
  },
  {
    q: 'Bagaimana sistem hitungan biaya per-generate?',
    a: 'Paket dan angka di halaman ini masih rancangan. Harga, kuota, dan ketentuan akhir akan ditetapkan setelah generator diuji bersama guru.',
  },
  {
    q: 'Apakah saat ini pembayaran sudah memotong uang riil?',
    a: 'Periksa mode pembayaran di ruang guru. Sandbox hanya untuk simulasi, sedangkan mode produksi menggunakan uang nyata. Pembelian tersedia setelah dibuka pengelola; kuota masuk setelah pembayaran diverifikasi.',
  },
];

export function LandingView({ onOpenLogin }: { onOpenLogin: () => void }) {
  // Hero Demo State
  const [activeTab, setActiveTab] = useState<'ipas' | 'matematika' | 'bindo'>('ipas');
  const [demoStep, setDemoStep] = useState<number>(3); // 0: init, 1: tp, 2: activities, 3: done
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Annotated Section Tab State
  const [activeAnnotatedKey, setActiveAnnotatedKey] = useState<'ipas' | 'matematika' | 'bindo'>('ipas');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Legal Modal State
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | 'refund' | null>(null);

  const currentHeroMod = SAMPLE_MODULES[activeTab];
  const currentAnnotatedMod = SAMPLE_MODULES[activeAnnotatedKey];

  // Function to run hero generation animation (≤ 4 detik total, §7)
  const runDemoAnimation = (tabKey: 'ipas' | 'matematika' | 'bindo') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveTab(tabKey);

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDemoStep(3);
      setIsGenerating(false);
      return;
    }

    setDemoStep(0);
    setIsGenerating(true);

    const step1 = setTimeout(() => setDemoStep(1), 700);
    const step2 = setTimeout(() => setDemoStep(2), 1900);
    const step3 = setTimeout(() => {
      setDemoStep(3);
      setIsGenerating(false);
    }, 3200);

    timerRef.current = step3;
  };

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop && !prefersReduced) {
      runDemoAnimation('ipas');
    } else {
      setDemoStep(3);
      setIsGenerating(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const generatingLabel =
    demoStep === 0
      ? 'identitas modul'
      : demoStep === 1
      ? 'tujuan pembelajaran'
      : 'kegiatan pembelajaran';

  return (
    <div className="landing-scope">
      {/* ── 1. NAVBAR (§5.1: 72px, logo 36px, max 4 tautan, 1 CTA) ── */}
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

          <div className="lp-nav-right">
            <nav className="lp-nav-links" aria-label="Navigasi Utama">
              <a href="#contoh">Contoh dokumen</a>
              <a href="#cara-kerja">Cara kerja</a>
              <a href="#harga">Paket &amp; biaya</a>
              <a href="#faq">FAQ</a>
            </nav>

            <a href="/login" className="lp-btn-primary lp-nav-cta">
              Masuk guru
            </a>

            <button
              type="button"
              className="lp-nav-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
              aria-expanded={mobileMenuOpen}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Menu */}
        {mobileMenuOpen && (
          <div className="lp-mobile-menu" role="dialog" aria-modal="true">
            <nav className="lp-mobile-menu-links">
              <a
                href="#contoh"
                onClick={() => setMobileMenuOpen(false)}
                className="lp-mobile-link"
              >
                <span>Contoh dokumen</span>
                <span className="lp-mobile-link-arrow">&rarr;</span>
              </a>
              <a
                href="#cara-kerja"
                onClick={() => setMobileMenuOpen(false)}
                className="lp-mobile-link"
              >
                <span>Cara kerja</span>
                <span className="lp-mobile-link-arrow">&rarr;</span>
              </a>
              <a
                href="#harga"
                onClick={() => setMobileMenuOpen(false)}
                className="lp-mobile-link"
              >
                <span>Paket &amp; biaya</span>
                <span className="lp-mobile-link-arrow">&rarr;</span>
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="lp-mobile-link"
              >
                <span>Pertanyaan (FAQ)</span>
                <span className="lp-mobile-link-arrow">&rarr;</span>
              </a>
            </nav>
            <div className="lp-mobile-menu-cta">
              <a
                href="/login"
                className="lp-btn-primary"
                style={{ width: '100%', height: 46 }}
              >
                Masuk ruang guru
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION (§5.2: 12 Kolom, Meja Bleed, Tanpa Form Panel) ── */}
      <section className="lp-hero">
        <div className="lp-hero-grid">
          {/* Kiri (5 Kolom) */}
          <div className="lp-hero-copy">
            <h1>
              Rancang RPP lebih mudah, bersama <span className="nw">Bapak/Ibu</span> guru.
            </h1>
            <p className="lp-body-lg">
              RuangRPP sedang disiapkan untuk membantu menyusun draf tujuan pembelajaran, kegiatan, dan asesmen. Bapak/Ibu tetap memeriksa dan menyesuaikan hasilnya.
            </p>

            <div className="lp-hero-cta-group">
              <a href="/login" className="lp-btn-primary">
                Masuk guru
              </a>
              <a href="#contoh" className="lp-btn-secondary">
                Lihat contoh RPP
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
              <span>Pratinjau produk. Generator, editor, dan ekspor sedang disiapkan.</span>
            </div>
          </div>

          {/* Kanan (7 Kolom): Meja Mint Bleed + Tab Contoh + Lembar RPP 540px */}
          <div className="lp-hero-demo">
            {/* Baris Tab Contoh (§5.2 & §8) */}
            <div className="lp-hero-tabs-bar">
              <div className="lp-hero-tab-list" role="tablist" aria-label="Contoh Mata Pelajaran">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'ipas'}
                  className={`lp-hero-tab ${activeTab === 'ipas' ? 'active' : ''}`}
                  onClick={() => runDemoAnimation('ipas')}
                >
                  IPAS: Siklus Air
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'matematika'}
                  className={`lp-hero-tab ${activeTab === 'matematika' ? 'active' : ''}`}
                  onClick={() => runDemoAnimation('matematika')}
                >
                  Matematika: Pecahan
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'bindo'}
                  className={`lp-hero-tab ${activeTab === 'bindo' ? 'active' : ''}`}
                  onClick={() => runDemoAnimation('bindo')}
                >
                  B. Indonesia: Teks Eksplanasi
                </button>
              </div>

              <button
                type="button"
                className="lp-hero-tab-replay"
                onClick={() => runDemoAnimation(activeTab)}
                title="Ulangi simulasi penulisan draf"
              >
                {isGenerating ? 'Menulis…' : 'Ulangi contoh'}
              </button>
            </div>

            {/* Lembar RPP (§6: Tinggi 540px, Sudut 24px, Fade Mask Bawah) */}
            <div className="rpp-wrap">
              <article className="rpp-sheet" aria-live="polite">
                {/* Status Bar Tunggal (§6) */}
                <div className="rpp-status-bar">
                  {isGenerating ? (
                    <span className="rpp-status-generating">
                      <span className="rpp-sparkle">✦</span> Simulasi {generatingLabel}…
                    </span>
                  ) : (
                    <span className="rpp-status-done">
                      <span className="rpp-done-dot">●</span> Ilustrasi tampilan · belum ditinjau guru
                    </span>
                  )}
                </div>

                {/* Eyebrow & Judul */}
                <div className="rpp-eyebrow">Modul ajar</div>
                <h2 className="rpp-title">{currentHeroMod.title}</h2>

                {/* Tabel Identitas 3 Baris (§6) */}
                <div className="rpp-identitas-table">
                  <div className="rpp-id-row">
                    <span className="rpp-id-label">Mata pelajaran</span>
                    <span className="rpp-id-val">{currentHeroMod.subjectShort}</span>
                  </div>
                  <div className="rpp-id-row">
                    <span className="rpp-id-label">Fase / kelas</span>
                    <span className="rpp-id-val">{currentHeroMod.phaseShort}</span>
                  </div>
                  <div className="rpp-id-row">
                    <span className="rpp-id-label">Alokasi waktu</span>
                    <span className="rpp-id-val">{currentHeroMod.duration}</span>
                  </div>
                </div>

                {/* Bagian 1: Capaian dan Tujuan Pembelajaran */}
                <div className="rpp-section-block">
                  <h4 className="rpp-doc-h4">1. Capaian dan tujuan pembelajaran</h4>
                  <p className="rpp-doc-p">
                    {demoStep >= 1 ? currentHeroMod.tp : 'Menyusun rumusan capaian kompetensi…'}
                  </p>
                  <div className="rpp-doc-ref-note">
                    <em>Ilustrasi elemen: {currentHeroMod.elementRef}</em>
                  </div>
                </div>

                {/* Bagian 2: Rencana Kegiatan Pembelajaran */}
                {demoStep >= 2 && (
                  <div className="rpp-section-block">
                    <h4 className="rpp-doc-h4">2. Rencana kegiatan pembelajaran</h4>
                    <div>
                      {currentHeroMod.activities.map((act, i) => (
                        <p key={i} className="rpp-doc-p" style={{ marginBottom: 6 }}>
                          <strong>{act.step}:</strong> {act.desc}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </div>

            <div className="lp-hero-custom-prompt-note">
              Ingin menyiapkan akun? <a href="/login">Masuk ke ruang guru.</a>
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
                Sistem menyusun tujuan pembelajaran berlandaskan regulasi resmi, skenario kegiatan pembuka-inti-penutup, serta asesmen.
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

      {/* ── 4. CONTOH DOKUMEN BESAR + ANOTASI (§5.4) ── */}
      <section className="lp-section lp-section-mint" id="contoh">
        <div className="lp-container">
          <h2 className="lp-h2">Contoh dokumen</h2>
          <p className="lp-body">
            Ilustrasi struktur dokumen untuk menunjukkan rancangan produk. Contoh ini belum ditinjau guru dan bukan kutipan CP resmi.
          </p>

          {/* Subject Switcher */}
          <div className="lp-annotated-tabs-bar">
            <button
              type="button"
              className={`lp-hero-tab ${activeAnnotatedKey === 'ipas' ? 'active' : ''}`}
              onClick={() => setActiveAnnotatedKey('ipas')}
            >
              IPAS Kelas 5 SD
            </button>
            <button
              type="button"
              className={`lp-hero-tab ${activeAnnotatedKey === 'matematika' ? 'active' : ''}`}
              onClick={() => setActiveAnnotatedKey('matematika')}
            >
              Matematika Kelas 2 SD
            </button>
            <button
              type="button"
              className={`lp-hero-tab ${activeAnnotatedKey === 'bindo' ? 'active' : ''}`}
              onClick={() => setActiveAnnotatedKey('bindo')}
            >
              Bahasa Indonesia Kelas 5 SD
            </button>
          </div>

          <div className="lp-annotated-wrap">
            {/* Lembar Besar */}
            <div className="rpp-wrap">
              <article className="rpp-sheet" style={{ height: 'auto', WebkitMaskImage: 'none', maskImage: 'none' }}>
                <div className="rpp-eyebrow">Modul ajar lengkap</div>
                <h3 className="rpp-title" style={{ fontSize: 24, marginBottom: 12 }}>
                  {currentAnnotatedMod.title}
                </h3>

                <div className="rpp-identitas-table">
                  <div className="rpp-id-row">
                    <span className="rpp-id-label">Mata pelajaran</span>
                    <span className="rpp-id-val">{currentAnnotatedMod.subjectShort}</span>
                  </div>
                  <div className="rpp-id-row">
                    <span className="rpp-id-label">Fase / kelas</span>
                    <span className="rpp-id-val">{currentAnnotatedMod.phaseShort}</span>
                  </div>
                  <div className="rpp-id-row">
                    <span className="rpp-id-label">Alokasi waktu</span>
                    <span className="rpp-id-val">{currentAnnotatedMod.duration}</span>
                  </div>
                </div>

                <div className="rpp-section-block">
                  <h4 className="rpp-doc-h4">1. Capaian dan tujuan pembelajaran</h4>
                  <p className="rpp-doc-p">{currentAnnotatedMod.tp}</p>
                  <div className="rpp-doc-ref-note">
                    <em>Ilustrasi elemen: {currentAnnotatedMod.elementRef}</em>
                  </div>
                </div>

                <div className="rpp-section-block">
                  <h4 className="rpp-doc-h4">Pemahaman bermakna &amp; pertanyaan pemantik</h4>
                  <p className="rpp-doc-p" style={{ marginBottom: 6 }}>
                    <strong>Bermakna:</strong> {currentAnnotatedMod.meaningful}
                  </p>
                  <p className="rpp-doc-p">
                    <strong>Pemantik:</strong> &ldquo;{currentAnnotatedMod.triggerQ}&rdquo;
                  </p>
                </div>

                <div className="rpp-section-block">
                  <h4 className="rpp-doc-h4">2. Rencana langkah kegiatan</h4>
                  <div>
                    {currentAnnotatedMod.activities.map((act, i) => (
                      <p key={i} className="rpp-doc-p" style={{ marginBottom: 6 }}>
                        <strong>{act.step}:</strong> {act.desc}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="rpp-section-block" style={{ marginBottom: 0 }}>
                  <h4 className="rpp-doc-h4">3. Asesmen &amp; bukti ketercapaian</h4>
                  <p className="rpp-doc-p">{currentAnnotatedMod.assessment}</p>
                </div>
              </article>
            </div>

            {/* Anotasi Samping (4 Hal Penting) */}
            <div className="lp-annotated-points">
              <div className="lp-annotated-item">
                <h4>Rujukan yang dapat ditelusuri</h4>
                <p>
                  Generator dirancang menampilkan sumber yang benar-benar digunakan. Tim masih memeriksa dokumen kurikulum dan belum mengaktifkan retrieval.
                </p>
              </div>

              <div className="lp-annotated-item">
                <h4>Tujuan pembelajaran terukur</h4>
                <p>
                  Menggunakan kata kerja operasional dan konsep esensial yang sesuai dengan tahapan perkembangan kognitif fase peserta didik.
                </p>
              </div>

              <div className="lp-annotated-item">
                <h4>Aktivitas berdiferensiasi</h4>
                <p>
                  Skenario pembelajaran memfasilitasi variasi gaya belajar murid (visual, auditori, kinestetik) agar kelas tetap aktif dan bermakna.
                </p>
              </div>

              <div className="lp-annotated-item">
                <h4>Instrumen asesmen konkret</h4>
                <p>
                  Dilengkapi rubrik observasi formatif yang realistis dan praktis dinilai guru saat kegiatan belajar mengajar berlangsung.
                </p>
              </div>

              <div style={{ marginTop: 8 }}>
                <a
                  href="#harga"
                  className="lp-btn-secondary"
                  style={{ width: '100%', height: 44, fontSize: 14 }}
                >
                  Lihat rencana paket
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. ANDA YANG MENGATUR (§5.5) ── */}
      <section className="lp-section" id="keunggulan">
        <div className="lp-container">
          <h2 className="lp-h2">Guru tetap memegang kendali penuh</h2>
          <p className="lp-body">
            ruangRPP dirancang sebagai rekan penyusun draf awal, bukan pengganti peran dan pertimbangan guru di kelas.
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
                Ekspor Word dan PDF akan tersedia setelah format draf ditinjau guru dan implementasi ekspor stabil.
              </p>
            </div>

            <div className="lp-control-card">
              <h3>Simpan &amp; gunakan kembali</h3>
              <p>
                Penyimpanan dan pembukaan kembali draf direncanakan setelah generator tersedia. Saat ini akun guru sedang disiapkan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. PAKET & BIAYA (§5.6: Per-Generate Kuota Draf + Keterangan Staging Dummy) ── */}
      <section className="lp-section" id="harga">
        <div className="lp-container">
          <h2 className="lp-h2">Rencana paket draf RPP</h2>
          <p className="lp-body">
            Lihat ketersediaan pembelian dan rincian kuota di ruang guru. Generator masih dalam pengembangan.
          </p>

          {/* Banner Pemberitahuan Fase Staging / Sandbox Dummy */}
          <div className="lp-staging-notice">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--teal-dalam)' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <strong>Dalam pengembangan:</strong> Pembelian dibuka sesuai konfigurasi pengelola. Mode sandbox hanya untuk simulasi; ketersediaan generator ditampilkan di ruang guru.
            </div>
          </div>

          <div className="lp-pricing-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`lp-price-card ${plan.recommended ? 'recommended' : ''}`}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <h3 className="lp-price-name" style={{ margin: 0 }}>{plan.name}</h3>
                    <span className="lp-quota-chip">{plan.quota}</span>
                  </div>
                  <div className="lp-price-val">{plan.price}</div>
                  <div className="lp-price-period">
                    {plan.period} &bull; <strong style={{ color: 'var(--teal-dalam)' }}>{plan.unitPrice}</strong>
                  </div>
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
                  onClick={() => window.location.assign('/dashboard#billing')}
                >
                  {plan.priceNumber === 0 ? 'Masuk ke ruang guru' : 'Lihat paket di akun'}
                </button>
              </div>
            ))}
          </div>

          <p className="lp-small" style={{ marginTop: 24, textAlign: 'center', color: 'var(--abu-tinta)' }}>
            Masuk ke akun belum mengaktifkan kuota. Generator akan dibuka setelah sumber dan hasil draf selesai diuji.
          </p>
        </div>
      </section>

      {/* ── 7. FAQ ACCORDION (§5.7 & §9) ── */}
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

      {/* ── 8. CTA PENUTUP & FOOTER (§5.8: SATU-SATUNYA BAGIAN GELAP #172B55) ── */}
      <footer className="lp-dark-block">
        <div className="lp-container">
          {/* CTA Penutup */}
          <div className="lp-cta-inner">
            <h2 className="lp-display">
              Siap menyusun RPP tanpa lembur?
            </h2>
            <p className="lp-body-lg">
              Siapkan akun dan lihat rancangan ruang kerja guru. Pembuatan draf dibuka setelah sumber dan generator selesai diuji.
            </p>
            <div className="lp-cta-btn-group">
              <a href="/login" className="lp-btn-primary" style={{ background: '#16A596', borderColor: '#16A596' }}>
                Masuk ke ruang guru
              </a>
              <a href="#contoh" className="lp-btn-secondary">
                Lihat contoh dokumen
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
                style={{ height: 36, width: 'auto', display: 'block' }}
              />
              <p>
                Platform pendamping guru Sekolah Dasar dalam menyusun perangkat ajar terstruktur berlandaskan Capaian Pembelajaran Kurikulum Nasional.
              </p>
            </div>

            <div className="lp-footer-col">
              <h5>Halaman</h5>
              <ul>
                <li><a href="#contoh">Contoh dokumen</a></li>
                <li><a href="#cara-kerja">Cara kerja</a></li>
                <li><a href="#harga">Paket &amp; biaya</a></li>
                <li><a href="#faq">Tanya jawab</a></li>
              </ul>
            </div>

            <div className="lp-footer-col">
              <h5>Ketentuan &amp; Akses</h5>
              <ul>
                <li>
                  <button type="button" onClick={() => setLegalModal('terms')}>
                    Syarat &amp; ketentuan
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalModal('privacy')}>
                    Kebijakan privasi
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalModal('refund')}>
                    Garansi pengembalian dana
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenLogin} style={{ color: 'var(--teal-ruang)', fontWeight: 600 }}>
                    Masuk tim pengelola
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

      {/* ── MODAL: SIMULATOR MIDTRANS PAYMENT (DUMMY SANDBOX) ── */}
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
                  <p>3. <strong>Status pengembangan:</strong> Generator, ekspor, dan paket berbayar belum aktif. Ketentuan penggunaan sumber dan hasil perlu ditetapkan sebelum layanan dirilis.</p>
                </div>
              )}

              {legalModal === 'privacy' && (
                <div>
                  <p>Nama, email, identitas akun Google, serta waktu masuk digunakan untuk akun RuangRPP. Pembayaran belum terhubung.</p>
                  <p><a href="/privasi">Baca penggunaan data akun dan status layanan.</a></p>
                </div>
              )}

              {legalModal === 'refund' && (
                <div>
                  <p>Pembayaran belum tersedia. Kebijakan pengembalian dana akan ditetapkan sebelum paket berbayar dibuka.</p>
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
