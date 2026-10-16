# Pengumpulan panduan besar dan contoh modul SD

Keputusan implementasi: 14 Oktober 2026. Kurikulum sasaran belum dikunci.

## Jenis sumber yang berbeda

Portal yang diberikan pengguna berjudul [Panduan Mata Pelajaran](https://kurikulum.kemendikdasmen.go.id/panduan-mapel#filter-pmp). Pemeriksaan filter SD/MI menampilkan 20 dokumen. Ini panduan penerapan pembelajaran, bukan pengganti dokumen keputusan CP. Aplikasi menyediakan kategori `Panduan_Mapel` terpisah dari `CP`, `Panduan` pembelajaran dan asesmen, serta `Modul_Ajar`.

Daftar 20 menjadi target pengumpulan per file: enam agama dipisahkan, kepercayaan tersendiri, empat cabang seni, koding/KA, dan dua program kebutuhan khusus. Fase awal mengikuti daftar yang dikirim pengguna; tetap perlu dicocokkan dengan PDF. Tahun, edisi, halaman, dan izin tidak otomatis diisi. Muatan lokal dan kebutuhan sumber lainnya tetap dapat ditambahkan.

### CP tetap diperlukan

CP resmi menjadi dasar capaian; Panduan Mata Pelajaran membantu penerapan; contoh modul memperlihatkan rancangan untuk topik tertentu. Dalam rancangan RAG RuangRPP, ketiganya memiliki fungsi berbeda. Jika panduan mengutip CP, cocokkan kutipan dan versinya dengan sumber resmi sebelum memakainya; keberadaan kutipan tidak membuktikan versi CP masih berlaku. Simpan file asli sekali dan hindari pengindeksan kutipan yang berulang tanpa kebutuhan.

Pemeriksaan 15 Oktober 2026: [siaran pers resmi 23 Juni 2026](https://www.kemendikdasmen.go.id/siaran-pers/15636-capaian-pembelajaran-baru-telah-terbit-yang-berubah-hanya-mata-pelajaran-agama-dan-budi-pekerti) menjelaskan Keputusan Kepala BKPDM Nomor 020 Tahun 2026 mengubah CP Agama dan Budi Pekerti pada Keputusan BSKAP 046/H/KR/2025. Menurut siaran pers tersebut, CP mapel lainnya tetap mengacu keputusan 2025. Naskah keputusan dan lampiran yang tepat masih harus dikumpulkan serta diperiksa sebelum aktivasi. Jangan otomatis menganggap panduan 2025 telah memuat perubahan agama 2026.

Satu keputusan/lampiran dapat mencakup beberapa mapel dan fase. Kumpulkan berdasarkan cakupan isi yang nyata, bukan mewajibkan 20 file CP atau salinan terpisah untuk setiap fase. Pengembangan dashboard dapat berlanjut saat pengumpulan CP berlangsung; evaluasi kesesuaian kurikulum generator menunggu sumber CP yang telah diperiksa.

Bahasa Inggris dan IPAS memakai calon cakupan SD B/C; koding/KA C; panduan lainnya A/B/C sesuai daftar pengguna. Ini belum persetujuan penerapan sekolah. [Portal kurikulum](https://kurikulum.kemendikdasmen.go.id/) menjelaskan koding/KA sebagai pilihan. Program kebutuhan khusus bukan kebutuhan seragam seluruh kelas SD; tinjauan ahli diperlukan.

## File besar

[Repositori Matematika](https://repositori.kemendikdasmen.go.id/33608/) mencatat PDF 59 MB; ukuran tiap file berbeda. Aplikasi menerima maksimum 128 MiB per file dan PDF maksimum 2.000 halaman. Batas ini keputusan teknis pilot, bukan sifat semua panduan.

1. Unggah asli sekali dan catat seluruh cakupan fase/jenjangnya.
2. Isi pasangan mapel–fase SD yang relevan secara terpisah.
3. Bila belum mengetahui halaman, biarkan kosong untuk ekstraksi seluruh file.
4. Buka pratinjau dan bandingkan dengan PDF. Tambahkan rentang halaman SD per cakupan melalui Edit. Sampul dihitung sebagai halaman PDF 1; nomor cetak bisa berbeda.
5. Perubahan metadata mengantrekan ekstraksi ulang dan mereset tinjauan. File asli tetap utuh.
6. Untuk file yang mencakup D/E/F, setiap cakupan SD perlu rentang halaman sebelum memenuhi syarat indeks. Sistem memproses gabungan halaman pilihan tanpa menggandakan halaman yang tumpang tindih.

Unggah mengembalikan status antrean; worker Docker mengekstrak setelah file tersimpan. Batas per proses: 180 detik, 1 GiB memori subprocess dan 5 juta karakter; DOCX dibatasi 80 MiB hasil dekompresi. Jika worker terhenti, pekerjaan berjalan lebih dari 5 menit ditandai gagal dan dapat diproses ulang. Revisi lama tidak boleh menimpa metadata/pekerjaan baru. OCR belum tersedia.

## Contoh modul ajar

Contoh yang dikirim pengguna menyebut fase E/F dan kelas 10–12 dari [portal SMA](https://sma.kemendikdasmen.go.id/pembelajaran/modul-ajar/identifikasi-tujuan-penulis-teks-naratif). Contoh tersebut tidak dapat dipakai sebagai bukti cakupan SD A/B/C. Jangan mengganti labelnya menjadi SD.

Modul ajar wajar spesifik pada topik atau unit; tidak perlu satu file yang mencakup seluruh mapel. Cari contoh melalui filter fase, kelas, dan mapel pada [pencarian perangkat ajar Ruang GTK](https://pusatinformasi.rumahpendidikan.kemendikdasmen.go.id/hc/id/articles/52514632411417-Mencari-Perangkat-Ajar). Portal juga memakai istilah [Contoh Kegiatan Intrakurikuler](https://pusatinformasi.rumahpendidikan.kemendikdasmen.go.id/hc/id/articles/52478122488089-Contoh-Kegiatan-Intrakurikuler). Ketersediaan contoh SD tertentu belum diverifikasi di proyek ini.

Mulai uji kualitas dari satu topik dan satu cakupan yang memiliki CP, panduan, contoh, template dan peninjau siap. Bila contoh sah belum tersedia, tim dapat menyusun contoh internal untuk ditinjau guru; beri label internal, bukan contoh resmi. Cakupan MVP tetap kelas 1–6 dengan dukungan bertahap.

## Izin dan status

Repositori Matematika menampilkan informasi hak cipta pada item dan ketentuan nonkomersial pada footer. Cakupan izin perlu diperiksa; jangan mengartikan akses unduh sebagai izin indeks komersial. Catat bukti dan keputusan peninjau untuk penggunaan, adaptasi, serta pengiriman ke layanan eksternal.

Lolos otomatis hanya format, metadata dan keterbacaan dasar. Tinjauan isi, izin dan kualitas ekstraksi dilakukan admin. Siap indeks belum berarti aktif atau sudah diunggah ke Qdrant. Belum ada pemanggilan embedding/LLM dari dashboard.

## Berkas pengumpulan

Panduan disimpan di `RUANGRPP_DATA/03_BUKU_DAN_PANDUAN_GURU/01_PANDUAN_MATA_PELAJARAN/`; petunjuk penamaan tersedia di folder tersebut. Daftar target baru ada di `05_INVENTARIS_METADATA/Daftar_Target_Panduan_Mapel_SD.xlsx`.

Inventaris utama lama tetap untuk satu baris per file yang benar-benar diperoleh. Target baru bukan bukti sudah terkumpul; isikan ID inventaris dan nama file setelah diperoleh. Belum ada sinkronisasi Excel–dashboard. Daftar calon CP/modul lama tetap belum dikonfirmasi dan perlu penyesuaian penerapan per sumber.
