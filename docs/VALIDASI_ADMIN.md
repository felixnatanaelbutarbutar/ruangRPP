# Validasi dashboard sumber

Pembaruan diuji 14–15 Oktober 2026.

- Build produksi Next.js dan pemeriksaan TypeScript berhasil di Docker.
- 16 tes API/worker berhasil pada PostgreSQL terisolasi. Satu peringatan deprecation berasal dari dependensi test client, bukan kegagalan tes.
- PDF sintetis 260 halaman dengan ukuran di atas 33 MiB berhasil diunggah. Ekstraksi pilihan halaman 250–252 menghasilkan locator asli; halaman kosong tidak lolos otomatis.
- Metadata berubah saat ekstraksi berjalan tidak tertimpa hasil revisi lama. Pekerjaan terhenti dapat ditandai gagal dan diproses ulang.
- Uji lewat container web Next.js terpisah: upload 33,03 MiB mengembalikan status antrean; unduhan asli memiliki SHA-256 sama; file di atas batas ditolak 413; origin lain ditolak 403.
- Login, keenam menu, daftar 20 panduan, dan preset Bahasa Inggris (B/C untuk SD, fase lengkap terpisah) diperiksa melalui browser. Pemeriksaan lebar 390 piksel tidak menemukan overflow halaman; tabel memiliki area gulir sendiri.
- Excel daftar target berisi 20 baris, tiga dropdown status, dan tabel berfilter. Pratinjau judul, baris program khusus, isian dan petunjuk diperiksa. Inventaris lama tidak ditimpa. Belum diuji interaktif di aplikasi Microsoft Excel.
- Container uji sementara dihentikan setelah tes. Layanan db/api/web sehat dan worker berjalan; sumber tim tidak dipakai untuk pengujian upload sintetis.

Ini menguji fungsi perangkat lunak, bukan kualitas kurikulum atau generator. PDF resmi 20 panduan belum diuji satu per satu. OCR, chunking, embedding, Qdrant dan aktivasi retrieval belum tersedia. Sumber yang lolos otomatis tetap perlu tinjauan isi, izin dan ekstraksi.

## Form unggah sederhana — 15 Oktober 2026

17 tes berhasil di PostgreSQL Docker setelah cakupan dokumen dibuat opsional saat unggah. Tes tambahan membuktikan file dengan judul dan jenis saja tersimpan serta diekstrak, tanpa mengarang fase/mapel. Metadata kosong tetap menghalangi kesiapan indeks bahkan jika tinjauan disimpan. Melengkapi metadata kemudian mengembalikan alur pemeriksaan biasa dan mereset tinjauan lama.
