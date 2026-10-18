# ruangRPP — Mobile-First UI/UX Guideline (v3)

> **Mulai sekarang HP adalah layar utama, desktop adalah tambahan.**
> Dokumen ini berlaku untuk **landing page** dan **dashboard guru**. Untuk lebar **< 1024px**, dokumen ini **menggantikan** aturan responsif di *ruangRPP-UIUX-Guideline-v2.md* dan *ruangRPP-Dashboard-Guru-UIUX.md*. Warna, font, logo, lembar RPP, dan copy tetap mengikuti dokumen tersebut.

---

## 0. Apa yang Berubah

| Area | Sebelumnya | Sekarang |
|---|---|---|
| Pendekatan CSS | Desktop dulu, lalu "diperkecil" | **Mobile dulu** (`min-width`), desktop sebagai peningkatan |
| Lebar rancang utama | 1440 px | **360 × 800 px** (Android kelas menengah), uji juga 390 dan 412 |
| Landing mobile | Hero menumpuk, demo statis | Hero dirancang untuk 360px, demo mulai saat terlihat, CTA lengket setelah hero (§5) |
| Dashboard mobile | Sidebar menjadi tab bar, form bertumpuk | Top bar **tidak lengket**, tab bar bawah, bottom sheet, layar hasil penuh dengan bar aksi lengket (§6) |
| Pemilih (kelas/mapel) | Select kustom | Kelas = select asli; Mapel = **bottom sheet dengan pencarian** (§4.4) |
| Unduh | Word dan PDF setara | Di HP **PDF jadi tombol utama**, Word kedua, plus opsi **Bagikan** (§6.3) |
| Alur kritis | Tidak dibahas | Login Google di browser dalam aplikasi, pembayaran lewat e-wallet, jaringan putus, tombol Back (§7) |
| Performa | Lighthouse ≥ 90 | **Anggaran terukur** untuk HP kelas menengah dan 4G lambat (§8) |
| Pengujian | 3 ukuran layar | Matriks perangkat dan skenario (§11) |

---

## 1. Fakta Lapangan yang Dijadikan Dasar

Asumsi ini menentukan keputusan desain. Validasi dengan data analitik begitu ada pengunjung nyata.

1. **Guru membuka dari HP**, sering di sela mengajar: berdiri, satu tangan, sesi singkat 2–5 menit.
2. **Android kelas menengah/bawah** dominan: layar 360 × 800 (CSS px), RAM terbatas, CPU lambat.
3. **Jaringan tidak stabil**: 4G naik-turun, kuota data dipikirkan. Koneksi bisa putus saat draf disusun.
4. **Tautan dibagikan lewat WhatsApp** (grup KKG, grup sekolah). Pratinjau tautan menentukan apakah diklik.
5. **Browser dalam aplikasi** (WhatsApp, Instagram, Facebook, TikTok) sering menjadi pintu masuk pertama; sebagian membatasi login Google.
6. **Pembayaran lewat e-wallet/aplikasi bank** berarti pengguna berpindah aplikasi lalu kembali.
7. **Cahaya terang di luar ruangan**: teks abu pucat sulit dibaca.
8. **Dokumen hasil sering diteruskan** ke WhatsApp, Google Drive, atau dicetak di tempat lain.

---

## 2. Prinsip Mobile-First

1. **Satu tangan, satu ibu jari.** Aksi utama berada di separuh bawah layar.
2. **Satu tugas per layar.** Tidak ada layar yang meminta pengguna membaca dan memutuskan banyak hal sekaligus.
3. **Status sebelum aksi.** Kuota habis, jaringan putus, dan error ditampilkan sebelum pengguna mengisi.
4. **Tidak ada yang hanya bisa diakses lewat hover.**
5. **Hemat data dan CPU.** Tanpa gambar berat, tanpa animasi berat, font disubset.
6. **Tidak kehilangan pekerjaan.** Isian form dan draf aman jika tab tertutup, jaringan putus, atau pengguna berpindah aplikasi.
7. **Tombol Back berfungsi seperti yang diharapkan.** Sheet dan layar detail menutup dengan Back.
8. **Teks dapat dibaca di bawah matahari.** Kontras tinggi, ukuran tidak kurang dari 14px.
9. **Desktop adalah peningkatan**, bukan acuan. Jika ragu antara tampilan HP dan desktop, HP menang.

---

## 3. Fondasi Mobile

### 3.1 Breakpoint (mobile-first, pakai `min-width`)

| Nama | Lebar | Perilaku |
|---|---|---|
| base | 320–479px | Satu kolom. **Rancang di 360px.** 320px tidak boleh rusak |
| `sm` | ≥ 480px | Satu kolom lebih longgar, chip tidak membungkus |
| `md` | ≥ 768px | Tablet: konten maks 680px terpusat atau dua kolom di tempat yang jelas |
| `lg` | ≥ 1024px | Desktop: sidebar, hero dua kolom, workbench 5/7 |
| `xl` | ≥ 1280px | Sidebar 248px, container 1120–1200px |

Ponsel landscape (tinggi < 500px): sembunyikan tab bar saat keyboard terbuka dan jangan memakai elemen lengket besar.

### 3.2 Satuan, viewport, safe area

- Gunakan **`dvh`/`svh`**, bukan `vh`. Bilah alamat browser HP berubah tinggi.
- Tag viewport: `width=device-width, initial-scale=1, viewport-fit=cover`.
- Semua bar tepi layar (top bar, tab bar, bar aksi) menambahkan `env(safe-area-inset-*)`.
- Jangan menonaktifkan zoom (`user-scalable=no` dilarang).
- Ukuran teks memakai `rem`; layout tidak boleh pecah saat ukuran font sistem 130%.

### 3.3 Spasi dan grid (360px)

| Item | Nilai |
|---|---|
| Padding sisi halaman | 16px (landing: 20px) |
| Padding kartu | 16px (form: 20px) |
| Jarak antar elemen form | 16px; antar bagian 24px |
| Jarak antar bagian landing | 56px |
| Radius | Kartu 16px, tombol 12px, input 10px, lembar 4px, bottom sheet 20px (atas) |
| Grid | 1 kolom; dua kolom hanya untuk pasangan **pendek** (mis. chip, angka) |

### 3.4 Target sentuh

| Elemen | Minimum |
|---|---|
| Tombol utama | tinggi **52px** (landing) / **48px** (dashboard) |
| Input, select, tab | tinggi **48px** |
| Ikon-tombol, menu ⋯ | **44 × 44px** (ikon boleh 20–24px dengan area sentuh diperluas) |
| Item daftar/tabel yang bisa diketuk | tinggi baris ≥ 56px |
| Jarak antar target | ≥ 8px |

### 3.5 Tipografi mobile

| Token | Mobile | Catatan |
|---|---|---|
| `display` (hero) | `clamp(32px, 8.5vw, 40px)` / 1.15 / 800 | Maks 4 baris di 360px; "Bapak/Ibu" tidak terbelah |
| `h2` | 26px / 1.2 / 800 | Judul bagian landing |
| `app-h1` | 24px / 1.2 / 800 | Judul halaman dashboard |
| `h3` / judul kartu | 18px / 700 | |
| `body-lg` | 17px / 1.55 | Sub-headline |
| `body` | **16px** / 1.6 | **Minimum untuk bacaan.** Input juga 16px (mencegah zoom otomatis di iOS) |
| `ui` | 15px / 600 | Tab, label, nav |
| `helper` | 13–14px | **Tidak lebih kecil dari 13px** |
| `doc` (isi lembar) | 15–16px / 1.65, Source Serif 4 | Di layar baca draf: 16px |

- Teks sekunder minimal **Abu Tinta `#4A5568`** (≈ 7:1 di atas putih). Tidak ada abu lebih pucat untuk teks yang perlu dibaca.
- Panjang baris di HP otomatis pendek; jangan tambah `max-width` yang membuat teks sempit.

### 3.6 Gerakan

- Hanya `opacity` dan `transform` yang dianimasikan (murah bagi CPU).
- Satu momen otomatis: lembar RPP di hero, dan itu pun hanya saat terlihat (§5.2).
- Aktifkan mode statis jika `prefers-reduced-motion` **atau** `navigator.connection.saveData` aktif.
- Transisi bottom sheet: 220ms `ease-out`, naik dari bawah.

---

## 4. Pola Komponen Mobile

### 4.1 Top bar (dashboard)

- Tinggi **56px**, putih, border bawah 1px Garis. **Tidak lengket**: ikut menggulir naik agar ruang baca tidak hilang.
- Isi: logo 28–32px (kiri), chip kuota "Kuota 3" (kanan), avatar 36px (target sentuh 44px).
- Chip kuota: Mint Tipis, teks navy 14px/700; saat 0 → border dan teks `#B54708`. Mengetuk membuka **Paket & kuota**.
- Mengetuk avatar membuka **bottom sheet akun** (§6.6).

### 4.2 Tab bar bawah (dashboard)

```
┌────────────────────────────────────┐
│  ▣ Buat      ▢ Draf      ▢ Paket   │  64px + safe-area
└────────────────────────────────────┘
```

- Tiga tab sama lebar. Ikon 24px + label 12–13px/600 (satu-satunya tempat 12px, hanya label tab).
- Aktif: ikon di dalam pil Mint Tipis 56 × 32px, ikon Teal Dalam, label navy 700. Tidak aktif: Abu Tinta.
- Tetap (fixed) di bawah, latar putih, border atas 1px Garis.
- **Disembunyikan** saat: keyboard terbuka, layar detail/hasil draf (diganti bar aksi), dan bottom sheet terbuka.
- Konten halaman diberi `padding-bottom: calc(64px + env(safe-area-inset-bottom) + 16px)`.

### 4.3 Bottom sheet

Dipakai untuk: pilih mata pelajaran, filter daftar, menu akun, konfirmasi hapus.

| Item | Spesifikasi |
|---|---|
| Bentuk | Radius atas 20px, handle 36 × 4px abu di tengah, `max-height: 85dvh` |
| Latar belakang | Scrim navy 40% |
| Menutup | Ketuk scrim, tombol Tutup (X) 44px, geser ke bawah pada handle, **tombol Back**, Esc |
| Fokus | Terkunci di dalam sheet, kembali ke pemicu saat ditutup |
| Back | Saat dibuka, `history.pushState`; Back menutup sheet, bukan meninggalkan halaman |
| Isi panjang | Menggulir di dalam sheet; header (judul + pencarian) tetap |
| Aksi utama | Di dasar sheet, tinggi 48px, penuh lebar, di atas safe-area |

### 4.4 Kontrol form di HP

| Kontrol | Perilaku mobile |
|---|---|
| **Kelas** | `<select>` asli bergaya (12 pilihan, picker bawaan OS paling cepat dan familiar) |
| **Mata pelajaran** | Tombol berbentuk field → **bottom sheet** berisi pencarian + daftar baris 56px, tanda centang pada pilihan |
| **Topik** | `<input type="text">`, `enterkeyhint="next"`, `autocapitalize="sentences"`, placeholder contoh |
| **Alokasi waktu** | `inputmode="numeric"` `pattern="[0-9]*"`, sufiks "menit", **chip cepat** yang bisa digeser horizontal (tanpa scrollbar) |
| **Konteks kelas** | Collapsible; `<textarea>` 4 baris, `enterkeyhint="done"` |
| **Cara menyusun** | Segmented control penuh lebar (dua segmen), penjelas satu baris di bawahnya |
| Label | Di atas field, 14px/600 navy. Tidak memakai placeholder sebagai label |
| Error | Pesan di bawah field + ikon; saat kirim gagal validasi, **gulir dan fokuskan field pertama yang salah** (beri `scroll-margin-top: 80px`) |
| Autofill | `autocomplete` yang sesuai di tempat relevan; matikan (`off`) untuk topik |

Semua field 48px, font 16px. Pasangan Kelas + Mapel **bertumpuk** di HP (nama mapel panjang tidak boleh terpotong).

### 4.5 Tombol

- Landing: tombol utama 52px, **penuh lebar** di HP, sekunder di bawahnya (jarak 12px).
- Dashboard: tombol utama 48px penuh lebar di dalam form.
- Label berubah sesuai status ("Buat draf", "Menyusun…", "Coba lagi").
- Tidak ada tombol yang hanya berupa ikon tanpa label kecuali ⋯, X, dan kembali (dengan `aria-label`).

### 4.6 Banner dan toast

- **Banner:** teks (maks 2 baris) lalu tombol penuh lebar di bawah teks, di dalam banner. Satu banner pada satu waktu.
- **Toast:** muncul **di atas tab bar** (`bottom: calc(64px + safe-area + 12px)`), lebar penuh dikurangi 16px, 4 detik, bisa memuat satu aksi ("Buka").

### 4.7 Daftar (pengganti tabel)

Tabel diganti **kartu baris** di HP:

```
┌──────────────────────────────┐
│ Memahami isi cerita pendek ⋯ │  ← judul maks 2 baris
│ B. Indonesia · Kelas 1       │
│ 18 Okt 2026                  │
└──────────────────────────────┘
```

Seluruh kartu bisa diketuk. Menu ⋯ adalah area terpisah 44px.

### 4.8 Skeleton, loading, kosong

- Skeleton baris untuk daftar; **lembar menulis** untuk draf (bukan spinner).
- Empty state memakai lembar kecil bersudut lipatan + satu kalimat + satu tombol. Tinggi maksimum ±240px agar tidak mendorong aksi keluar layar.

---

## 5. Landing Page di HP

Urutan bagian sama dengan v2, tetapi dirancang untuk 360px.

### 5.1 Navbar

```
┌──────────────────────────┐
│ [logo]          [Coba gratis] │  56px, lengket? tidak
└──────────────────────────┘
```

- Tinggi 56px. **Logo kiri (tinggi 28–32px), satu CTA kanan.** Tanpa hamburger: tautan Contoh/Cara kerja/Paket/FAQ dipindah ke footer dan dijangkau dengan menggulir.
- Tidak lengket (hemat ruang). Setelah hero, muncul **bar CTA lengket** di bawah (§5.9).
- Tombol CTA 44px.

### 5.2 Hero

```
┌──────────────────────────┐
│ RPP siap dipakai,        │  32–36px / 800
│ tinggal Bapak/Ibu        │
│ sesuaikan.               │
│                          │
│ Isi mata pelajaran,      │  17px, maks 3–4 baris
│ kelas, dan topik. Draf   │
│ lengkap tersusun, Anda   │
│ tinggal memeriksa.       │
│                          │
│ [   Coba gratis     ]    │  52px, penuh lebar
│ [ Lihat contoh RPP  ]    │  sekunder
│ ▫ Bisa diedit, unduh PDF │
├──────────────────────────┤  ← bidang Mint Tipis penuh lebar
│ [IPAS][Mat][B.Indo] →    │  tab geser
│ ┌──────────────────────┐ │
│ │ ✦ Menyusun…        ◥ │ │  ← lembar mengintip di layar pertama
│ │ Modul ajar           │ │
│ │ Siklus Air …         │ │
```

**Aturan:**

- Di 360 × 740, **bagian atas lembar (≥ 120px) sudah terlihat tanpa menggulir** sebagai petunjuk ada demo di bawahnya.
- Padding atas hero 24px, antara tombol dan meja mint 32px.
- Sub-headline maksimal 2 kalimat, 4 baris.
- Tombol sekunder berupa **outline** (bukan teks) agar tetap mudah diketuk.
- **Lembar:** lebar penuh dikurangi padding, tinggi **420px**, `overflow: hidden`, 80px terbawah memudar. Tidak ada offset/overlap seperti di desktop.
- **Tab contoh:** satu baris geser horizontal dengan `scroll-snap`, tinggi 44px, tanpa scrollbar; tab aktif otomatis digulirkan ke tengah.
- **Animasi menulis:**
  - Konten lembar **sudah ada di HTML dalam keadaan selesai** (untuk LCP dan tanpa JS).
  - Animasi dimulai **sekali**, saat lembar ≥ 50% terlihat (`IntersectionObserver`), berupa munculnya bagian satu per satu dengan `opacity` (bukan mengetik per huruf), total ≤ 3 detik.
  - Dilewati jika `prefers-reduced-motion`, `saveData`, atau tab tidak aktif.
  - Mengganti tab: isi diganti dengan transisi `opacity` 150ms, tanpa menulis ulang panjang.

### 5.3 Cara kerja

Stepper vertikal: nomor bulat 32px di kiri, garis penghubung 2px Garis, judul 18px/700, deskripsi 16px. Tiga langkah, tanpa kartu.

### 5.4 Contoh dokumen

- Lembar penuh lebar (tinggi bebas, maks ±560px, fade di bawah) di atas bidang Mint Tipis.
- **Anotasi di HP berupa penanda angka di lembar** (lingkaran teal 24px bernomor ① ② ③) dan **daftar keterangan di bawah lembar**, bukan garis samping seperti desktop.
- Tombol "Unduh contoh (PDF)" penuh lebar di bawah daftar.

### 5.5 Keunggulan

Baris bertumpuk: judul 18px/700 + satu kalimat. Potongan UI kecil di bawah teks bila ada, lebar penuh. Tanpa grid dua kolom.

### 5.6 Paket & biaya

- Dua kartu **bertumpuk**, urutan Mandiri lalu Semester, tinggi masing-masing ringkas (±200px): nama, harga 28px/800, "15 kuota · ±Rp 1.667/draf", tombol penuh lebar.
- Paket yang disarankan: border Teal Ruang 2px.
- Tidak ada tabel perbandingan lebar di HP; jika diperlukan, tampilkan sebagai 3–4 baris "label: nilai".
- Jika pembelian belum dibuka: satu catatan di atas kartu, kartu menampilkan "Segera dibuka".

### 5.7 FAQ

Accordion baris penuh lebar, tinggi ≥ 56px, `button` + `aria-expanded`, ikon plus/minus 24px di kanan. Satu terbuka pada satu waktu.

### 5.8 CTA penutup dan footer

Navy. Satu kalimat, satu tombol penuh lebar. Footer: logo versi gelap, tautan bertumpuk (Contoh dokumen, Cara kerja, Paket & biaya, FAQ, **Masuk pengelola**), setiap tautan tinggi 44px.

### 5.9 Bar CTA lengket

- Muncul setelah tombol CTA hero keluar dari layar; menghilang saat bagian CTA penutup terlihat.
- Tinggi 64px + safe-area, putih, border atas 1px Garis, berisi satu tombol **Coba gratis** penuh lebar.
- Tidak muncul di dashboard.

### 5.10 Pratinjau tautan (WhatsApp)

Karena tautan sering dibagikan di grup:

- `og:title` ≤ 60 karakter: "ruangRPP — RPP siap dipakai, tinggal Anda sesuaikan".
- `og:description` ≤ 110 karakter.
- `og:image` **1200 × 630**, ukuran file **≤ 300 KB**, berisi logo, headline, dan sepotong lembar RPP. `og:image:alt` diisi.
- `theme-color` meta: putih atau Teal Dalam untuk bilah browser Android.
- Uji dengan menempel tautan di WhatsApp sebelum rilis.

---

## 6. Dashboard di HP

### 6.1 Kerangka

```
┌─────────────────────────┐
│ [logo]     [Kuota 3] (F)│  56px, tidak lengket
├─────────────────────────┤
│ Buat draf modul ajar    │  24px/800
│ (banner status)         │
│ … konten …              │
├─────────────────────────┤
│ ▣ Buat │ ▢ Draf │ ▢ Paket│  tab bar 64px, fixed
└─────────────────────────┘
```

Latar Kanvas, kartu putih. Semua halaman satu kolom.

### 6.2 Buat draf

```
┌─────────────────────────┐
│ Buat draf modul ajar    │
│ ┌─ banner ────────────┐ │
│ │ Mulai dengan 3      │ │
│ │ kuota gratis.       │ │
│ │ [   Aktifkan   ]    │ │
│ └─────────────────────┘ │
│ ┌─ kartu form ────────┐ │
│ │ Cara menyusun       │ │
│ │ [Langsung|Dokumen]  │ │
│ │ Kelas               │ │
│ │ [Kelas 1        ▾]  │ │
│ │ Fase A              │ │
│ │ Mata pelajaran      │ │
│ │ [Bahasa Indonesia ›]│ │ ← buka bottom sheet
│ │ Topik atau materi   │ │
│ │ [Memahami isi cerpen]│ │
│ │ Alokasi waktu       │ │
│ │ [70      ] menit    │ │
│ │ (35)(70)(105)(140)→ │ │
│ │ + Tambah konteks    │ │
│ │ [   Buat draf    ]  │ │
│ │ Memakai 1 kuota.    │ │
│ │ Jika gagal, tidak   │ │
│ │ terpotong.          │ │
│ │ 🔒 Topik dikirim ke │ │
│ │ penyedia AI.        │ │
│ └─────────────────────┘ │
│ Draf terakhir  Semua →  │
│ [kartu baris] [kartu]   │
└─────────────────────────┘
```

**Aturan:**

- **Tidak ada panel hasil di sebelah form** (tidak muat). Hasil memakai **layar penuh** (§6.3).
- Tombol "Buat draf" **tidak lengket**; ia berada di akhir form. Tab bar sudah menempati dasar layar, menumpuk dua bar membuat ruang kerja terlalu sempit.
- Keyboard terbuka → tab bar disembunyikan.
- **Isian form disimpan otomatis di perangkat** (localStorage atau serupa) dan dipulihkan jika halaman dimuat ulang atau tab ditutup. Dihapus setelah draf berhasil disimpan.
- Banner status (§7 dashboard guideline) tampil di atas kartu form; teks maks 2 baris, tombol penuh lebar di dalam banner.
- Kuota 0: banner "Kuota habis." + **Lihat paket**; tombol "Buat draf" nonaktif dengan alasan tertulis tepat di bawahnya.
- Tinggi total form ≈ 640px; boleh menggulir satu layar. Tidak perlu membagi menjadi langkah (wizard) untuk lima isian.

### 6.3 Menyusun dan hasil draf (layar penuh)

Setelah mengetuk **Buat draf**, navigasi ke `/app/draf/[id]` (layar hasil) **segera**, bukan menunggu selesai.

```
┌─────────────────────────┐
│ ‹        Draf       ⋯   │  top bar 56px
├─────────────────────────┤
│ ✦ Menyusun tujuan       │  status 1 baris
│   pembelajaran…         │
│ ┌─────────────────────┐ │
│ │ Modul ajar        ◥ │ │
│ │ Memahami isi cerpen │ │
│ │ Identitas modul     │ │
│ │ Mapel   B. Indonesia│ │
│ │ Kelas   1 (Fase A)  │ │
│ │ Waktu   70 menit    │ │
│ │ ▾ Tujuan pembelaj.  │ │  ← bagian bisa dilipat
│ │ ▾ Kegiatan          │ │
│ │ ▾ Asesmen           │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ [ Unduh PDF ] [ Word ]  │  bar aksi lengket 72px (tab bar disembunyikan)
└─────────────────────────┘
```

**Aturan:**

- Layar ini **tidak memakai tab bar**; diganti **bar aksi lengket** di bawah.
- Bar aksi: **Unduh PDF** (utama, ±60% lebar) + **Word** (sekunder) + tombol ⋯ untuk "Bagikan", "Salin teks". Alasan PDF utama: dapat dibuka di semua HP tanpa aplikasi tambahan, Word membutuhkan aplikasi.
- **Bagikan** memakai Web Share API bila tersedia (mengirim file ke WhatsApp, Drive, dll.). Jika tidak tersedia, tombol disembunyikan, bukan dinonaktifkan.
- **Selama menyusun:** bar aksi menampilkan **Batalkan** (sekunder) dan tombol unduh nonaktif. Kuota tidak terpotong jika dibatalkan atau gagal.
- **Bagian lembar bisa dilipat** (accordion), kecuali Identitas. Di bawah top bar ada baris **chip lompat** (Tujuan · Kegiatan · Asesmen) yang menggulir ke bagian tersebut; chip ikut lengket di bawah top bar saat menggulir.
- **Tabel dalam dokumen** (mis. rubrik, rincian kegiatan) di HP ditampilkan **bertumpuk per baris** ("Label: isi"), bukan tabel lebar. Bila terpaksa tabel, bungkus dalam container `overflow-x: auto` dengan bayangan tepi sebagai petunjuk geser.
- Teks dokumen 16px Source Serif 4, lebar penuh, padding lembar 20px.
- **Jika pengguna meninggalkan layar** (berpindah aplikasi, mengunci layar): draf tetap diproses di server dan muncul di **Draf saya** berstatus "Menyusun…" lalu "Selesai". Teks di layar: "Anda boleh meninggalkan halaman ini. Draf akan tersimpan di Draf saya." *(Bergantung pada kemampuan backend; lihat §13.)*
- Setelah selesai: toast "Draf tersimpan. 1 kuota terpakai." dan fokus ke judul.
- Gagal: kartu error di tempat lembar, "Draf gagal disimpan. Kuota Anda tidak terpotong." + **Coba lagi** (penuh lebar). Isian form tidak hilang.

### 6.4 Draf saya

```
┌─────────────────────────┐
│ Draf saya     [+ Buat]  │
│ [🔍 Cari judul…   ][⚙] │  ← ⚙ membuka sheet filter
│ ┌─────────────────────┐ │
│ │ Memahami isi cerpen⋯│ │
│ │ B. Indonesia · Kls 1│ │
│ │ 18 Okt              │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Siklus air        ⋯ │ │
│ …                       │
│ [   Muat lebih banyak ] │
└─────────────────────────┘
```

- Pencarian 48px; filter Kelas dan Mapel di **bottom sheet** (bukan dua dropdown di baris).
- Daftar kartu baris (§4.7). Menu ⋯ → bottom sheet: Unduh PDF, Unduh Word, Bagikan, Hapus.
- **Hapus** → bottom sheet konfirmasi: "Hapus draf ini?", tombol **Hapus** (merah) dan **Batal**; fokus awal pada Batal.
- Pagination diganti tombol **Muat lebih banyak** (10 per kali). Tidak ada nomor halaman, tidak ada infinite scroll otomatis (hemat data, mudah diakses).
- Draf berstatus "Menyusun…" menampilkan baris status dengan percikan dan dapat diketuk untuk melihat progres.
- Kosong: lembar kecil + "Belum ada draf. Buat yang pertama." + tombol **Buat draf**. Pencarian dan filter disembunyikan saat belum ada draf.

### 6.5 Paket & kuota

```
┌─────────────────────────┐
│ Paket & kuota           │
│ ┌─ Kuota Anda ────────┐ │
│ │ 0   kuota tersisa   │ │
│ └─────────────────────┘ │
│ ┌─ Coba dulu ─────────┐ │
│ │ 3 kuota gratis,     │ │
│ │ sekali per akun.    │ │
│ │ [ Aktifkan 3 kuota ]│ │
│ └─────────────────────┘ │
│ Pilih paket             │
│ ┌─ Mandiri ───────────┐ │
│ │ Rp 25.000           │ │
│ │ 15 kuota · ±Rp1.667 │ │
│ │ [  Beli paket   ]   │ │
│ └─────────────────────┘ │
│ ┌─ Semester ──────────┐ │ ← border teal 2px
│ │ Rp 65.000           │ │
│ │ 50 kuota · ±Rp1.300 │ │
│ │ [  Beli paket   ]   │ │
│ └─────────────────────┘ │
│ Riwayat pembayaran      │
│ Belum ada transaksi.    │
└─────────────────────────┘
```

- Angka kuota 32px/800. Bila kuota gratis sudah dipakai, kartu "Coba dulu" menyusut menjadi satu baris.
- Riwayat pembayaran: **kartu baris** (Pesanan, Paket, Jumlah, Status badge, tombol **Periksa pembayaran** bila menunggu), bukan tabel.
- Kotak info "Sudah membayar tapi status menunggu?" hanya muncul bila ada transaksi menunggu.
- Sandbox/uji coba: satu bar tipis di bagian paling atas app (tinggi 36px, 13–14px), bukan di tiap kartu.

### 6.6 Menu akun (bottom sheet)

```
        ───
 (F)  Felix Natanael Butarbutar
      felixnatb@gmail.com
      Masuk dengan Google
 ─────────────────────────
 [ Keluar ]
```

Baris "Keluar" tinggi 56px. Tidak ada halaman akun terpisah.

---

## 7. Alur Kritis di HP

### 7.1 Login Google di browser dalam aplikasi

Sebagian browser dalam aplikasi (mis. Instagram, Facebook, TikTok) dapat **memblokir login Google** dengan galat user-agent. Perlakuan:

- Deteksi in-app browser lewat user-agent pada halaman login.
- Jika terdeteksi, tampilkan banner di atas tombol login: **"Untuk masuk dengan Google, buka halaman ini di Chrome atau Safari."** dengan tombol **Salin tautan**.
- Tombol "Masuk dengan Google" tetap ada, tetapi di bawah banner.
- Uji nyata: tautan yang dibuka dari WhatsApp, Instagram, Facebook, TikTok, Telegram, dan Chrome langsung.

### 7.2 Pembayaran lewat e-wallet / aplikasi bank

- Pengguna berpindah ke aplikasi pembayaran lalu kembali ke browser.
- Saat halaman kembali aktif (`visibilitychange` → visible, atau saat memuat halaman hasil pembayaran), **periksa status otomatis** sekali dan tampilkan status terbaru.
- Teks: "Kami memeriksa status pembayaran Anda…" lalu hasilnya. Tombol **Periksa pembayaran** tetap tersedia.
- Pesan jelas: "Jangan membayar ulang jika status masih menunggu."
- Kuota baru aktif setelah pembayaran **terkonfirmasi server**, bukan sekadar kembali dari halaman pembayaran.

### 7.3 Jaringan putus atau lambat

| Situasi | Perilaku |
|---|---|
| Offline saat membuka halaman | Halaman sederhana: "Tidak ada koneksi. Isian Anda aman di perangkat." + **Coba lagi** |
| Putus saat "Buat draf" | Status gagal yang menenangkan: "Koneksi terputus. Kuota Anda tidak terpotong." + **Coba lagi**; isian tidak hilang |
| Lambat | Skeleton dan status "Menyusun tujuan pembelajaran…"; jangan menampilkan spinner kosong lebih dari 1 detik tanpa teks |
| Kembali online | Banner kecil "Terhubung kembali" otomatis hilang dalam 3 detik |

### 7.4 Tombol Back dan navigasi

- Sheet, filter, dan menu akun mendorong state riwayat; Back menutupnya.
- Dari layar hasil draf, Back kembali ke halaman sebelumnya (Buat draf atau Draf saya), tidak keluar aplikasi.
- Posisi gulir daftar dipulihkan saat kembali.

### 7.5 Unduh dan berbagi

- Setelah unduh berhasil: toast "PDF berhasil diunduh" dengan aksi **Buka**.
- Nama file otomatis dan bermakna: `Modul-Ajar_IPAS_Kelas-5_Siklus-Air.pdf`.
- PDF harus terbaca baik di layar kecil (margin wajar, font ≥ 11pt) dan tercetak A4.
- Word (.docx) memakai gaya Judul/Isi standar agar mudah diedit di Word, Google Docs, atau WPS.

---

## 8. Performa dan Jaringan (Anggaran)

Ukur pada profil: **Moto G Power/Android kelas menengah, Slow 4G, CPU 4× lebih lambat**.

| Metrik | Target |
|---|---|
| LCP landing | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.05 (tinggi lembar dan font dicadangkan) |
| JS awal landing (gzip) | ≤ 150 KB |
| JS awal dashboard (gzip) | ≤ 200 KB |
| Total berat landing (tanpa cache) | ≤ 500 KB |
| Gambar | Hanya SVG dan `og:image`; **tanpa gambar hero** |
| Lighthouse (mobile) | Performance ≥ 90, Accessibility ≥ 95 |

**Taktik:**

- **Font:** Nunito variabel *subset latin*, `woff2`, `font-display: swap`, dengan `size-adjust` pada fallback agar tidak ada lompatan layout. **Source Serif 4** hanya dua bobot (400/600), subset latin, dimuat saat lembar mendekati terlihat.
- **Render:** konten lembar demo ada di HTML (SSR/SSG), animasi ditambahkan setelahnya.
- **Kode:** pisahkan (code-split) editor dan ekspor; muat halaman Paket hanya saat dibuka; tanpa pustaka animasi besar.
- **Cache:** aset berfingerprint dengan cache panjang; halaman landing dapat di-cache di CDN.
- **Data hemat:** respek `saveData`; jangan memuat video atau animasi latar.
- **Ikon:** SVG inline atau sprite, bukan font ikon.
- **Opsional (PWA ringan):** `manifest` dengan ikon dari logo agar bisa "Tambahkan ke layar utama", `theme-color`, dan halaman offline sederhana. Tidak perlu mode offline penuh.

---

## 9. Aksesibilitas di HP

- Kontras teks ≥ 4.5:1; untuk teks bacaan gunakan Abu Tinta atau lebih gelap (target ≈ 7:1).
- Ukuran teks mengikuti pengaturan OS; uji pada **130%** dan **200%** (layout tidak patah, tombol tetap terlihat).
- Fokus terlihat untuk pengguna keyboard Bluetooth; urutan fokus logis.
- Pembaca layar (TalkBack/VoiceOver): tab bar `nav` dengan `aria-current="page"`; bottom sheet `role="dialog"` dengan `aria-modal`; status penyusunan di wilayah `aria-live="polite"`.
- Banner error `role="alert"`; info `role="status"`.
- Tidak ada informasi yang hanya dibedakan warna: badge status selalu bertuliskan teks.
- Tidak ada gestur wajib (swipe, long-press); semua aksi punya tombol biasa.
- Target sentuh sesuai §3.4.

---

## 10. Kerangka CSS Mobile-First dan Snippet

```css
:root {
  /* token dari guideline sebelumnya + */
  --kanvas: #F4F9F8;
  --topbar-h: 56px;
  --tabbar-h: 64px;
  --control-h: 48px;
  --safe-b: env(safe-area-inset-bottom, 0px);
  --safe-t: env(safe-area-inset-top, 0px);
}

html { -webkit-text-size-adjust: 100%; }
body { font: 400 16px/1.6 var(--font-ui); color: var(--navy-rpp); background: var(--kertas); }

/* Landing */
.container { padding-inline: 20px; margin-inline: auto; max-width: 1200px; }
.hero h1 { font-size: clamp(32px, 8.5vw, 40px); line-height: 1.15; font-weight: 800; text-wrap: balance; }
.hero .nw { white-space: nowrap; }
.btn-primary { min-height: 52px; width: 100%; }

/* Dashboard shell (HP dulu) */
.app { background: var(--kanvas); min-height: 100dvh; }
.topbar { height: var(--topbar-h); padding: var(--safe-t) 16px 0; display:flex; align-items:center; justify-content:space-between;
          background:#fff; border-bottom:1px solid var(--garis); }       /* tidak sticky */
.main { padding: 16px 16px calc(var(--tabbar-h) + var(--safe-b) + 16px); }
.tabbar { position: fixed; inset: auto 0 0 0; height: calc(var(--tabbar-h) + var(--safe-b)); padding-bottom: var(--safe-b);
          display:grid; grid-template-columns: repeat(3, 1fr); background:#fff; border-top:1px solid var(--garis); z-index: 20; }
.tab { display:grid; place-items:center; gap:2px; font: 600 12px var(--font-ui); color: var(--abu-tinta); min-height: 48px; }
.tab[aria-current="page"] { color: var(--navy-rpp); font-weight: 700; }
.tab[aria-current="page"] .pill { background: var(--mint-tipis); color: var(--teal-dalam); }
.pill { width: 56px; height: 32px; border-radius: 16px; display:grid; place-items:center; }

.input, .select, .field-btn { height: var(--control-h); font-size: 16px; }   /* 16px mencegah zoom iOS */

/* Bottom sheet */
.sheet { position: fixed; inset: auto 0 0 0; max-height: 85dvh; background:#fff;
         border-radius: 20px 20px 0 0; padding: 8px 16px calc(16px + var(--safe-b)); overflow:auto;
         transform: translateY(0); transition: transform .22s ease-out; z-index: 40; }
.scrim { position: fixed; inset: 0; background: rgba(23,43,85,.4); z-index: 30; }

/* Desktop = peningkatan */
@media (min-width: 1024px) {
  .app { display:grid; grid-template-columns: 248px 1fr; }
  .tabbar { display:none; }
  .main { padding: 32px 40px 64px; }
  .btn-primary { width: auto; }
  .hero h1 { font-size: 48px; }
}

@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```

```js
// Sembunyikan tab bar saat keyboard terbuka
const vv = window.visualViewport;
vv?.addEventListener('resize', () => {
  const keyboardOpen = vv.height < window.innerHeight * 0.75;
  document.querySelector('.tabbar')?.toggleAttribute('hidden', keyboardOpen);
});

// Deteksi browser dalam aplikasi (login Google dapat gagal di sini)
const ua = navigator.userAgent || '';
const inApp = /FBAN|FBAV|Instagram|TikTok|musical_ly|Line\//i.test(ua);

// Periksa status pembayaran saat kembali dari aplikasi e-wallet
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && window.__hasPendingPayment) checkPaymentStatus();
});

// Bottom sheet menutup dengan tombol Back
function openSheet(id) { history.pushState({ sheet: id }, ''); /* tampilkan sheet */ }
window.addEventListener('popstate', () => { /* tutup sheet jika terbuka */ });

// Hormati hemat data dan reduced motion untuk animasi hero
const lowData = navigator.connection?.saveData === true;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const shouldAnimate = !lowData && !reduce;
```

---

## 11. Matriks Pengujian dan Checklist

### 11.1 Perangkat dan skenario

| # | Uji | Ukuran / kondisi |
|---|---|---|
| 1 | Android Chrome, layar utama | **360 × 800** |
| 2 | Android Chrome, layar lebar | 412 × 915 |
| 3 | iPhone Safari | 390 × 844 (dan 375 × 667 untuk layar kecil) |
| 4 | Layar sangat kecil | 320 × 568 (tidak boleh ada scroll horizontal) |
| 5 | Landscape | 800 × 360 dengan keyboard terbuka di form |
| 6 | Ukuran font OS | 130% dan 200% |
| 7 | Jaringan | Slow 4G + CPU 4× lebih lambat; mode pesawat saat membuat draf |
| 8 | Browser dalam aplikasi | Tautan dibuka dari WhatsApp, Instagram, Facebook, TikTok |
| 9 | Pembayaran | Pergi ke aplikasi e-wallet/bank lalu kembali |
| 10 | Pratinjau tautan | Tempel di WhatsApp, cek gambar dan teks |
| 11 | Perangkat nyata | Minimal satu Android kelas menengah dan satu iPhone |

### 11.2 Checklist

**Landing**
- [ ] Tidak ada scroll horizontal di 320px
- [ ] Headline ≤ 4 baris di 360px, "Bapak/Ibu" tidak terbelah
- [ ] CTA utama terlihat tanpa menggulir; bagian atas lembar mengintip di layar pertama
- [ ] Tombol utama 52px, penuh lebar
- [ ] Demo menulis hanya saat terlihat dan mati pada reduced-motion / saveData
- [ ] Bar CTA lengket muncul setelah hero dan hilang di CTA penutup
- [ ] Anotasi contoh dokumen berupa penanda angka + daftar di bawah
- [ ] `og:image` 1200×630 ≤ 300 KB, pratinjau WhatsApp benar
- [ ] Tautan "Masuk pengelola" ada di footer, bukan navbar

**Dashboard**
- [ ] Top bar tidak lengket, tab bar bawah 3 item dengan area sentuh ≥ 48px
- [ ] Kuota selalu terlihat (chip di top bar)
- [ ] Form satu kolom, field 48px, font 16px, tidak ada teks terpotong
- [ ] Mapel memakai bottom sheet dengan pencarian
- [ ] Isian form tersimpan di perangkat dan pulih setelah muat ulang
- [ ] Layar hasil penuh dengan bar aksi lengket (PDF utama, Word, Bagikan bila tersedia)
- [ ] Dokumen mudah dibaca: bagian dapat dilipat, chip lompat, tabel tidak melebar
- [ ] Daftar draf berupa kartu baris, "Muat lebih banyak", hapus lewat sheet konfirmasi
- [ ] Riwayat pembayaran berupa kartu, bukan tabel
- [ ] Back menutup sheet; tidak keluar aplikasi tak sengaja
- [ ] Tab bar tersembunyi saat keyboard terbuka

**Alur kritis**
- [ ] Banner "buka di Chrome/Safari" muncul pada in-app browser tertentu
- [ ] Status pembayaran dicek otomatis saat kembali dari aplikasi pembayaran
- [ ] Putus jaringan saat membuat draf: pesan menenangkan, kuota tidak terpotong, isian aman

**Performa & aksesibilitas**
- [ ] LCP ≤ 2.5 s, CLS ≤ 0.05, JS awal sesuai anggaran
- [ ] Kontras teks bacaan ≈ 7:1 (Abu Tinta atau lebih gelap)
- [ ] Layout utuh pada font 200%
- [ ] Semua aksi tersedia tanpa gestur dan tanpa hover

---

## 12. Prompt untuk AI Coding Agent (Refaktor Mobile-First)

Jalankan berurutan pada kode yang sudah ada. Berhenti dan periksa di 360 × 800 setelah tiap langkah.

**Langkah 1: Fondasi mobile-first**
```
Baca ruangRPP-Mobile-First-UIUX.md §3 dan §10. Ubah CSS global menjadi
mobile-first (min-width), tag viewport dengan viewport-fit=cover, gunakan dvh
dan safe-area inset, input dan select berfont 16px tinggi 48px, tombol utama
52px (landing) / 48px (dashboard), skala tipografi mobile §3.5. Tidak boleh ada
scroll horizontal di 320px. Jangan mengubah logika.
```

**Langkah 2: Landing di HP**
```
Baca §5. Revisi landing untuk 360px: navbar 56px (logo + satu CTA, tanpa
hamburger), hero sesuai §5.2 (CTA penuh lebar, tab contoh geser dengan
scroll-snap, lembar 420px dengan fade, bagian atas mengintip di layar pertama),
animasi menulis hanya saat terlihat via IntersectionObserver dan dilewati pada
reduced-motion/saveData, cara kerja sebagai stepper vertikal, contoh dokumen
dengan penanda angka + legenda di bawah, paket bertumpuk, FAQ accordion 56px,
bar CTA lengket setelah hero. Tambahkan meta og:* dan theme-color (§5.10).
```

**Langkah 3: Kerangka dashboard HP**
```
Baca §4 dan §6.1. Buat top bar 56px tidak lengket (logo, chip kuota, avatar),
tab bar bawah 64px+safe-area (Buat, Draf, Paket) yang disembunyikan saat
keyboard terbuka, dan komponen BottomSheet (scrim, handle, Back menutup lewat
history.pushState, fokus terkunci). Pindahkan menu akun ke bottom sheet.
Di ≥1024px kembali ke sidebar 248px.
```

**Langkah 4: Form dan pemilih**
```
Baca §4.4 dan §6.2. Form Buat draf satu kolom: segmented control, Kelas select
asli, Mata pelajaran lewat bottom sheet pencarian, Topik, Alokasi waktu
(inputmode numeric + chip geser), collapsible Konteks. Banner status di atas
form dengan tombol penuh lebar. Simpan isian di perangkat dan pulihkan saat
dimuat ulang. Fokuskan dan gulir ke field pertama yang tidak valid.
```

**Langkah 5: Layar hasil draf**
```
Baca §6.3. Setelah "Buat draf" segera navigasi ke /app/draf/[id] dengan lembar
yang menulis bertahap, status ✦ satu baris, bagian dapat dilipat, chip lompat
lengket, tabel menjadi baris bertumpuk di HP. Bar aksi lengket: Unduh PDF
(utama), Word, dan ⋯ (Bagikan via Web Share API jika tersedia, Salin teks).
Tab bar disembunyikan di layar ini. Tangani gagal/batal tanpa memotong kuota.
```

**Langkah 6: Draf saya dan Paket**
```
Baca §6.4 dan §6.5. Daftar draf sebagai kartu baris dengan pencarian, filter di
bottom sheet, "Muat lebih banyak", hapus lewat sheet konfirmasi. Halaman Paket:
kartu Kuota, kartu Coba dulu, dua kartu paket bertumpuk, riwayat pembayaran
sebagai kartu. Implementasikan pengecekan status pembayaran otomatis saat
visibilitychange (§7.2).
```

**Langkah 7: Alur kritis dan performa**
```
Baca §7 dan §8. Tambahkan deteksi in-app browser dengan banner "buka di
Chrome/Safari" + Salin tautan di halaman login, penanganan offline dan jaringan
putus, subset font + size-adjust fallback, lazy-load Source Serif 4, code
splitting, dan jalankan Lighthouse mobile dengan throttling. Laporkan LCP, CLS,
ukuran JS awal terhadap anggaran.
```

**Langkah 8: Audit**
```
Audit seluruh halaman terhadap checklist §11.2 pada 360×800, 412×915, 390×844,
320×568, landscape, font 130% dan 200%. Laporkan pelanggaran dengan screenshot
lalu perbaiki.
```

---

## 13. Hal yang Perlu Anda Putuskan

1. **Penyusunan di latar belakang:** apakah server tetap menyusun draf jika pengguna meninggalkan halaman, sehingga hasil muncul di "Draf saya"? Ini menentukan kalimat di §6.3. Jika belum, tampilkan peringatan "Jangan tutup halaman sampai selesai."
2. **Bagikan:** apakah Web Share API (kirim file ke WhatsApp/Drive) masuk target rilis pertama? Rekomendasi: ya, nilai tinggi untuk guru.
3. **PDF vs Word di HP:** apakah PDF dijadikan tombol utama di HP (rekomendasi) atau tetap Word?
4. **Edit di HP:** apakah draf bisa diedit langsung di aplikasi? Jika ya, perlu spesifikasi editor mobile terpisah (toolbar di atas keyboard, simpan otomatis).
5. **PWA:** apakah "Tambahkan ke layar utama" diaktifkan (manifest + ikon)? Murah dikerjakan dan membantu guru kembali dengan cepat.
6. **Notifikasi:** apakah akan ada pemberitahuan saat draf selesai (hanya relevan jika penyusunan di latar belakang)?
7. **Penyedia pembayaran:** metode apa yang dibuka (e-wallet, QRIS, transfer)? Menentukan alur kembali dari aplikasi pembayaran (§7.2).
8. **Mode gelap:** ditunda. Hanya kerjakan setelah semua alur HP stabil.
9. **Data nyata:** pasang analitik ringan (ukuran layar, jenis browser, sumber kunjungan) agar asumsi §1 dapat diverifikasi.
