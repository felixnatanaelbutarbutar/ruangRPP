# RAG pilot RuangRPP

**Tambahan mode MVP:** dashboard guru sekarang menyediakan **Draf AI langsung** tanpa dokumen, embedding, atau Qdrant. Mode ini diberi label belum diverifikasi terhadap CP. Panduan penggunaan dan kuota percobaan ada di [MVP_AI_LANGSUNG.md](MVP_AI_LANGSUNG.md). Aturan sumber di bawah khusus untuk mode berbasis sumber.

Implementasi pertama: pencarian semantik Qdrant, sumber terverifikasi, dan draf terstruktur. Ini belum merupakan bukti kualitas kurikulum atau kesiapan rilis publik. Uji pemakaian dilakukan pemilik proyek sesuai permintaan; tidak ada dokumen otomatis disetujui dan tidak ada panggilan AI berbayar saat build.

## Alur yang tersedia

1. Unggah PDF/DOCX melalui alur pengumpulan yang ada. Dokumen asli disimpan sekali.
2. Lengkapi metadata sumber yang akan digunakan. Setujui isi, hak penggunaan, kualitas ekstraksi, dan pemrosesan eksternal setelah pemeriksaan.
3. Buka **Admin → Indeks Vektor → Siapkan potongan**. Ini belum memanggil penyedia AI.
4. Periksa pratinjau. Potongan mengikuti halaman PDF/paragraf/tabel DOCX, maksimal 2.200 karakter. Pemotongan mengutamakan batas baris/kalimat; teks sangat panjang masih dapat terpecah. Locator asli selalu disimpan. Potongan yang identik dalam cakupan sama dideduplikasi.
5. Klik **Kirim potongan ke API embedding**. Tindakan ini berbayar sesuai penyedia. Antrean PostgreSQL dikerjakan `rag-worker`, batch 16 potongan, batas 2.000 potongan per dokumen. Worker gagal tidak otomatis mengulang panggilan berbayar.
6. Setelah siap, masukkan pertanyaan uji. Periksa hasil dan halaman, tulis catatan, lalu aktifkan sumber. Embedding selesai tidak berarti sumber aktif.
7. Bila CP, panduan pembelajaran/asesmen, contoh modul, template, dan checklist sesuai cakupan sudah aktif, pilihan muncul di generator. Admin dapat memakai **Uji draf** tanpa akun Google atau kuota guru; tetap memakai API berbayar.
8. Guru masuk Google → pilih kelas/mapel yang siap → isi topik dan menit → buat draf. Hasil, rujukan, model, pemakaian token yang dilaporkan penyedia, dan waktu proses disimpan di PostgreSQL. Draf dapat dibuka dan disunting kembali.

## Konfigurasi

Tetap memakai Next.js, FastAPI, PostgreSQL, dan Docker. Layanan tambahan:

- `qdrant`: image `qdrant/qdrant:v1.19.2`, volume `qdrant_data`, tidak membuka port ke host/publik.
- `rag-worker`: pekerja indeks terpisah dari worker ekstraksi. Tidak memasang volume file asli; menerima teks yang sudah diekstrak dari PostgreSQL.

Tambahkan kunci penyedia ke `.env` lokal. Jangan menaruh key di repository atau browser:

```dotenv
OPENAI_API_KEY=isi_di_mesin_sendiri
DEEPSEEK_API_KEY=
QDRANT_API_KEY=pilih_kunci_lokal_yang_panjang
RAG_ENABLED=true
RAG_REQUIRE_QUOTA=true
RAG_MIN_SCORE=0.35
```

Di **Model LLM**, simpan/pilih model default dan pengaturan embedding. Default embedding adalah `text-embedding-3-small` pada OpenAI. Tidak ada model LLM default yang diam-diam dipilih. Gunakan ID model yang tersedia bagi akun Anda.

Adapter generasi mendukung OpenAI, DeepSeek, atau endpoint kompatibel OpenAI yang dikonfigurasi operator. Generasi memakai Chat Completions dengan keluaran `json_object`; tidak semua model mendukung kontrak ini. Kegagalan dilaporkan, tidak otomatis dialihkan ke model lain. Embedding terpisah dari LLM: DeepSeek dapat dipakai untuk generasi dengan embedding OpenAI.

Untuk penyedia lain, isi pasangan yang diperlukan:

```dotenv
CUSTOM_LLM_BASE_URL=https://endpoint-resmi-penyedia/v1
CUSTOM_LLM_API_KEY=
CUSTOM_EMBEDDING_BASE_URL=https://endpoint-embedding-penyedia/v1
CUSTOM_EMBEDDING_API_KEY=
```

URL di atas hanya pola, bukan layanan yang telah diverifikasi. Operator memasukkan endpoint HTTPS milik penyedia yang dipilih. Base URL sudah menyertakan versi yang diperlukan; aplikasi menambahkan `/chat/completions` atau `/embeddings`. Kunci dan konfigurasi harus tersedia pada API serta worker melalui Compose.

Jalankan dari root proyek:

```powershell
docker compose up --build -d
```

Inisialisasi menambah tabel `rag_indexes`, `rag_chunks`, dan `lesson_drafts`. Tidak menghapus unggahan atau transaksi. Build web memakai Webpack untuk mengatasi kegagalan font Turbopack sebelumnya. Jangan menghapus volume ketika memperbarui aplikasi.

## Aturan sumber dan pencarian

- Satu potongan punya satu cakupan mapel/fase/varian/wilayah. Dokumen PDF dengan lebih dari satu cakupan harus mempunyai rentang halaman untuk setiap cakupan. DOCX multi-cakupan belum didukung: gunakan satu cakupan yang benar atau siapkan dokumen internal terpisah.
- Versi kurikulum harus cocok **persis**. Panduan, template, dan checklist dapat berstatus `Lintas mapel / Umum`, tetapi tetap memakai acuan yang sama. Hal ini mencegah pencampuran versi secara diam-diam.
- Filter kelas memakai metadata kelas bila tersedia; CP fase A/B/C dipetakan ke 1–2/3–4/5–6 sebagai kandidat. Cakupan kelas baru siap jika paket sumber pendukung cocok. Peninjau harus memeriksa penerapan sebenarnya.
- CP, panduan, dan contoh diambil terpisah agar contoh tidak menggantikan dasar CP. Pencarian Qdrant dibatasi ke ID potongan yang lolos filter PostgreSQL. Teks untuk LLM dibaca dari PostgreSQL, bukan mempercayai payload bebas dari indeks.
- Template dan checklist ringkas dimasukkan utuh, maksimal 14.000 karakter masing-masing. Bila ada lebih dari satu yang cocok, versi indeks dipilih secara deterministik; untuk pilot, aktifkan hanya satu template dan satu checklist per acuan.
- Ambang kemiripan awal `0.35` adalah parameter eksperimen, bukan ukuran benar/salah. Jika suatu peran sumber tidak menemukan hasil relevan, generasi dihentikan. Tidak ada fallback mengarang CP. Kesamaan semantik saja belum membuktikan dukungan terhadap klaim.
- Koleksi vektor dipisahkan berdasarkan penyedia, endpoint, model embedding, dan dimensi aktual. Mengganti embedding memerlukan persiapan/indeks ulang. Koleksi lama tidak dicampur dengan query model baru.
- Pemeriksaan revisi, persetujuan, dan status aktif dilakukan sebelum pencarian serta sebelum menyimpan hasil. Perubahan metadata/tinjauan atau penonaktifan sumber memblokir penggunaan baru. Worker membersihkan vektor indeks nonaktif/gagal/usang; Qdrant tidak menjadi sumber otorisasi.

## Draf dan rujukan

Model menerima konteks sebagai data, bukan perintah yang boleh mengubah aturan sistem. Tidak ada tools browsing/eksekusi pada model. Hasil harus memenuhi struktur JSON dengan judul, tujuan pembelajaran, dan bagian modul. Bagian mengikuti template yang telah ditinjau, bukan satu format nasional yang diasumsikan universal.

ID rujukan harus berasal dari hasil pencarian. Setiap tujuan wajib menyertakan potongan CP. Nama dokumen dan locator ditambahkan dari database. Kegiatan usulan diberi label adaptasi. Validasi ini mencegah ID sumber fiktif, **tidak membuktikan kebenaran setiap kalimat**; guru tetap menilai relevansi, asesmen, durasi, dan kesesuaian CP.

Edit draf tidak memanggil AI atau memotong kuota. Rujukan awal dipertahankan; kecocokannya perlu diperiksa lagi setelah suntingan. Draf lama menyimpan snapshot sumber historis, bukan pernyataan bahwa sumber itu masih aktif untuk generasi baru.

## Kuota dan biaya

- Guru: satu kuota setelah draf berhasil disimpan. Saldo dan potongan dipisahkan per lingkungan sandbox/produksi. Penguncian akun guru mencegah permintaan paralel memakai saldo sama; ID permintaan yang sama mengembalikan draf tersimpan.
- Kegagalan retrieval/LLM, respons terpotong, JSON tidak sesuai, atau sumber berubah tidak memotong kuota aplikasi. Penyedia tetap dapat mengenakan biaya API yang sudah dipakai.
- Default membutuhkan kuota. Guru dapat mengaktifkan 3 kuota percobaan satu kali per akun per lingkungan tanpa pembayaran. `RAG_REQUIRE_QUOTA=false` hanya berlaku di sandbox. Produksi selalu memerlukan kuota. Admin dapat mencoba draf melalui menu Indeks Vektor tanpa kuota guru.
- Batas pilot 20 draf berhasil per guru dalam 24 jam. Tidak ada panggilan ulang otomatis ke LLM. Batas ini bukan pengganti rate limit dan pembatas biaya global untuk rilis publik.

## Pemeriksaan manual pemilik proyek

Pengujian di bawah belum dijalankan agen:

1. Sumber tanpa persetujuan/izin tidak dapat diindeks. Pratinjau tidak mengirim teks ke API.
2. PDF A–F dengan beberapa cakupan tidak melabeli semua halaman sebagai fase A; potongan mengikuti batas halaman yang diperiksa.
3. Selesainya embedding menghasilkan **Siap diuji**, bukan **Aktif**. Aktivasi membutuhkan hasil pencarian dan catatan peninjau.
4. Bandingkan potongan yang ditemukan dengan pertanyaan uji dan halaman asli. Coba pertanyaan di luar topik/fase.
5. Nonaktifkan atau ubah versi sumber; pencarian baru harus mengabaikannya walaupun vektor fisik masih ada.
6. Aktifkan paket lima peran sumber, gunakan uji draf admin, tinjau isi dengan guru. ID rujukan dan halaman harus sesuai konteks nyata.
7. Buat draf guru: berhasil tersimpan memotong satu kuota, permintaan ulang dengan ID sama tidak memotong dua kali. Gagal tidak mengurangi kuota aplikasi.
8. Akun lain tidak boleh membaca/menyunting draf tersebut. Edit dari tab dengan revisi lama harus ditolak.

## Kendala umum dan batas pilot

- Tidak ada pilihan kelas: periksa sumber aktif dari kelima peran, kecocokan acuan, mapel/fase/kelas, serta konfigurasi embedding yang sama.
- Indeks stale: metadata/revisi/persetujuan berubah. Siapkan ulang, embed, uji, dan aktifkan kembali.
- Qdrant tidak tersedia: lihat `docker compose logs --tail 60 qdrant rag-worker api`. Jangan menampilkan `.env` atau `docker compose config` ke publik.
- API 401/403: periksa key/akses. API 429 dapat berarti kuota atau rate limit; bukan selalu saldo nol.
- Model tidak mendukung JSON mode atau parameter output: pilih ID model kompatibel. Sistem tidak menebak model pengganti.
- Potongan kehilangan tabel/konteks: hentikan aktivasi dan perbaiki pemilihan bagian atau ekstraksi. OCR, analisis tata letak kompleks, hybrid search, dan reranking belum tersedia.
- Pilot memakai pencarian kandidat metadata di PostgreSQL sebelum filter Qdrant. Cocok untuk koleksi awal; perlu indeks metadata terukur dan paginasi lebih lanjut saat koleksi membesar.
- Generasi sinkron dibatasi timeout penyedia dan proxy. Pemakaian API bisa tetap tertagih jika koneksi terputus; draf yang sudah tersimpan dapat dibuka kembali. Pekerjaan generasi tahan restart dan batas biaya global merupakan penguatan berikutnya.
- DOCX/PDF export belum termasuk tahap ini. Sesi guru mengikuti autentikasi Google yang sudah ada.

## Dokumentasi resmi

- [Qdrant Query API](https://api.qdrant.tech/api-reference/search/query-points)
- [Qdrant upsert](https://api.qdrant.tech/api-reference/points/upsert-points)
- [Qdrant v1.19.2](https://github.com/qdrant/qdrant/releases/tag/v1.19.2)
- [OpenAI embeddings](https://developers.openai.com/api/reference/resources/embeddings/methods/create)
- [OpenAI Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)
- [DeepSeek Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/)
