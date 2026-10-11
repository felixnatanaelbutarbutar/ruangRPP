# Pengumpulan sumber RuangRPP

11 Oktober 2026. Belum ada file sumber eksternal yang diunduh ke folder ini. Excel adalah inventaris utama. Daftar tautan kandidat bukan daftar file yang telah tersedia.

## Checklist minimum yang realistis

| Prioritas | Kebutuhan | Minimum sebelum evaluasi mapel uji | Status awal |
|---|---|---|---|
| P1 | Acuan kurikulum dan CP resmi | Seluruh bagian CP untuk kombinasi uji; boleh satu PDF lintas mapel/fase; cek perubahan 2026 untuk agama | Kandidat CP 2025 ditemukan; isi/izin belum selesai diperiksa |
| P1 | Panduan resmi pembelajaran dan asesmen | Satu versi sesuai acuan, dengan status hak penggunaan jelas untuk cara pemakaian yang direncanakan | Kandidat revisi 2025 ditemukan; izin perlu ditinjau |
| P1 | Contoh modul ajar berkualitas | Mulai 1 contoh per mapel uji; untuk uji 2 mapel × 3 fase, sarankan 6 contoh yang mewakili masing-masing kombinasi, atau lebih sedikit file jika cakupannya nyata | Belum dikumpulkan |
| P1 | Template internal | Satu template v1 beserta aturan komponen wajib/opsional dan bukti tinjauan guru | Usulan komponen di dokumen rencana; belum disahkan |
| P1 | Checklist evaluasi | Satu checklist dengan identitas peninjau, tanggal dan hasil uji | Draf 0.1 tersedia; belum ditinjau guru |
| P2 | Buku/panduan guru | Tambah hanya untuk kebutuhan materi atau kegiatan yang belum terjawab | Belum dikumpulkan |
| P2 | Rubrik, TP/ATP sebagai konteks, remedial/pengayaan | Tambah berdasarkan temuan evaluasi dan hak penggunaan | Belum dikumpulkan |
| P2 | Sumber lokal, varian agama/seni | Wajib sebelum kombinasi khusus tersebut ditawarkan | Belum dikumpulkan |

Jumlah file bukan ukuran kelengkapan. Satu CP gabungan tidak perlu diduplikasi per fase. Untuk mapel yang belum punya contoh berizin, tim dapat menyusun contoh sendiri lalu meminta guru meninjaunya dan mencatat hak penggunaannya. Jangan mengaktifkan dokumen tanpa izin yang cukup hanya untuk mengejar jumlah contoh.

## Matriks target pengumpulan

A/B/C di bawah adalah target pemeriksaan, dengan pemetaan kerja A: kelas 1–2, B: 3–4, C: 5–6; perlu verifikasi acuan dan penerapan per mapel. “Belum” berarti belum ada file lokal yang terverifikasi. Bukan kesimpulan bahwa sumber resminya tidak ada. Rincian per fase tersedia di tab Cakupan Excel.

| Mapel/kategori | A / kelas 1–2 | B / kelas 3–4 | C / kelas 5–6 | Catatan pemeriksaan | Dukungan awal |
|---|---|---|---|---|---|
| Pendidikan Agama dan Budi Pekerti | Belum | Belum | Belum | Pecah per agama; dapatkan lampiran perubahan 020/2026 | Belum didukung |
| Pendidikan Pancasila | Belum | Belum | Belum | Periksa CP dan contoh per fase | Belum didukung |
| Bahasa Indonesia | Belum | Belum | Belum | Kandidat uji awal; CP tidak dibagi semester tanpa dasar | Belum didukung |
| Matematika | Belum | Belum | Belum | Kandidat uji awal | Belum didukung |
| IPAS | Cek penerapan | Belum | Belum | Jangan otomatis menawarkan kelas 1–2; periksa struktur dan CP | Belum didukung |
| PJOK | Belum | Belum | Belum | Perhatikan fasilitas, keselamatan dan kelayakan kegiatan | Belum didukung |
| Seni | Belum | Belum | Belum | Rinci cabang seni yang tersedia di sekolah dan sumbernya | Belum didukung |
| Bahasa Inggris | Cek penerapan | Cek penerapan | Cek penerapan | Verifikasi fase, tahun ajaran dan penerapan sekolah | Belum didukung |
| Muatan Lokal/Bahasa Daerah | Cek wilayah | Cek wilayah | Cek wilayah | Dasar lokal, bahasa, kelas, dan instansi sesuai wilayah | Belum didukung |
| Mata pelajaran lainnya | Cek penerapan | Cek penerapan | Cek penerapan | Koding/KA muncul sebagai mapel pilihan di portal nasional; cek fase/kelas sebelum membuat entri khusus | Belum didukung |

Portal resmi menyebut Koding dan Kecerdasan Artifisial sebagai mata pelajaran pilihan: [Sistem Informasi Kurikulum Nasional](https://kurikulum.kemendikdasmen.go.id/). Ini belum menjadi status dukungan RuangRPP.

Status dukungan: **belum didukung → sumber sedang disiapkan → siap uji internal → didukung terbatas**, dengan **ditangguhkan** untuk cakupan yang dicabut sementara. “Tidak berlaku” hanya dipakai setelah bukti acuan tersedia. Rincikan baris per agama, cabang seni, wilayah/bahasa atau kelas ketika ada kebutuhan nyata. Status tahap tidak menyatakan sumber sudah benar untuk semua topik.

## Struktur final yang disepakati untuk pengumpulan

Seluruh folder dalam tree berikut sudah dibuat untuk pengumpulan oleh tim. Setiap folder, termasuk RUANGRPP_DATA, memiliki PETUNJUK.txt yang menjelaskan isi dan aturan pengumpulan. File petunjuk juga membuat struktur folder tercatat di Git walaupun dokumen sumber belum tersedia. PETUNJUK.txt bukan dokumen kurikulum, tidak perlu dicatat sebagai sumber di inventaris, dan tidak boleh diindeks sebagai sumber RAG.

```text
RUANGRPP_DATA/
├── README.md
├── 00_PANDUAN_UMUM/
├── 01_CAPAIAN_PEMBELAJARAN_CP/
│   ├── 01_PENDIDIKAN_AGAMA/
│   ├── 02_PENDIDIKAN_PANCASILA/
│   ├── 03_BAHASA_INDONESIA/
│   ├── 04_MATEMATIKA/
│   ├── 05_IPAS/
│   ├── 06_PJOK/
│   ├── 07_SENI/
│   ├── 08_BAHASA_INGGRIS/
│   ├── 09_MUATAN_LOKAL/
│   └── 10_MATA_PELAJARAN_LAINNYA/
├── 02_CONTOH_MODUL_AJAR/
│   ├── 01_PENDIDIKAN_AGAMA/
│   ├── 02_PENDIDIKAN_PANCASILA/
│   ├── 03_BAHASA_INDONESIA/
│   ├── 04_MATEMATIKA/
│   ├── 05_IPAS/
│   ├── 06_PJOK/
│   ├── 07_SENI/
│   ├── 08_BAHASA_INGGRIS/
│   ├── 09_MUATAN_LOKAL/
│   └── 10_MATA_PELAJARAN_LAINNYA/
├── 03_BUKU_DAN_PANDUAN_GURU/
├── 04_TEMPLATE_INTERNAL/
├── 05_INVENTARIS_METADATA/
└── 99_PERLU_DITINJAU/
```

Untuk file lintas mapel gunakan kategori paling tepat. PDF CP gabungan boleh berada langsung di `01_CAPAIAN_PEMBELAJARAN_CP/`; catat cakupan di Excel, jangan salin ke setiap mapel. `99_PERLU_DITINJAU/` menyimpan file karantina; pindahkan setelah selesai ditinjau dan perbarui path, tanpa menduplikasi aslinya.

Saat tahap ekstraksi dimulai, tambahkan `RUANGRPP_PROCESSED/<ID_DOKUMEN>/<VERSI_PROSES>/` di luar folder sumber untuk teks/OCR/chunk. Keluaran teknis ini tidak mengubah dokumen asli. Bukti izin disimpan sebagai lampiran tersendiri yang dirujuk metadata. Jangan memasukkan sumber berhak cipta, rahasia API, atau data pengguna ke Git publik.

## Aturan nama dan identitas

Pola umum: `KATEGORI_MAPEL_JENJANG_FASE-ATAU-KELAS_TOPIK_TAHUN.ext`. Nama file menjelaskan isi nyata. Gunakan underscore dan token `Lintas_Mapel`, `Lintas_Fase`, atau `Lintas_Jenjang` jika benar-benar sesuai; jangan memaksakan satu fase pada PDF gabungan.

Contoh pola, **bukan klaim file sudah tersedia**:

- `CP_Matematika_SD_Fase_A_Tahun_2025.pdf` hanya bila file memang khusus cakupan tersebut.
- `CP_Lintas_Mapel_Lintas_Jenjang_Lintas_Fase_046_H_KR_Tahun_2025.pdf` untuk keputusan gabungan setelah cakupannya diperiksa.
- `Modul_Ajar_Matematika_SD_Kelas_1_Penjumlahan_Tahun_Tidak_Diketahui.docx` jika tahun sumber tidak tercantum.
- `Panduan_Pembelajaran_dan_Asesmen_Tahun_2025.pdf` untuk panduan umum; token tidak relevan boleh dihilangkan.

Tahun adalah tahun dokumen, bukan tahun unduh. Jangan menebak. Simpan nama asli, URL asli, nama lokal dan path relatif. Gunakan suffix versi/ID hanya ketika perlu membedakan file nyata; jangan gunakan `final_fix_baru2`. Ekstensi mengikuti format asli, bukan sekadar mengganti nama ekstensi.

ID contoh `RR-CP-MAT-A-001`; untuk gabungan gunakan token `LINTAS`, misalnya `RR-CP-LINTAS-LINTAS-001`. Tetapkan ID sekali; jangan mengubahnya saat penamaan/topik berubah. File revisi baru memperoleh ID inventaris baru dan mengisi ID dokumen terkait. Hash membantu membedakan salinan identik dari versi yang isinya berbeda.

## Menggunakan Excel

1. Baca tab Petunjuk. Tab Kandidat hanya menyimpan tautan hasil penelusuran dan tindakan berikutnya.
2. Setelah memperoleh file asli, isi satu baris di Inventaris. Jangan isi baris inventaris untuk file yang belum ada. Seratus baris masukan sudah disiapkan; filter berada di baris 5.
3. Lengkapi 20 kolom minimum. Kolom tambahan mencatat nama asli, acuan, bukti izin, pemeriksa, lokasi cakupan, hash, aktivasi dan relasi versi. Metadata yang tidak diketahui ditulis `Tidak diketahui`, kecuali tanggal/URL/hash yang dibiarkan kosong dengan alasan di Catatan.
4. Multi-mapel/fase/kelas memakai titik koma, misalnya `A;B;C`. Dropdown fase menyediakan kombinasi umum; isian mapel tetap bebas agar varian tidak hilang. Jangan menganggap CP fase otomatis menetapkan topik per kelas.
5. Isi tanggal sebagai tanggal Excel, tampil `yyyy-mm-dd`. Pilih dropdown status izin, pemrosesan, kualitas teks, validasi, dan aktivasi secara terpisah. Izin penggunaan untuk embedding eksternal dan produk berbayar harus didukung bukti.
6. Perbarui Cakupan dengan ID CP dan contoh yang ada, status pengumpulan, hasil uji dan peninjau. Baris Cakupan adalah target dukungan, bukan file tambahan.
7. Periksa ID ganda (ditandai merah) dan rekonsiliasi file/path. Jika melampaui baris 105, perluas tabel serta salin validasi/format dari baris sebelumnya. Dropdown bukan pengganti validasi pada backend; paste dapat melewati kontrol spreadsheet.

Status izin `diizinkan sesuai bukti` berarti penggunaannya cocok dengan ruang lingkup bukti yang dicatat, bukan izin universal. `nonkomersial saja` dan `perlu ditinjau` tidak boleh mengaktifkan RAG produk berbayar. Tidak ada formula Excel yang otomatis memberi persetujuan aktivasi.
