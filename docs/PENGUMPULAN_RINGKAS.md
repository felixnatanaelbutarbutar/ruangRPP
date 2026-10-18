# Pengumpulan ringkas untuk satu pengelola

Keputusan 17 Oktober 2026: mulai dari satu pilot Matematika kelas 1. Ini pilihan pengembangan, bukan perubahan target jangka panjang SD kelas 1–6. Kurikulum/versi sumber tetap harus diperiksa sebelum generator digunakan.

## Lima kebutuhan awal

| Urutan | Kebutuhan | Jumlah awal | Kegunaan |
| --- | --- | --- | --- |
| 1 | CP resmi yang mencakup Matematika fase A | 1 file gabungan jika tersedia | Dasar capaian; tidak perlu memecah PDF per fase |
| 2 | Panduan pembelajaran dan asesmen yang sesuai | 1 | Prinsip pembelajaran dan asesmen lintas mapel |
| 3 | Contoh modul ajar Matematika kelas 1 | 1 topik | Contoh rancangan untuk ditinjau guru; contoh internal diperbolehkan dengan label yang jelas |
| 4 | Template modul ajar internal | 1 | Susunan hasil yang disepakati dan ditinjau guru |
| 5 | Checklist penilaian draf | 1 | Menilai kesesuaian tujuan, kegiatan, asesmen, bahasa, dan sumber |

Ini lima **kebutuhan**, bukan kewajiban mencari lima PDF resmi. Template dan checklist dibuat internal. Satu dokumen dapat memenuhi beberapa kebutuhan jika isinya memang sesuai. Tidak ada dokumen dinyatakan sudah terkumpul atau diverifikasi hanya karena target dibuat.

Panduan Mata Pelajaran Matematika adalah tambahan pertama bila butuh penjelasan penerapan CP. Tidak wajib mengumpulkan 20 panduan sekaligus. File yang sudah dimiliki boleh tetap diunggah, tetapi tidak semuanya perlu diindeks. CP tetap diperlukan untuk memeriksa dasar capaian dan versinya.

Daftar lama sekitar 80 baris merupakan target pengumpulan, bukan berarti sudah ada 80 dokumen atau semuanya wajib untuk mulai. Dashboard menampilkan lima prioritas. Target lain berada di **Pengembangan nanti** dan seluruh file lama tetap tersimpan. Inisialisasi menambah lima target dengan ID tetap; tidak menghapus target lama atau mengubah persetujuan dokumen.

## Alur paling singkat

1. Buka Kebutuhan Sumber → Unggah pada salah satu prioritas. Jenis, mapel, dan calon fase mengikuti target sebagai bantuan pengisian, bukan hasil verifikasi.
2. Pilih file. Judul berasal dari nama file dan boleh diperbaiki. Bila unggah umum, pilih jenis dokumen. Tautan sumber opsional tetapi sebaiknya ditempel saat tersedia.
3. Simpan. Selesai untuk tahap pengumpulan. Jangan mengisi tahun, kurikulum, atau halaman dengan tebakan.
4. Saat hendak menyiapkan sumber AI, buka Edit → **Persiapan sumber AI — kerjakan nanti**. Lengkapi data berdasarkan isi PDF dan tinjau izin serta hasil ekstraksi.

Fungsi isian lanjutan:

- Acuan/versi: mencegah pencampuran aturan kurikulum berbeda.
- Mapel/fase/bagian: menentukan teks yang relevan untuk pertanyaan guru.
- Halaman: menyaring bagian SD dalam dokumen lintas jenjang dan memberi rujukan yang dapat dilacak.
- Tahun/penerbit/URL: mengenali asal dan edisi file.
- Izin: menentukan apakah sumber boleh diproses, dikirim ke API, dan digunakan secara komersial.

Isian tersebut bukan syarat menyimpan unggahan. Ia tetap diperlukan sebelum aktivasi sesuai konteks; penyederhanaan formulir tidak sama dengan persetujuan sumber otomatis.

## PDF panjang dan RAG

150 halaman per file atau 30 file tidak otomatis membuat RAG buruk. Ukuran PDF terutama memengaruhi penyimpanan, transfer, dan ekstraksi; banyak gambar dapat memperbesar file tanpa menambah teks. Biaya embedding lebih terkait jumlah teks/token yang diindeks. Kualitas pencarian bergantung pada pemilihan bagian, kebersihan teks, pemisahan topik, filter, dan evaluasi.

Rencana penerapan bertahap:

1. Simpan PDF asli satu kali. Hasil ekstraksi dan indeks terpisah.
2. Periksa daftar isi dan pilih bagian SD yang dibutuhkan pilot. Jika penjelasan umum diperlukan, tandai perannya; jangan membuang konteks penting hanya demi sedikit halaman.
3. Gunakan rentang halaman yang diperiksa manusia. PDF A–F tidak diberi label fase A pada seluruh isi. Label file hanya calon cakupan; chunk harus punya cakupan bagian yang benar.
4. Buat potongan mengikuti bagian/subbagian, pertahankan judul serta hubungan tabel/CP. Kandidat 400–800 token dapat diuji untuk narasi; bukan aturan baku atau batas ukuran CP.
5. Simpan ID dokumen, revisi, jenis sumber, mapel, fase, lokasi halaman/bagian, versi acuan, dan izin pada indeks.
6. Ambil konteks CP, panduan, dan contoh sesuai fungsi masing-masing; jangan mengganti CP dengan contoh modul. Filter sumber aktif dan fase/mapel terlebih dahulu, kemudian pencarian relevansi. Jumlah potongan yang diberikan ke LLM dibatasi berdasarkan hasil evaluasi, tidak seluruh PDF.
7. Buang pengulangan header/footer dan teks duplikat dengan jejak sumber tetap tersimpan. Tambahkan dokumen hanya jika ada kekurangan yang terlihat dari pertanyaan uji guru.

Status implementasi: alur chunking, embedding, Qdrant, uji pencarian, aktivasi sumber, dan generator sudah ditambahkan. Implementasi awal memakai potongan maksimal 2.200 karakter per halaman/paragraf, belum menjamin pemahaman susunan tabel/CP. Evaluasi kualitas tetap dilakukan dengan guru; lihat [RAG_DOCKER.md](RAG_DOCKER.md). Sambil mengumpulkan sumber, guru dapat memakai mode AI langsung tanpa rujukan sebagaimana [MVP_AI_LANGSUNG.md](MVP_AI_LANGSUNG.md). Pilot Matematika tidak membatasi mata pelajaran pada mode AI langsung.

Mulai evaluasi dengan 5–10 pertanyaan pada satu topik, cek apakah bagian CP dan panduan yang benar ditemukan serta rujukannya mendukung draf. Ini latihan awal, bukan bukti kesiapan semua kelas/mapel. Perluas setelah guru meninjau hasil.

Referensi teknis: [metadata/payload Qdrant](https://qdrant.tech/documentation/concepts/payload/) dan [pencarian Qdrant](https://qdrant.tech/documentation/concepts/search/).
