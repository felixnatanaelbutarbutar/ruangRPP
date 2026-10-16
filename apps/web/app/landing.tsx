'use client';
import { useState } from 'react';

type Plan = {
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

const SAMPLE_MODULES = [
  {
    id: 'ipas',
    title: 'Fotosintesis: Proses Terpenting bagi Kehidupan di Bumi',
    subject: 'IPAS (Ilmu Pengetahuan Alam & Sosial)',
    phase: 'Fase B · Kelas 4 SD',
    duration: '2 Pertemuan (4 JP x 35 Menit)',
    cpRef: 'Keputusan Kepala BSKAP No. 046/H/KR/2025 (Elemen Pemahaman IPAS Sains)',
    tp: 'Peserta didik menganalisis kebutuhan tumbuhan untuk melakukan fotosintesis serta mengaitkan dampaknya terhadap ketersediaan oksigen bagi makhluk hidup.',
    meaningful: 'Tumbuhan adalah produsen utama di bumi; menjaga kelestarian pohon berarti menjaga napas seluruh kehidupan di lingkungan sekolah kita.',
    triggerQ: 'Dari mana pohon besar di halaman sekolah mendapatkan makanannya padahal tidak memiliki mulut?',
    activities: [
      { time: '10m', type: 'Pembuka', desc: 'Apersepsi: Guru membawa daun segar & daun layu, mengajak murid mengamati perbedaan warna dan tekstur.' },
      { time: '50m', type: 'Inti (Diferensiasi)', desc: 'Kelompok visual mengamati infografis klorofil; kelompok kinestetik melakukan uji bayangan cahaya matahari pada tanaman pot.' },
      { time: '10m', type: 'Penutup', desc: 'Refleksi "Satu Kata Hari Ini" dan penugasan lembar observasi tanaman rumah sederhana.' },
    ],
    assessment: 'Formatif: Lembar ceklis observasi diskusi kelompok & jurnal refleksi belajar mandiri murid.',
  },
  {
    id: 'matematika',
    title: 'Eksplorasi Pecahan Sederhana (1/2 dan 1/4)',
    subject: 'Matematika Dasar',
    phase: 'Fase A · Kelas 2 SD',
    duration: '2 Pertemuan (4 JP x 35 Menit)',
    cpRef: 'Keputusan BSKAP No. 046/H/KR/2025 (Elemen Bilangan Fase A)',
    tp: 'Peserta didik mampu menunjukkan makna pecahan setengah (1/2) dan seperempat (1/4) menggunakan benda konkret berbentuk lingkaran dan persegi.',
    meaningful: 'Berbagi makanan atau barang secara adil kepada saudara dan teman dimulai dari memahami pecahan yang sama besar.',
    triggerQ: 'Jika kamu memiliki satu buah kue bolu dan ingin membaginya rata dengan adikmu, bagaimana cara memotongnya?',
    activities: [
      { time: '10m', type: 'Pembuka', desc: 'Permainan melipat kertas origami menjadi 2 bagian yang saling menutupi sempurna.' },
      { time: '50m', type: 'Inti (Eksploratif)', desc: 'Memotong replika buah plastisin; membedakan potongan yang adil (sama besar) dan tidak adil.' },
      { time: '10m', type: 'Penutup', desc: 'Menempelkan potongan karya di "Pohon Pecahan Ceria" di dinding kelas.' },
    ],
    assessment: 'Unjuk kerja: Kemampuan menunjukkan bagian 1/2 dan 1/4 dengan alat peraga kertas lipat.',
  },
  {
    id: 'bindo',
    title: 'Menulis Teks Eksplanasi: Mengapa Terjadi Hujan?',
    subject: 'Bahasa Indonesia',
    phase: 'Fase C · Kelas 5 SD',
    duration: '3 Pertemuan (6 JP x 35 Menit)',
    cpRef: 'Keputusan BSKAP No. 046/H/KR/2025 (Elemen Menulis Fase C)',
    tp: 'Peserta didik mampu menulis teks eksplanasi sebab-akibat sederhana tentang fenomena siklus air menggunakan kosakata baku dan tanda baca tepat.',
    meaningful: 'Memahami fenomena alam membuat kita sadar pentingnya menjaga kebersihan sungai dan daerah resapan air di pemukiman.',
    triggerQ: 'Mengapa air hujan yang jatuh dari langit tidak pernah habis meskipun turun terus-menerus?',
    activities: [
      { time: '15m', type: 'Pembuka', desc: 'Menyimak rekaman suara gemercik hujan dan menceritakan pengalaman banjir/hujan deras.' },
      { time: '45m', type: 'Inti (Struktur Teks)', desc: 'Menyusun kerangka teks sebab-akibat (evaporasi, kondensasi, presipitasi) dengan peta pikiran.' },
      { time: '10m', type: 'Penutup', desc: 'Saling membaca draf kalimat pertama dengan teman sebangku (peer feedback).' },
    ],
    assessment: 'Rubrik penulisan: Struktur pembuka, deretan penjelas, ketepatan konjungsi kausalitas.',
  },
];

const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Paket Uji Coba',
    price: 'Rp 0',
    period: 'gratis 3 hari',
    priceNumber: 0,
    desc: 'Untuk mengenal dan menguji kualitas draf modul ajar terstruktur RuangRPP.',
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
      'Riwayat tersimpan permanen tanpa batas',
      'Aktivasi instan otomatis via Midtrans',
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
      'Seluruh Kelas 1–6 (Fase A, B, C)',
      'Ekspor dokumen siap cetak & siap telaah',
      'Generator instrumen rubrik asesmen',
      'Pembaruan otomatis regulasi Kemendikdasmen',
      'Dukungan prioritas tim via WhatsApp',
    ],
    recommended: true,
  },
  {
    id: 'sekolah',
    name: 'Sekolah & KKG',
    badge: 'Satuan Pendidikan',
    price: 'Rp 249.000',
    period: 'per tahun ajaran',
    priceNumber: 249000,
    desc: 'Lisensi multi-guru untuk sekolah dasar, gugus, atau kelompok kerja guru.',
    features: [
      'Hingga 10 Akun Guru Terdaftar',
      'Akses tak terbatas selama 1 tahun penuh',
      'Standarisasi perangkat ajar satu sekolah',
      'Format identitas & kop surat sekolah resmi',
      'Faktur pajak / invoice resmi instansi',
      'Sesi orientasi penggunaan via Zoom online',
    ],
  },
];

const FAQS = [
  {
    q: 'Apakah modul ajar yang dihasilkan sudah sesuai regulasi kurikulum terbaru?',
    a: 'Ya. RuangRPP secara ketat berlandaskan pada dokumen regulasi Capaian Pembelajaran resmi (CP No. 046/H/KR/2025 dan Permendikdasmen terkait). Setiap tujuan pembelajaran yang dihasilkan memiliki rujukan kutipan elemen dan fase dokumen aslinya, bukan karangan AI acak.',
  },
  {
    q: 'Apakah guru tetap bisa mengedit hasil drafnya?',
    a: 'Tentu saja. Di RuangRPP, filosofi kami adalah bahwa guru memegang kendali pedagogis penuh. Hasil generator selalu berstatus draf kerja yang dapat Anda sesuaikan di editor kami, lalu diunduh dalam format Microsoft Word (.DOCX) atau PDF agar leluasa dicetak.',
  },
  {
    q: 'Bagaimana cara pembayaran dan aktivasinya?',
    a: 'Pembayaran dilakukan secara aman melalui gerbang pembayaran resmi Midtrans. Anda dapat memilih QRIS (GoPay, OVO, ShopeePay, DANA, BCA Mobile), Transfer Virtual Account, atau Kartu Kredit. Akun Anda langsung aktif secara otomatis dalam hitungan detik setelah bayar.',
  },
  {
    q: 'Apakah ada jaminan pengembalian dana (refund)?',
    a: 'Ada. Kami menyediakan garansi pengembalian dana 100% dalam waktu 3x24 jam sejak transaksi jika terjadi kendala teknis sistemik di platform kami yang mengakibatkan layanan tidak dapat digunakan sama sekali.',
  },
  {
    q: 'Apakah cocok untuk semua mata pelajaran SD?',
    a: 'Ya, RuangRPP mendukung seluruh mata pelajaran jenjang SD mulai dari Matematika, Bahasa Indonesia, IPAS, Pendidikan Pancasila, PJOK, hingga Seni Budaya dan muatan lokal.',
  },
];

export function LandingView({ onOpenLogin }: { onOpenLogin: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeDocTab, setActiveDocTab] = useState<'tp' | 'kegiatan' | 'asesmen'>('tp');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | 'refund' | null>(null);

  // Checkout Simulator State
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'va' | 'card'>('qris');
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', school: '' });

  const currentMod = SAMPLE_MODULES[activeModuleIndex];

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

  const handleCopySample = () => {
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="landing-scope">
      {/* ── TOP NAV BAR ── */}
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-ruangRPP-transparent.png" alt="RuangRPP" height={34} className="brand-logo-img" />
            <span className="brand-caption-tag">Perangkat Ajar SD</span>
          </div>

          <nav className="header-nav">
            <a href="#studio">Studio Modul</a>
            <a href="#keunggulan">Prinsip &amp; Mutu</a>
            <a href="#alur">Alur Kerja</a>
            <a href="#harga">Paket &amp; Harga</a>
            <a href="#faq">Tanya Jawab</a>
          </nav>

          <div className="header-cta">
            <button
              type="button"
              className="btn-link"
              onClick={onOpenLogin}
              title="Akses masuk untuk tim pengelola dan peninjau"
            >
              Masuk Tim Pengelola
            </button>
            <a href="#harga" className="btn-primary-teal">
              Pilih Paket &rarr;
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="hero-section-clean">
        <div className="hero-container">
          <div className="hero-badge-pill">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0fa895" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Standar Kurikulum Nasional SD · Capaian Pembelajaran BSKAP 046/2025</span>
          </div>

          <h1 className="hero-headline">
            Rancang Modul Ajar Terstruktur. <br />
            <span className="hero-highlight-teal">Akurat, Runtut, dan Tanpa Asal Generate.</span>
          </h1>

          <p className="hero-subline">
            Platform pendamping guru Sekolah Dasar (SD) kelas 1–6 untuk menyusun draf Modul Ajar dan RPP berkualitas. 
            Setiap tujuan dan alokasi pembelajaran ditautkan langsung ke rujukan resmi regulasi pendidikan nasional.
          </p>

          <div className="hero-buttons">
            <a href="#harga" className="btn-hero-primary">
              Mulai Susun Modul Ajar &rarr;
            </a>
            <a href="#studio" className="btn-hero-secondary">
              Buka Pratinjau Dokumen
            </a>
          </div>

          <div className="hero-metrics-strip">
            <div className="metric-item">
              <strong>100% Terverifikasi</strong>
              <span>Sitasi Dokumen BSKAP</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <strong>Fase A, B, &amp; C</strong>
              <span>Kelas 1 hingga Kelas 6 SD</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <strong>Format Terbuka</strong>
              <span>Ekspor DOCX &amp; PDF Siap Cetak</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <strong>Pembayaran Resmi</strong>
              <span>Midtrans Payment Gateway</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE INTERACTIVE DOCUMENT STUDIO ── */}
      <section id="studio" className="studio-section">
        <div className="container">
          <div className="section-header-center">
            <span className="tag-kicker">Pratinjau Nyata</span>
            <h2>Lihat Kualitas Draf Modul Ajar RuangRPP</h2>
            <p>
              Pilih contoh mata pelajaran di bawah untuk memeriksa bagaimana sistem kami menyusun 
              dokumen pembelajaran terstruktur, lengkap dengan rujukan Capaian Pembelajaran dan rubrik asesmen.
            </p>
          </div>

          {/* Subject Switcher Pills */}
          <div className="subject-pills-bar">
            {SAMPLE_MODULES.map((mod, idx) => (
              <button
                key={mod.id}
                type="button"
                className={`subject-pill ${activeModuleIndex === idx ? 'active' : ''}`}
                onClick={() => {
                  setActiveModuleIndex(idx);
                  setActiveDocTab('tp');
                }}
              >
                <span className="pill-index">Contoh {idx + 1}</span>
                <strong>{mod.subject}</strong>
                <small>{mod.phase}</small>
              </button>
            ))}
          </div>

          {/* Paper Canvas Mockup */}
          <div className="paper-canvas-wrap">
            <div className="paper-canvas">
              {/* Paper Header */}
              <div className="paper-header">
                <div className="paper-crest">
                  <div className="crest-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0fa895" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="paper-instansi">PERANGKAT AJAR KURIKULUM NASIONAL · SD KELAS 1–6</span>
                    <h3 className="paper-title">{currentMod.title}</h3>
                    <div className="paper-meta-row">
                      <span className="meta-badge-dark">{currentMod.subject}</span>
                      <span className="meta-badge-dark">{currentMod.phase}</span>
                      <span className="meta-badge-dark">{currentMod.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="paper-status-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0fa895" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Rujukan Sah CP</span>
                </div>
              </div>

              {/* Verified Citation Box */}
              <div className="citation-callout">
                <div className="callout-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0fa895" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div className="callout-content">
                  <strong>Landasan Capaian Pembelajaran (CP) Resmi:</strong>
                  <p>{currentMod.cpRef}</p>
                </div>
              </div>

              {/* Paper Content Navigation Tabs */}
              <div className="paper-tabs">
                <button
                  type="button"
                  className={`paper-tab-btn ${activeDocTab === 'tp' ? 'active' : ''}`}
                  onClick={() => setActiveDocTab('tp')}
                >
                  Bagian 1: Tujuan &amp; Pemahaman
                </button>
                <button
                  type="button"
                  className={`paper-tab-btn ${activeDocTab === 'kegiatan' ? 'active' : ''}`}
                  onClick={() => setActiveDocTab('kegiatan')}
                >
                  Bagian 2: Langkah Pembelajaran
                </button>
                <button
                  type="button"
                  className={`paper-tab-btn ${activeDocTab === 'asesmen' ? 'active' : ''}`}
                  onClick={() => setActiveDocTab('asesmen')}
                >
                  Bagian 3: Rubrik Asesmen
                </button>
              </div>

              {/* Tab Contents */}
              <div className="paper-body">
                {activeDocTab === 'tp' && (
                  <div className="doc-section">
                    <div className="doc-item">
                      <h4 className="doc-item-title">A.1 Tujuan Pembelajaran (Diturunkan dari CP)</h4>
                      <div className="doc-item-box quote-style">
                        <p>{currentMod.tp}</p>
                      </div>
                    </div>

                    <div className="doc-item">
                      <h4 className="doc-item-title">A.2 Pemahaman Bermakna Bagi Murid</h4>
                      <div className="doc-item-box">
                        <p>{currentMod.meaningful}</p>
                      </div>
                    </div>

                    <div className="doc-item">
                      <h4 className="doc-item-title">A.3 Pertanyaan Pemantik Diskusi</h4>
                      <div className="doc-item-box highlight-box">
                        <p><strong>Pertanyaan Guru:</strong> &quot;{currentMod.triggerQ}&quot;</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDocTab === 'kegiatan' && (
                  <div className="doc-section">
                    <h4 className="doc-item-title">B. Rangkaian Kegiatan Pembelajaran (Berdiferensiasi)</h4>
                    <p className="doc-sub">Waktu terdistribusi terencana sesuai alokasi Jam Pelajaran (JP) riil di sekolah.</p>
                    
                    <div className="activity-timeline">
                      {currentMod.activities.map((act, i) => (
                        <div key={i} className="activity-card">
                          <div className="activity-time-badge">
                            <span>{act.time}</span>
                            <small>{act.type}</small>
                          </div>
                          <div className="activity-desc">
                            <p>{act.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDocTab === 'asesmen' && (
                  <div className="doc-section">
                    <h4 className="doc-item-title">C. Instrumen &amp; Rubrik Asesmen Ketercapaian</h4>
                    <div className="doc-item-box">
                      <p><strong>Bentuk Asesmen:</strong> {currentMod.assessment}</p>
                      <div className="rubric-mini-table">
                        <div className="rubric-col">
                          <strong>Perlu Bimbingan</strong>
                          <span>Belum mampu mengidentifikasi komponen dasar secara mandiri.</span>
                        </div>
                        <div className="rubric-col">
                          <strong>Cukup</strong>
                          <span>Menyebutkan komponen dengan bantuan pertanyaan pancingan guru.</span>
                        </div>
                        <div className="rubric-col highlight">
                          <strong>Sangat Baik</strong>
                          <span>Mampu menjelaskan hubungan sebab-akibat secara runtut dan percaya diri.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Paper Canvas Footer Toolbar */}
              <div className="paper-toolbar">
                <span className="toolbar-info">
                  Status Dokumen: <strong>Draf Siap Telaah &amp; Ekspor</strong> · Format Kompatibel Microsoft Word &amp; Google Docs
                </span>
                <div className="toolbar-btns">
                  <button type="button" className="btn-toolbar" onClick={handleCopySample}>
                    {copiedNotification ? '✓ Teks Tersalin' : 'Salin Cuplikan'}
                  </button>
                  <a href="#harga" className="btn-toolbar-primary">
                    Unduh Format Lengkap (.DOCX) &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 NILAI UTAMA ── */}
      <section id="keunggulan" className="principles-section">
        <div className="container">
          <div className="section-header-center">
            <span className="tag-kicker">Standar Kualitas</span>
            <h2>Prinsip Pembelajaran RuangRPP</h2>
            <p>
              Kami mengutamakan kesesuaian akademik dengan naskah kurikulum sah, bukan sekadar memproduksi 
              teks cepat tanpa pertanggungjawaban pedagogis.
            </p>
          </div>

          <div className="cards-grid-3">
            <div className="glass-card">
              <div className="card-top-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0fa895" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <h3>Rujukan Sah, Bukan Rekaan</h3>
              <p>
                Setiap penurunan tujuan pembelajaran terhubung dengan naskah Capaian Pembelajaran (CP) sah. 
                Sistem tidak mengarang mata pelajaran atau capaian fiktif yang tidak ada di standar kurikulum.
              </p>
              <div className="card-pill-tag">
                <span>SK BSKAP 046/2025</span>
              </div>
            </div>

            <div className="glass-card popular">
              <div className="card-top-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0fa895" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3>Proporsi Jam Pelajaran Riil SD</h3>
              <p>
                Membedakan durasi riil menit dengan Jam Pelajaran (JP) kelas SD. Alokasi kegiatan pembuka, 
                inti, dan penutup dihitung proporsional agar realistis diterapkan guru di kelas.
              </p>
              <div className="card-pill-tag">
                <span>Alokasi 35 Menit / JP</span>
              </div>
            </div>

            <div className="glass-card">
              <div className="card-top-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0fa895" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <h3>Pemberdaya Guru, Bukan Pengganti</h3>
              <p>
                Hasil berstatus draf kerja terstruktur. Guru tetap memegang kendali penuh untuk 
                menyesuaikan ketersediaan sarana kelas, keberagaman murid, dan kearifan budaya sekolah.
              </p>
              <div className="card-pill-tag">
                <span>Format Terbuka Siap Edit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALUR 4 LANGKAH PRAKTIS ── */}
      <section id="alur" className="steps-section">
        <div className="container">
          <div className="section-header-center">
            <span className="tag-kicker">Alur Kerja Cepat</span>
            <h2>Hemat Waktu Administrasi dalam 4 Langkah</h2>
            <p>
              Fokuskan perhatian Anda untuk membimbing dan berinteraksi dengan murid, sementara 
              kerangka dokumen pembelajaran terstandar siap digunakan.
            </p>
          </div>

          <div className="workflow-steps-row">
            <div className="workflow-card">
              <div className="workflow-number">1</div>
              <h4>Pilih Fase &amp; Mata Pelajaran</h4>
              <p>Tentukan kelas (1–6 SD), topik materi mingguan, dan alokasi pertemuan tatap muka.</p>
            </div>

            <div className="workflow-connector">&rarr;</div>

            <div className="workflow-card">
              <div className="workflow-number">2</div>
              <h4>Integrasi Rujukan CP Otomatis</h4>
              <p>Sistem mengambil kutipan elemen dan panduan pembelajaran resmi yang relevan.</p>
            </div>

            <div className="workflow-connector">&rarr;</div>

            <div className="workflow-card">
              <div className="workflow-number">3</div>
              <h4>Kompilasi Draf &amp; Asesmen</h4>
              <p>Modul ajar lengkap terkompilasi: tujuan, kegiatan diferensiasi, hingga rubrik evaluasi.</p>
            </div>

            <div className="workflow-connector">&rarr;</div>

            <div className="workflow-card">
              <div className="workflow-number">4</div>
              <h4>Tinjau &amp; Ekspor DOCX</h4>
              <p>Buka di editor, tambahkan catatan khusus guru Anda, lalu unduh format dokumen cetak.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TABEL PAKET & HARGA ── */}
      <section id="harga" className="pricing-section-v2">
        <div className="container">
          <div className="section-header-center">
            <span className="tag-kicker">Biaya Transparan</span>
            <h2>Pilihan Paket Layanan RuangRPP</h2>
            <p>
              Pilih paket yang paling sesuai dengan kebutuhan Anda atau sekolah Anda. Transaksi 
              diproses aman dan instan melalui gerbang pembayaran <strong>Midtrans</strong>.
            </p>
          </div>

          <div className="plans-grid-4">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`plan-card-v2 ${plan.recommended ? 'is-recommended' : ''}`}>
                {plan.badge && <div className="plan-badge-pill">{plan.badge}</div>}

                <div className="plan-header-area">
                  <h3 className="plan-title">{plan.name}</h3>
                  <div className="plan-price-wrap">
                    <span className="plan-price-num">{plan.price}</span>
                    <span className="plan-price-sub">/ {plan.period}</span>
                  </div>
                  <p className="plan-desc-text">{plan.desc}</p>
                </div>

                <div className="plan-feature-divider" />

                <ul className="plan-features-list">
                  {plan.features.map((feat, i) => (
                    <li key={i}>
                      <span className="check-bullet">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="plan-cta-area">
                  <button
                    type="button"
                    className={`btn-plan-action ${plan.recommended ? 'primary' : 'outline'}`}
                    onClick={() => handleOpenCheckout(plan)}
                  >
                    {plan.id === 'trial' ? 'Coba Sekarang (Gratis)' : `Pilih Paket (${plan.price})`}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Badges & Midtrans Guarantee */}
          <div className="gateway-assurance-box">
            <div className="assurance-badges">
              <span className="assurance-title">Metode Pembayaran Resmi:</span>
              <div className="payment-logo-badges">
                <span className="pay-chip">QRIS (GoPay, OVO, ShopeePay, DANA)</span>
                <span className="pay-chip">BCA Virtual Account</span>
                <span className="pay-chip">Mandiri Livin'</span>
                <span className="pay-chip">BNI &amp; BRI Virtual Account</span>
                <span className="pay-chip">Visa / MasterCard 3DS</span>
              </div>
            </div>
            <p className="assurance-sub">
              Sistem transaksi online terenkripsi dan diawasi oleh Bank Indonesia melalui <strong>Midtrans</strong>. 
              Layanan aktif otomatis tanpa perlu konfirmasi transfer manual.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION ── */}
      <section id="faq" className="faq-section">
        <div className="container-narrow">
          <div className="section-header-center">
            <span className="tag-kicker">Tanya Jawab</span>
            <h2>Pertanyaan yang Sering Diajukan Guru</h2>
          </div>

          <div className="faq-accordion">
            {FAQS.map((faq, idx) => (
              <div key={idx} className={`faq-card ${openFaq === idx ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <span className="faq-toggle-icon">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="faq-answer-body">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT & SUPPORT STRIP ── */}
      <section className="contact-banner">
        <div className="container">
          <div className="contact-inner-card">
            <div className="contact-text">
              <h3>Pusat Bantuan &amp; Layanan Pengguna</h3>
              <p>Tim dukungan RuangRPP siap melayani Anda di hari kerja (Senin–Jumat, 08.00–17.00 WIB).</p>
              <div className="contact-badges-row">
                <span className="c-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  support@ruangrpp.id
                </span>
                <span className="c-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  WhatsApp: +62 821-2345-6789
                </span>
                <span className="c-chip">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Indonesia (Web SaaS Nasional)
                </span>
              </div>
            </div>
            <div className="contact-btn-box">
              <a href="#harga" className="btn-primary-teal">
                Pilih Paket Sekarang &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SITE FOOTER ── */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-top-grid">
            <div className="footer-brand-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-ruangRPP-transparent.png" alt="RuangRPP" height={32} className="footer-logo-img" />
              <p className="footer-desc">
                Rancang Pembelajaran, Lebih Mudah. Platform pendamping guru SD dalam menyusun 
                draf modul ajar berlandaskan Capaian Pembelajaran resmi kurikulum nasional.
              </p>
            </div>

            <div className="footer-links-col">
              <strong>Navigasi</strong>
              <ul>
                <li><a href="#studio">Studio Modul</a></li>
                <li><a href="#keunggulan">Prinsip &amp; Mutu</a></li>
                <li><a href="#harga">Paket &amp; Biaya</a></li>
                <li><button type="button" className="btn-footer-link" onClick={onOpenLogin}>Konsol Tim Pengelola</button></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <strong>Legalitas &amp; Hak Konsumen</strong>
              <ul>
                <li><button type="button" className="btn-footer-link" onClick={() => setLegalModal('refund')}>Kebijakan Pengembalian Dana (Refund)</button></li>
                <li><button type="button" className="btn-footer-link" onClick={() => setLegalModal('terms')}>Syarat &amp; Ketentuan Layanan</button></li>
                <li><button type="button" className="btn-footer-link" onClick={() => setLegalModal('privacy')}>Kebijakan Privasi Data</button></li>
              </ul>
            </div>

            <div className="footer-compliance-col">
              <strong>Kepatuhan Transaksi</strong>
              <p>
                Transaksi diproses resmi melalui <strong>Midtrans Payment Gateway</strong>. Layanan berupa produk 
                digital perangkat lunak yang diserahkan secara daring seketika setelah pembayaran terverifikasi.
              </p>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span>&copy; {new Date().getFullYear()} RuangRPP. Hak Cipta Dilindungi Undang-Undang.</span>
            <span>Versi Staging &amp; Evaluasi Uji Coba</span>
          </div>
        </div>
      </footer>

      {/* ── MODAL CHECKOUT & MIDTRANS SIMULATOR ── */}
      {selectedPlan && (
        <dialog className="checkout-dialog" open>
          <div className="checkout-modal">
            <div className="modal-head">
              <div>
                <h2>Simulasi Checkout &amp; Pembayaran</h2>
                <p>Verifikasi Alur Transaksi Midtrans Payment Gateway</p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Tutup"
                onClick={() => setSelectedPlan(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {checkoutStep === 'form' && (
                <form onSubmit={handleProcessPayment} className="checkout-form">
                  <div className="order-summary-box">
                    <div className="summary-row">
                      <span className="summary-label">Paket Dipilih:</span>
                      <strong>{selectedPlan.name}</strong>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Masa Berlaku:</span>
                      <span>{selectedPlan.period}</span>
                    </div>
                    <div className="summary-row total-row">
                      <span className="summary-label">Total Tagihan (IDR):</span>
                      <strong className="summary-price">{selectedPlan.price}</strong>
                    </div>
                  </div>

                  <div className="checkout-fields">
                    <h4>1. Data Pendidik / Pemesan</h4>
                    <div className="form-grid-2">
                      <label>
                        Nama Lengkap
                        <input
                          required
                          type="text"
                          placeholder="cth: Ibu Siti Aminah, S.Pd."
                          value={customer.name}
                          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        />
                      </label>
                      <label>
                        Email Pengiriman Akun
                        <input
                          required
                          type="email"
                          placeholder="cth: sitiaminah@guru.sd.belajar.id"
                          value={customer.email}
                          onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        />
                      </label>
                    </div>

                    <div className="form-grid-2">
                      <label>
                        Nomor WhatsApp
                        <input
                          required
                          type="tel"
                          placeholder="cth: 081234567890"
                          value={customer.phone}
                          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        />
                      </label>
                      <label>
                        Nama Sekolah / Satuan Pendidikan (Opsional)
                        <input
                          type="text"
                          placeholder="cth: SDN 01 Rawamangun"
                          value={customer.school}
                          onChange={(e) => setCustomer({ ...customer, school: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="payment-method-selector">
                    <h4>2. Pilih Metode Pembayaran (Midtrans Gateway)</h4>
                    <div className="method-options">
                      <label className={`method-item ${paymentMethod === 'qris' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'qris'}
                          onChange={() => setPaymentMethod('qris')}
                        />
                        <div>
                          <strong>QRIS (Instan Semua E-Wallet &amp; M-Banking)</strong>
                          <small>GoPay, OVO, DANA, ShopeePay, BCA Mobile, Livin Mandiri</small>
                        </div>
                      </label>

                      <label className={`method-item ${paymentMethod === 'va' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'va'}
                          onChange={() => setPaymentMethod('va')}
                        />
                        <div>
                          <strong>Virtual Account Bank (Verifikasi Otomatis)</strong>
                          <small>BCA, Mandiri, BNI, BRI, Permata Bank</small>
                        </div>
                      </label>

                      <label className={`method-item ${paymentMethod === 'card' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                        />
                        <div>
                          <strong>Kartu Kredit / Debit Online</strong>
                          <small>Visa, MasterCard, JCB terverifikasi 3D-Secure</small>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setSelectedPlan(null)}
                    >
                      Batal
                    </button>
                    <button type="submit" className="primary">
                      Lanjutkan ke Pembayaran ({selectedPlan.price}) &rarr;
                    </button>
                  </div>
                </form>
              )}

              {checkoutStep === 'processing' && (
                <div className="checkout-state-loading">
                  <div className="loading-spinner" />
                  <h3>Menghubungkan ke Midtrans Snap API...</h3>
                  <p>Membuat nomor tagihan aman dan token transaksi sandbox.</p>
                </div>
              )}

              {checkoutStep === 'success' && (
                <div className="checkout-state-success">
                  <div className="success-icon-badge">✓</div>
                  <h3>Simulasi Alur Pembayaran Berhasil!</h3>
                  <p>
                    Dalam lingkungan produksi (production), jendela popup <strong>Midtrans Snap</strong> akan 
                    otomatis menampilkan kode QRIS atau nomor Virtual Account sesuai pilihan Anda.
                  </p>
                  
                  <div className="demo-transaction-receipt">
                    <div className="receipt-row"><span>Kode Referensi:</span> <code>RPP-TRX-{Math.floor(100000 + Math.random() * 900000)}</code></div>
                    <div className="receipt-row"><span>Paket Layanan:</span> <strong>{selectedPlan.name}</strong></div>
                    <div className="receipt-row"><span>Jumlah Dibayar:</span> <strong>{selectedPlan.price}</strong></div>
                    <div className="receipt-row"><span>Metode:</span> <span className="uppercase">{paymentMethod}</span></div>
                    <div className="receipt-row"><span>Status Pembayaran:</span> <span className="badge-green">Settlement / Berhasil</span></div>
                  </div>

                  <div className="success-note">
                    <strong>Integrasi Webhook RuangRPP:</strong>
                    <p>Setelah status pembayaran berubah menjadi <em>settlement</em>, sistem API backend secara instan mengaktifkan kuota pembuatan modul ajar ke akun pemesan tanpa perlu konfirmasi manual.</p>
                  </div>

                  <button
                    type="button"
                    className="primary full-width"
                    onClick={() => {
                      setSelectedPlan(null);
                      setCheckoutStep('form');
                    }}
                  >
                    Selesai &amp; Tutup Simulasi
                  </button>
                </div>
              )}
            </div>
          </div>
        </dialog>
      )}

      {/* ── MODAL LEGALITAS / KEBIJAKAN ── */}
      {legalModal && (
        <dialog className="checkout-dialog" open>
          <div className="checkout-modal">
            <div className="modal-head">
              <div>
                <h2>
                  {legalModal === 'refund' && 'Kebijakan Pengembalian Dana (Refund Policy)'}
                  {legalModal === 'terms' && 'Syarat & Ketentuan Layanan (Terms of Service)'}
                  {legalModal === 'privacy' && 'Kebijakan Privasi Pengguna (Privacy Policy)'}
                </h2>
                <p>Kepatuhan Transaksi Digital RuangRPP</p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Tutup"
                onClick={() => setLegalModal(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body legal-content-text">
              {legalModal === 'refund' && (
                <div>
                  <p><strong>1. Ketentuan Umum Pengembalian Dana</strong></p>
                  <p>Layanan RuangRPP merupakan produk digital berupa akses perangkat lunak dan token komputasi draf modul ajar yang diserahkan secara daring seketika setelah pembayaran terkonfirmasi.</p>
                  
                  <p><strong>2. Syarat Pengajuan Refund</strong></p>
                  <ul>
                    <li>Pengguna mengalami kendala teknis sistemik permanen di platform RuangRPP dalam kurun waktu 3x24 jam sejak transaksi dan kuota tidak dapat digunakan sama sekali.</li>
                    <li>Terjadi transaksi ganda (double charge) yang disebabkan oleh gangguan jaringan gerbang pembayaran.</li>
                  </ul>

                  <p><strong>3. Prosedur Klaim</strong></p>
                  <p>Kirimkan email ke <strong>support@ruangrpp.id</strong> dengan subjek <em>Pengajuan Refund - [Order ID Midtrans]</em>. Tim kami akan memverifikasi dan memproses pengembalian dana melalui mekanisme transfer balik dalam 3–7 hari kerja.</p>
                </div>
              )}

              {legalModal === 'terms' && (
                <div>
                  <p><strong>1. Lingkup Penggunaan</strong></p>
                  <p>RuangRPP menyediakan fasilitas perancangan draf RPP dan Modul Ajar untuk jenjang SD. Draf yang dihasilkan dirancang sebagai bahan kerja pendidik dan wajib ditelaah serta disetujui oleh guru sebelum diterapkan di kelas.</p>

                  <p><strong>2. Hak Kekayaan Intelektual</strong></p>
                  <p>Dokumen rujukan kurikulum dan Capaian Pembelajaran merupakan dokumen publik Kemendikdasmen RI. Hak cipta atas variasi pengembangan modul dan catatan pembelajaran yang diedit oleh guru tetap menjadi hak milik guru atau institusi sekolah masing-masing.</p>

                  <p><strong>3. Akun dan Keamanan</strong></p>
                  <p>Pengguna bertanggung jawab menjaga kerahasiaan kata sandi dan akses akun masing-masing serta dilarang menyalahgunakan sistem untuk aktivitas ilegal.</p>
                </div>
              )}

              {legalModal === 'privacy' && (
                <div>
                  <p><strong>1. Pengumpulan Informasi</strong></p>
                  <p>Kami hanya mengumpulkan data yang dibutuhkan untuk memproses transaksi dan menyediakan layanan (nama pemesan, alamat email, nomor kontak, dan identitas sekolah jika diisi).</p>

                  <p><strong>2. Keamanan Pembayaran</strong></p>
                  <p>Seluruh proses pembayaran diproses secara terenkripsi melalui Midtrans Payment Gateway. RuangRPP tidak pernah menyimpan nomor kartu kredit atau kode keamanan (CVV) pengguna di server kami.</p>

                  <p><strong>3. Perlindungan Privasi Pendidik</strong></p>
                  <p>Kami tidak menjual, menyewakan, atau memberikan data pribadi pengguna kepada pihak ketiga untuk kepentingan pemasaran.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary"
                onClick={() => setLegalModal(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
