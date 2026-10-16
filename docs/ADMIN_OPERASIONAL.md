# Admin operasional RuangRPP

Pembaruan 16 Oktober 2026. Dashboard lokal: http://localhost:3001/ (port mengikuti `.env`).

## Yang tersedia

- Ringkasan sumber dan kesiapan operasional, menggunakan data database.
- Pengelolaan dokumen, pemeriksaan, target pengumpulan, dan kesiapan indeks yang sudah ada.
- Pengguna: daftar akun internal, peran, jumlah unggahan, dan login terakhir yang bisa dihubungkan ke ID akun.
- Riwayat aktivitas: pencarian tindakan, filter ID pengguna, 25 baris per halaman, tautan dokumen. Catatan lama tanpa ID pelaku tetap disimpan; identitasnya tidak ditebak dari nama.
- Model LLM: simpan profil penyedia + ID model, pilih default, hapus profil yang bukan default. Perubahan tercatat dalam audit. Default tersimpan di PostgreSQL, tetap ada setelah container dimulai ulang.
- Keuangan: halaman status integrasi. Angka belum tersedia ditulis `—`, bukan Rp0. Tidak ada transaksi contoh.

Menu operasional dan seluruh `/api/v1/admin/*` dibatasi untuk peran admin. Pengumpul tetap mengakses pengumpulan sumber. Navigasi menggunakan hash URL, sehingga menu dapat dibuka kembali, disegarkan, dan menggunakan tombol kembali browser.

## Mengatur model

1. Buka **Model LLM → Tambah model**.
2. Pilih penyedia dan salin ID model dari akun/dokumentasi penyedia yang memang akan digunakan.
3. Simpan, lalu pilih **Jadikan default**.

Ini menyimpan konfigurasi untuk tahap generator; **belum menguji koneksi atau menjalankan model**. Ketersediaan, harga, context window, dan kemampuan model belum diverifikasi oleh aplikasi. Tidak ada daftar model/harga yang dibuat-buat. Adapter penyedia, endpoint, uji koneksi, timeout, kuota biaya, pencatatan token, dan konsumsi default oleh generator adalah pekerjaan tahap berikutnya.

Kunci API tidak diisi melalui dashboard. Jika sudah siap, pengelola dapat menambahkan variabel opsional `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, atau `CUSTOM_LLM_API_KEY` ke `.env` lokal yang diabaikan Git, lalu menjalankan `docker compose up -d api`. Jangan menyalin nilai kunci ke chat, dokumen, atau repository. Dashboard hanya menerima boolean ketersediaan kunci; keberadaan kunci tidak membuktikan koneksi berhasil. Jangan membagikan keluaran `docker compose config`, karena dapat memuat nilai rahasia.

## Menjalankan dan menguji

Dari root proyek, setelah Docker Desktop siap:

```powershell
docker compose --profile test run --build --rm tests-postgres
docker compose up --build -d
docker compose --profile test stop test-db
```

Pengujian memakai PostgreSQL terpisah, bukan database koleksi. Inisialisasi membuat tabel baru `llm_profiles` dan `admin_settings`, serta menambahkan kolom nullable `actor_id` pada `source_audit` jika belum ada. Migrasi dapat dijalankan ulang tanpa menghapus catatan lama. Cadangkan database sebelum deployment di server rilis.

Jika API mengeluhkan kolom `actor_id` belum ada, jalankan `docker compose run --rm init`, kemudian `docker compose up -d api worker web`. Jika browser menampilkan data lama, muat ulang setelah container web sehat. Jika Docker engine tidak bisa diakses, periksa Docker Desktop sebelum menjalankan ulang perintah aplikasi.

## Batas tahap ini

Akun guru, history generasi modul, pembayaran QRIS/langganan, refund, analitik biaya token, dan ekspor laporan keuangan belum diintegrasikan. Daftar akun internal tidak mengklaim sebagai jumlah pelanggan. Status indeks juga tetap mengikuti implementasi nyata, tanpa menganggap dokumen otomatis sudah di-embedding.

Sebelum rilis publik diperlukan integrasi generator, akun guru dan aturan aksesnya, migrasi berversi untuk pengembangan skema selanjutnya, HTTPS/cookie secure, backup dan pemulihan, pemantauan serta evaluasi keamanan. Pembayaran menyusul setelah generator tervalidasi, dengan pencatatan webhook idempoten dan rekonsiliasi transaksi.

## Pola tampilan

Seluruh halaman menggunakan putih/abu-abu, satu keluarga font sistem, tombol/label/tabel seragam, dan status berbentuk teks. Status tidak bergantung pada warna. Form unggah awal hanya meminta berkas, judul, serta kategori; metadata lain dilengkapi setelah unggah.
