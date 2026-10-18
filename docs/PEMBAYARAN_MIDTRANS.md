# Checkout, verifikasi pembayaran, dan kuota

Implementasi 17 Oktober 2026. Pembelian satu kali, bukan langganan otomatis.

## Yang sudah dihubungkan

- Landing → ruang guru `/dashboard#billing` → konfirmasi paket → halaman checkout resmi Midtrans (Snap redirect).
- Katalog server: Mandiri Rp25.000 / 15 kuota; Semester Rp65.000 / 50 kuota. Mengikuti rancangan harga landing. Browser hanya mengirim ID paket dan ID permintaan, tidak menentukan harga atau kuota.
- Pesanan disimpan di PostgreSQL sebelum menghubungi Midtrans. Klik ganda dan permintaan ulang memakai pesanan yang sama selama masih terbuka. Satu guru hanya memiliki satu checkout terbuka per lingkungan.
- Notifikasi diperiksa dengan SHA-512 dan dibandingkan secara konstan. Server kemudian mengambil status langsung dari Midtrans, memeriksa nomor pesanan, nominal, mata uang, status, serta fraud status.
- `settlement` yang diterima atau `capture` dengan `fraud_status=accept` dan kode status 200 mengaktifkan kuota. Redirect browser tidak menjadi bukti pembayaran.
- Penguncian baris transaksi dan primary key unik `quota_grants.order_id` mencegah penambahan ganda, termasuk ketika notifikasi dan tombol pemeriksaan berjalan bersamaan.
- Dashboard guru: saldo produksi dan simulasi, pembelian, riwayat, lanjut bayar, periksa pembayaran.
- Admin `/admin#finance`: filter sandbox/produksi, transaksi, nilai bruto pembayaran terverifikasi, jumlah lunas, status perlu ditinjau, dan pemeriksaan ulang.
- Refund penuh menahan kuota paket. Partial refund dan chargeback menahan seluruh kuota paket untuk pemeriksaan manual. Tidak ada endpoint untuk mengirim refund uang atau memulihkan kuota secara manual pada tahap ini.

Saldo adalah jumlah kuota aktif dikurangi pemakaian draf berhasil. Generator AI langsung dan berbasis sumber menggunakan satu kuota setelah draf tersimpan. Tiga kuota percobaan tersedia lewat tombol klaim satu kali per akun per lingkungan, tidak memerlukan Midtrans dan tidak dihitung sebagai pemasukan. Data sandbox tidak menjadi saldo produksi atau laporan uang nyata. Lihat [MVP_AI_LANGSUNG.md](MVP_AI_LANGSUNG.md).

## Konfigurasi lokal dengan Docker

Isi `.env` lokal, bukan file yang di-commit:

```dotenv
GOOGLE_CLIENT_ID=client_id_web_milik_tim
PAYMENTS_ENABLED=true
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SANDBOX_SERVER_KEY=server_key_sandbox_milik_tim
PUBLIC_APP_URL=http://localhost:3001
```

Sesuaikan port dengan `WEB_PORT`. Login guru tetap membutuhkan konfigurasi Google yang dijelaskan dalam [panduan login](LOGIN_GOOGLE_DAN_TAHAP_RAG.md). Tidak ada akun guru palsu atau login bypass untuk membeli.

`MIDTRANS_SERVER_KEY` tetap didukung sebagai fallback untuk lingkungan aktif. Key khusus lingkungan mengambil prioritas. `MIDTRANS_CLIENT_KEY` tidak dibutuhkan karena checkout memakai halaman hosted redirect, bukan popup Snap.js. Key tidak dikirim ke browser.

Default `PAYMENTS_ENABLED=false` menutup checkout baru, tetapi **verifikasi pembayaran lama tetap berjalan**. Mengisi key saja tidak membuka penjualan. Setelah konfigurasi diubah, jalankan dari root proyek:

```powershell
docker compose up --build -d
```

Inisialisasi membuat tabel `payment_orders` dan `quota_grants` tanpa menghapus tabel atau data sebelumnya. Jangan menggunakan `docker compose down -v` untuk memperbarui aplikasi.

Build web Docker memakai `next build --webpack` karena build Turbopack versi terpasang gagal memproses font Google. Next.js, font landing, dan struktur aplikasi tetap sama. Pemeriksaan tipe bawaan build tetap dijalankan; ini bukan pengujian transaksi Midtrans.

## URL di dashboard Midtrans

Di lingkungan Midtrans yang sama dengan key, atur:

- Payment Notification URL: `https://DOMAIN-APLIKASI/api/v1/payments/midtrans/notification`
- Finish URL (Snap Preference): `https://DOMAIN-APLIKASI/dashboard#billing`
- Unfinish/Error URL: `https://DOMAIN-APLIKASI/dashboard#billing`

Finish URL juga dikirim server melalui `callbacks.finish`. Sesuaikan metode pembayaran yang tersedia pada akun Midtrans; integrasi tidak menjanjikan semua metode sudah disetujui.

**Midtrans tidak bisa mengirim webhook ke localhost.** Untuk mencoba webhook lokal, gunakan alamat HTTPS publik yang mengarah ke aplikasi melalui sarana yang dipilih tim, atau lakukan pengujian setelah deployment. Tanpa webhook lokal, tombol **Periksa pembayaran** tetap meminta status langsung ke Midtrans dan menjalankan aktivasi kuota yang sama. Tidak ada tunnel yang dibuat otomatis oleh proyek ini.

## Saat pindah ke VPS

Gunakan HTTPS reverse proxy menuju web Docker. API dan PostgreSQL tetap internal. Atur:

```dotenv
PUBLIC_APP_URL=https://DOMAIN-APLIKASI
ALLOWED_ORIGINS=https://DOMAIN-APLIKASI
COOKIE_SECURE=1
MIDTRANS_IS_PRODUCTION=false
PAYMENTS_ENABLED=false
```

Selesaikan pengujian sandbox milik tim sebelum membuka produksi. Setelah akun Midtrans disetujui dan produk siap dijual, isi `MIDTRANS_PRODUCTION_SERVER_KEY`, ubah `MIDTRANS_IS_PRODUCTION=true`, konfigurasi URL notifikasi **di lingkungan produksi**, lalu buka `PAYMENTS_ENABLED=true`. Pertahankan key sandbox jika masih ada transaksi sandbox yang perlu diperiksa. Jangan menjual kuota publik sebelum generator, ketentuan paket, dan dukungan pengguna siap.

## Pemeriksaan yang dapat dilakukan tim

Pengujian transaksi tidak dijalankan oleh agen sesuai permintaan pemilik proyek. Gunakan data simulasi resmi Midtrans, bukan kartu nyata di sandbox.

1. Login guru → pilih paket → periksa jumlah → buka checkout. Rekening/QR/metode mengikuti pilihan yang tersedia di akun Midtrans.
2. Saat masih pending, kuota tetap sama. Menutup checkout tidak mengaktifkan kuota.
3. Selesaikan transaksi sandbox. Webhook atau **Periksa pembayaran** membuat status lunas dan memberi tepat 15/50 kuota simulasi.
4. Periksa lagi atau kirim ulang notifikasi dari Midtrans: kuota tidak bertambah lagi.
5. Coba transaksi gagal/kedaluwarsa: kuota tidak bertambah. Guru lain tidak dapat membaca atau memverifikasi pesanan tersebut.
6. Pastikan admin menampilkan data yang sama dan filter produksi tidak memasukkan transaksi sandbox.
7. Jika menggunakan pengembalian dana di sandbox, periksa status dan penahanan kuota. Penyesuaian partial refund perlu kebijakan tim; jangan mengasumsikan pemulihan kuota otomatis.

## Penanganan kendala

| Kondisi | Tindakan |
| --- | --- |
| Tombol belum tersedia | Periksa `PAYMENTS_ENABLED`, server key lingkungan aktif, dan `PUBLIC_APP_URL`; buat ulang container API setelah mengubah `.env`. |
| Login Google belum tersedia | Lengkapi Client ID dan Authorized JavaScript Origins sesuai URL yang digunakan. |
| Sudah dibayar tetapi masih pending | Klik Periksa pembayaran; jangan membayar ulang. Admin juga dapat memeriksa pesanan. Periksa URL notifikasi dan riwayat delivery di Midtrans. |
| Kembali dari Midtrans diminta login | Masuk lagi dengan akun Google yang sama; riwayat pesanan tersimpan di server. |
| Timeout saat membuat checkout | Pesanan berstatus perlu diperiksa. Server tidak otomatis membuat pesanan baru karena checkout mungkin telah tercipta. Periksa pesanan dan akun Midtrans terlebih dahulu. |
| Core API menjawab 404 sebelum memilih metode bayar | Itu bukan bukti pembayaran gagal. Pesanan tetap menunggu. Checkout memiliki batas 24 jam; pemeriksaan setelah 25 jam dengan respons 404 mengizinkan pesanan dinyatakan kedaluwarsa. |
| Notifikasi ditolak | Tanda tangan harus cocok dengan key lingkungan pesanan. Pastikan key lama tetap tersedia setelah mengganti lingkungan. Error upstream mengembalikan respons gagal agar Midtrans dapat mencoba ulang. |
| Nominal atau identitas tidak cocok | Kuota tidak diubah. Periksa order ID pada kedua sistem; jangan mengubah status langsung di database. |

Pemeriksaan manual dibatasi satu kali setiap 15 detik per pesanan yang berhasil diperiksa. Notifikasi sah tidak memakai cache tersebut. Tidak ada rekonsiliasi berkala otomatis; gunakan webhook dan pemeriksaan manual. Riwayat halaman guru berisi 20 transaksi, admin 25 transaksi.

Laporan adalah jumlah bruto transaksi berstatus lunas, belum dikurangi biaya Midtrans, bukan saldo pencairan bank. Transaksi refund/partial refund tidak masuk agregat tersebut. Ekspor akuntansi, rekonsiliasi bank, langganan, dan pemakaian biaya AI belum termasuk.

## Referensi teknis resmi

- [Snap backend integration dan autentikasi](https://docs.midtrans.com/reference/backend-integration)
- [Request body: callback, expiry, dan item](https://docs.midtrans.com/reference/request-body-json-parameter)
- [Notifikasi dan verifikasi tanda tangan](https://docs.midtrans.com/docs/https-notification-webhooks)
- [Status transaksi](https://docs.midtrans.com/reference/get-transaction-status)
- [Batas waktu checkout](https://docs.midtrans.com/reference/expire-a-snap-session)

Ketentuan biaya merchant, hak penggunaan data pembayaran, dan kesiapan produksi harus mengikuti perjanjian akun tim; dokumen ini tidak mengasumsikan nominal biaya gateway atau persetujuan merchant.
