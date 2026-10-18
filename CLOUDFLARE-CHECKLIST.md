# Panduan & Checklist Konfigurasi Cloudflare — RuangRPP

Dokumen operasional ini adalah panduan langkah-demi-langkah bagi DevOps / Admin untuk memastikan seluruh lalu lintas produksi ruangRPP terlindungi di tepi jaringan (Edge) oleh Cloudflare sebelum mencapai origin server.

---

## 1. SSL / TLS & Enkripsi Transport

| Pengaturan | Nilai Target | Alasan / Catatan |
|---|---|---|
| **SSL/TLS Encryption Mode** | **Full (Strict)** | Wajib memasang sertifikat TLS valid di server origin (mis. Let's Encrypt / Cloudflare Origin CA). Menolak koneksi jika origin tidak terenkripsi. |
| **Minimum TLS Version** | **TLS 1.2 (Disarankan TLS 1.3)** | Menonaktifkan protokol usang (TLS 1.0 & 1.1) yang rentan POODLE/BEAST. |
| **Opportunistic Encryption** | **On** | Mengoptimalkan performa TLS. |
| **TLS 1.3** | **On** | Handshake 1-RTT/0-RTT yang lebih cepat dan cipher suite modern. |
| **Automatic HTTPS Rewrites** | **On** | Mengubah tautan `http://` internal menjadi `https://` otomatis. |
| **HSTS (HTTP Strict Transport Security)** | **Enabled** | `max-age=31536000` (1 tahun), `includeSubDomains=true`, `preload=true`. |

---

## 2. Penguncian Origin (Mencegah Direct IP Bypass)

> **PENTING (P1):** Jika penyerang mengetahui alamat IP publik server origin Anda, mereka dapat mem-bypass Cloudflare WAF sepenuhnya.

### Tindakan Wajib:
1. **Authenticated Origin Pulls (AOP):**
   - Aktifkan di Cloudflare: *SSL/TLS > Origin Server > Authenticated Origin Pulls = On*.
   - Pasang sertifikat CA Cloudflare pada reverse proxy origin (Nginx/Traefik).
2. **Firewall / Security Group Allowlist:**
   - Kunci port 80 & 443 pada firewall cloud (AWS/GCP/VPS/DigitalOcean) agar **hanya menerima koneksi dari daftar IP resmi Cloudflare**:
     - Referensi IP Cloudflare: `https://www.cloudflare.com/ips/`
     - Blokir seluruh IP publik lain langsung pada layer TCP/IP.
3. **Restriksi Header Host:**
   - Konfigurasikan server web origin untuk menolak request dengan IP mentah (mis. `http://103.x.x.x`) dan hanya merespons Host header domain resmi (`ruangrpp.com`).

---

## 3. Web Application Firewall (WAF) & Bot Management

### A. Managed Rules
- [ ] **Cloudflare Managed Ruleset:** Status `Enabled` (Action: *Block* untuk anomali tingkat tinggi).
- [ ] **Cloudflare OWASP Core Ruleset:**
  - Paranoia Level: `PL1` (default) atau `PL2`.
  - Anomaly Score Threshold: `Low (score >= 60)` untuk fase awal, tingkatkan ke `Medium` setelah observasi.

### B. Bot Fight Mode
- [ ] **Super Bot Fight Mode (atau Bot Fight Mode gratis):**
  - Definite automated bots: *Block* atau *Managed Challenge*.
  - AI scrapers & crawlers: *Block* (mencegah scraping template modul & draf guru).

### C. Custom Rate Limiting Rules (Security Rules)

| Rute URL | Ambang Batas (Threshold) | Aksi | Alasan |
|---|---|---|---|
| `/api/v1/teacher/drafts` | 5 request / 1 menit per IP | Managed Challenge / Block | Mencegah pembengkakan biaya API LLM (Denial of Wallet) |
| `/api/v1/auth/teacher/*` | 10 request / 1 menit per IP | Managed Challenge | Mencegah credential stuffing & brute-force token |
| `/api/v1/payments/midtrans/notification` | 60 request / 1 menit per IP | Block (429) | Melindungi webhook server dari request flood |
| `/api/v1/session` (Login Admin) | 5 request / 5 menit per IP | Block (15 menit) | Mencegah brute force password pengelola |
| `/api/*` (Seluruh API) | 120 request / 1 menit per IP | Managed Challenge | Menghentikan automated bot scraping |

---

## 4. Konfigurasi Cache (Mencegah Kebocoran Data Sesi)

> **BAHAYA:** Jangan pernah meng-cache respons API dinamis atau data yang terikat sesi pengguna!

Konfigurasikan **Page Rules / Cache Rules**:
1. **Bypass Cache untuk API & Sesi:**
   - Expression: `http.request.uri.path starts_with "/api/"`
   - Cache Eligibility: **Bypass Cache**
2. **Bypass Cache untuk Halaman Dasbor & Admin:**
   - Expression: `http.request.uri.path starts_with "/dashboard" or http.request.uri.path starts_with "/admin"`
   - Cache Eligibility: **Bypass Cache**
3. **Cache Aset Statis:**
   - Expression: `http.request.uri.path starts_with "/_next/static/" or http.request.uri.path ends_with ".png"`
   - Browser TTL: 1 bulan, Edge TTL: 1 bulan.

---

## 5. Cloudflare Turnstile (CAPTCHA Ramah Privasi)

- Buat Turnstile Widget di dashboard Cloudflare:
  - Mode: **Managed** (non-intrusif, tantangan otomatis jika skor risiko mencurigakan).
  - Tautkan Site Key pada environment frontend: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
  - Simpan Secret Key di environment backend: `TURNSTILE_SECRET_KEY`.

---

## 6. Verifikasi & Pengujian Berkala

- [ ] Uji apakah tembakan langsung ke IP origin ditolak (Port 80/443 connection timed out/refused).
- [ ] Uji apakah header `cf-connecting-ip` diteruskan dengan benar ke FastAPI backend.
- [ ] Uji batas Rate Limiting pada endpoint `/api/v1/teacher/drafts` menggunakan akun uji.
- [ ] Pantau log WAF di menu *Security > Events* setiap minggu untuk mengidentifikasi false positives.
