# Login guru dan tahap berikutnya

Tanggal: 17 Oktober 2026.

## Halaman

| URL lokal | Fungsi |
|---|---|
| http://localhost:3001/ | Landing page yang sudah dibuat tim |
| http://localhost:3001/login | Masuk/daftar guru dengan Google |
| http://localhost:3001/dashboard | Beranda akun guru, memerlukan sesi guru |
| http://localhost:3001/admin | Dashboard pengelola, sesi admin terpisah |
| http://localhost:3001/privasi | Informasi data akun untuk versi pengembangan |

Tautan admin lama seperti `/#models` dialihkan ke `/admin#models`. Tombol publik menuju `/login`. Pilihan paket berbayar ditandai belum tersedia; simulasi checkout tidak mengaktifkan akun/kuota nyata. Tata letak dan aset landing page tim dipertahankan. Salinan sebelum integrasi ada di folder lokal `test-results` yang tidak masuk Git.

## Keputusan login

Gunakan **Google Identity Services (GIS)** dengan tombol resmi Google, mode popup, dan verifikasi ID token oleh library resmi `google-auth` di FastAPI. Ini cukup untuk identitas akun guru; tidak meminta akses Gmail/Drive dan tidak memerlukan penyimpanan kata sandi guru atau client secret untuk alur ini.

Google menjelaskan [tombol dan callback GIS](https://developers.google.com/identity/gsi/web/guides/display-button), [konfigurasi client](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), serta [verifikasi ID token di backend](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token). Identitas akun menggunakan `sub`, bukan pencocokan alamat email.

Yang sudah diimplementasikan:

- Nonce sekali pakai berumur 10 menit, terikat ke cookie browser HttpOnly.
- Pemeriksaan origin untuk permintaan autentikasi guru.
- Pemeriksaan tanda tangan, audience/client ID, issuer, kedaluwarsa, nonce, email terverifikasi dan authorized party bila tersedia.
- Akun guru tersimpan di PostgreSQL, terpisah dari `admin_users`. Email sama tidak memberikan akses admin atau menggabungkan akun.
- Cookie sesi guru HttpOnly, SameSite Strict, maksimal 12 jam. Token sesi di database hanya hash. Login ulang memutar sesi browser saat ini; logout mencabut sesi itu.
- Riwayat masuk/keluar dan daftar guru dapat dilihat admin. Login Google tidak mengaktifkan generator atau paket berbayar.

ID token Google tidak disimpan dalam database/localStorage dan tidak dicatat ke log aplikasi. Nama/email/Google sub disimpan untuk akun, tetapi `sub` tidak dikirim dalam daftar publik profil.

## Mengaktifkan Google untuk uji lokal

1. Di Google Cloud/Google Auth Platform, pilih proyek RuangRPP milik tim. Siapkan branding dan audience untuk pengujian, beserta test users bila status aplikasi masih Testing.
2. Buat OAuth client jenis **Web application**. Pada **Authorized JavaScript origins**, masukkan `http://localhost:3001` (sesuaikan port aktual). Bila juga membuka lewat `127.0.0.1`, daftarkan origin itu secara terpisah sesuai ketentuan Google.
3. Alur yang dipakai adalah GIS popup + JavaScript callback. Tidak ada URL callback OAuth authorization-code di aplikasi ini; jangan mengisi URL fiktif `/auth/callback`.
4. Salin **Client ID**, berakhiran `.apps.googleusercontent.com`, ke `.env` lokal pada baris `GOOGLE_CLIENT_ID=...`. Client ID adalah identitas publik aplikasi; client secret tidak digunakan dalam implementasi ini.
5. Jalankan dari root proyek:

```powershell
docker compose up -d api
```

6. Buka `/login` dengan browser desktop biasa bila browser dalam aplikasi tidak didukung Google. Tombol resmi Google muncul jika client ID sudah dikonfigurasi. Masuk menggunakan akun test user yang sesuai.
7. Setelah berhasil, pastikan `/dashboard` menampilkan nama/email yang benar. Cek `/admin` tetap memerlukan akun pengelola. Uji logout dan penolakan akses setelah sesi berakhir.

Tanpa client ID, halaman menampilkan **login sedang disiapkan**, bukan login palsu. Uji persetujuan Google dengan akun nyata belum dapat dinyatakan berhasil sebelum konfigurasi ini selesai.

## Menjalankan semua layanan dan pengujian

```powershell
docker compose --profile test run --build --rm tests-postgres
docker compose up --build -d
docker compose --profile test stop test-db
```

`init` menambahkan tabel `teacher_accounts`, `teacher_sessions`, dan `google_login_challenges`. Data dokumen tim tetap berada di database/volume sebelumnya.

Troubleshooting:

- Tombol Google tidak muncul: cek `GOOGLE_CLIENT_ID`, jalankan ulang container API, lalu muat ulang `/login`.
- Origin tidak diizinkan: origin browser harus cocok dengan Google Cloud dan `ALLOWED_ORIGINS` FastAPI. HTTP lokal hanya untuk pengembangan; gunakan HTTPS untuk domain rilis.
- Popup diblokir/browser tidak didukung: izinkan popup untuk situs ini atau gunakan browser biasa. Jangan menonaktifkan keamanan browser.
- Percobaan login berakhir: tekan **Coba lagi** untuk nonce baru, lalu masuk kembali.
- Layanan Google gagal dimuat: periksa jaringan atau pemblokir skrip. Tidak ada fallback login yang melewati verifikasi.
- Build font gagal: landing page tim memakai `next/font/google`, sehingga build awal memerlukan koneksi ke layanan font Google.

Sebelum pendaftaran publik: tetapkan kontak pengelola, kebijakan retensi/penghapusan akun, dan ketentuan layanan; tambahkan pembatasan percobaan login yang terpusat, HTTPS/cookie Secure, konfigurasi origin domain, serta pengujian pemulihan backup. Compose saat ini tetap konfigurasi lokal. Akun guru bukan bukti bahwa pemilik akun telah diverifikasi sebagai guru profesional.

## Qdrant dibangun sebelum rilis VPS

Keputusan: lanjutkan **Qdrant lokal melalui Docker** sesudah fondasi akun ini. Tidak menunggu seluruh dokumen terkumpul dan tidak menunggu aplikasi dirilis. Dokumentasi resmi menyediakan [quickstart Docker lokal](https://qdrant.tech/documentation/quickstart/); data lokal harus disimpan pada volume persisten.

| Milestone berikut | Output | Kriteria selesai |
|---|---|---|
| Qdrant lokal | Service Docker internal, volume persisten, health/readiness | Restart tidak menghilangkan indeks; browser publik tidak bisa mengakses Qdrant langsung |
| Chunking sumber | Potongan teks dengan ID dokumen, revisi, mapel, fase, halaman/bagian yang tersedia | Tidak mencampur bagian luar cakupan SD; locator dapat ditelusuri ke sumber |
| Embedding | Adapter embedding, identitas model/dimensi, antrean dan retry | Hanya sumber yang lolos pemeriksaan/izin; retry tidak membuat duplikat |
| Retrieval admin | Pencarian semantik + filter metadata + pratinjau hasil | Sumber nonaktif/revisi lama tidak muncul; hasil kosong memiliki pesan yang jujur |
| Evaluasi awal | Kasus uji dari sedikit dokumen sah yang sudah diperiksa | Guru menilai relevansi sumber sebelum generator memakai indeks |
| Generator | Draf terstruktur, referensi nyata, simpan/edit | Tidak mengarang CP/referensi ketika retrieval tidak memadai |
| VPS | Deployment, backup file/PostgreSQL/Qdrant, pemulihan | Uji pemulihan dan retrieval di server lolos sebelum rilis terbatas |

Model **embedding berbeda tugasnya dari model LLM**. Jangan menganggap pilihan model percakapan di admin otomatis bisa membuat embedding. Model dan dimensi embedding harus dipilih serta dicatat sebelum membuat koleksi Qdrant. Mengganti model embedding memerlukan strategi indeks ulang/koleksi baru; file asli dan metadata tetap disimpan.

Belum ada perubahan ke Qdrant pada tahap login ini. Tidak ada dokumen yang dikirim ke penyedia AI atau ditandai terindeks oleh pekerjaan ini.

## Persiapan Midtrans

Variabel opsional berikut sudah diteruskan ke container API: `MIDTRANS_IS_PRODUCTION` (default `false`), `MIDTRANS_SERVER_KEY`, dan `MIDTRANS_CLIENT_KEY`. Halaman admin **Keuangan** menunjukkan mode yang dipilih dan apakah masing-masing key tersedia, tanpa menampilkan nilainya.

**Ini baru persiapan konfigurasi, bukan integrasi pembayaran.** Pengisian key belum membuka checkout atau memberikan kuota. Sebelum aktivasi, masih perlu implementasi order di server, checkout, penerimaan dan verifikasi notifikasi, pencocokan nominal/pemilik order, penanganan notifikasi berulang, status gagal/kedaluwarsa/refund, serta pencatatan kuota. Domain notifikasi HTTPS dan pengaturan merchant juga harus disiapkan saat deployment.

Setelah integrasi tersebut selesai dan akun merchant disetujui, masukkan key lingkungan yang sesuai ke `.env` server, kemudian jalankan `docker compose up -d api`. Jangan membagikan Server Key di chat atau memasukkannya ke Git.

## Pemeriksaan lanjutan oleh pemilik proyek

Atas permintaan pengguna, pengujian tambahan dihentikan setelah instruksi 17 Oktober 2026. Build Docker tetap dilakukan untuk menerapkan perubahan. Pengguna melanjutkan pemeriksaan tombol landing → login, login Google setelah Client ID dipasang, logout, pemisahan akses admin/guru, dan tampilan ponsel. Login nyata dengan Google belum diuji karena Client ID belum dikonfigurasi.
