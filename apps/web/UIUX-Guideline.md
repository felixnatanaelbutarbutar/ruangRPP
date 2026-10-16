# ruangRPP — UI/UX Guideline v2 (Landing Page)

> **Versi 2.** Disusun ulang setelah hasil implementasi v1 ditinjau. Fokus perubahan: **hero, navbar, dan lembar RPP**. Bagian lain tetap, dengan beberapa angka disesuaikan.

---

## 0. Diagnosis Hasil v1 dan Perbaikannya

Hasil v1 sudah benar di warna, font, dan konsep lembar RPP. Yang salah ada di **tata letak dan kepadatan**.

| # | Masalah di v1 | Dampak | Perbaikan di v2 |
|---|---|---|---|
| 1 | Form dan lembar RPP **ditumpuk vertikal** di kolom kanan | Hero jadi 1500px+; lembar RPP (bintang halaman) jatuh di bawah layar | Form dibuang. Diganti **tab contoh** tipis di atas lembar. Hero muat dalam satu layar (§5.2) |
| 2 | Kolom kiri berhenti di ±1000px, kanan lanjut ±1500px | Ruang kosong besar di kiri bawah, komposisi timpang | Dua kolom **rata tengah secara vertikal**, tinggi kanan dibatasi dan dipotong dengan fade |
| 3 | Headline ±80px, pecah 4 baris, "Bapak/Ibu" terbelah | Terlalu dominan, ritme baca jelek | Headline 48px, maksimal 3 baris, `text-wrap: balance`, "Bapak/Ibu" tidak boleh terpisah |
| 4 | Informasi **diulang**: mapel/kelas/topik ada di form, lalu di lembar | Terasa penuh tanpa menambah arti | Satu sumber saja: identitas hanya tampil di lembar |
| 5 | Panel form mint (radius 24px) + lembar (radius 4px) berdampingan tanpa hubungan | Dua objek yang tidak "bicara" satu sama lain | Mint dipakai sebagai **"meja"** di belakang lembar, bukan sebagai kartu form |
| 6 | Navbar: 5 tautan + "Masuk Pengelola" + CTA, semua tebal | Ramai, CTA tidak menonjol, tautan admin muncul di halaman publik | Maksimal 4 tautan + 1 CTA, bobot ringan, "Masuk Pengelola" dipindah ke footer |
| 7 | Semua teks UI berbobot tebal (nav, label, chip) | Hierarki datar | Aturan bobot baru (§3) |
| 8 | Dalam lembar: label kapital semua, chip identitas membungkus 2 baris, dua baris meta di header | Mirip template, berisik | Identitas dibuat sebagai **tabel kecil** gaya Modul Ajar, tanpa kapital, satu baris status (§6) |
| 9 | Teks di field terpotong ("...Sosia") | Terlihat belum selesai | Tidak ada lagi field di hero. Di aplikasi: pakai label pendek ("IPAS") |
| 10 | Hero lebih tinggi dari viewport, bagian gelap berikutnya mengintip di tepi bawah | Transisi kasar | Hero punya tinggi terukur (§5.2) dan lembar dipotong dengan fade |

---

## 1. Arah Desain

**Satu kalimat:** *Tenang, rapi, dan terpercaya seperti meja kerja guru yang tertata, dengan satu momen "ajaib" saat RPP tertulis sendiri.*

| Aspek | Keputusan |
|---|---|
| Audiens | Guru SD–SMA, usia beragam, banyak yang membuka dari HP |
| Tugas utama halaman | Membuat guru **mencoba generator** dalam kurang dari 1 menit |
| Kepribadian | Hangat, praktis, tidak lebay. Bukan startup AI futuristik |
| Elemen yang diingat | **Lembar RPP** dengan sudut terlipat teal, ditulis langsung di hero |
| Yang sengaja dibuat sunyi | Semua hal lain: warna datar, dekorasi minim, animasi hampir nol |

**Prinsip:**

1. **Tunjukkan produknya, jangan jelaskan.** Hero adalah demo: lembar RPP yang tertulis.
2. **Satu momen berani.** Lembar RPP adalah bintangnya. Sisanya tenang.
3. **Satu objek, satu fungsi.** Hero hanya punya: teks + CTA di kiri, satu demo di kanan. Tidak ada objek ketiga.
4. **Sans untuk antarmuka, serif untuk dokumen.**
5. **Bintang kecil hanya untuk AI.** Percikan dari logo hanya menandai "AI sedang menulis". Bukan hiasan.
6. **Guru tetap pegang kendali.** Semua copy menekankan: draf, bisa diedit, bisa diunduh.
7. **Tidak mengulang informasi.** Kalau sudah tampil di lembar, jangan ditampilkan lagi di tempat lain pada layar yang sama.

---

## 2. Warna

Nilai hex adalah pendekatan dari logo PNG; cocokkan dengan file vektor asli.

| Nama | Hex | Fungsi |
|---|---|---|
| **Teal Ruang** | `#16A596` | Merek: ikon, garis aksen, lipatan lembar, fokus ring |
| **Teal Dalam** | `#0D7C6F` | Tombol utama, link, teks teal (kontras ±5:1 di atas putih) |
| **Navy RPP** | `#172B55` | Judul, teks utama, blok gelap |
| **Mint Tipis** | `#E8F5F2` | **"Meja"** di belakang lembar, latar bagian selang-seling |
| **Putih Kertas** | `#FFFFFF` | Latar utama dan lembar RPP |
| **Abu Tinta** | `#4A5568` | Teks sekunder |
| **Garis** | `#D9E4E2` | Border, pemisah |
| Error | `#B42318` | Status error |
| Peringatan | `#B54708` | Status peringatan |

### Aturan

- Komposisi kira-kira **70% putih/mint, 20% navy, 10% teal**.
- **Jangan** pakai `#16A596` untuk teks kecil di atas putih (±3:1). Pakai Teal Dalam.
- Tombol utama: latar Teal Dalam, teks putih. Sekunder: border navy, teks navy.
- Hanya **satu** bagian navy di seluruh halaman: CTA penutup + footer.
- Mint Tipis dipakai sebagai bidang datar. **Tidak** dijadikan kartu berradius besar.
- **Dilarang:** gradien dekoratif (ungu/biru/teal-navy), glassmorphism, glow, blob.
  (Satu-satunya "gradien" yang boleh: mask fade di tepi bawah lembar RPP, karena fungsional.)

---

## 3. Tipografi

| Peran | Font | Catatan |
|---|---|---|
| Judul, UI, body | **Nunito** | Ujung membulat seperti wordmark "ruang" |
| Isi lembar RPP saja | **Source Serif 4** | Memberi rasa dokumen resmi |

Fallback: `Nunito, "Nunito Sans", system-ui, sans-serif` dan `"Source Serif 4", Georgia, serif`.

### Skala (diperbarui)

| Token | Desktop | Mobile | Line-height | Bobot | Pemakaian |
|---|---|---|---|---|---|
| `display` | **48px** (sebelumnya 56, aktual v1 ±80) | 34px | 1.1 | 800 | Headline hero, satu kali |
| `h2` | 34px | 26px | 1.15 | 800 | Judul bagian |
| `h3` | 20px | 18px | 1.3 | 700 | Sub-judul |
| `body-lg` | **19px** | 17px | 1.6 | 400 | Sub-headline hero |
| `body` | 16–17px | 16px | 1.6 | 400 | Teks biasa |
| `ui` | 15px | 15px | 1.4 | 600 | Nav, label, chip, tab |
| `small` | 14px | 14px | 1.5 | 400 | Bantuan, catatan |
| `doc` | 15px | 14px | 1.65 | 400 (serif) | Isi lembar RPP |

### Aturan bobot (menyelesaikan masalah "semua tebal")

- **800** hanya untuk headline dan judul bagian.
- **700** untuk tombol dan sub-judul.
- **600** untuk label, tab, chip, tautan nav.
- **400** untuk semua teks bacaan.
- Tautan navbar: **600**, warna navy 85%, bukan 700 penuh.

### Aturan lain

- Letter-spacing judul `-0.01em`.
- Lebar baris maksimum 60–65 karakter.
- Rata **kiri**. Jangan tengah-tengahkan paragraf.
- Tidak ada huruf kapital semua untuk label (termasuk di dalam lembar RPP).
- Tidak ada satu kata judul yang diwarnai/dimiringkan sendirian.
- Tidak ada label kecil di atas setiap judul bagian.
- Headline: `text-wrap: balance`. "Bapak/Ibu" dibungkus `white-space: nowrap`.

---

## 4. Layout, Grid, Spasi

- **Container:** maks **1200px**, padding sisi 24px (mobile 20px). (v1 melebar sampai ±1600px sehingga isi terlalu renggang di layar besar.)
- **Grid:** 12 kolom desktop, gap 48px di hero dan 24px di bagian lain.
- **Skala spasi (kelipatan 8):** 4, 8, 16, 24, 32, 48, 64, 96.
- **Jarak antar bagian:** 96px desktop, 64px mobile.
- **Komposisi:** asimetris, rata kiri, dua kolom di hero.

### Radius

| Elemen | Radius |
|---|---|
| Tombol, tab, chip | 12px |
| Input (di aplikasi) | 10px |
| **Lembar RPP** | 4px |
| Kartu harga | 16px |

Tidak ada lagi panel besar berradius 24px di hero.

### Elevasi

- Dasarnya border 1px Garis.
- Bayangan hanya untuk lembar RPP: `0 16px 40px -16px rgba(23,43,85,.28)`.

---

## 5. Struktur Halaman

### 5.1 Navbar (diubah)

```
┌────────────────────────────────────────────────────────────────┐
│ [logo]      Contoh dokumen   Cara kerja   Paket   FAQ  [Coba gratis] │
└────────────────────────────────────────────────────────────────┘
```

- Tinggi **72px**, putih, border bawah 1px Garis, sticky.
- Logo kiri, tinggi **36px** (v1 terlalu kecil untuk wordmark).
- **Empat tautan maksimal**: Contoh dokumen, Cara kerja, Paket & biaya, FAQ. "Keunggulan" tidak masuk nav (tetap jadi bagian halaman).
- Tautan: 15px, bobot 600, warna navy 85%, jarak antar tautan 32px, **ditempatkan di kanan dekat CTA** atau di tengah, bukan menempel pada logo.
- Satu CTA: **Coba gratis**, tinggi 44px. Hanya ini yang berwarna solid.
- **"Masuk Pengelola" dipindah ke footer** (atau tautan teks kecil di footer). Tautan admin tidak bersaing dengan CTA pengunjung.
- Mobile: logo + CTA + ikon menu. Tautan masuk ke panel.

### 5.2 Hero (ditulis ulang)

**Tujuan:** dalam satu layar, pengunjung paham produknya dan melihat RPP tertulis.

#### Wireframe desktop (≥ 1024px)

```
┌───────────────────────────────────────────────────────────────────────┐
│ NAVBAR 72px                                                           │
├──────────────────────────────────────┬────────────────────────────────┤
│                                      │ ░░░░░░░░ meja (Mint Tipis) ░░░░│
│  RPP siap dipakai,                   │ ░ [IPAS: Siklus Air][Mat..][B.I]│ ← tab contoh
│  tinggal Bapak/Ibu                   │ ┌──────────────────────────┐   │
│  sesuaikan.                          │ │ ✦ Menyusun tujuan…     ◥ │   │
│                                      │ │ Modul Ajar               │   │
│  Isi mata pelajaran, kelas, dan      │ │ Siklus Air dan Pelest…   │   │
│  topik. Draf lengkap tersusun,       │ │ ┌ Identitas ───────────┐ │   │
│  Anda tinggal memeriksa dan          │ │ │ Mapel   IPAS         │ │   │
│  mengedit.                           │ │ └──────────────────────┘ │   │
│                                      │ │ 1. Capaian dan tujuan    │   │
│  [Coba gratis] [Lihat contoh RPP]    │ │ Peserta didik …          │   │
│  ▫ Bisa diedit, unduh Word atau PDF  │ │ 2. Rencana kegiatan  ▒▒▒ │   │ ← fade bawah
│                                      │ └──────────────────────────┘   │
├──────────────────────────────────────┴────────────────────────────────┤
│  (bagian berikutnya dimulai di sini, bukan mengintip)                 │
```

#### Spesifikasi

| Item | Nilai |
|---|---|
| Tinggi hero | `min-height: min(720px, calc(100svh - 72px))`, padding vertikal 48px atas, 64px bawah |
| Grid | 12 kolom. Kiri **5 kolom**, kanan **7 kolom**. `align-items: center` |
| Kolom kiri | Headline → sub-headline (margin-top 20) → tombol (margin-top 32) → satu baris kepercayaan (margin-top 20) |
| Headline | 48px, 800, navy, maks 3 baris, `max-width: 13em` |
| Sub-headline | 19px, Abu Tinta, `max-width: 44ch`, **maksimal 2 kalimat** |
| Tombol | Tinggi 48px. Utama + sekunder sebaris, gap 12px |
| Baris kepercayaan | 14px, ikon dokumen kecil, satu kalimat: "Bisa diedit, unduh sebagai Word atau PDF" |
| **Meja** | Bidang Mint Tipis di belakang kolom kanan, **menempel ke tepi kanan layar** (bleed), tinggi penuh hero. Mulai ±50% lebar |
| **Lembar** | Lebar penuh kolom kanan, **menjorok ±48px ke kiri melewati tepi meja** sehingga setengahnya di putih, setengahnya di mint (memberi kedalaman tanpa bayangan berlebih) |
| Tinggi lembar | **520–560px**, `overflow: hidden`, 96px terbawah di-fade dengan `mask-image` |
| Tab contoh | Di atas lembar, rata dengan tepi kiri lembar. 3 tab: **IPAS: Siklus Air**, **Matematika: Pecahan**, **B. Indonesia: Teks Eksplanasi**. Tab aktif navy, lainnya putih berborder |
| "Ulangi contoh" | Tombol teks kecil di ujung kanan baris tab |
| Pengisi ruang | Tidak ada. Whitespace di kiri itu sah selama kolom kiri **terpusat vertikal** terhadap lembar |

#### Yang dihapus dari v1

- Panel form (Mata Pelajaran, Fase & Kelas, Topik, tombol "Buat Draf RPP") dari hero. Form asli ada di aplikasi setelah **Coba gratis**.
- Alasan: form di hero adalah duplikat, memakan 500px, dan membuat dua tombol utama bersaing.
- Setelah tab dipilih, demo **langsung menulis**. Tidak perlu tombol "Buat".
- Di bawah tab boleh ada satu teks kecil: "Ingin topik sendiri? Coba gratis."

#### Wireframe mobile (< 1024px)

```
┌─────────────────────┐
│ logo        [Coba]  │
├─────────────────────┤
│ RPP siap dipakai,   │
│ tinggal Bapak/Ibu   │
│ sesuaikan.          │
│ Sub-headline 2 kal. │
│ [Coba gratis]       │ ← penuh lebar
│ [Lihat contoh RPP]  │
├─────────────────────┤  ← mint penuh lebar
│ [IPAS][Mat][B.Ind]→ │  ← tab bisa digeser
│ ┌─────────────────┐ │
│ │ lembar (420px)  │ │  ← keadaan selesai, statis
│ │ fade bawah      │ │
│ └─────────────────┘ │
└─────────────────────┘
```

- Tanpa offset/overlap. Meja jadi pita mint penuh lebar.
- Demo tampil dalam keadaan selesai (tanpa animasi panjang).
- Headline 34px, maksimal 4 baris.

#### Kerangka CSS

```css
.hero {
  position: relative;
  min-height: min(720px, calc(100svh - 72px));
  padding-block: 48px 64px;
  display: grid;
  align-items: center;
}
.hero-grid {
  max-width: 1200px; margin-inline: auto; padding-inline: 24px;
  display: grid; grid-template-columns: repeat(12, 1fr); gap: 48px;
  align-items: center;
}
.hero-copy  { grid-column: 1 / span 5; }
.hero-demo  { grid-column: 6 / span 7; position: relative; z-index: 1;
              margin-left: -48px; }
.hero::before {                       /* meja */
  content: ""; position: absolute; inset: 0 0 0 50%;
  background: var(--mint-tipis);
}
.hero h1 {
  font-size: 48px; line-height: 1.1; font-weight: 800;
  letter-spacing: -0.01em; text-wrap: balance; max-width: 13em;
}
.hero h1 .nw { white-space: nowrap; }  /* Bapak/Ibu */
.hero p.lead { font-size: 19px; color: var(--abu-tinta); max-width: 44ch; margin-top: 20px; }

@media (max-width: 1023px) {
  .hero::before { inset: auto 0 0 0; height: 60%; }
  .hero-grid { grid-template-columns: 1fr; gap: 32px; }
  .hero-copy, .hero-demo { grid-column: 1; margin-left: 0; }
  .hero h1 { font-size: 34px; }
}
```

### 5.3 Cara kerja

Tiga langkah (memang berurutan, boleh bernomor), disusun sebagai **tiga baris horizontal dengan garis penghubung tipis**, bukan tiga kartu.

1. **Isi data kelas.** Mata pelajaran, fase/kelas, topik, durasi.
2. **Biarkan draf ditulis.** Tujuan pembelajaran, kegiatan, dan asesmen tersusun.
3. **Periksa dan unduh.** Sesuaikan, lalu ekspor ke Word atau PDF.

### 5.4 Contoh dokumen

- Latar Mint Tipis. Satu lembar RPP besar di tengah dengan **anotasi samping** (garis tipis teal menunjuk bagian: tujuan, kegiatan, asesmen).
- Tombol "Unduh contoh (PDF)" di bawahnya.

### 5.5 Keunggulan ("Anda yang mengatur")

Dua kolom, teks plus potongan UI kecil. Tulis hanya fitur yang benar-benar ada: edit tiap bagian, unduh Word/PDF, simpan dan pakai ulang. Bukan grid kartu ikon.

### 5.6 Paket & biaya

- Maksimal **3 paket**, disusun sejajar, tinggi sama.
- Perbedaan antar paket ditampilkan dalam **tabel perbandingan sederhana**, bukan daftar centang panjang di tiap kartu.
- Satu paket yang direkomendasikan ditandai dengan border teal 2px, **bukan** badge "Paling populer" berwarna-warni.
- Harga jelas, termasuk apa yang terjadi saat kuota habis. Jangan sembunyikan syarat.

### 5.7 FAQ

Accordion sederhana, 5–6 pertanyaan nyata (§9).

### 5.8 CTA penutup + footer

Latar navy, satu kalimat, satu tombol. Footer menyatu: logo versi gelap, tautan, **Masuk pengelola**, kontak.

---

## 6. Lembar RPP (diperbarui)

Satu-satunya "momen berani" halaman.

### Bentuk

- Putih, border Garis, radius 4px, bayangan navy lembut (§4).
- **Sudut kanan atas terlipat**, ukuran **24px** (v1 terlalu mencolok, tampak seperti stiker). Sudut benar-benar terpotong; segitiga lipatan memakai Teal Ruang.
  ```css
  .rpp-wrap  { filter: drop-shadow(0 16px 24px rgba(23,43,85,.22)); }
  .rpp-sheet {
    position: relative; background: #fff; border-radius: 4px;
    padding: 40px 48px;
    clip-path: polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%);
    font-family: var(--font-doc);
    height: 540px; overflow: hidden;
    -webkit-mask-image: linear-gradient(#000 80%, transparent);
            mask-image: linear-gradient(#000 80%, transparent);
  }
  .rpp-sheet::after {
    content: ""; position: absolute; top: 0; right: 0; width: 24px; height: 24px;
    background: linear-gradient(225deg, transparent 50%, #16A596 50%);
  }
  ```
  (Mask ditaruh pada isi di dalam lembar, bukan pada elemen yang sama dengan `clip-path`, jika hasil di browser bentrok.)

### Isi dan struktur (disederhanakan)

```
✦ Menyusun tujuan pembelajaran…        ← satu baris status (14px, Abu Tinta); jadi "Draf selesai" setelah selesai
Modul ajar                              ← 14px, 600, Teal Dalam, sentence case (bukan kapital)
Siklus Air dan Pelestarian Sumber Daya Air   ← serif 600, 26–28px, navy

Identitas modul (tabel 2 kolom, garis tipis antar baris)
  Mata pelajaran     IPAS
  Fase / kelas       C / Kelas 5 SD
  Alokasi waktu      2 pertemuan (4 JP × 35 menit)

1. Capaian dan tujuan pembelajaran
   Peserta didik mengidentifikasi urutan siklus hidrologi …
2. Rencana kegiatan pembelajaran
   Pembuka (10 menit): …
```

### Perubahan dari v1

| v1 | v2 |
|---|---|
| Dua baris meta di header ("Draf Perangkat Ajar Kurikulum Nasional" + "Selesai disusun") | **Satu** baris status |
| Eyebrow kapital "MODUL AJAR / RPP KURIKULUM MERDEKA" | "Modul ajar" sentence case, satu kata kunci |
| Tiga chip identitas, membungkus ke 2 baris | **Tabel identitas** tiga baris, gaya dokumen sungguhan |
| Baris "Rujukan: Keputusan Kepala BSKAP No. …" berdempet di bawah judul bagian | Rujukan dipindah ke **catatan kecil di akhir bagian** (13px, italic), atau dihapus dari demo |

### Konten demo

- Isi harus nyata dan benar secara pedagogis (IPAS Kelas 5, Siklus Air).
- **Periksa kebenaran rujukan regulasi** (nomor keputusan, istilah elemen). Rujukan yang keliru di halaman marketing langsung merusak kepercayaan guru. Jika belum 100% yakin, tulis saja nama elemen ("Elemen: Pemahaman IPAS") tanpa nomor.
- Tiap tab contoh punya isi sendiri (3 contoh, panjang serupa) supaya tinggi lembar konsisten.

### Percikan bintang

- Muncul di margin/kiri baris status saat AI sedang menulis, hilang saat selesai. Satu percikan pada satu waktu.

---

## 7. Gerakan (Motion)

| Gerak | Kapan | Detail |
|---|---|---|
| **Lembar menulis** | Sekali saat load, dan setiap tab dipilih | Bagian muncul satu per satu, total ≤ 4 detik. Teks tidak bergeser layout (tinggi lembar tetap) |
| Ganti tab | Dipicu pengguna | Isi lembar dibersihkan lalu menulis ulang |
| Hover tombol | Dipicu pengguna | Warna berubah 120ms |
| Accordion FAQ | Dipicu pengguna | 200ms `ease-out` |

- Tidak ada fade-up per bagian, parallax, hover-lift kartu, atau elemen melayang.
- `prefers-reduced-motion`: lembar tampil langsung dalam keadaan selesai.
- Animasi menulis berhenti jika tab browser tidak aktif dan tidak dimulai ulang tanpa aksi.

---

## 8. Komponen

### Tombol

| Varian | Gaya |
|---|---|
| Utama | Latar `#0D7C6F`, teks putih, tinggi 48px (nav: 44px), bobot 700, radius 12px |
| Sekunder | Border 1.5px navy, teks navy, latar transparan |
| Teks | Teal Dalam, garis bawah saat hover |

- Label kata kerja spesifik: **Coba gratis**, **Lihat contoh RPP**, **Unduh Word**.
- Satu hero, **satu** tombol utama. Jangan ada dua tombol hijau solid bersaing dalam satu layar (nav CTA dan hero CTA dianggap satu aksi yang sama).
- Tanpa panah `→` di setiap tombol.

### Tab contoh (baru)

- Tinggi 40px, padding 0 16px, radius 12px, 15px/600.
- Tidak aktif: putih, border Garis, teks navy. Aktif: latar navy, teks putih.
- Di mobile: baris tab bisa digeser horizontal, tanpa scrollbar terlihat, fokus keyboard tetap terlihat.
- Semantik: `role="tablist"` / `role="tab"` / `aria-selected`.

### Input (di aplikasi, bukan di hero)

- Tinggi 48px, border Garis, radius 10px, label selalu di atas.
- Fokus: ring 2px Teal Ruang, offset 2px.
- Teks tidak boleh terpotong: pakai label pendek ("IPAS") atau `select` dengan nama lengkap saat dibuka.

### Ikon

Stroke 1.75px, ujung membulat (mis. Lucide). Hanya jika membantu.

### Toast, kosong, loading

- Kata kerja toast sama dengan tombolnya ("Unduh Word" → "Word berhasil diunduh").
- Error langsung jelas: "Topik belum diisi. Tulis topik, mis. Siklus air."
- Loading: lembar menulis bertahap, bukan spinner.

---

## 9. Copywriting

**Nada:** hangat, langsung, menghormati waktu guru. "Bapak/Ibu" secukupnya.

### Hero

- **Headline:** "RPP siap dipakai, tinggal Bapak/Ibu sesuaikan." (tetap, hanya diperkecil dan dirapikan)
- **Sub-headline (maksimal 2 kalimat):** "Isi mata pelajaran, kelas, dan topik. Draf lengkap dengan tujuan pembelajaran, kegiatan, dan asesmen tersusun, Anda tinggal memeriksa dan mengedit."
- **CTA:** **Coba gratis** · **Lihat contoh RPP**
- **Baris kepercayaan:** "Bisa diedit, unduh sebagai Word atau PDF."

### FAQ yang disarankan

1. Apakah hasilnya bisa saya edit?
2. Sesuai kurikulum apa?
3. Format apa yang bisa diunduh?
4. Apakah data kelas saya disimpan?
5. Apa saya masih perlu memeriksa hasilnya? (jawab: **ya**, ini draf)
6. Berapa biayanya dan apa yang terjadi kalau kuota habis?

### Hindari

- "Revolusi pendidikan", "didukung AI canggih", janji "otomatis 100% sesuai kurikulum".
- Statistik, testimoni, atau logo sekolah palsu.
- Mengulang info yang sama di dua tempat pada layar yang sama.

---

## 10. Logo

- Versi utama di atas putih/mint. Versi gelap di atas navy (ikon dan "ruang" teal terang/mint, "RPP" putih).
- **Tinggi di navbar 36px**; logo penuh minimum 96px lebar; ikon saja minimum 24px.
- Ruang bebas minimal setinggi huruf "R" pada "RPP".
- Siapkan **SVG transparan**. PNG sekarang berlatar putih dan terlalu banyak ruang kosong di sekelilingnya; **crop rapat** (trim) sebelum dipakai agar ukuran di navbar tidak tampak kecil.
- Favicon dari ikon saja.

---

## 11. Responsif

| Breakpoint | Lebar | Perilaku |
|---|---|---|
| Mobile | < 640px | Satu kolom. Tombol penuh lebar. Lembar statis, 420px, fade bawah |
| Tablet | 640–1023px | Satu kolom, lembar lebih lebar, meja jadi pita penuh lebar |
| Desktop | ≥ 1024px | Hero dua kolom 5/7 dengan meja bleed |
| Layar lebar | ≥ 1600px | Container tetap 1200px, meja tetap bleed ke tepi |

Uji wajib: **1440×900**, **1366×768** (laptop umum), **390×844**. Di 1366×768, headline, kedua tombol, dan **dua bagian pertama lembar** harus terlihat tanpa scroll.

---

## 12. Aksesibilitas & Performa

- Kontras teks ≥ 4.5:1 (body), 3:1 (teks besar/UI).
- Fokus keyboard selalu terlihat, urutan tab logis.
- Tab contoh: `tablist` + `aria-selected`. Lembar: `aria-live="polite"` untuk teks yang muncul, atau sediakan ringkasan teks statis untuk pembaca layar.
- Accordion: `button` + `aria-expanded`.
- Muat hanya bobot font yang dipakai (Nunito 400/600/700/800, Source Serif 4 400/600), `font-display: swap`.
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95.
- Hindari layout shift: tinggi lembar tetap selama animasi menulis.

---

## 13. Design Tokens

```css
:root {
  /* Warna */
  --teal-ruang: #16A596;
  --teal-dalam: #0D7C6F;
  --navy-rpp:   #172B55;
  --mint-tipis: #E8F5F2;
  --kertas:     #FFFFFF;
  --abu-tinta:  #4A5568;
  --garis:      #D9E4E2;
  --error:      #B42318;
  --peringatan: #B54708;

  /* Tipografi */
  --font-ui:  "Nunito", "Nunito Sans", system-ui, sans-serif;
  --font-doc: "Source Serif 4", Georgia, serif;

  /* Radius */
  --r-chip: 12px;
  --r-input: 10px;
  --r-card: 16px;
  --r-doc: 4px;

  /* Spasi */
  --s1: 4px;  --s2: 8px;  --s3: 16px; --s4: 24px;
  --s5: 32px; --s6: 48px; --s7: 64px; --s8: 96px;

  /* Layout */
  --container: 1200px;
  --nav-h: 72px;

  /* Bayangan (hanya lembar RPP) */
  --shadow-doc: 0 16px 40px -16px rgba(23, 43, 85, .28);
}

body {
  font-family: var(--font-ui);
  color: var(--navy-rpp);
  background: var(--kertas);
  font-size: 17px;
  line-height: 1.6;
}

:focus-visible { outline: 2px solid var(--teal-ruang); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

### Tailwind (opsional)

```js
// tailwind.config.js
module.exports = {
  theme: {
    container: { center: true, padding: "1.5rem", screens: { xl: "1200px" } },
    extend: {
      colors: {
        teal: { ruang: "#16A596", dalam: "#0D7C6F" },
        navy: { rpp: "#172B55" },
        mint: { tipis: "#E8F5F2" },
        garis: "#D9E4E2",
        tinta: "#4A5568",
      },
      fontFamily: {
        ui: ["Nunito", "Nunito Sans", "system-ui", "sans-serif"],
        doc: ['"Source Serif 4"', "Georgia", "serif"],
      },
      fontSize: { display: ["48px", { lineHeight: "1.1", fontWeight: "800" }] },
      borderRadius: { chip: "12px", input: "10px", card: "16px", doc: "4px" },
      boxShadow: { doc: "0 16px 40px -16px rgba(23,43,85,.28)" },
    },
  },
};
```

---

## 14. Checklist

### A. QA tata letak (baru)

- [ ] Hero muat di 1440×900; di 1366×768 dua bagian pertama lembar terlihat
- [ ] Tinggi kolom kiri dan kanan seimbang, kolom kiri terpusat vertikal, tidak ada ruang kosong > 120px di bawah tombol
- [ ] Headline ≤ 3 baris di desktop, "Bapak/Ibu" tidak terbelah
- [ ] Hanya **satu** objek demo di hero (tidak ada form + lembar bertumpuk)
- [ ] Tidak ada informasi yang diulang pada layar yang sama
- [ ] Navbar ≤ 4 tautan + 1 CTA; tidak ada tautan admin di nav publik
- [ ] Bagian berikutnya tidak mengintip di tepi bawah hero
- [ ] Teks tidak terpotong di elemen apa pun
- [ ] Bobot huruf berjenjang (800/700/600/400), tidak semua tebal

### B. Bukan AI slop

Tidak boleh ada:
- [ ] Gradien dekoratif, blob, glow
- [ ] Grid kartu identik berikon emoji dengan bayangan sama
- [ ] Label kapital berjarak di atas judul
- [ ] Satu kata judul diwarnai sendiri
- [ ] Nomor 01/02/03 pada konten bukan urutan
- [ ] Fade-up di setiap bagian, hover-lift kartu
- [ ] Ikon robot/otak/roket, foto stok guru tertawa
- [ ] Statistik, testimoni, logo sekolah palsu, lorem ipsum
- [ ] Copy "revolusioner/canggih/terdepan"
- [ ] Tombol "Submit" atau semua tombol berpanah

Harus ada:
- [ ] Demo nyata di hero dengan lembar RPP yang benar secara isi
- [ ] Satu bagian navy, satu momen gerak otomatis
- [ ] Kontras ≥ 4.5:1, fokus keyboard terlihat
- [ ] Logo SVG (trim rapat), versi gelap, favicon dari ikon
- [ ] Copy jujur: hasil adalah **draf** yang perlu diperiksa guru

---

## 15. Prompt untuk AI Coding Agent (Revisi v2)

Gunakan prompt ini pada kode v1 yang sudah ada. Kerjakan satu per satu dan cek hasil di tiap langkah.

**Langkah 1: Navbar**
```
Baca ruangRPP-UIUX-Guideline-v2.md §5.1. Revisi Navbar: tinggi 72px, logo 36px
(trim rapat file logo agar tidak ada ruang kosong), maksimal 4 tautan (Contoh
dokumen, Cara kerja, Paket & biaya, FAQ) berbobot 600 ukuran 15px, satu CTA
"Coba gratis". Pindahkan "Masuk Pengelola" ke footer. Jangan ubah bagian lain.
```

**Langkah 2: Hero**
```
Baca §5.2 dan §6. Tulis ulang Hero: HAPUS panel form. Layout grid 12 kolom, kiri
5 kolom (headline 48px maks 3 baris dengan text-wrap: balance, sub-headline 19px,
dua tombol, satu baris kepercayaan), kanan 7 kolom berisi tab contoh (3 tab) di
atas satu lembar RPP setinggi 540px dengan fade di bawah. Tambahkan "meja" Mint
Tipis di belakang kolom kanan yang bleed ke tepi kanan layar; lembar menjorok 48px
ke kiri melewati tepi meja. align-items: center. Mobile: satu kolom, lembar
statis 420px. Pakai kerangka CSS di §5.2.
```

**Langkah 3: Lembar RPP**
```
Rapikan lembar sesuai §6: satu baris status dengan percikan bintang, "Modul ajar"
sentence case (tanpa kapital), judul serif, tabel identitas 3 baris (mapel, fase/
kelas, alokasi waktu), bagian 1 dan 2. Hapus chip identitas dan meta ganda.
Lipatan sudut 24px. Animasi menulis sekali saat load dan setiap ganti tab, tinggi
lembar tetap (tanpa layout shift), hormati prefers-reduced-motion.
```

**Langkah 4: Tipografi dan bobot**
```
Terapkan skala tipografi dan aturan bobot §3 secara global (800 judul, 700 tombol,
600 UI, 400 body). Container maks 1200px. Hapus semua radius 24px di hero.
```

**Langkah 5: Audit**
```
Audit terhadap checklist §14A dan §14B. Uji di 1440×900, 1366×768, dan 390×844.
Laporkan tiap pelanggaran dengan screenshot, perbaiki, lalu jalankan Lighthouse.
```

---

## 16. Hal yang Perlu Anda Putuskan

1. **Istilah:** "RPP" atau "Modul Ajar" di judul lembar? Hero v1 memakai keduanya, pilih satu agar konsisten.
2. **Rujukan regulasi di demo:** verifikasi atau hapus nomor keputusan (§6).
3. **Akun:** apakah "Coba gratis" butuh login? Menentukan alur setelah klik.
4. **Paket & biaya:** jumlah paket, batas kuota, dan apa yang terjadi saat kuota habis (§5.6).
5. **Bukti sosial:** tampilkan testimoni hanya setelah ada guru nyata yang bersedia dikutip.
6. **Logo:** SVG transparan, versi gelap, dan crop rapat sebelum dipakai di navbar.