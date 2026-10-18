# MVP guru: AI langsung dan RAG

Implementasi 18 Oktober 2026. Matematika kelas 1 tetap menjadi contoh prioritas pengumpulan sumber, **bukan batas generator guru**. Tidak perlu menunggu seluruh dokumen terkumpul untuk memakai mode AI langsung.

## Memulai

1. Isi `.env` lokal dengan `GOOGLE_CLIENT_ID` dan API key penyedia LLM. Untuk penyedia kompatibel lainnya, isi `CUSTOM_LLM_BASE_URL` dan `CUSTOM_LLM_API_KEY`.
2. Di admin → Model LLM, pilih model default yang tersedia di akun penyedia dan mendukung Chat Completions dengan JSON mode. Kunci hanya berada di server. Tidak ada pergantian penyedia otomatis saat gagal.
3. Perbarui layanan dari root proyek: `docker compose up --build -d`.
4. Buka `/login`, masuk Google, lalu `/dashboard`. Di **Kuota & paket**, pilih **Aktifkan 3 kuota gratis**. Tidak perlu Midtrans untuk kuota percobaan.
5. Pilih **Draf AI langsung**, kelas, mapel, topik, dan alokasi waktu. Agama, seni, muatan lokal, kebutuhan khusus, atau pelajaran lain meminta satu rincian tambahan. Konteks kelas opsional; jangan isi data pribadi murid.
6. Setelah selesai, draf otomatis tersimpan. Buka dari riwayat dan edit. Suntingan tidak menggunakan API atau kuota.

Jika Google belum dikonfigurasi, tombol masuk belum bisa dipakai. Cocokkan authorized JavaScript origin di Google dengan alamat aplikasi. Untuk VPS gunakan HTTPS, `COOKIE_SECURE=1`, `ALLOWED_ORIGINS` dan `PUBLIC_APP_URL` sesuai domain. Konfigurasi Google yang berlaku dijelaskan dalam panduan autentikasi proyek.

## Dua mode yang berbeda

| Mode | Ketergantungan | Status hasil |
|---|---|---|
| AI langsung | Akun guru, model LLM, key dan kuota | Usulan AI, belum diverifikasi terhadap CP; tidak menyertakan referensi dokumen |
| Berbasis sumber | Semua di atas, paket sumber aktif, embedding dan Qdrant | Draf dengan potongan rujukan yang ditelusuri; tetap perlu tinjauan guru |

Mode AI langsung tidak memanggil embedding atau Qdrant. Gangguan konfigurasi embedding tidak menutup pilihan AI langsung. Kegagalan mode berbasis sumber tidak diam-diam beralih ke AI tanpa sumber.

Pilihan awal meliputi kelas 1–6 dan mapel katalog proyek. IPAS/Bahasa Inggris ditawarkan mulai kelas 3, Koding dan Kecerdasan Artifisial mulai kelas 5. Ini batas produk awal mengikuti calon cakupan fase yang sedang dikumpulkan, bukan keputusan bahwa semua sekolah menerapkannya. Guru memilih mata pelajaran yang berlaku di sekolahnya. Varian agama, seni, bahasa/daerah, dan kebutuhan khusus harus disebutkan; AI tidak menganggap semua variannya sama.

Format AI langsung adalah susunan kerja awal: konteks, materi, media, kegiatan, asesmen dan tindak lanjut. **Belum ditinjau sebagai template kurikulum resmi.** Label ini selalu ditampilkan pada hasil dan riwayat. Mode disimpan bersama draf dan tidak dapat diubah lewat penyuntingan. Server menolak ID rujukan atau jenis bagian `curriculum` pada draf AI langsung. Pemeriksaan ini tidak membuktikan kebenaran isi kalimat; guru tetap meninjau.

## Kuota dan pembayaran

- Tiga kuota percobaan dapat diklaim sekali per akun Google **per lingkungan**; sandbox dan produksi terpisah. Klik ulang tidak menambah kuota lagi. Klaim gratis tidak menciptakan transaksi Midtrans atau pemasukan admin.
- Kedua mode memakai satu kuota setelah hasil berhasil disimpan. Permintaan ulang dengan ID sama mengembalikan draf yang sama; saldo tidak dipotong dua kali.
- Gagal membuat draf tidak memotong kuota aplikasi, tetapi panggilan yang sudah diterima penyedia AI masih dapat ditagihkan kepada pengelola.
- Batas awal 20 draf berhasil per akun dalam 24 jam. Kuota tidak berarti API gratis bagi pengelola. Akun Google berbeda dapat memperoleh kuota percobaan masing-masing; perlindungan penyalahgunaan multiakun dan batas biaya global masih perlu penguatan sebelum skala publik besar.
- `RAG_ENABLED` saat ini mengatur kedua mode generator. `RAG_REQUIRE_QUOTA=false` hanya untuk pilot sandbox. Di produksi, kuota selalu wajib.
- Selama Midtrans belum siap, gunakan `PAYMENTS_ENABLED=false`. Untuk rilis pengguna nyata, gunakan `MIDTRANS_IS_PRODUCTION=true` agar saldo percobaan berada di lingkungan produksi; pembelian tetap tertutup sampai `PAYMENTS_ENABLED=true` dan konfigurasi pembayaran lengkap.
- Ekspor DOCX/PDF belum tersedia. Harga paket di landing tidak berarti pembelian otomatis dibuka.

## Pemeriksaan yang dilakukan pemilik proyek

Sesuai permintaan, agen tidak menjalankan pengujian aplikasi atau panggilan API berbayar. Build Docker tidak membuktikan kualitas draf.

1. Masuk Google, klaim kuota, ulangi klaim: saldo tetap tiga.
2. Buat satu draf AI tanpa dokumen aktif. Pastikan hasil tersimpan, saldo berkurang satu, label belum diverifikasi terlihat, dan tidak ada referensi dokumen.
3. Coba kelas/mapel berbeda, termasuk isian agama atau cabang seni. Tinjau bahasa, durasi, tujuan dan asesmen bersama guru.
4. Edit, simpan dan buka kembali; saldo tidak berubah. Akun berbeda tidak boleh mengakses draf tersebut.
5. Simulasikan model/key tidak tersedia: pesan jelas, tanpa draf palsu dan tanpa pengurangan kuota aplikasi.
6. Pilih berbasis sumber saat sumber belum siap: tampilkan keterbatasan, jangan menghasilkan draf tanpa sumber dalam mode itu.

Panduan indeks dan pengumpulan sumber: [RAG_DOCKER.md](RAG_DOCKER.md). Panduan checkout: [PEMBAYARAN_MIDTRANS.md](PEMBAYARAN_MIDTRANS.md).
