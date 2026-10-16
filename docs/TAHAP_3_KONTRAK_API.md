# Tahap 3A — kontrak API awal

11 Oktober 2026, versi 0.1. Ini spesifikasi yang diusulkan, bukan daftar API yang sudah berjalan. Kontrak ditulis dahulu agar Next.js, FastAPI dan pekerjaan latar belakang menggunakan makna yang sama. Implementasi dilakukan per milestone, bukan seluruh tabel sekaligus.

## 1. Aturan umum

- Operasi aplikasi memakai prefix `/api/v1`. Pemeriksaan proses memakai `/health/live` dan `/health/ready`.
- JSON memakai nama `snake_case`; ID adalah UUID server; waktu berupa ISO 8601 dengan zona waktu; tanggal terbit yang tidak diketahui null.
- Client tidak dapat menentukan pemilik draf, peran, status aktif, hasil pemeriksaan atau biaya model melalui payload umum.
- FastAPI memverifikasi identitas dari mekanisme auth terpilih. Rancangan alur Next.js tidak memberi hak mempercayai sembarang header `X-User-Id`.
- Pemeriksaan izin selalu dilakukan sebelum membaca/mengubah resource. Draf milik pengguna lain dikembalikan sebagai 404 agar keberadaannya tidak bocor. Guru yang mencoba operasi admin mendapat 403.
- Daftar menggunakan pagination berbasis cursor dan batas usulan 20 per halaman, maksimum 100. Respons membawa `next_cursor` atau null. Sorting stabil memakai waktu lalu ID.
- POST pekerjaan yang menimbulkan pemrosesan/biaya menerima `Idempotency-Key`. Kunci diikat ke pengguna, operasi dan hash input. Kunci sama dengan input sama mengembalikan pekerjaan yang sama; input berbeda menghasilkan 409.
- PATCH sumber dan penyimpanan versi draf memerlukan `expected_revision`. Ketidaksesuaian menghasilkan 409; perubahan tidak ditimpa otomatis.
- Respons kesalahan aman untuk pengguna; stack trace, rahasia, signed URL privat dan isi dokumen tidak dikirim dalam pesan umum.

Format kesalahan yang diusulkan:

```json
{
  "error": {
    "code": "SOURCE_NOT_READY",
    "message": "Sumber untuk pilihan ini belum siap.",
    "details": { "reasons": ["NO_ACTIVE_CP", "NO_APPROVED_TEMPLATE"] }
  },
  "request_id": "id-penelusuran-yang-dibuat-server"
}
```

Kode alasan di atas adalah rancangan produk. Bukan bukti bahwa suatu sumber sudah diperiksa atau bahwa API sudah tersedia.

## 2. Fondasi dan katalog — tahap 3B/3C

| Metode / path | Akses | Kontrak |
|---|---|---|
| GET `/health/live` | Publik, tanpa detail internal | 200 jika proses API hidup; tidak memerlukan Qdrant atau penyedia LLM |
| GET `/health/ready` | Operator/reverse proxy sesuai deployment | 200 jika dependensi wajib untuk milestone berjalan; 503 jika belum siap. Tahap 3B hanya memerlukan PostgreSQL dan migrasi yang sesuai |
| GET `/api/v1/me` | Login | ID, nama tampilan dan role dari server; 401 bila sesi/token tidak valid |
| GET `/api/v1/catalog/scopes` | Publik | Filter opsional grade, subject_id, curriculum_version_id, region_code; hanya ringkasan cakupan, tanpa storage key/bukti izin privat |
| GET `/api/v1/capabilities` | Publik | Daftar fitur yang benar-benar tersedia dan penjelasannya; tidak membeberkan kredensial atau konfigurasi vendor |

Satu item katalog berisi `id`, acuan, mapel/varian, kelas, fase, wilayah, `status`, `generation_ready` dan `unavailable_reasons`. `generation_ready` adalah hasil pemeriksaan efektif, bukan salinan status “limited” saja. Jangan membuat query publik yang memungkinkan memasukkan include_inactive untuk membuka sumber privat.

Respons katalog tanpa data:

```json
{
  "items": [],
  "next_cursor": null,
  "message": "Cakupan pembelajaran sedang disiapkan."
}
```

Tidak ada entri mapel/fase fiktif untuk membuat halaman terlihat penuh. Matriks pengumpulan boleh ditampilkan sebagai target yang belum didukung apabila berasal dari katalog yang dikelola tim, tanpa mengklaim acuan telah diverifikasi. Kesalahan database harus menghasilkan respons gagal, bukan `items: []`.

Autentikasi masuk, daftar, reset dan callback mengikuti penyedia/pustaka yang dipilih pada 3C. Endpoint untuk password sengaja belum dirancang sebelum pilihan itu dibuat; jangan menerapkan penyimpanan password buatan sendiri.

## 3. Sumber dan ekstraksi — tahap 4

| Metode / path | Akses | Hasil |
|---|---|---|
| GET `/api/v1/admin/documents` | Admin | Ringkasan dokumen dan versi, filter status terpisah |
| POST `/api/v1/admin/documents` | Admin | Metadata calon sumber; 201, versi belum aktif. Record awal belum dianggap file lengkap |
| GET `/api/v1/admin/documents/{id}` | Admin | Metadata, daftar versi, alasan penahanan dan revision |
| PATCH `/api/v1/admin/documents/{id}` | Admin | Perbarui metadata yang diizinkan dengan expected_revision; tidak menerima status aktif |
| POST `/api/v1/admin/documents/{id}/versions` | Admin | Multipart file + metadata versi; cek ukuran, format/signature dan hash; 201 bila tersimpan, 409 bila file identik sudah ada |
| GET `/api/v1/admin/document-versions/{id}/file` | Admin | Akses file privat melalui otorisasi/tautan singkat; jangan memakai path yang dikirim client |
| POST `/api/v1/admin/document-versions/{id}/rights-reviews` | Admin | Bukti, lingkup izin, hasil dan penanggung jawab; 201; revisi sebelumnya dipertahankan |
| POST `/api/v1/admin/document-versions/{id}/content-reviews` | Admin | Hasil validasi pedagogi dan bukti tinjauan; 201, terikat versi sumber |
| POST `/api/v1/admin/document-versions/{id}/extractions` | Admin | Membuat job ekstraksi lokal; 202 dan job_id, tidak menunggu seluruh proses HTTP |
| GET `/api/v1/admin/extractions/{id}` | Admin | Pratinjau paginasi teks dan locator, kualitas serta versi extractor |
| POST `/api/v1/admin/extractions/{id}/reviews` | Admin | Terima/tolak kualitas hasil, alasan dan identitas pemeriksa |
| GET `/api/v1/admin/jobs/{id}` | Admin | Stage, status, progress jika dapat diukur, error_code dan kemampuan retry |

Metadata awal dokumen: title, category, publisher, source_url, notes. Metadata versi: inventory_id, publication_year nullable, edition_label nullable, scope_descriptions, original_filename dari upload, catatan pengumpul. Data yang belum diverifikasi tidak boleh diam-diam menjadi cakupan aktif.

Batas awal yang diusulkan untuk pilot teknis: PDF dan DOCX, satu file per unggah, maksimum 25 MiB. Ini batas aplikasi yang dapat dikonfigurasi setelah sampel nyata, bukan batas format PDF/DOCX. Backend menghitung ukuran aktual dan batas ekstraksi/dekompresi; ekstensi saja tidak membuktikan format. PDF terkunci ditahan dengan alasan; scan tidak dipaksa seolah memiliki teks.

Operasi unggah harus menghindari record menunjuk file yang belum tersimpan. Gunakan area sementara dan finalisasi terkendali; kegagalan transaksi menyisakan pekerjaan pembersihan berkas yatim. Uji kegagalan storage maupun database.

Dokumen boleh dicatat untuk ditinjau tanpa aktivasi. Ekstraksi lokal dan pengiriman teks ke penyedia eksternal memiliki syarat berbeda. Sebelum langkah eksternal, server memeriksa allowed_uses untuk tujuan/provider terkait.

## 4. Retrieval dan aktivasi — tahap 5

| Metode / path | Akses | Hasil |
|---|---|---|
| POST `/api/v1/admin/extractions/{id}/index-jobs` | Admin | 202; menyiapkan chunk dan embedding pada indeks staging setelah semua izin relevan lolos |
| POST `/api/v1/admin/retrieval-tests` | Admin | Jalankan query pada index_version_id/cakupan eksplisit; 202 untuk evaluasi tersimpan |
| GET `/api/v1/admin/retrieval-tests/{id}` | Admin | Chunk, locator, filter, skor dan hasil pemeriksaan untuk peninjau |
| POST `/api/v1/admin/retrieval-tests/{id}/reviews` | Admin | Catat keputusan peninjau dan bukti hasil uji; metrik otomatis saja tidak memberi persetujuan guru |
| POST `/api/v1/admin/document-versions/{id}/activation` | Admin | 200 jika prasyarat lengkap, 409 beserta daftar kekurangan jika belum; expected_revision wajib |
| POST `/api/v1/admin/document-versions/{id}/suspension` | Admin | 200 setelah blokir efektif di PostgreSQL; buat pekerjaan pembersihan indeks dan cache |
| PATCH `/api/v1/admin/scopes/{id}/support` | Admin | Perubahan dukungan dengan bukti evaluasi dan expected_revision; “limited” ditolak jika prasyarat kurang |

Operasi katalog admin untuk membuat acuan/mapel/scope ditambahkan pada 3C hanya setelah aturan metadata ditetapkan; nilai default selalu belum diverifikasi/belum didukung. Angka kelas boleh divalidasi sejak awal, tetapi pemetaan kurikulum tidak boleh diisi berdasarkan tebakan.

Uji admin dapat mengakses staging melalui jalur khusus ini. Parameter uji tersebut tidak diterima oleh generator guru. Penonaktifan wajib diperiksa ulang sebelum konteks dikirim ke model dan sebelum hasil dibuka kepada guru; jika status berubah di tengah proses, run gagal aman tanpa menyimpan hasil sebagai draf siap ditinjau.

## 5. Generator, draf dan ekspor — tahap 6/7

| Metode / path | Akses | Hasil |
|---|---|---|
| POST `/api/v1/generations` | Guru login | 202 hanya setelah prasyarat dasar lolos; pengecekan konteks dapat berakhir failed dengan INSUFFICIENT_CONTEXT tanpa panggilan LLM |
| GET `/api/v1/generations/{id}` | Pemilik | Status, pesan, draft_id jika berhasil, kode kegagalan jika ada |
| GET `/api/v1/drafts` | Guru login | Hanya draf milik sesi tersebut; tidak menerima owner_id untuk mengganti pemilik |
| GET `/api/v1/drafts/{id}` | Pemilik | Isi versi terkini, revision, status referensi dan tindakan yang tersedia |
| POST `/api/v1/drafts/{id}/versions` | Pemilik | Simpan edit dengan expected_revision; 201 atau 409; tanpa regenerasi otomatis |
| GET `/api/v1/drafts/{id}/versions` | Pemilik | Riwayat versi miliknya |
| POST `/api/v1/drafts/{id}/exports` | Pemilik | 202 jika format diaktifkan dan diizinkan; ekspor mengikat draft_version_id |
| GET `/api/v1/exports/{id}` | Pemilik | Status dan tautan sementara jika selesai; tautan tidak permanen/publik |

Payload generasi yang diusulkan:

```text
scope_id                  UUID cakupan yang benar-benar tersedia
topic                     teks 1–200 karakter setelah trim
semester                  null, 1 atau 2; sesuai konteks
meetings                  daftar { duration_minutes: bilangan bulat positif }
learning_context          teks opsional, maksimum usulan 2.000 karakter
```

Model, provider, index_version dan template diselesaikan server dari konfigurasi yang disetujui. API tidak menerima teks CP bebas dari guru sebagai pengganti CP terverifikasi. Client juga tidak mengirim user_id, biaya, daftar sumber “dipakai”, atau status “valid”.

Kontrak konten draf: identitas/konteks dan `components[]`. Setiap komponen punya id stabil, type, title, body terstruktur dan citation_ids. Jenis komponen dan kelengkapannya tunduk pada schema template_version, bukan daftar komponen wajib permanen yang diasumsikan berlaku untuk semua sekolah.

Saat hasil generasi berhasil, run, draft awal, versinya dan hubungan sitasi disimpan secara konsisten. Hasil tidak diklaim tersimpan sebelum commit berhasil. Gagal validasi sitasi/schema menghasilkan kegagalan terkontrol, bukan JSON rusak yang langsung tampil sebagai modul.

Setiap rujukan hasil generasi harus berasal dari generation_contexts. Daftar dokumen yang sekadar ditemukan retrieval tidak boleh diberi label “digunakan” jika tidak dikaitkan dengan hasil. Server dapat memeriksa ID dan locator; penilaian apakah isi mendukung klaim tetap perlu evaluasi guru.

Jika edit mengubah bagian bersitasi, citation review_status bagian itu menjadi needs_review. Ekspor menampilkan status draf dan rujukan sesuai versi yang diekspor; tidak boleh mengembalikan isi sebelum edit. Hak distribusi file asli tidak disimpulkan dari izin menampilkan referensi.

## 6. Kode kesalahan awal

| HTTP | Kode | Tindakan UI |
|---|---|---|
| 401 | AUTH_REQUIRED | Ajak masuk kembali tanpa membocorkan resource |
| 403 | FORBIDDEN | Jelaskan akses tidak tersedia |
| 404 | NOT_FOUND | Resource tidak ditemukan atau tidak boleh diketahui pengguna |
| 409 | REVISION_CONFLICT | Pertahankan edit dan tawarkan buka versi terbaru |
| 409 | DUPLICATE_FILE | Admin melihat referensi dokumen yang sudah tercatat |
| 409 | SOURCE_NOT_READY / ACTIVATION_BLOCKED | Tampilkan alasan dan langkah yang diperlukan |
| 409 | IDEMPOTENCY_CONFLICT | Jangan ulang permintaan dengan input berbeda pada kunci sama |
| 413 | FILE_TOO_LARGE | Jelaskan batas aktual konfigurasi |
| 415 | UNSUPPORTED_FILE_TYPE | Tampilkan format yang diterima |
| 422 | VALIDATION_ERROR | Tandai field terkait; pertahankan isian lain |
| 429 | RATE_LIMITED | Tampilkan kapan dapat mencoba lagi bila server mengetahuinya |
| 503 | DEPENDENCY_UNAVAILABLE / FEATURE_UNAVAILABLE | Jelaskan fitur sementara belum tersedia; jangan tampilkan keberhasilan palsu |

Pada job asinkron, GET status bisa tetap 200 dengan `status: failed` dan error_code seperti INSUFFICIENT_CONTEXT, EXTRACTION_FAILED, PROVIDER_TIMEOUT atau INVALID_GENERATION. HTTP 200 berarti status berhasil dibaca, bukan pekerjaan berhasil. Status pembatalan tidak menjamin panggilan penyedia yang sudah berjalan tidak ditagih; UI tidak menjanjikan itu.

## 7. Kriteria penerimaan fondasi pertama

Checklist ini akan dijalankan setelah kode tersedia; belum merupakan hasil pengujian:

1. API hidup tetapi PostgreSQL mati: live 200, ready 503.
2. Database tersedia tetapi tabel/migrasi belum sesuai: ready 503 dengan detail internal terbatas.
3. Katalog tanpa data menghasilkan daftar kosong dan UI “sedang disiapkan”; kegagalan membaca katalog menghasilkan pesan gagal.
4. Saat generator belum diimplementasikan, capabilities menandainya unavailable; tidak ada panggilan model.
5. Setelah auth dipasang, token tidak valid ditolak dan role guru tidak dapat mengakses operasi admin.
6. Resource privat tidak masuk cache publik; pencatatan error tidak berisi kredensial.

Pengujian unggah, peran, retrieval dan draf dilakukan pada milestone terkait. Fixture sintetis untuk menguji API/akses harus diberi label data uji dan ditempatkan terpisah dari RUANGRPP_DATA serta indeks produksi.
