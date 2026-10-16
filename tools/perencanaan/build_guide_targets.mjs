import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const root = 'C:/my-project/ruangRPP';
const rows = JSON.parse(await fs.readFile(`${root}/services/api/app/guide_targets.json`, 'utf8'));
const out = `${root}/RUANGRPP_DATA/05_INVENTARIS_METADATA/Daftar_Target_Panduan_Mapel_SD.xlsx`;
const wb = Workbook.create();
const sheet = wb.worksheets.add('Target panduan');
sheet.showGridLines = false;
sheet.getRange('A1:M38').format.font = {name:'Arial',size:10,color:'#27372E'};
sheet.getRange('A1:M38').format.verticalAlignment = 'center';
sheet.getRange('A2').values = [['Target pengumpulan panduan mata pelajaran SD']];
sheet.getRange('A2').format.font = {name:'Arial',size:14,bold:true,color:'#27372E'};
sheet.getRange('A3').values = [['Sumber daftar: https://kurikulum.kemendikdasmen.go.id/panduan-mapel#filter-pmp']];
sheet.getRange('A4').values = [['Fase dari daftar pengguna; cocokkan kembali dengan PDF. Tahun, versi, halaman dan izin belum diperiksa.']];
sheet.getRange('A5').values = [['Satu baris = satu target panduan. Ini bukan bukti file sudah terkumpul. Kolom krem diisi tim.']];
const headers=['ID target','Panduan / mapel','Fase file (calon)','Target fase SD','Pengumpulan','ID inventaris file','Nama file lokal','Tahun / versi','Halaman PDF per fase','Status izin','Validasi isi','Pengumpul','Catatan tim'];
sheet.getRange('A7:M7').values = [headers];
sheet.getRange('A8:M27').values = rows.map(r=>[r.id,r.title,r.original_phases.join(', '),r.original_phases.filter(p=>['A','B','C'].includes(p)).join(', '),'Belum dikumpulkan','','','','','Belum diperiksa','Belum divalidasi','',r.note]);
sheet.tables.add('A7:M27',true,'TargetPanduanSD');
sheet.getRange('A7:M7').format = {fill:'#344B3D',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},wrapText:true,rowHeight:34,horizontalAlignment:'center',verticalAlignment:'center'};
sheet.getRange('A8:M27').format.wrapText = true;
sheet.getRange('A8:M27').format.rowHeight = 52;
sheet.getRange('A22:M23').format.rowHeight = 112;
sheet.getRange('E8:M27').format.fill = '#FFFCF0';
const widths={A:18,B:60,C:24,D:18,E:25,F:25,G:50,H:24,I:40,J:25,K:25,L:25,M:70};
for(const [col,width] of Object.entries(widths)) sheet.getRange(`${col}7:${col}27`).format.columnWidth = width;
for(const [col,values] of Object.entries({
 E:['Belum dikumpulkan','Sedang dicari','File tersedia','Perlu penggantian'],
 J:['Belum diperiksa','Perlu ditinjau','Diizinkan sesuai bukti','Nonkomersial saja','Tidak diizinkan'],
 K:['Belum divalidasi','Valid','Perlu revisi','Ditolak']
})) sheet.getRange(`${col}8:${col}27`).dataValidation={rule:{type:'list',values}};
sheet.getRange('J8:K27').conditionalFormats.add('containsText',{text:'Perlu',format:{fill:'#FFF0D6',font:{color:'#7A4F00'}}});
sheet.freezePanes.freezeRows(7);
sheet.freezePanes.freezeColumns(2);
sheet.getRange('A30').values=[['Petunjuk pengisian']];
sheet.getRange('A30').format.font.bold=true;
const notes=[
 'Periksa PDF sebelum memastikan fase. Kelas tidak diturunkan otomatis dari fase; tulis hanya bila disebutkan.',
 'Setelah file tersedia, buat satu baris di inventaris utama dan isi ID inventaris pada kolom F. Jangan menggandakan file A–F.',
 'Tahun / versi mengikuti dokumen. Jika tidak diketahui, tulis Tidak diketahui; jangan memakai tahun unduh.',
 'Halaman PDF dihitung dari 1 termasuk sampul. Contoh format isian: A: [awal–akhir], B: [awal–akhir]. Isi angka setelah diperiksa.',
 'Pisahkan pemeriksaan izin, validasi isi, dan kualitas ekstraksi di inventaris utama/dashboard. File tersedia tidak berarti boleh digunakan komersial.',
 'Program kebutuhan khusus perlu peninjau ahli. Koding/KA perlu konfirmasi sekolah. Muatan lokal tetap dikumpulkan terpisah.',
 'Dashboard dan workbook belum tersinkron. Perbarui status di tempat yang menjadi acuan kerja tim.',
 'Folder panduan: 03_BUKU_DAN_PANDUAN_GURU/01_PANDUAN_MATA_PELAJARAN. Lihat PETUNJUK.txt untuk penamaan.'
];
sheet.getRange('A31:A38').values=notes.map(x=>[x]);
sheet.getRange('A30:M38').format.rowHeight=25;
sheet.getRange('A30:M38').format.wrapText=false;
wb.recalculate();
if (sheet.getRange('A8:A27').values.length !== 20) throw new Error('Target count');
console.log((await wb.inspect({kind:'table',range:'Target panduan!A8:E10',include:'values',tableMaxRows:3,tableMaxCols:5,maxChars:1400})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',options:{useRegex:true,maxResults:5},maxChars:700})).ndjson);
await fs.mkdir(`${root}/test-results`,{recursive:true});
for(const [range,name] of [['A1:E12','panduan-target'],['A20:D27','panduan-khusus'],['F7:M10','panduan-isian'],['A30:F38','panduan-petunjuk']]) {
 const preview=await wb.render({sheetName:sheet.name,range,scale:1,format:'png'});
 await fs.writeFile(`${root}/test-results/${name}.png`,new Uint8Array(await preview.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(out);
console.log(JSON.stringify({output:out,targets:rows.length}));
