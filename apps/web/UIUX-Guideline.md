# ruangRPP — UI/UX Guideline (Landing Page)

Panduan ini dibuat dari logo ruangRPP: ikon buku dengan monogram **R**, percikan bintang kecil, wordmark **ruang** (teal, huruf bulat) dan **RPP** (navy, tebal). Semua keputusan di bawah diturunkan dari logo dan dari satu hal: **produk ini menghasilkan dokumen RPP untuk guru**.

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

1. **Tunjukkan produknya, jangan jelaskan.** Hero berisi demo nyata (isi form, RPP muncul), bukan ilustrasi orang tertawa di depan laptop.
2. **Satu momen berani.** Lembar RPP adalah bintangnya. Sisanya tenang.
3. **Sans untuk antarmuka, serif untuk dokumen.** Ini membedakan "alat" dari "hasil kerja" dan membuat output terasa seperti dokumen guru sungguhan.
4. **Bintang kecil hanya untuk AI.** Percikan di logo dipakai sebagai penanda "AI sedang/ sudah menulis bagian ini". Tidak dipakai sebagai hiasan.
5. **Guru tetap pegang kendali.** Semua copy menekankan: bisa diedit, bisa diunduh, Anda yang memutuskan.

---

## 2. Warna

Diambil dari logo (nilai hex adalah pendekatan dari gambar; cocokkan dengan file vektor asli jika ada).

### Palet inti

| Nama | Hex | Fungsi |
|---|---|---|
| **Teal Ruang** | `#16A596` | Warna merek: ikon, wordmark, garis aksen, sudut terlipat, ilustrasi |
| **Teal Dalam** | `#0D7C6F` | Tombol utama, link, teks berwarna teal (kontras ±5:1 di atas putih) |
| **Navy RPP** | `#172B55` | Judul, teks utama, blok gelap (CTA akhir, footer) |
| **Mint Tipis** | `#E8F5F2` | Latar bagian selang-seling, area form, chip |
| **Putih Kertas** | `#FFFFFF` | Latar utama dan lembar RPP |
| **Abu Tinta** | `#4A5568` | Teks sekunder, bantuan input |
| **Garis** | `#D9E4E2` | Border, pemisah (sedikit kehijauan, selaras teal) |

### Warna fungsional (hanya untuk status)

| Status | Hex |
|---|---|
| Error | `#B42318` |
| Peringatan | `#B54708` |
| Sukses | pakai Teal Dalam `#0D7C6F` |

### Aturan pemakaian

- Komposisi kira-kira **70% putih/mint, 20% navy, 10% teal**. Teal itu aksen, bukan lautan.
- **Jangan** pakai `#16A596` untuk teks kecil di atas putih (kontras sekitar 3:1, tidak lolos AA). Pakai Teal Dalam.
- Tombol utama: latar **Teal Dalam**, teks putih. Tombol sekunder: border navy, teks navy, latar transparan.
- Hanya **satu** bagian gelap (navy) di seluruh halaman: CTA penutup, lalu footer menyatu dengannya.
- **Dilarang:** gradien ungu/biru, gradien teal-ke-navy sebagai hiasan, glassmorphism, glow, blob melayang.

---

## 3. Tipografi

| Peran | Font | Bobot | Alasan |
|---|---|---|---|
| Judul, UI, body | **Nunito** | 800 judul, 700 tombol/label, 400–500 body | Ujung huruf membulat seperti wordmark "ruang"; ramah tapi terbaca |
| Isi lembar RPP (hanya di dalam dokumen) | **Source Serif 4** | 400, 600 untuk sub-judul | Memberi rasa dokumen resmi; pemisah jelas dari antarmuka |

Fallback: `Nunito, "Nunito Sans", system-ui, sans-serif` dan `"Source Serif 4", Georgia, serif`.

### Skala (desktop → mobile)

| Token | Desktop | Mobile | Line-height | Pemakaian |
|---|---|---|---|---|
| `display` | 56px | 36px | 1.08 | Headline hero (satu kali) |
| `h2` | 36px | 28px | 1.15 | Judul bagian |
| `h3` | 22px | 20px | 1.3 | Judul sub-bagian |
| `body-lg` | 20px | 18px | 1.55 | Sub-headline hero |
| `body` | 17px | 16px | 1.6 | Teks biasa |
| `small` | 14px | 14px | 1.5 | Bantuan, catatan |
| `doc` | 15px | 14px | 1.65 | Teks di lembar RPP (serif) |

### Aturan

- Letter-spacing judul: `-0.01em`. Body: normal.
- Lebar baris maksimum **65 karakter** (±`60ch`) untuk paragraf.
- Rata **kiri** untuk semua teks. Jangan tengah-tengahkan paragraf.
- Huruf kapital semua **tidak dipakai** untuk label. Pakai sentence case.
- **Jangan** mewarnai/miringkan satu kata saja di judul sebagai "aksen" (ciri khas halaman buatan AI). Judul satu warna, navy.
- **Jangan** taruh label kecil di atas setiap judul bagian. Judul sudah cukup.

---

## 4. Layout, Grid, Spasi

- **Container:** maks 1120px, padding sisi 24px (mobile 20px).
- **Grid:** 12 kolom desktop, 4 kolom mobile, gap 24px.
- **Skala spasi (kelipatan 8):** 4, 8, 16, 24, 32, 48, 64, 96, 128.
- **Jarak antar bagian:** 96px desktop, 64px mobile. Konsisten, jangan acak.
- **Komposisi:** asimetris dan rata kiri. Tidak semua bagian simetris di tengah.

### Radius (berjenjang, bukan satu angka untuk semua)

| Elemen | Radius |
|---|---|
| Tombol, chip | 12px (mengikuti kebulatan logo) |
| Input | 10px |
| Panel besar (area form) | 24px |
| **Lembar RPP** | 4px, kecuali sudut kanan atas yang terlipat (lihat §6) |

Lembar dokumen sengaja lebih "tajam" daripada UI di sekitarnya, sama seperti kertas di atas meja.

### Elevasi

- Dasarnya **border 1px Garis**, bukan bayangan.
- Bayangan hanya untuk **lembar RPP**: `0 12px 32px -12px rgba(23,43,85,.25)` (bayangan bertinta navy, bukan abu).
- Tidak ada bayangan di kartu fitur, tombol, atau input.

---

## 5. Struktur Halaman

Urutan dan isi dibuat pendek. Setiap bagian punya satu tugas.

```
┌──────────────────────────────────────────────────────────┐
│ [logo ruangRPP]                     Contoh   FAQ  [Coba] │  Navbar (sticky, putih, border bawah)
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Headline besar              ┌─ Form ──────┐ ┌─ RPP ──┐  │
│  rata kiri, navy             │ Mapel  [..] │ │ ◥      │  │  HERO
│                              │ Kelas  [..] │ │ lembar │  │  (demo hidup)
│  Sub-headline 1–2 kalimat    │ Topik  [..] │ │ ditulis│  │
│                              │ [Buat RPP]  │ │ bertahap│ │
│  [Coba gratis]  Lihat contoh └─────────────┘ └────────┘  │
├──────────────────────────────────────────────────────────┤
│ Cara kerja (3 langkah, memang berurutan)                 │  Latar putih
├──────────────────────────────────────────────────────────┤
│ Isi RPP yang dihasilkan (lembar besar + anotasi)         │  Latar Mint Tipis
├──────────────────────────────────────────────────────────┤
│ Anda yang mengatur (edit, unduh, sesuaikan)              │  Latar putih
├──────────────────────────────────────────────────────────┤
│ FAQ (accordion)                                          │  Latar putih
├──────────────────────────────────────────────────────────┤
│ CTA penutup + footer                                     │  Latar Navy (satu-satunya)
└──────────────────────────────────────────────────────────┘
```

### 5.1 Navbar

- Logo kiri (tinggi 32px). Tautan: Contoh, Cara kerja, FAQ. Satu tombol utama kanan: **Coba gratis**.
- Mobile: logo + tombol utama saja, tautan masuk ke menu.

### 5.2 Hero (bagian terpenting)

- **Kiri (5 kolom):** headline, sub-headline, tombol, satu baris kepercayaan (mis. "Bisa diedit dan diunduh sebagai Word/PDF").
- **Kanan (7 kolom):** form kecil + lembar RPP yang terisi otomatis.
- **Mobile:** teks dulu, lalu demo dalam keadaan **sudah selesai** (statis, tanpa animasi panjang).
- Tidak ada gambar stok, ilustrasi orang, atau ikon robot/otak.

### 5.3 Cara kerja

Boleh bernomor karena memang urutan.

1. **Isi data kelas.** Mata pelajaran, fase/kelas, topik, durasi.
2. **Biarkan draf ditulis.** Tujuan pembelajaran, kegiatan, dan asesmen tersusun.
3. **Periksa dan unduh.** Sesuaikan sesuai kelas Anda, lalu ekspor.

Tampilkan sebagai tiga baris horizontal dengan garis penghubung tipis, bukan tiga kartu identik.

### 5.4 Isi RPP yang dihasilkan

- Satu lembar RPP ukuran besar di tengah, dengan **anotasi samping** (garis tipis teal menunjuk ke bagian: tujuan pembelajaran, kegiatan inti, asesmen).
- Ini menggantikan grid "6 fitur dengan ikon". Konten nyata lebih meyakinkan daripada ikon.

### 5.5 Anda yang mengatur

Dua kolom, teks saja plus potongan UI kecil:
- Edit tiap bagian langsung.
- Unduh Word/PDF.
- Simpan dan pakai ulang untuk kelas lain.

Hanya tulis fitur yang **benar-benar ada** di produk.

### 5.6 FAQ

Accordion sederhana, 5–6 pertanyaan nyata (lihat §9). Buka satu per satu, tanpa animasi berlebihan.

### 5.7 CTA penutup

Latar navy, satu kalimat, satu tombol (teal terang atau putih). Logo versi gelap di footer.

---

## 6. Elemen Khas: Lembar RPP

Ini satu-satunya "momen berani" halaman.

- Kertas putih, border Garis, radius 4px, bayangan navy lembut.
- **Sudut kanan atas terlipat** (segitiga teal `#16A596`), meniru lipatan halaman pada ikon buku di logo.
  ```css
  .rpp-sheet {
    position: relative;
    background: #fff;
    border: 1px solid var(--garis);
    border-radius: 4px;
    clip-path: polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%);
    font-family: "Source Serif 4", Georgia, serif;
  }
  .rpp-sheet::after {            /* lipatan */
    content: "";
    position: absolute; top: 0; right: 0;
    width: 28px; height: 28px;
    background: linear-gradient(225deg, transparent 50%, #16A596 50%);
  }
  ```
  (Jika memakai `clip-path`, bayangan dipasang pada elemen pembungkus dengan `filter: drop-shadow`.)
- Isi lembar: judul, identitas (mapel, kelas, durasi), **Tujuan pembelajaran**, **Kegiatan** (pembuka, inti, penutup), **Asesmen**. Judul bagian pakai Source Serif 600 navy.
- **Percikan bintang** (dari logo) muncul kecil di margin bagian yang sedang ditulis AI, lalu hilang setelah selesai. Hanya satu percikan pada satu waktu.
- Isi demo harus **nyata dan masuk akal secara pedagogis** (contoh: IPAS Kelas 5, Siklus Air). Jangan lorem ipsum.

---

## 7. Gerakan (Motion)

Aturan: gerak otomatis hanya di **satu tempat**.

| Gerak | Kapan | Detail |
|---|---|---|
| **Demo hero menulis** | Sekali saat halaman dimuat | Form terisi → tombol ditekan → bagian lembar muncul satu per satu (±4 detik total). Tersedia tombol "Ulangi contoh" |
| Hover tombol | Dipicu pengguna | Perubahan warna 120ms, tanpa geser/loncat |
| Accordion FAQ | Dipicu pengguna | Tinggi berubah 200ms, `ease-out` |
| Fokus input | Dipicu pengguna | Ring muncul langsung |

- **Tidak ada** fade-up pada setiap bagian, parallax, hover-lift pada kartu, atau elemen melayang.
- Hormati `prefers-reduced-motion`: demo langsung tampil dalam keadaan selesai.

---

## 8. Komponen

### Tombol

| Varian | Gaya |
|---|---|
| Utama | Latar `#0D7C6F`, teks putih, tinggi 48px, padding 0 24px, bobot 700 |
| Sekunder | Border 1.5px navy, teks navy, latar transparan |
| Teks/tautan | Teal Dalam, garis bawah saat hover |

- Label berupa kata kerja spesifik: **Coba gratis**, **Buat RPP**, **Unduh Word**. Hindari "Submit" / "Klik di sini".
- Tanpa tanda panah `→` di setiap tombol.
- Area sentuh minimum 44×44px.

### Input

- Tinggi 48px, border 1px Garis, radius 10px, latar putih.
- Label **selalu terlihat di atas** input (jangan placeholder sebagai label).
- Fokus: ring 2px Teal `#16A596` + offset 2px.
- Error: border `#B42318` + pesan di bawah yang menjelaskan cara memperbaiki.

### Chip pilihan (mis. fase, durasi)

Latar Mint Tipis, teks navy, radius 12px. Terpilih: latar navy, teks putih.

### Ikon

Gaya garis (stroke 1.75px), ujung membulat agar serasi dengan Nunito dan logo. Pakai set konsisten (mis. Lucide). Ikon dipakai hanya jika membantu memahami, bukan sebagai hiasan di tiap kalimat.

### Toast / status

- Memakai kata kerja yang sama dengan tombolnya: tombol "Unduh Word" → toast "Word berhasil diunduh".
- Error tidak minta maaf berlebihan, langsung jelas: "Topik belum diisi. Tulis topik, mis. Siklus air."

### Keadaan kosong & loading

- **Kosong:** ajakan bertindak, mis. "Belum ada RPP. Isi data kelas untuk membuat yang pertama."
- **Loading:** lembar RPP menulis bertahap (bukan spinner generik), dengan teks "Menyusun tujuan pembelajaran…".

---

## 9. Copywriting

**Nada:** hangat, langsung, menghormati waktu guru. Sapaan **"Bapak/Ibu"** secukupnya, sisanya kalimat tanpa subjek yang ringkas. Tidak ada jargon teknis (bukan "LLM", "prompt engineering", "AI-powered").

### Pilihan headline (pilih satu, uji dengan guru sungguhan)

- "RPP siap dipakai, tinggal Bapak/Ibu sesuaikan."
- "Dari topik ke RPP lengkap dalam beberapa menit."
- "Waktu malam Anda lebih berharga dari menyusun RPP."

### Sub-headline

"Isi mata pelajaran, kelas, dan topik. ruangRPP menyusun draf lengkap dengan tujuan pembelajaran, kegiatan, dan asesmen. Anda tinggal memeriksa dan mengedit."

### CTA

Utama: **Coba gratis** · Sekunder: **Lihat contoh RPP**

### FAQ yang disarankan

1. Apakah hasilnya bisa saya edit?
2. Sesuai kurikulum apa? (jawab jujur sesuai produk Anda)
3. Format apa yang bisa diunduh?
4. Apakah data kelas saya disimpan?
5. Apa saya masih perlu memeriksa hasilnya? (jawab: **ya**, ini draf)
6. Berapa biayanya?

### Hindari

- "Revolusi pendidikan", "ubah cara mengajar", "masa depan pendidikan", "didukung AI canggih".
- Angka, testimoni, atau logo sekolah **palsu**. Kalau belum ada, jangan ditampilkan.
- Janji berlebihan ("sempurna", "otomatis 100% sesuai kurikulum").
- Em dash berspasi untuk semua label, atau string bertitik tengah "A · B · C".

---

## 10. Penggunaan Logo

- **Versi utama:** di atas putih/Mint Tipis (ikon teal, "ruang" teal, "RPP" navy).
- **Versi gelap (di atas navy):** ikon dan "ruang" tetap teal terang atau Mint, "RPP" putih. Siapkan file terpisah.
- **Ikon saja** (buku + R + percikan): favicon, avatar, app icon. Uji terbaca di 32px; di 16px boleh buang percikan.
- **Ruang bebas:** minimal setinggi huruf "R" besar pada "RPP" di semua sisi.
- **Ukuran minimum:** logo penuh 96px lebar; ikon 24px.
- **Jangan:** mengubah warna acak, memberi bayangan/outline, meregangkan, atau menaruh di atas foto ramai.
- Siapkan **SVG** (bukan PNG) untuk web. PNG saat ini memiliki latar putih; buat versi transparan.

---

## 11. Responsif

| Breakpoint | Lebar | Perilaku |
|---|---|---|
| Mobile | < 640px | Satu kolom. Hero: teks → demo statis. Tombol utama penuh lebar |
| Tablet | 640–1023px | Hero masih satu kolom, demo lebih lebar |
| Desktop | ≥ 1024px | Hero dua kolom (5/7) |

- Dirancang **mobile-first**; sebagian besar guru membuka lewat HP.
- Lembar RPP di mobile: tampilkan 3–4 bagian saja, dengan teks tetap ≥ 14px.
- Tidak ada scroll horizontal.

---

## 12. Aksesibilitas & Performa

- Kontras teks minimal **4.5:1** (body) dan 3:1 (teks besar/UI). Cek dengan alat kontras sebelum rilis.
- Fokus keyboard selalu terlihat. Urutan tab logis.
- Semua gambar punya `alt`; demo hero punya ringkasan teks untuk pembaca layar (`aria-live="polite"` untuk bagian yang muncul).
- Accordion memakai `button` + `aria-expanded`.
- Font: muat hanya bobot yang dipakai (Nunito 400/700/800, Source Serif 4 400/600), `font-display: swap`.
- Target Lighthouse: Performance ≥ 90, Accessibility ≥ 95.
- Gunakan SVG untuk logo/ikon, tanpa gambar hero berat.

---

## 13. Design Tokens (siap salin)

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
  --r-panel: 24px;
  --r-doc: 4px;

  /* Spasi */
  --s1: 4px;  --s2: 8px;  --s3: 16px; --s4: 24px;
  --s5: 32px; --s6: 48px; --s7: 64px; --s8: 96px;

  /* Bayangan (hanya lembar RPP) */
  --shadow-doc: 0 12px 32px -12px rgba(23, 43, 85, .25);
}

body {
  font-family: var(--font-ui);
  color: var(--navy-rpp);
  background: var(--kertas);
  font-size: 17px;
  line-height: 1.6;
}

:focus-visible {
  outline: 2px solid var(--teal-ruang);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

### Tailwind (opsional)

```js
// tailwind.config.js
module.exports = {
  theme: {
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
      borderRadius: { chip: "12px", input: "10px", panel: "24px", doc: "4px" },
      boxShadow: { doc: "0 12px 32px -12px rgba(23,43,85,.25)" },
    },
  },
};
```

---

## 14. Checklist "Bukan AI Slop"

Sebelum rilis, semua harus **tidak** ada:

- [ ] Gradien ungu/biru/teal sebagai hiasan, atau blob dan glow melayang
- [ ] Grid 3–6 kartu identik dengan emoji/ikon dan bayangan abu yang sama
- [ ] Label kapital berjarak lebar di atas setiap judul bagian
- [ ] Satu kata di judul diberi warna/miring berbeda
- [ ] Penomoran 01/02/03 pada konten yang bukan urutan
- [ ] Animasi fade-up di setiap bagian, hover-lift di setiap kartu
- [ ] Ikon robot, otak, atau roket; foto stok guru tertawa
- [ ] Statistik, testimoni, atau logo sekolah palsu
- [ ] Lorem ipsum di demo
- [ ] Copy bergaya "revolusioner / canggih / terdepan"
- [ ] Tombol berlabel "Submit" atau semua tombol berpanah →

Semua harus **ada**:

- [ ] Demo nyata di hero dengan lembar RPP yang masuk akal
- [ ] Satu bagian gelap saja, satu momen gerak otomatis saja
- [ ] Teks body kontras ≥ 4.5:1, fokus keyboard terlihat
- [ ] Logo SVG, favicon dari ikon, versi gelap untuk footer
- [ ] Copy jujur: hasil adalah **draf** yang perlu diperiksa guru

---

## 15. Prompt untuk AI Coding Agent

Salin ke Claude Code / Cursor / agen lain. Kerjakan bertahap, satu langkah per prompt.

**Langkah 1: Fondasi**
```
Baca ruangRPP-UIUX-Guideline.md. Buat proyek landing page (Next.js + Tailwind
atau HTML/CSS statis). Pasang design tokens (§13), font Nunito dan Source
Serif 4 via next/font atau Google Fonts, dan komponen dasar: Button, Input,
Chip. Belum ada konten halaman. Jangan menambah warna di luar palet.
```

**Langkah 2: Hero + lembar RPP**
```
Bangun Navbar dan Hero sesuai §5.1, §5.2, §6. Lembar RPP dengan sudut terlipat
teal, isi contoh IPAS Kelas 5 "Siklus Air" (tujuan pembelajaran, kegiatan,
asesmen). Demo menulis sekali saat load (~4 detik), hormati
prefers-reduced-motion, mobile menampilkan keadaan selesai. Tanpa gradien,
tanpa glow.
```

**Langkah 3: Bagian lain**
```
Bangun bagian Cara kerja, Isi RPP (lembar besar + anotasi), Anda yang mengatur,
FAQ (accordion aksesibel), dan CTA penutup navy sesuai §5.3–5.7 dan copy di §9.
Jangan pakai grid kartu identik. Jangan tambah animasi selain yang ada di §7.
```

**Langkah 4: Audit**
```
Audit halaman terhadap §12 dan §14. Laporkan setiap pelanggaran, perbaiki,
lalu jalankan Lighthouse (target Performance ≥ 90, Accessibility ≥ 95) dan
uji di lebar 360px.
```

---

## 16. Hal yang Perlu Anda Putuskan

1. **Kurikulum & istilah:** apakah produk menyebut "RPP" atau "Modul Ajar" (Kurikulum Merdeka)? Sesuaikan copy dan isi lembar contoh.
2. **Harga & akun:** apakah "Coba gratis" butuh login? Ini mengubah alur CTA.
3. **Bukti sosial:** tampilkan testimoni hanya setelah ada guru nyata yang bersedia dikutip.
4. **File logo vektor:** minta/buat SVG transparan dan versi gelap sebelum implementasi.