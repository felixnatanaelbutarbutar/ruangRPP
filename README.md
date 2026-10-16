# RuangRPP

**Rancang Pembelajaran, Lebih Mudah.**

Status 12 Oktober 2026: implementasi awal dashboard pengumpulan sumber tersedia dengan Next.js, FastAPI, PostgreSQL, dan Docker Compose. Mencakup akun tim, unggah PDF/DOCX, detail metadata, pemeriksaan dasar, tinjauan admin, serta daftar kebutuhan. Qdrant, embedding, OCR otomatis, dan generator belum diaktifkan. Pemeriksaan acuan dan tinjauan guru tetap diperlukan.

## Menjalankan dashboard dengan Docker

Panduan lengkap, akun pertama, pengujian, dan troubleshooting: [Dashboard admin dengan Docker](docs/ADMIN_DOCKER.md).

Jalankan dari folder proyek di PowerShell setelah Docker Desktop siap:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/setup-docker.ps1
docker compose up --build -d
docker compose exec api python -m app.manage create-user --email "admin@tim-anda.id" --name "Admin Tim" --role admin
```

Ganti email/nama dengan milik tim; kata sandi diminta secara interaktif. Buka http://localhost:3000. Tidak ada akun atau kata sandi bawaan. Node.js dan Python di komputer tidak diperlukan untuk menjalankan aplikasi.

## Dokumen proyek

- [Perencanaan MVP dan roadmap](docs/PERENCANAAN_MVP.md)
- [Keputusan teknis dan arsitektur RAG](docs/KEPUTUSAN_TEKNIS.md)
- [Tahap 3A: desain alur guru/admin dan milestone fondasi](docs/TAHAP_3_DESAIN_PRODUK.md)
- [Tahap 3A: desain database dan status sumber](docs/TAHAP_3_DATABASE.md)
- [Tahap 3A: kontrak API dan kriteria pengujian](docs/TAHAP_3_KONTRAK_API.md)
- [Pengumpulan sumber, folder, penamaan, dan checklist minimum](RUANGRPP_DATA/README.md)
- [Inventaris Excel](RUANGRPP_DATA/05_INVENTARIS_METADATA/Inventaris_Sumber_RuangRPP.xlsx)
- [Checklist tinjauan guru](RUANGRPP_DATA/04_TEMPLATE_INTERNAL/Checklist_Validasi_Guru_v0_1.md)

Calon acuan: kurikulum nasional SD berbasis CP, masih perlu penguncian versi dan pemeriksaan guru. Implementasi pilot memakai Next.js, FastAPI, PostgreSQL dan Docker; Qdrant serta penyedia LLM yang dapat diganti tetap untuk tahap berikutnya. Belum ada deployment publik atau pembelian layanan.
# Pembaruan pengumpulan panduan SD

Panduan mata pelajaran dari portal Kemendikdasmen memiliki kategori terpisah dari CP. Dashboard Docker mendukung unggahan 128 MiB, antrean ekstraksi dan pemilihan halaman SD pada file lintas jenjang. Lihat [panduan sumber SD](docs/PANDUAN_SUMBER_SD.md) dan [cara menjalankan admin](docs/ADMIN_DOCKER.md).
