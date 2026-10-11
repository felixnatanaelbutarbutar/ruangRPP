import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const root = 'C:/my-project/ruangRPP';
const qa = `${root}/tools/perencanaan/qa`;
const out = `${root}/RUANGRPP_DATA/05_INVENTARIS_METADATA/Inventaris_Sumber_RuangRPP.xlsx`;
await fs.mkdir(qa, { recursive: true });
const wb = Workbook.create();
const scope = wb.worksheets.add('Cakupan');
const inv = wb.worksheets.add('Inventaris');
const candidates = wb.worksheets.add('Kandidat');
const guide = wb.worksheets.add('Petunjuk');
const navy = '#233B53';
const amber = '#FFF3D6';

function base(s, title, subtitle, headers, endRow) {
  const n = headers.length;
  s.showGridLines = false;
  s.getRangeByIndexes(0, 0, endRow, n).format.font = {name:'Arial',size:10,color:'#243344'};
  s.getRangeByIndexes(0, 0, endRow, n).format.verticalAlignment='center';
  s.getRangeByIndexes(0, 0, endRow, n).format.columnWidth=22;
  s.getRangeByIndexes(0, 0, endRow, n).format.rowHeight=28;
  s.getRange('A2').values=[[title]];
  s.getRange('A2').format.font={name:'Arial',size:15,bold:true,color:navy};
  s.getRange('A3').values=[[subtitle]];
  s.getRange('A3').format.font={name:'Arial',size:10,italic:true,color:'#526477'};
  s.getRangeByIndexes(4,0,1,n).values=[headers];
  s.getRangeByIndexes(4,0,1,n).format={fill:navy,font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},wrapText:true,rowHeight:52,horizontalAlignment:'center',verticalAlignment:'center'};
  s.getRangeByIndexes(5,0,endRow-5,n).format.wrapText=true;
  s.freezePanes.freezeRows(5);
  s.freezePanes.freezeColumns(2);
}
function list(s, col, start, end, values) {
  s.getRange(`${col}${start}:${col}${end}`).dataValidation={rule:{type:'list',values}};
}
function table(s, range, name) {
  const t=s.tables.add(range,true,name);
  t.showFilterButton=true;
  return t;
}
function issue(s, range, text) {
  s.getRange(range).conditionalFormats.add('containsText',{text,format:{fill:'#FFF0DA',font:{color:'#854D0E'}}});
}
const headers = [
 'ID dokumen','Nama dokumen','Kategori dokumen','Mata pelajaran','Jenjang','Fase','Kelas','Tahun/versi','Penerbit/instansi','URL sumber asli','Format file','Nama file lokal',
 'Status pemeriksaan izin penggunaan','Ringkasan lisensi/ketentuan penggunaan','Status pemrosesan','Kualitas teks','Status validasi','Catatan','Nama pengumpul','Tanggal dicatat',
 'Nama file asli','Path relatif lokal','Acuan kurikulum','Bukti izin/URL ketentuan','Pemeriksa izin','Tanggal pemeriksaan izin','Cakupan bagian/halaman','SHA-256 file','Status aktivasi','ID dokumen terkait'
];
base(inv,'Inventaris file sumber','Satu baris untuk satu file yang sudah tersedia. Isi mulai baris 6; status diperiksa terpisah.',headers,105);
inv.tabColor='#49647D';
inv.getRange('A6:AD105').format.fill='#FFFCF4';
table(inv,'A5:AD105','InventarisDokumen');
const widths={A:24,B:46,C:28,D:34,E:18,F:22,G:22,H:22,I:38,J:60,K:16,L:58,M:34,N:62,O:26,P:26,Q:26,R:60,S:26,T:20,U:58,V:60,W:34,X:60,Y:26,Z:24,AA:60,AB:68,AC:28,AD:28};
for(const [c,width] of Object.entries(widths)) inv.getRange(`${c}5:${c}105`).format.columnWidth=width;
inv.getRange('T6:T105').setNumberFormat('yyyy-mm-dd');
inv.getRange('Z6:Z105').setNumberFormat('yyyy-mm-dd');
for(const c of ['A','F','G','H','AB','AD']) inv.getRange(`${c}6:${c}105`).setNumberFormat('@');
list(inv,'C',6,105,['CP','Panduan umum','Contoh modul ajar','Buku/panduan guru','Template internal','Checklist validasi','Sumber lokal','Lainnya']);
list(inv,'E',6,105,['SD','Lintas jenjang','Tidak diketahui']);
list(inv,'F',6,105,['A','B','C','A;B','B;C','A;C','A;B;C','Lintas fase','Tidak berlaku','Tidak diketahui']);
list(inv,'K',6,105,['PDF','DOCX','XLSX','TXT','MD','Lainnya']);
list(inv,'M',6,105,['belum diperiksa','perlu ditinjau','diizinkan sesuai bukti','nonkomersial saja','tidak diizinkan']);
list(inv,'O',6,105,['belum diproses','sedang diproses','berhasil','gagal','perlu ditinjau']);
list(inv,'P',6,105,['baik','perlu OCR','teks berantakan','belum diperiksa']);
list(inv,'Q',6,105,['belum divalidasi','valid','perlu revisi','ditolak']);
list(inv,'AC',6,105,['nonaktif','staging uji internal','aktif','ditangguhkan']);
inv.getRange('A6:A105').conditionalFormats.addCustom('AND(A6<>"",COUNTIF($A$6:$A$105,A6)>1)',{fill:'#FDE8E7',font:{color:'#A61B1B',bold:true}});
issue(inv,'M6:M105','perlu ditinjau');
issue(inv,'O6:O105','gagal');
issue(inv,'Q6:Q105','ditolak');

const sh=['Mapel/kategori','Fase target','Kelas target','Penerapan kurikulum','Pengumpulan CP','Pengumpulan contoh','Status dukungan','ID CP terkait','ID contoh terkait','Status uji retrieval','Peninjau','Catatan'];
base(scope,'Cakupan sumber dan dukungan','Target pemeriksaan per 11 Oktober 2026. Semua cakupan belum didukung; fase/kelas belum disahkan per mapel.',sh,35);
scope.tabColor=navy;
const cats=[
 ['Pendidikan Agama dan Budi Pekerti','Rinci per agama; dapatkan perubahan CP 020/2026 beserta lampiran.'],
 ['Pendidikan Pancasila','Periksa bagian CP dan contoh sesuai fase.'],
 ['Bahasa Indonesia','Kandidat uji awal; topik per kelas harus ditinjau guru.'],
 ['Matematika','Kandidat uji awal; topik per kelas harus ditinjau guru.'],
 ['IPAS','Periksa struktur dan CP; jangan otomatis menawarkan kelas 1–2.'],
 ['PJOK','Periksa CP, fasilitas dan keamanan kegiatan.'],
 ['Seni','Rinci per cabang seni yang nyata didukung sekolah.'],
 ['Bahasa Inggris','Periksa fase, tahun ajaran dan penerapan di sekolah.'],
 ['Muatan Lokal/Bahasa Daerah','Rinci wilayah/bahasa dan dasar penerapan setempat.'],
 ['Mata pelajaran lainnya','Identifikasi mapel nyata; Koding/KA perlu verifikasi fase/kelas.']
];
const sr=[];
for(const [subject,note] of cats) for(const [phase,grade] of [['A','1;2'],['B','3;4'],['C','5;6']]) {
 sr.push([subject,phase,grade,'belum diverifikasi','belum dikumpulkan','belum dikumpulkan','belum didukung',null,null,'belum diuji',null,note]);
}
scope.getRange('A6:L35').values=sr;
scope.getRange('A6:L35').format.rowHeight=44;
const sw=[36,16,17,27,26,26,27,27,27,27,26,68];
sw.forEach((width,i)=>scope.getRangeByIndexes(4,i,31,1).format.columnWidth=width);
table(scope,'A5:L35','CakupanDukungan');
list(scope,'D',6,35,['belum diverifikasi','berlaku sesuai bukti','tidak berlaku']);
for(const c of ['E','F']) list(scope,c,6,35,['belum dikumpulkan','sebagian terkumpul','terkumpul belum diperiksa','cukup untuk uji','tidak berlaku']);
list(scope,'G',6,35,['belum didukung','sumber sedang disiapkan','siap uji internal','didukung terbatas','ditangguhkan','tidak berlaku']);
list(scope,'J',6,35,['belum diuji','lulus','perlu perbaikan','gagal']);
issue(scope,'G6:G35','ditangguhkan');

const ch=['Kandidat sumber','Tahun/nomor','URL resmi','Bukti yang ditemukan','Izin untuk RAG komersial','Status file lokal','Tindakan berikutnya','Tanggal cek'];
base(candidates,'Kandidat sumber resmi','Tautan yang ditemukan bukan dokumen terkumpul. Tidak ada kandidat yang otomatis diaktifkan.',ch,9);
const checked=new Date('2026-10-11T00:00:00Z');
candidates.getRange('A6:H9').values=[
 ['Keputusan CP lintas jenjang','046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','Tercantum dalam daftar PPID BPMP Babel; baca penuh melalui alat web gagal karena ukuran.','perlu ditinjau','belum diunduh','Peroleh file; cocokkan versi/lampiran, cakupan SD dan ketentuan penggunaan.',checked],
 ['Perubahan CP Agama dan Budi Pekerti','020/2026','https://www.kemendikdasmen.go.id/siaran-pers/15636-capaian-pembelajaran-baru-telah-terbit-yang-berubah-hanya-mata-pelajaran-agama-dan-budi-pekerti','Siaran resmi 23 Juni 2026 mengumumkan perubahan; naskah keputusan belum diperoleh.','perlu ditinjau','belum diunduh','Temukan keputusan dan lampiran asli; siaran pers bukan pengganti CP.',checked],
 ['Panduan Pembelajaran dan Asesmen','Edisi revisi 2025','https://repositori.kemendikdasmen.go.id/33290/','Katalog terindeks menampilkan label file All Rights Reserved dan footer CC BY-NC 4.0.','perlu ditinjau','belum diunduh','Periksa halaman hak cipta PDF dan lingkup lisensi; jangan aktifkan komersial tanpa dasar.',checked],
 ['Portal kurikulum nasional','Permendikdasmen 13/2025','https://kurikulum.kemendikdasmen.go.id/','Portal resmi memuat perubahan regulasi dan mapel pilihan Koding/KA.','perlu ditinjau','belum diunduh','Verifikasi naskah, lampiran SD, perubahan berikutnya dan tahun ajaran sekolah.',checked]
];
const cw=[40,24,75,70,30,25,70,20];
cw.forEach((width,i)=>candidates.getRangeByIndexes(4,i,5,1).format.columnWidth=width);
candidates.getRange('A6:H9').format.rowHeight=92;
candidates.getRange('H6:H9').setNumberFormat('yyyy-mm-dd');
table(candidates,'A5:H9','KandidatSumber');

const instructions=[
 ['Alur pengisian','Temukan tautan di Kandidat. Isi Inventaris hanya setelah file asli tersedia. Perbarui Cakupan dengan ID file yang mendukung kombinasi uji.'],
 ['Satu file satu baris','PDF lintas mapel/fase dicatat satu kali. Jelaskan banyak cakupan; jangan menggandakan file untuk mengisi matriks.'],
 ['Nilai tidak diketahui','Tulis Tidak diketahui untuk metadata teks yang belum jelas. URL, hash dan tanggal yang belum ada dibiarkan kosong; jelaskan alasannya di Catatan.'],
 ['Multi-nilai','Pisahkan mapel, fase atau kelas dengan titik koma. Contoh A;B;C. Jangan menyimpulkan pembagian topik per kelas dari CP fase.'],
 ['Perbedaan status','Izin, pemrosesan, kualitas teks dan validasi konten adalah pemeriksaan berbeda. Berhasil diekstrak tidak sama dengan boleh dipakai.'],
 ['Aktivasi','Aktif hanya setelah bukti izin untuk cara penggunaan, validasi konten, ekstraksi dan uji retrieval lolos. Template/guru dan cakupan juga harus siap.'],
 ['Izin belum jelas','Nonkomersial saja atau perlu ditinjau menghalangi aktivasi produk berbayar. Periksa izin pengiriman teks ke API eksternal secara terpisah.'],
 ['Tanggal','Masukkan sebagai tanggal Excel; format tampilan yyyy-mm-dd. Tahun dokumen tidak sama dengan tanggal unduh.'],
 ['ID dan duplikasi','Tetapkan ID unik sekali. ID ganda ditandai merah. Periksa SHA-256 untuk file identik; ID tidak diganti karena nama file berubah.'],
 ['Versi sumber','File revisi diberi ID baru dan ID dokumen terkait. Nonaktifkan versi lama sesuai acuan; jangan menimpa asli.'],
 ['Pemetaan cakupan','Baris A/B/C adalah target pemeriksaan. Penerapan kurikulum belum diverifikasi; bukan bukti bahwa semua mapel berlaku pada semua kelas.'],
 ['Varian khusus','Tambahkan baris nyata per agama, cabang seni, wilayah/bahasa atau kelas. Gunakan ID sumber dan catatan untuk bukti penerapan.'],
 ['Penambahan baris','Inventaris disiapkan sampai baris 105. Sesudahnya perluas Excel Table dan salin validasi/format dari baris sebelumnya.'],
 ['Warna dan kontrol','Area inventaris berwarna krem adalah isian. Merah menandai ID ganda; jingga menyoroti status bermasalah. Dropdown bisa dilewati paste; validasi server tetap diperlukan.'],
 ['Batas peran workbook','Workbook mencatat penilaian manusia, tidak memberi izin legal/aktivasi otomatis. Kandidat sumber belum diunduh; template guru belum disahkan.']
];
const defs=[
 'ID unik, misalnya RR-CP-MAT-A-001. Ini contoh pola, bukan dokumen yang sudah ada.',
 'Judul persis sesuai dokumen; jangan membuat judul seolah-olah resmi.',
 'Pilih kategori berdasarkan isi dan fungsi sumber.',
 'Nama mapel lengkap/varian; gunakan titik koma bila banyak.',
 'Jenjang menurut isi; file gabungan dapat Lintas jenjang.',
 'Fase sesuai isi; pilih kombinasi jika benar tercakup.',
 'Kelas sesuai bukti; jika hanya fase diketahui jangan menebak kelas spesifik.',
 'Tahun/nomor/edisi sesuai sumber; tulis Tidak diketahui jika tidak ada.',
 'Instansi penerbit yang tercantum, bukan akun pengunggah tanpa bukti.',
 'URL asal resmi atau asal pemilik; kosong jika sumber internal, jelaskan di Catatan.',
 'Format asli dari file yang tersedia.',
 'Nama setelah penamaan konsisten; isi asli tidak diubah.',
 'Status penilaian izin untuk penggunaan yang direncanakan.',
 'Ringkas batas komersial, pengindeksan, adaptasi, atribusi dan pengiriman ke pihak ketiga sesuai bukti.',
 'Kemajuan ekstraksi/indeks; bukan tanda konten atau lisensi valid.',
 'Hasil pemeriksaan teks dibandingkan file asli.',
 'Hasil peninjauan isi kurikulum/pedagogi.',
 'Kekurangan, alasan keputusan, OCR, pembatasan dan langkah berikutnya.',
 'Nama orang yang mengumpulkan; jangan otomatis mengisi nama pengguna komputer.',
 'Tanggal pencatatan file, bukan tanggal publikasi.',
 'Nama file persis saat diperoleh untuk penelusuran.',
 'Path dari RUANGRPP_DATA, termasuk subfolder dan nama file.',
 'Nama acuan/nomor keputusan/tahun ajaran sasaran yang telah diperiksa.',
 'URL atau path bukti ketentuan/izin tertulis; jangan hanya memberi status tanpa bukti.',
 'Nama penanggung jawab pemeriksaan izin.',
 'Tanggal penilaian izin, isi sebagai tanggal Excel.',
 'Bagian/halaman untuk setiap cakupan; bedakan indeks PDF dan nomor tercetak. DOCX pakai heading/paragraf.',
 'Hash dari file asli yang dihitung sistem; jangan diisi tebakan.',
 'Nonaktif secara default dalam aplikasi; aktivasi manusia setelah semua pemeriksaan lolos.',
 'ID versi sebelumnya atau dokumen terkait, jika ada.'
];
const gh=['Bagian / kolom','Petunjuk pengisian'];
const guideRows=[...instructions,...headers.map((h,i)=>[h,defs[i]])];
base(guide,'Petunjuk inventaris','RuangRPP — inventaris sumber dan cakupan, versi 0.1.',gh,5+guideRows.length);
guide.tabColor='#94A3B8';
guide.getRangeByIndexes(5,0,guideRows.length,2).values=guideRows;
guide.getRange(`A5:A${5+guideRows.length}`).format.columnWidth=43;
guide.getRange(`B5:B${5+guideRows.length}`).format.columnWidth=112;
guide.getRangeByIndexes(5,0,guideRows.length,2).format.rowHeight=40;
guide.freezePanes.unfreeze();
guide.freezePanes.freezeRows(5);
guide.getRange('A6:A20').format.font.bold=true;

wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'Cakupan!A5:G8',include:'values',tableMaxRows:4,tableMaxCols:7,maxChars:1800})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:20},maxChars:1000})).ndjson);
const output=await SpreadsheetFile.exportXlsx(wb);
await output.save(out);
for(const [sheetName,range,filename] of [
 ['Cakupan','A1:G11','cakupan'],['Cakupan','H5:L11','cakupan_detail'],
 ['Inventaris','A1:G9','inventaris'],['Inventaris','M5:Q9','inventaris_status'],['Inventaris','R5:AD7','inventaris_tambahan'],
 ['Kandidat','A1:C9','kandidat'],['Kandidat','D5:H9','kandidat_detail'],
 ['Petunjuk','A1:B12','petunjuk'],['Petunjuk','A35:B41','petunjuk_kolom']
]) {
 const preview=await wb.render({sheetName,range,scale:1,format:'png'});
 await fs.writeFile(`${qa}/${filename}.png`,new Uint8Array(await preview.arrayBuffer()));
}
console.log(JSON.stringify({output:out,sheets:4,inventoryRows:100,scopeRows:30,sourceFiles:0}));
