# Runbook Respons Insiden Keamanan (Incident Response Plan) — RuangRPP

Panduan operasional tanggap darurat saat terjadi insiden keamanan, anomali finansial, kegagalan sistem kuota, atau indikasi pelanggaran data pribadi pada platform RuangRPP.

---

## 1. Klasifikasi Tingkat Keparahan (Severity Level)

| Tingkat | Definisi | Waktu Respons | Contoh Insiden |
|---|---|---|---|
| **SEV-0 (Kritis)** | Kebocoran data pribadi massal, kunci privat/rahasia produksi bocor ke publik, pemalsuan saldo pembayaran/kuota aktif. | **< 15 menit** | API Key LLM atau Midtrans Server Key bocor di GitHub; akun admin dibobol; bypass validasi kuota. |
| **SEV-1 (Tinggi)** | Lonjakan pengeluaran LLM tak terkendali (Denial of Wallet); serangan DDoS/brute-force yang mengganggu layanan; webhook gagal massal. | **< 1 jam** | Bot memanen draf modul; tagihan AI melompat 5x lipat dalam hitungan jam; WAF jebol. |
| **SEV-2 (Sedang)** | Fitur sekunder mengalami gangguan; peringatan anomali WAF; kegagalan berkas terisolasi. | **< 4 jam** | Ekstraksi file DOCX tertentu crash; false positive rate limit memblokir guru sah. |

---

## 2. Prosedur Darurat Per Skenario

### Skenario A: Lonjakan Tagihan LLM / Denial of Wallet (SEV-1)
**Gejala:** Notifikasi lonjakan pemakaian token OpenAI/Gemini/DeepSeek, antrean CPU tinggi, atau guru melapor antrean pembuatan draf terhenti.
1. **Matikan Generator AI Sementara:**
   Set variabel lingkungan pada Docker/VPS:
   ```bash
   # Matikan generator seketika (mengembalikan 503 tanpa memanggil API LLM berbayar)
   RAG_ENABLED=false
   docker compose up -d api
   ```
2. **Identifikasi Akun / IP Pelaku:**
   - Periksa database audit log:
     ```sql
     SELECT actor_id, count(*) FROM audits 
     WHERE created_at > NOW() - INTERVAL '1 hour' 
     GROUP BY actor_id ORDER BY count(*) DESC LIMIT 10;
     ```
   - Periksa IP pada Cloudflare Events: *Cloudflare Dashboard > Security > Events*.
3. **Blokir Pelaku:**
   - Tambahkan IP penyerang ke *Cloudflare IP Access Rules* dengan aksi **Block**.
   - Kunci akun guru mencurigakan jika kuota gratis dieksploitasi berulang.
4. **Pulihkan Layanan:**
   Nyalakan kembali `RAG_ENABLED=true` setelah rate limit di tepi jaringan Cloudflare diperketat.

---

### Skenario B: Kunci Rahasia / Secret Bocor ke Publik (SEV-0)
**Gejala:** Peringatan GitHub Secret Scanning, commit tidak sengaja menyertakan `.env` atau credential mentah.
1. **Cabut & Rotasi Kunci Seketika (Bukan sekadar menghapus commit):**
   - **Kunci LLM (OpenAI / Gemini / DeepSeek):** Buka konsol penyedia, tekan tombol *Revoke/Delete Key*, buat kunci baru dengan kuota anggaran ketat.
   - **Midtrans Server Key:** Masuk ke *Midtrans MAP Dashboard > Settings > Access Keys*, lakukan rotasi kunci produksi.
   - **Google OAuth Client Secret:** Buka *Google Cloud Console > Credentials*, rotasi Client Secret jika terekspos.
   - **Database Password:** Ubah password pengguna `ruangrpp` di PostgreSQL dan perbarui `POSTGRES_PASSWORD`.
2. **Pembaruan Konfigurasi:**
   Perbarui file `.env` di server produksi, lalu restart service:
   ```bash
   docker compose up -d --force-recreate api worker
   ```
3. **Audit Jejak Aktivitas:**
   Periksa log penyedia LLM / Midtrans untuk melihat apakah kunci yang bocor telah disalahgunakan sebelum dicabut.

---

### Skenario C: Anomali Transaksi / Pembayaran Midtrans (SEV-0)
**Gejala:** Status pesanan `paid` tanpa ada dana masuk di mutasi bank/Midtrans, atau kegagalan verifikasi HMAC SHA-512 berulang.
1. **Verifikasi Status Pesanan di Database:**
   ```sql
   SELECT id, teacher_id, plan_id, amount, status, provider_status, created_at 
   FROM payment_orders 
   WHERE status = 'paid' AND created_at > NOW() - INTERVAL '24 hours' 
   ORDER BY created_at DESC;
   ```
2. **Bekukan Hibah Kuota Terkait (Suspend Grant):**
   Jika transaksi terbukti fraud atau dipalsukan, set status kuota menjadi nonaktif:
   ```sql
   UPDATE quota_grants 
   SET suspended_at = NOW() 
   WHERE order_id = '<ID_PESANAN_FRAUD>';
   ```
3. **Pemeriksaan Webhook:**
   Endpoint `/api/v1/payments/midtrans/notification` di ruangRPP secara otomatis memverifikasi signature key `SHA512(order_id + status_code + gross_amount + server_key)`. Bila ada request tanpa signature valid, endpoint otomatis merespons HTTP 403 dan tidak mengubah data.

---

### Skenario D: Dugaan Pelanggaran Data Pribadi (UU PDP No. 27/2022) (SEV-0)
**Gejala:** Draf modul ajar atau identitas akun guru diakses oleh pihak tidak berwenang.
1. **Isolasi Sistem (Containment):**
   - Putus koneksi internet server atau aktifkan Cloudflare "Under Attack Mode" jika eksploitasi sedang berlangsung.
   - Tutup sesi seluruh pengguna:
     ```sql
     DELETE FROM teacher_sessions;
     DELETE FROM login_sessions;
     ```
2. **Investigasi Akar Masalah:**
   - Telusuri log akses di `/data/uploads` dan endpoint API.
   - Pastikan seluruh endpoint draf memiliki klausul `WHERE id = ? AND teacher_id = ?` (IDOR/BOLA prevention).
3. **Kepatuhan Regulasi UU PDP:**
   - Dalam waktu maksimal **3 x 24 jam (72 jam)** sejak insiden terkonfirmasi, sampaikan pemberitahuan resmi tertulis kepada:
     - Lembaga Pelindungan Data Pribadi yang berwenang.
     - Subjek data (guru yang terdampak) melalui email terdaftar.
   - Muat informasi: data yang terungkap, kapan dan bagaimana peristiwa terjadi, serta langkah penanganan dan mitigasi yang telah dilakukan pengelola.

---

## 3. Kontak Darurat & Eskalasi

| Peran | Kontak | Tanggung Jawab |
|---|---|---|
| **Tech Lead / Security Admin** | `security@ruangrpp.com` | Pemutusan darurat, rotasi kunci, investigasi kode |
| **DevOps / Infra Lead** | `ops@ruangrpp.com` | Cloudflare firewall, rollback kontainer, isolasi database |
| **Dukungan Pembayaran** | Midtrans Support Hotline | Investigasi transaksi ganda atau sengketa pembayaran |
