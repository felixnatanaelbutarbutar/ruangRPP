'use client';
import { useState, useId, useEffect } from 'react';

type Plan = {
  id: string;
  name: string;
  badge?: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  recommended?: boolean;
};

const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Paket Uji Coba',
    price: 'Rp 0',
    period: 'gratis 3 hari',
    desc: 'Untuk mengenal dan menguji kualitas draf modul ajar RuangRPP.',
    features: [
      '3 Draf Modul Ajar SD',
      'Akses Fase A, B, dan C',
      'Rujukan Capaian Pembelajaran resmi',
      'Pratinjau struktur modul ajar',
    ],
  },
  {
    id: 'mandiri',
    name: 'Paket Guru Mandiri',
    badge: 'Paling Hemat',
    price: 'Rp 29.000',
    period: 'sekali bayar / kuota',
    desc: 'Solusi praktis untuk kebutuhan persiapan mengajar modul tertentu.',
    features: [
      '15 Draf Modul Ajar Lengkap',
      'Semua Mata Pelajaran SD',
      'Ekspor format DOCX (Word) & PDF',
      'Panduan diferensiasi & asesmen',
      'Riwayat tersimpan permanen',
      'Aktivasi instan via Midtrans',
    ],
  },
  {
    id: 'semester',
    name: 'Paket Guru Semester',
    badge: 'Rekomendasi',
    price: 'Rp 79.000',
    period: 'per semester (6 bulan)',
    desc: 'Pendamping lengkap persiapan ajar 1 semester penuh untuk 1 guru.',
    features: [
      'Draf Modul Ajar Tanpa Batas',
      'Seluruh Fase A–C (Kelas 1–6)',
      'Ekspor DOCX & PDF siap cetak',
      'Generator asesmen & lembar refleksi',
      'Pembaruan berkala sesuai regulasi',
      'Bantuan prioritas via WhatsApp',
    ],
    recommended: true,
  },
  {
    id: 'sekolah',
    name: 'Paket Sekolah & KKG',
    badge: 'Satuan Pendidikan',
    price: 'Rp 249.000',
    period: 'per tahun ajaran',
    desc: 'Lisensi multi-guru untuk sekolah, gugus, atau kelompok kerja guru.',
    features: [
      'Hingga 10 Akun Guru',
      'Akses tak terbatas selama 1 tahun',
      'Standarisasi perangkat ajar sekolah',
      'Format kop surat & identitas sekolah',
      'Faktur & bukti potong instansi',
      'Sesi orientasi penggunaan via Zoom',
    ],
  },
];

export function LandingView({ onOpenLogin }: { onOpenLogin: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState<'fitur' | 'alur' | 'harga' | 'legal'>('fitur');
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | 'refund' | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'va' | 'card'>('qris');
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', school: '' });

  // Handle checkout simulation
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
    <div className="landing-wrap">
      {/* ── TOP HEADER / NAV ── */}
      <header className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-title">Ruang<span className="brand-accent">RPP</span></span>
            <span className="brand-tag">Platform Perangkat Ajar SD</span>
          </div>

          <nav className="nav-menu">
            <a href="#keunggulan">Prinsip Kerja</a>
            <a href="#alur-kerja">Alur Guru</a>
            <a href="#harga">Paket &amp; Harga</a>
            <a href="#kebijakan">Syarat &amp; Refund</a>
            <a href="#kontak">Bantuan</a>
          </nav>

          <div className="nav-actions">
            <button
              type="button"
              className="secondary small"
              onClick={onOpenLogin}
              title="Akses masuk untuk tim pengelola dan peninjau"
            >
              Masuk Tim Pengelola
            </button>
            <a href="#harga" className="primary small">
              Pilih Paket
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pill">
            <span className="pill-dot" />
            <span>Berbasis Capaian Pembelajaran Resmi Kemendikdasmen (Fase A, B, &amp; C)</span>
          </div>

          <h1 className="hero-title">
            Rancang Pembelajaran Lebih Terstruktur. <br />
            <span className="hero-highlight">Bermutu, Akurat, dan Tanpa Halusinasi.</span>
          </h1>

          <p className="hero-desc">
            RuangRPP adalah pendamping kerja digital bagi guru Sekolah Dasar (SD) dalam menyusun draf 
            Modul Ajar dan RPP bermakna. Didasarkan pada rujukan resmi dokumen kurikulum nasional—bukan teks 
            karangan acak tanpa landasan acuan.
          </p>

          <div className="hero-cta">
            <a href="#harga" className="primary hero-btn">
              Lihat Pilihan Paket &amp; Simulasi Bayar &rarr;
            </a>
            <a href="#alur-kerja" className="secondary hero-btn">
              Pelajari Alur 4 Langkah
            </a>
          </div>

          <div className="hero-badges">
            <div className="hero-badge-item">
              <strong>Acuan Terverifikasi</strong>
              <span>CP 046/H/KR/2025 &amp; Panduan BSKAP</span>
            </div>
            <div className="hero-badge-item">
              <strong>Kendali Guru</strong>
              <span>Draf kerja siap tinjau, edit, &amp; modifikasi</span>
            </div>
            <div className="hero-badge-item">
              <strong>Format Standar</strong>
              <span>Ekspor DOCX &amp; PDF siap cetak instansi</span>
            </div>
            <div className="hero-badge-item">
              <strong>Aktivasi Instan</strong>
              <span>Integrasi pembayaran digital Midtrans</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRINSIP KERJA & KEUNGGULAN (ANTI-SLOP) ── */}
      <section id="keunggulan" className="section-block">
        <div className="section-head text-center">
          <span className="section-kicker">Etika &amp; Mutu Pembelajaran</span>
          <h2>Mengapa RuangRPP Berbeda dari Generator Biasa?</h2>
          <p>
            Banyak generator AI membuat materi yang terdengar meyakinkan namun salah fase, keliru menurunkan tujuan, 
            atau mengabaikan regulasi. RuangRPP dibangun dengan prinsip kehati-hatian akademik.
          </p>
        </div>

        <div className="grid-3">
          <div className="feature-card">
            <div className="feature-num">01</div>
            <h3>Rujukan Sah, Bukan Halusinasi</h3>
            <p>
              Setiap tujuan pembelajaran, indikator, dan alur materi selalu dikaitkan langsung dengan Capaian Pembelajaran (CP) 
              resmi per mata pelajaran dan per fase. Anda mengetahui dari mana asal rujukan setiap kalimat.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-num">02</div>
            <h3>Pembedaan Durasi Nyata &amp; Jam Pelajaran (JP)</h3>
            <p>
              Aplikasi membedakan menit riil pembelajaran dan jumlah jam pelajaran di sekolah. Kegiatan pembuka, 
              inti, dan penutup dialokasikan proporsional sesuai kondisi anak usia SD.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-num">03</div>
            <h3>Draf Kerja Guru, Bukan Pengganti Guru</h3>
            <p>
              Hasil selalu berstatus draf kerja terstruktur. Guru tetap memegang hak prerogatif untuk menyesuaikan 
              sarana sekolah, keragaman kebutuhan murid di kelas, dan nilai lokal sebelum digunakan.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4 LANGKAH ALUR KERJA ── */}
      <section id="alur-kerja" className="section-block alt-bg">
        <div className="section-head text-center">
          <span className="section-kicker">Alur Praktis</span>
          <h2>4 Langkah Penyusunan Modul Ajar</h2>
          <p>Dirancang menghemat waktu administrasi guru hingga 70% agar lebih fokus pada interaksi murid.</p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <span className="step-badge">Langkah 1</span>
            <h4>Pilih Jenjang &amp; Konteks</h4>
            <p>Pilih kelas 1–6 (Fase A, B, atau C), mata pelajaran, topik materi, dan alokasi waktu pertemuan.</p>
          </div>

          <div className="step-arrow">&rarr;</div>

          <div className="step-card">
            <span className="step-badge">Langkah 2</span>
            <h4>Sinkronisasi Rujukan CP</h4>
            <p>Sistem mencocokkan dokumen Capaian Pembelajaran resmi dan panduan asesmen yang berlaku.</p>
          </div>

          <div className="step-arrow">&rarr;</div>

          <div className="step-card">
            <span className="step-badge">Langkah 3</span>
            <h4>Kompilasi Draf Ajar</h4>
            <p>Draf tersusun lengkap: tujuan belajar, pemahaman bermakna, kegiatan berbasis diferensiasi, dan rubrik asesmen.</p>
          </div>

          <div className="step-arrow">&rarr;</div>

          <div className="step-card">
            <span className="step-badge">Langkah 4</span>
            <h4>Tinjau &amp; Ekspor Dokumen</h4>
            <p>Periksa di editor internal, sesuaikan catatan guru, lalu unduh dokumen format DOCX siap pakai.</p>
          </div>
        </div>
      </section>

      {/* ── TABEL PAKET & HARGA (PENTING UNTUK MIDTRANS KYC) ── */}
      <section id="harga" className="section-block">
        <div className="section-head text-center">
          <span className="section-kicker">Biaya Transparan &amp; Terjangkau</span>
          <h2>Pilihan Paket Layanan RuangRPP</h2>
          <p>
            Pilih paket yang paling sesuai dengan kebutuhan Anda atau sekolah. Tanpa biaya tersembunyi.
            Didukung pembayaran online resmi dan aman melalui <strong>Midtrans Payment Gateway</strong>.
          </p>
        </div>

        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`pricing-card ${plan.recommended ? 'recommended' : ''}`}>
              {plan.badge && <span className="pricing-badge">{plan.badge}</span>}
              <div className="pricing-header">
                <h3>{plan.name}</h3>
                <div className="price-tag">
                  <span className="price-val">{plan.price}</span>
                  <span className="price-period">/ {plan.period}</span>
                </div>
                <p className="pricing-desc">{plan.desc}</p>
              </div>

              <ul className="pricing-features">
                {plan.features.map((feat, i) => (
                  <li key={i}>
                    <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="pricing-action">
                <button
                  type="button"
                  className={plan.recommended ? 'primary full-width' : 'secondary full-width'}
                  onClick={() => handleOpenCheckout(plan)}
                >
                  {plan.id === 'trial' ? 'Coba Sekarang (Gratis)' : `Pilih Paket (${plan.price})`}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="payment-support-notice">
          <span className="notice-label">Metode Pembayaran Resmi:</span>
          <span className="payment-tags">
            <span className="tag-item">QRIS (GoPay, OVO, ShopeePay, DANA)</span>
            <span className="tag-item">Virtual Account (BCA, Mandiri, BNI, BRI, Permata)</span>
            <span className="tag-item">Kartu Kredit / Debit (Visa, Mastercard, JCB)</span>
          </span>
          <p className="notice-sub">Diproses secara terenkripsi dan terverifikasi oleh Midtrans (Bank Indonesia Licensed).</p>
        </div>
      </section>

      {/* ── KEBIJAKAN, REFUND & LEGALITAS (PERSYARATAN MIDTRANS) ── */}
      <section id="kebijakan" className="section-block alt-bg">
        <div className="section-head text-center">
          <span className="section-kicker">Transparansi Konsumen</span>
          <h2>Kebijakan Layanan &amp; Jaminan Pengembalian Dana</h2>
          <p>Kami menjunjung tinggi keamanan data pengguna dan kepastian hak konsumen atas layanan digital.</p>
        </div>

        <div className="grid-3">
          <div className="policy-box">
            <h4>Kebijakan Pengembalian Dana (Refund)</h4>
            <p>
              Karena produk RuangRPP adalah produk digital yang aktif seketika, pengembalian dana 100% berlaku 
              jika terjadi kendala teknis sistemik di platform kami dalam 3x24 jam sejak pembayaran yang menyebabkan 
              layanan tidak dapat digunakan.
            </p>
            <button type="button" className="text-button" onClick={() => setLegalModal('refund')}>
              Baca Rincian Refund &rarr;
            </button>
          </div>

          <div className="policy-box">
            <h4>Syarat &amp; Ketentuan Layanan (ToS)</h4>
            <p>
              Akses akun bersifat personal bagi guru atau instansi sekolah yang terdaftar. Pengguna berhak mengunduh, 
              mengedit, dan mencetak dokumen modul ajar untuk kepentingan kegiatan belajar-mengajar resmi di kelas.
            </p>
            <button type="button" className="text-button" onClick={() => setLegalModal('terms')}>
              Baca Syarat &amp; Ketentuan &rarr;
            </button>
          </div>

          <div className="policy-box">
            <h4>Kebijakan Privasi Data</h4>
            <p>
              Data profil, identitas murid (jika dicantumkan konteks umum), dan draf pembelajaran dienkripsi 
              serta tidak diperjualbelikan kepada pihak ketiga manapun untuk keperluan periklanan.
            </p>
            <button type="button" className="text-button" onClick={() => setLegalModal('privacy')}>
              Baca Kebijakan Privasi &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ── KONTAK & LAYANAN BANTUAN ── */}
      <section id="kontak" className="section-block">
        <div className="contact-card">
          <div className="contact-main">
            <h3>Pusat Bantuan &amp; Kontak Operasional</h3>
            <p>
              Memerlukan bantuan aktivasi paket, konfirmasi pembayaran, atau memiliki pertanyaan seputar 
              penerapan Kurikulum Nasional di RuangRPP? Tim kami siap melayani Anda.
            </p>
            
            <div className="contact-details">
              <div>
                <strong>Email Dukungan Pelanggan:</strong>
                <span>support@ruangrpp.id (Balasan dalam 1x24 jam kerja)</span>
              </div>
              <div>
                <strong>Layanan Pesan Cepat (WhatsApp):</strong>
                <span>+62 821-2345-6789 (Senin – Jumat, 08.00 – 17.00 WIB)</span>
              </div>
              <div>
                <strong>Alamat Operasional:</strong>
                <span>Indonesia (Layanan Berbasis Web SaaS Nasional)</span>
              </div>
            </div>
          </div>

          <div className="contact-aside">
            <div className="aside-box">
              <strong>Butuh Akun Tim / Pengelola?</strong>
              <p>Penguji internal atau tim peninjau kurikulum dapat masuk ke konsol kerja melalui tautan berikut:</p>
              <button type="button" className="secondary full-width" onClick={onOpenLogin}>
                Masuk ke Konsol Tim &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-col">
            <span className="brand-title">Ruang<span className="brand-accent">RPP</span></span>
            <p className="footer-tagline">
              Rancang Pembelajaran, Lebih Mudah. Platform digital penyusunan modul ajar SD berbasis 
              Capaian Pembelajaran terstandar.
            </p>
          </div>

          <div className="footer-col">
            <strong>Navigasi Cepat</strong>
            <ul>
              <li><a href="#keunggulan">Prinsip Kerja</a></li>
              <li><a href="#alur-kerja">Alur Penggunaan</a></li>
              <li><a href="#harga">Paket Berlangganan</a></li>
              <li><button type="button" className="link-button" onClick={onOpenLogin}>Akses Pengelola</button></li>
            </ul>
          </div>

          <div className="footer-col">
            <strong>Informasi Legal</strong>
            <ul>
              <li><button type="button" className="link-button" onClick={() => setLegalModal('refund')}>Kebijakan Pengembalian Dana</button></li>
              <li><button type="button" className="link-button" onClick={() => setLegalModal('terms')}>Syarat &amp; Ketentuan</button></li>
              <li><button type="button" className="link-button" onClick={() => setLegalModal('privacy')}>Kebijakan Privasi</button></li>
            </ul>
          </div>

          <div className="footer-col">
            <strong>Kepatuhan Transaksi</strong>
            <p className="footer-compliance">
              Sistem transaksi online diproses aman dengan gerbang pembayaran resmi <strong>Midtrans</strong>. 
              Semua harga dalam mata uang Rupiah (IDR).
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <span>&copy; {new Date().getFullYear()} RuangRPP. Hak Cipta Dilindungi Undang-Undang.</span>
            <span>Versi Staging &amp; Evaluasi Uji Coba</span>
          </div>
        </div>
      </footer>

      {/* ── MODAL CHECKOUT & SIMULASI MIDTRANS ── */}
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
                          placeholder="cth: Ibu Nurhasanah, S.Pd."
                          value={customer.name}
                          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        />
                      </label>
                      <label>
                        Email Pengiriman Akun
                        <input
                          required
                          type="email"
                          placeholder="cth: nurhasanah@guru.sd.belajar.id"
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
                        Nama Sekolah / Gugus (Opsional)
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
                          <strong>QRIS (Instan)</strong>
                          <small>GoPay, OVO, DANA, ShopeePay, BCA Mobile</small>
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
                          <strong>Virtual Account Bank</strong>
                          <small>BCA, Mandiri, BNI, BRI, Permata</small>
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
                          <small>Visa, MasterCard, JCB terverifikasi 3DS</small>
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
                    Dalam lingkungan produksi (*production*), jendela popup <strong>Midtrans Snap</strong> akan 
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
                  <p>Layanan RuangRPP merupakan produk digital berupa akses perangkat lunak dan token komputasi draf modul ajar yang diserahkan secara instan setelah pembayaran terkonfirmasi.</p>
                  
                  <p><strong>2. Syarat Pengajuan Refund</strong></p>
                  <ul>
                    <li>Pengguna mengalami kegagalan teknis permanen di sistem RuangRPP dalam kurun waktu 3x24 jam sejak transaksi dan kuota tidak dapat digunakan sama sekali.</li>
                    <li>Terjadi transaksi ganda (*double charge*) yang disebabkan oleh gangguan jaringan gerbang pembayaran.</li>
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
