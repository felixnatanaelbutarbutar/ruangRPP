# Dashboard sumber — pilot Docker

Pembaruan 14 Oktober 2026. Cara utama menjalankan aplikasi adalah Docker Compose. Instalasi Node/Python lokal bukan prasyarat.

## Cakupan yang tersedia

- Login akun individu dengan peran `collector` dan `admin`; kata sandi di-hash Argon2, sesi server selama 12 jam.
- Unggah PDF/DOCX asli (128 MiB), SHA-256 untuk mendeteksi file identik meskipun namanya berbeda, penyimpanan persisten. Upload dialirkan melalui Next.js; ekstraksi berjalan di worker Docker setelah file tersimpan.
- Metadata kategori CP/modul/panduan/buku/template/checklist/sumber lokal; fase, kelas, varian agama/seni/bahasa, wilayah, tahun terbit atau tidak diketahui, acuan/versi, penerbit, URL dan catatan izin.
- Satu file dapat memiliki beberapa pasangan mapel–fase–kelas; tidak menggandakan file fisik.
- Panduan mata pelajaran dipisahkan dari CP/PPA. Cakupan asli A–F dipisahkan dari cakupan SD; rentang halaman PDF per cakupan dapat dipilih. Tombol 20 Panduan Mapel membuat target unik, bukan file unduhan atau persetujuan penerapan. Lihat [panduan pengumpulan SD](PANDUAN_SUMBER_SD.md).
- Ekstraksi PDF teks atau paragraf/tabel DOCX; pratinjau berlabel halaman PDF atau paragraf/tabel. Nomor halaman PDF adalah urutan halaman file, bukan nomor halaman cetak.
- Daftar seluruh file, lolos otomatis, perlu ditinjau, pencarian, filter, unduh asli, ekspor CSV untuk dibuka di Excel, dan riwayat perubahan.
- Admin menilai isi, izin penggunaan, kualitas ekstraksi, bukti/catatan, serta izin mengirim ke penyedia eksternal secara terpisah.
- Daftar kebutuhan yang dapat ditambah/disunting. Tombol daftar awal menambahkan 60 calon kebutuhan CP/modul untuk 10 kelompok mapel × fase A/B/C, semuanya **belum dikonfirmasi penerapannya**. Pengulangan tombol tidak menggandakan daftar awal.
- Jumlah unggahan dan jumlah lolos tinjauan per kebutuhan dihitung dari metadata aktual. File lintas cakupan dapat memenuhi beberapa kebutuhan. Tidak ada aturan satu file wajib per fase.

Daftar awal adalah alat perencanaan, bukan bukti bahwa semua mapel berlaku di semua fase. Admin harus menyesuaikan varian, wilayah, acuan, dan status penerapan berdasarkan sumber. Tambahkan kebutuhan panduan, template internal dan checklist sesuai konteks. Kurikulum belum dikunci.

## Jalankan di Windows

1. Buka Docker Desktop dengan engine Linux yang sudah siap.
2. Dari akar proyek:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/setup-docker.ps1
docker compose config --quiet
docker compose up --build -d
docker compose ps -a
```

Script membuat `.env` dengan password database acak; tidak menimpa `.env` yang sudah ada. Jangan commit `.env`. Di Linux/VPS, buat `.env` dari `.env.example` dengan password acak URL-safe terlebih dahulu.

3. Buat akun admin pertama dengan email/nama tim yang benar:

```powershell
docker compose exec api python -m app.manage create-user --email "admin@tim-anda.id" --name "Admin Tim" --role admin
```

Kata sandi diminta dua kali, minimal 12 karakter. Tidak ada pendaftaran publik atau kredensial bawaan. Buat akun pengumpul masing-masing:

```powershell
docker compose exec api python -m app.manage create-user --email "pengumpul@tim-anda.id" --name "Pengumpul Tim" --role collector
```

4. Buka http://localhost:3000 (atau port `WEB_PORT`), masuk, susun kebutuhan sumber, lalu unggah dokumen. Pada komputer ini digunakan http://localhost:3001 karena port 3000 telah dipakai proyek lain.

Container `init` selesai dengan exit code 0 adalah normal. Container `db`, `api`, `web` harus berjalan sehat dan `worker` berjalan. Skema pilot dibuat melalui `create_all`; pembaruan ini menambah tabel antrean tanpa menghapus tabel lama. Perubahan struktur kolom selanjutnya memerlukan migrasi terencana sebelum digunakan pada data tim yang nyata.

## Alur pemeriksaan

1. Unggah awal cukup file, judul, dan jenis dokumen. Judul diisi dari nama file dan bisa diubah; tautan sumber opsional. Unggah dari kebutuhan memakai calon cakupan target. Unggah umum tidak menebak mapel/fase. Metadata lain boleh kosong saat pengumpulan.
   Setelah tersimpan, buka Detail > Edit untuk melengkapi tiga bagian: Identitas dan versi; Mapel, fase, dan halaman; Asal, izin, dan catatan. Cakupan kosong atau metadata belum lengkap menghalangi kesiapan indeks, tetapi tidak menghalangi penyimpanan file.
2. Sistem memeriksa format, ukuran, duplikasi, kelengkapan dasar dan apakah cukup teks terbaca. Pemeriksaan ini tidak memverifikasi kebenaran kurikulum, keaslian URL, lisensi, atau kualitas OCR.
3. Status antrean/pemrosesan diperbarui otomatis. Buka detail dan pratinjau teks. PDF scan ditandai untuk ditinjau; OCR belum tersedia. Dokumen gagal ekstraksi tetap disimpan dengan alasannya. Pilih halaman yang lebih kecil lewat Edit atau gunakan Proses ulang. Proses ulang mereset persetujuan. Pekerjaan terhenti lebih dari 5 menit ditandai gagal oleh worker yang aktif kembali.
4. Admin mencatat hasil pemeriksaan isi, izin dan kualitas teks serta bukti/catatannya. Akun pengumpul tidak boleh memberikan persetujuan.
5. Mengubah metadata membatalkan persetujuan lama. Penyimpanan versi dokumen yang sudah berubah di sesi lain ditolak agar tidak menimpa perubahan tim.
6. Status memenuhi syarat indeks tetap **belum diindeks**. Tidak ada dokumen yang dikirim ke API LLM/embedding. Qdrant dan aktivasi sumber menunggu chunking, indeks staging, dan uji retrieval.

`Lengkap` pada kebutuhan mensyaratkan penerapan dikonfirmasi dan jumlah dokumen yang memenuhi seluruh tinjauan/izin mencapai target. Ini belum merupakan nilai kualitas generator. `Lolos otomatis` hanya pemeriksaan dasar.

## Pengujian dalam container

```powershell
docker compose --profile test run --build --rm tests
docker compose --profile test run --build --rm tests-postgres
```

Tes menggunakan SQLite **khusus pengujian terisolasi** di container tanpa memasang volume PostgreSQL atau unggahan tim. Runtime aplikasi tetap PostgreSQL. Kasus: autentikasi/role, origin, unggah/unduh asli, duplikasi, ekstraksi gagal, persetujuan, konflik revisi, invalidasi persetujuan, pencocokan cakupan, daftar awal idempoten, dan CSV formula escaping. Ini tidak menggantikan uji integrasi PostgreSQL maupun tinjauan guru.

Build web menjalankan pemeriksaan TypeScript dan build Next.js di Docker. Untuk pemeriksaan operasional:

```powershell
docker compose exec api python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health/ready').read().decode())"
docker compose logs --tail 80 web api init
```

Uji manual: unggah dokumen yang diizinkan, periksa teks, unduh dan bandingkan asli; coba duplikasi; tinjau sebagai admin; ubah metadata dan pastikan tinjauan kembali diperlukan; mulai ulang container dan pastikan dokumen tetap ada.

## Penyimpanan dan penghentian

- Volume `postgres_data`: metadata, akun, sesi, tinjauan dan kebutuhan.
- Volume `source_files`: file asli. Nama internal menggunakan UUID; nama asli disimpan di metadata dan dipakai saat mengunduh.
- Folder `RUANGRPP_DATA` dan Excel sebelumnya tetap tersedia sebagai paket pengumpulan manual. Belum ada impor atau sinkronisasi otomatis dengan dashboard.
- Pengujian container tidak menyentuh kedua volume produksi lokal tersebut.

```powershell
docker compose stop
docker compose up -d
```

`docker compose down` menghapus container/jaringan proyek tetapi mempertahankan named volume. Jangan gunakan `down -v` untuk penghentian biasa karena menghapus data. Sebelum pengumpulan nyata dalam jumlah besar, siapkan cadangan PostgreSQL dan file asli berpasangan beserta uji pemulihannya.

## Batas pilot dan deployment tim

Compose mengikat web ke `127.0.0.1`; database/API hanya di jaringan internal container. Tim di komputer lain belum dapat mengaksesnya. Tahap deployment perlu domain/TLS, cookie Secure, daftar origin yang tepat, undangan/reset/nonaktif akun, rate limiting bersama, backup/restore, dan migrasi database. Jangan membuka konfigurasi HTTP lokal ini langsung ke internet.

Ekstraksi dibatasi 2.000 halaman PDF, 5.000.000 karakter teks, dekompresi DOCX 80 MiB, memori subprocess 1 GiB dan waktu 180 detik. Worker terpisah dengan antrean PostgreSQL; tidak ada OCR/antivirus atau isolasi per dokumen setara sandbox khusus. Satu worker ekstraksi memproses satu file pada satu waktu. Akun collector dapat menyunting metadata koleksi bersama; hak persetujuan hanya admin. Riwayat mencatat aksi dan peninjau, belum snapshot audit lengkap setiap revisi. Daftar belum dipaginasi; pilot untuk koleksi kecil. Satu proses API dipakai karena rate limiter login masih di memori.

## Troubleshooting

- **Docker engine belum hidup:** periksa `docker info` dan pesan Docker Desktop. Kode Compose tidak dapat berjalan sebelum engine siap. Hindari factory reset sebagai langkah awal karena dapat menghapus data.
- **Build gagal mengambil image/paket:** periksa jaringan/proxy Docker, lalu ulangi `docker compose build`. Dependency web dipasang dari lockfile.
- **Port 3000 dipakai:** ubah `WEB_PORT` pada `.env`, lalu `docker compose up -d`; buka port baru. Origin API mengikuti port tersebut.
- **Login gagal:** buat akun lewat perintah di atas; periksa email dan layanan API. Terlalu banyak kegagalan login menunggu 5 menit.
- **Database menolak password setelah perubahan `.env`:** password volume lama tidak berubah hanya dengan mengganti `.env`. Kembalikan kredensial yang benar atau lakukan perubahan password database yang terencana. Jangan menghapus volume sebagai solusi.
- **API belum terhubung:** periksa `docker compose ps -a`, log `init`/`api`, lalu health check. File besar dapat melewati batas ekstraksi; periksa daftar dokumen sebelum mengulang unggahan.

Dasar panduan Docker: [troubleshooting resmi](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/). Pada mesin pengembangan ditemukan kegagalan startup `dockerInference`; ini dilaporkan juga pada [issue Docker #448](https://github.com/docker/desktop-feedback/issues/448). Status pengujian aktual dicatat terpisah dalam laporan validasi, bukan disimpulkan dari tersedianya perintah di atas.
