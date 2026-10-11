# Perencanaan MVP RuangRPP

Rancang Pembelajaran, Lebih Mudah.

Versi dokumen: 0.1, 11 Oktober 2026. Status: usulan untuk ditinjau pemilik produk dan guru. Tahap aktif: 1–2, perencanaan dan persiapan inventaris. Belum ada pengujian generator.

## 1. Scope yang sudah ditetapkan pengguna

RuangRPP membantu guru SD kelas 1–6 membuat **satu jenis hasil: draf modul ajar/rencana pembelajaran terstruktur**. Target mencakup seluruh mapel yang relevan, tetapi pilihan generator dibuka hanya untuk kombinasi kurikulum, mapel/varian, fase/kelas, dan konteks sekolah yang sumbernya benar-benar siap. Uji awal kecil tidak menghapus target cakupan MVP.

Fitur inti:

1. Halaman utama, autentikasi dasar, peran guru dan admin.
2. Form kelas, mapel, semester jika relevan, topik, alokasi waktu, dan konteks pembelajaran. Fase diturunkan dari acuan terpilih; durasi menit dan jumlah JP harus dibedakan.
3. RAG mengambil rujukan yang sesuai sebelum model menyusun draf. CP, panduan, dan contoh memiliki peran berbeda; contoh tidak boleh mengubah CP.
4. Hasil dapat ditinjau, diedit, disimpan, dibuka kembali, dan diberi versi. Sumber yang benar-benar mendukung bagian hasil ditampilkan dengan lokasi yang tersedia.
5. Ekspor DOCX/PDF menjadi milestone setelah edit/simpan stabil. Bila belum lulus pemeriksaan, tampilkan status belum tersedia.
6. Admin mengunggah sumber, mengisi metadata, memeriksa izin, melihat ekstraksi, menguji retrieval, dan mengaktifkan atau menonaktifkan sumber.
7. Penanganan file gagal, duplikasi, OCR buruk, sumber tidak relevan, dan sumber belum tervalidasi.

Tidak termasuk: generator ATP/LKPD/bank soal/rapor terpisah, LMS, absensi/nilai siswa, OCR tanpa batas, fine-tuning, pembayaran dan langganan. Monetisasi dibahas setelah manfaat, biaya, keamanan, dan hak penggunaan terbukti.

Hasil selalu berstatus draf kerja guru. Jangan menjanjikan kesesuaian otomatis. Jika sumber tidak cukup, hentikan pembuatan draf berbasis kurikulum, jelaskan kekurangan, dan minta topik/konteks tambahan atau tawarkan kombinasi yang memang didukung.

## 2. Fakta, asumsi, dan keputusan terbuka

**Fakta dari pengguna:** calon acuan nasional SD diminta; pengguna mengenal FastAPI, Next.js, Qdrant, PostgreSQL, Docker, VPS, Vercel, serta ingin LLM lintas penyedia. Anggaran belum diberikan.

**Temuan sumber resmi per 11 Oktober 2026:**

- Portal kurikulum memuat Permendikdasmen 13/2025 sebagai perubahan atas Permendikbudristek 12/2024. Ini kandidat landasan, bukan bukti bahwa setiap sekolah memakai konfigurasi yang sama. [Portal resmi](https://kurikulum.kemendikdasmen.go.id/).
- Salinan CP 046/H/KR/2025 ditemukan pada situs BPMP Babel. Pembacaan penuh PDF melalui alat penelusuran gagal karena ukuran file. Cakupan per bagian dan pemetaan halaman belum diverifikasi. [Daftar dokumen resmi](https://bpmpbabel.kemendikdasmen.go.id/PPID/2025/06/26/tahun-2025/).
- Siaran resmi 23 Juni 2026 menyatakan Keputusan Kepala BKPDM 020/2026 mengubah CP Agama dan Budi Pekerti, sedangkan mapel lainnya tetap mengacu 046/H/KR/2025. Naskah keputusan beserta lampiran perubahan belum diperoleh dalam pekerjaan ini; siaran pers tidak menggantikan teks CP. [Siaran resmi](https://www.kemendikdasmen.go.id/siaran-pers/15636-capaian-pembelajaran-baru-telah-terbit-yang-berubah-hanya-mata-pelajaran-agama-dan-budi-pekerti).
- Katalog resmi memuat Panduan Pembelajaran dan Asesmen edisi revisi 2025. Hasil penelusuran katalog menampilkan label file “Copyright All Rights Reserved” dan footer CC BY-NC 4.0. Lingkup keterangan itu terhadap file perlu diperjelas; belum ada dasar untuk mengaktifkannya bagi RAG komersial. [Katalog resmi](https://repositori.kemendikdasmen.go.id/33290/).

Temuan ini bukan audit lengkap semua regulasi sampai tanggal pemeriksaan. Pada tahap 1, cek perubahan/pencabutan, tahun ajaran sasaran, lampiran SD reguler, dan penerapan di sekolah mitra. Jangan mencampur CP SD reguler dengan SDLB atau kurikulum berbeda hanya karena istilah fasenya sama.

**Asumsi kerja yang belum disahkan guru:** pemetaan umum calon fase A ke kelas 1–2, B ke 3–4, C ke 5–6 dipakai sebagai kerangka inventaris; penerapan per mapel harus diverifikasi. Kolom fase/kelas pada matriks adalah target pemeriksaan, bukan klaim CP tersedia.

**Rekomendasi awal:** mulai uji internal dari Matematika dan Bahasa Indonesia, minimal satu topik per fase yang lolos pemeriksaan. Tambah mapel dan kelas secara bertahap. Rilis tidak boleh disebut mendukung semua mapel sebelum semua kombinasi yang ditawarkan lulus.

## 3. Roadmap dengan batas selesai

Setiap tahap boleh dipecah menjadi pekerjaan 1–3 hari sesuai waktu belajar. Tidak ada tanggal peluncuran atau estimasi biaya yang diklaim sebelum kapasitas dan volume diketahui.

| Tahap | Output konkret | Kriteria selesai dan pengujian | Penanggung jawab yang dibutuhkan |
|---|---|---|---|
| 1. Acuan dan kebutuhan guru | Tahun ajaran/acuan versi, profil pengguna, matriks penerapan, template draf v1, checklist guru | Guru meninjau 2 skenario kelas rendah/tinggi; komponen wajib/opsional disetujui; perbedaan CP dan tujuan turunan jelas | Pemilik produk + guru peninjau |
| 2. Inventaris sumber | File asli, Excel, bukti izin, cakupan per bagian, paket minimum uji | Setiap file punya ID dan hash; izin, konten, ekstraksi dinilai terpisah; CP/panduan/contoh tersedia untuk kasus uji; belum ada aktivasi otomatis | Pengumpul + peninjau konten/izin |
| 3. UX, database, autentikasi | Alur guru/admin, skema data, kontrak API, catatan keputusan stack, kerangka aplikasi kecil | Uji login/logout dan batas peran; guru A tidak dapat membaca/mengubah draf guru B; opsi mapel mengikuti matriks dukungan | Pengembang + pemilik produk |
| 4. Ingest dan ekstraksi | Unggah PDF/DOCX, job pemrosesan, pratinjau teks/lokasi, admin sumber | Uji file rusak, tipe palsu, duplikat, PDF scan, tabel berantakan, izin belum jelas; kegagalan tercatat dan dapat dicoba ulang tanpa duplikasi | Pengembang + admin |
| 5. Chunking dan retrieval | Chunk berversi, embedding, indeks staging, filter, test set rujukan | Uji mapel/fase/varian salah, sumber dicabut, dan indeks lama; sumber belum aktif hanya dapat dipakai evaluator admin; benchmark retrieval disetujui | Pengembang + guru |
| 6. Generator | Adapter LLM, prompt/schema, validasi keluaran, pemetaan sitasi | Sumber kosong menghasilkan fallback; sitasi tidak ada ditolak; CP tidak berubah; timeout/429/JSON rusak tertangani; konfigurasi model tercatat | Pengembang + guru |
| 7. Hasil dan ekspor | Editor terstruktur, simpan/buka ulang, versi, DOCX/PDF | Edit tidak hilang setelah muat ulang; konflik edit ditangani; tabel, paragraf panjang, daftar sumber dan pergantian halaman ekspor diperiksa | Pengembang + guru |
| 8. Evaluasi guru | Hasil uji lintas kelas/fase/mapel, skor rubrik, daftar masalah | Semua kombinasi rilis punya hasil uji; tidak ada salah CP kritis, kutipan palsu, atau sumber nonaktif; perbaiki lalu uji kasus terkait lagi | Guru peninjau + pemilik produk |
| 9. Penguatan dan deployment | Batas pemakaian, logging, rahasia server, backup, staging, panduan operasi | Uji pemulihan backup, pembatasan akses, file berbahaya, prompt injection dari dokumen, biaya/latensi, kegagalan penyedia dan rollback | Pengembang + operator |
| 10. Rilis terbatas | Akses kelompok guru, panduan draf, formulir feedback, daftar cakupan nyata | Guru dapat menyelesaikan alur buat–edit–simpan; kendala tercatat; biaya aktual diukur; keputusan perluasan berdasarkan feedback | Pemilik produk + guru |

Sebelum tahap 5, prototipe ekstraksi dapat diuji tanpa membayar embedding. Sebelum tahap 6, uji retrieval berdiri sendiri. Setelah tahap 8 gagal, kembali ke sumber/retrieval/template yang bermasalah, jangan hanya memperpanjang prompt.

## 4. Bentuk output untuk ditinjau, belum template resmi

Satu skema berkomponen yang dapat dikonfigurasi menurut acuan: identitas dan konteks; rujukan CP beserta sumber; tujuan pembelajaran yang diturunkan; materi; kegiatan dengan durasi; media/sumber; asesmen dan bukti ketercapaian; penyesuaian kebutuhan belajar jika relevan; catatan guru; daftar referensi.

CP yang ditampilkan berasal dari teks terverifikasi. Tujuan, kegiatan, dan asesmen yang dibuat AI diberi label usulan, dengan hubungan ke rujukan; jangan dipresentasikan sebagai kutipan dokumen. Tidak semua kegiatan baru harus pernah tertulis dalam dokumen, tetapi kesesuaiannya dengan tujuan/CP harus dapat ditinjau. Jika persyaratan produk benar-benar membatasi kegiatan hanya pada contoh sumber, nyatakan aturan tersebut dalam template.

Form awal: kelas, mapel/varian agama atau seni, topik, durasi menit, jumlah pertemuan, tahun ajaran/acuan, konteks/sarana, kebutuhan umum belajar tanpa nama siswa. Semester opsional sesuai kebutuhan sekolah, bukan pembagi CP otomatis. Untuk muatan lokal tambah wilayah/bahasa dan dasar penerapan.

## 5. Evaluasi yang diusulkan

Mulai dari 6 kasus positif internal: 2 mapel × 3 fase, setelah paket sumber lengkap. Ini hanya tes alur awal. Sebelum rilis, usulkan sekurangnya 18 kasus positif yang membagi kelas 1–6 masing-masing minimal 3 kasus, fase A/B/C, dan semua mapel/varian yang diaktifkan. Tambahkan kasus bila matriks dukungan melampaui cakupan tersebut. Topik dan rujukan harapan harus dipilih guru dari sumber, tidak diisi secara fiktif.

Tambahkan minimal 8 kasus negatif: fase salah, agama/cabang seni salah, wilayah mulok salah, tanpa sumber memadai, sumber nonaktif, CP versi lama, teks scan buruk, dan instruksi berbahaya di dalam sumber. Sisihkan beberapa kasus untuk evaluasi akhir yang tidak dipakai menyetel prompt.

Setiap kasus menyimpan ID, kelas/fase, mapel/varian, topik, dokumen/chunk relevan menurut guru, bagian keluaran yang diperiksa, waktu respons, jumlah token/biaya bila tersedia, model, prompt, versi indeks, skor dan catatan peninjau.

| Ukuran | Cara ukur | Usulan batas rilis, belum hasil pengujian |
|---|---|---|
| Kebenaran filter | Chunk sesuai kurikulum, fase/mapel/varian dan status aktif | 100%; pelanggaran menghalangi rilis |
| Recall@5 | Rujukan relevan berlabel yang ditemukan dalam 5 hasil / semua rujukan relevan berlabel | ≥ 80% pada set kecil; guru menyetujui target |
| Precision@5 | Hasil relevan / hasil yang dikembalikan sampai 5 | Laporkan per mapel/fase, bukan hanya rata-rata |
| Dukungan sitasi | Klaim bersitasi yang benar-benar didukung / klaim bersitasi yang dinilai | ≥ 95%; kutipan/halaman palsu harus 0 |
| Kelengkapan dan pedagogi | Guru menilai CP, komponen, bahasa, kegiatan, asesmen pada skala 1–4 | Rata-rata ≥ 3 setiap dimensi dan tidak ada kesalahan CP kritis |
| Fallback | Kasus tanpa bukti memadai yang dihentikan dengan penjelasan tepat | 100% kasus negatif yang relevan |
| Respons dan biaya | p50/p95 durasi, biaya per draf dan per ingest | Diukur dulu; tetapkan target sesuai anggaran sebelum rilis |

Nilai 1 = perlu rombak, 2 = perlu banyak revisi, 3 = layak dengan revisi ringan, 4 = layak menurut peninjau. Catat identitas peninjau, tanggal, dan alasan. Penilaian otomatis membantu menemukan masalah, tidak menggantikan guru.

## 6. Langkah berikutnya

Kunci acuan/tahun ajaran dan guru peninjau, lalu kumpulkan satu file CP lintas mapel jika sesuai, panduan, dan contoh milik/berizin untuk dua mapel uji. Selesaikan template internal serta checklist bersama guru. Pilih stack final setelah anggaran, penyedia auth, dan strategi hosting diperjelas. Tidak perlu menunggu seluruh sumber SD terkumpul untuk belajar ingest, tetapi evaluasi kualitas suatu mapel wajib menunggu paket minimumnya siap.
