# PRD & Langkah Kerja — Website Kelas Trading Forex

Dokumen ini dibuat supaya bisa langsung dipakai sebagai konteks untuk agentic AI (Claude Code, Cursor, dsb). Isinya: konsep, ide desain tanpa navbar, arsitektur, skema database MySQL, alur pembayaran → kode → Discord → role, keamanan, dan langkah kerja bertahap dengan acceptance criteria.

## 1. Ringkasan Produk

**Nama kerja:** (isi sendiri, contoh: *PipsAcademy*, *Forex Foundry*, *Candle Class*)

**Tujuan:** Menjual kelas trading forex lewat satu website yang fokus konversi, lalu mengantar pembeli langsung ke komunitas Discord internal lewat sistem kode redeem otomatis.

**Masalah yang diselesaikan:**

- Penjual kelas biasanya mengatur akses member secara manual (cek bukti transfer, kirim invite, kasih role satu per satu). Lambat dan rawan salah.
- Link invite Discord gampang bocor dan dibagikan ke orang yang tidak bayar.

**Solusi:** Pembayaran terverifikasi otomatis → sistem membuat kode unik sekali pakai → pembeli memasukkan kode di Discord → bot memvalidasi ke database MySQL → bot memberi role internal secara otomatis.

**Target pengguna:**

- Calon murid: trader pemula sampai menengah, mayoritas akses dari HP.
- Admin/mentor: butuh melihat order, kode, dan status redeem tanpa ngoding.

## 2. Alur Utama (User Flow)

1. Calon murid membuka website (landing page tanpa navbar), membaca penawaran, scroll sampai tombol beli.
2. Klik **Daftar Sekarang** → isi form singkat (nama, email, nomor WhatsApp, pilih paket).
3. Redirect ke pembayaran (payment gateway, mis. Midtrans atau Xendit: QRIS, VA bank, e-wallet).
4. Pembayaran sukses → webhook masuk ke backend → order jadi `paid` → sistem generate **kode akses** unik.
5. Halaman sukses menampilkan kode + kode dikirim ke email. Disertai tombol **Gabung Discord** dan instruksi singkat.
6. Murid masuk server Discord (kanal publik terbatas, hanya #verifikasi yang terlihat), jalankan `/redeem kode:XXXX-XXXX-XXXX`.
7. Bot memvalidasi kode ke MySQL → jika valid dan belum dipakai: kode ditandai `redeemed`, Discord ID tertaut ke order, role internal diberikan.
8. Murid kini melihat kanal kelas (materi, live session, tanya jawab, sinyal edukasi, dst).

## 3. Ide Desain: Website Tanpa Navbar

Tanpa navbar justru bagus untuk landing page penjualan: satu tujuan, satu CTA, tidak ada pintu keluar. Beberapa ide supaya tetap enak dipakai:

**Struktur: satu halaman panjang bercerita (scrollytelling).**

1. **Hero** — headline kuat + sub-headline + CTA utama. Latar candlestick chart bergerak pelan (canvas/SVG), bukan foto stok.
2. **Masalah** — 3 kalimat tentang kenapa kebanyakan trader pemula rugi (tanpa janji profit).
3. **Solusi / isi kelas** — kurikulum berbentuk timeline vertikal (Modul 1…N), tiap modul bisa expand.
4. **Cara kerja akses** — 3 langkah visual: Bayar → Dapat Kode → Masukkan di Discord. Ini sekaligus menjelaskan sistem unikmu.
5. **Preview komunitas Discord** — mockup tampilan channel (statik, bukan screenshot asli member).
6. **Mentor** — foto, pengalaman, bukti track record yang bisa dipertanggungjawabkan.
7. **Harga / paket** — 1 sampai 3 kartu paket, satu diberi label *Paling Dipilih*.
8. **FAQ** — accordion (akses berapa lama, metode bayar, apa itu kode, refund).
9. **CTA penutup + footer** — link Syarat & Ketentuan, Kebijakan Privasi, Disclaimer Risiko, kontak.

**Pengganti navbar:**

- **Floating CTA** di pojok bawah (mobile: bar full-width) bertuliskan *Daftar Sekarang*, muncul setelah scroll melewati hero.
- **Dot indicator vertikal** di sisi kanan (desktop) untuk lompat antar section, tanpa teks menu.
- **Progress bar tipis** di atas layar menunjukkan posisi scroll.
- **Footer** menampung semua link legal dan kontak.
- Halaman lain (checkout, sukses, legal) berdiri sendiri dengan tombol kembali minimal.

**Gaya visual:**

- Tema gelap dengan aksen hijau-emas (konotasi profit, tapi hindari kesan judi).
- Tipografi: heading tegas (mis. Space Grotesk / Sora), angka pakai monospace (mis. JetBrains Mono) supaya terasa seperti terminal trading.
- Mikro-interaksi: angka harga/statistik count-up, kartu hover glow, transisi section halus.
- Mobile-first: mayoritas calon murid dari HP.

**Elemen kepercayaan:** disclaimer risiko yang jelas (tidak ada janji profit), testimoni asli dengan izin, FAQ jujur, informasi mentor transparan.

## 4. Arsitektur & Tech Stack

| Komponen | Pilihan | Catatan |
| --- | --- | --- |
| Web (landing, checkout, admin) | **Laravel + Blade** (+ Tailwind, Alpine.js) | Server-side, SEO bagus, admin mudah dibuat |
| Database | **MySQL 8** | Sumber kebenaran tunggal untuk order, kode, redeem |
| Bot Discord | **discord.js (Node.js)** | Service terpisah, membaca/menulis MySQL yang sama atau lewat API internal |
| Payment | **Midtrans** atau **Xendit** | QRIS, VA, e-wallet; wajib verifikasi signature webhook |
| Email | SMTP / Resend / Mailgun | Kirim kode + bukti order |
| Queue | Laravel Queue (database/redis) | Generate kode & kirim email tidak memblokir webhook |

**Rekomendasi integrasi bot ↔ web:** bot memanggil **endpoint API internal Laravel** (`POST /api/internal/redeem`) dengan secret token, bukan langsung menulis ke MySQL. Dengan begitu semua aturan bisnis (validasi, audit log) ada di satu tempat. Alternatif yang lebih sederhana: bot langsung akses MySQL dengan user DB terbatas, tapi aturan harus diduplikasi.

```
[Browser] → [Laravel] ⇄ [MySQL]
               ↑  webhook
         [Payment Gateway]
               ↑ API internal (secret)
         [Discord Bot] ⇄ [Discord Server]
```

## 5. Fitur & Kebutuhan Fungsional

### 5.1 Landing & Checkout (publik)

- F1. Landing page one-page sesuai bagian 3.
- F2. Form pendaftaran: nama, email, WhatsApp, pilihan paket. Validasi server-side.
- F3. Pembuatan order `pending` lalu redirect ke payment gateway.
- F4. Halaman status order (`/order/{order_code}`) yang menampilkan kode setelah `paid`.

### 5.2 Pembayaran

- F5. Endpoint webhook payment gateway dengan **verifikasi signature**.
- F6. **Idempotent**: webhook yang datang dua kali tidak membuat dua kode.
- F7. Status order: `pending → paid → completed` (atau `expired`, `failed`, `refunded`).

### 5.3 Kode Akses

- F8. Generate kode acak kriptografis, format `XXXX-XXXX-XXXX` (alfanumerik tanpa karakter membingungkan seperti O/0, I/1).
- F9. Satu kode = satu order = satu kali redeem. Opsional: masa berlaku kode (mis. 30 hari).
- F10. Kode ditampilkan di halaman sukses dan dikirim ke email.
- F11. Simpan **hash** kode (SHA-256 + pepper) di database; kode asli hanya tampil sekali ke pembeli. Jika ingin admin bisa melihat ulang kode, simpan terenkripsi (bukan plaintext).

### 5.4 Bot Discord

- F12. Slash command `/redeem kode:<string>`, balasan **ephemeral** (hanya terlihat pengguna).
- F13. Validasi: kode ada, belum dipakai, belum kedaluwarsa, order berstatus paid.
- F14. Jika valid: tandai redeemed, simpan `discord_user_id`, beri role internal sesuai paket (mapping paket → role ID).
- F15. Jika gagal: pesan jelas (kode salah / sudah dipakai / kedaluwarsa) tanpa membocorkan detail berlebihan.
- F16. Rate limit: maksimal 5 percobaan gagal per user per jam, lalu cooldown.
- F17. Log setiap percobaan redeem (berhasil/gagal) ke tabel audit.
- F18. Opsional: `/status` untuk cek masa aktif akses; job terjadwal yang mencabut role saat akses berakhir.

### 5.4b Setup Server Discord

- Kanal `#verifikasi` terlihat oleh semua; kanal kelas hanya terlihat role internal.
- Role bot harus **di atas** role yang akan diberikan di hierarki, dengan izin *Manage Roles* saja.

### 5.5 Admin Panel (sederhana)

- F19. Login admin (Laravel auth, 2FA bila memungkinkan).
- F20. Daftar order (filter status), detail order, kirim ulang email kode.
- F21. Daftar kode: status, kapan di-redeem, oleh Discord ID siapa. Aksi: revoke kode, generate kode manual (mis. untuk beasiswa/komplimen).
- F22. Manajemen paket/kelas: nama, harga, durasi akses, mapping role Discord.
- F23. Ringkasan: total penjualan, jumlah kode belum diredeem, redeem per hari.

## 6. Skema Database (MySQL)

**classes** (paket/kelas)

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| id | BIGINT PK |  |
| name | VARCHAR(120) |  |
| slug | VARCHAR(120) UNIQUE |  |
| price | INT | dalam Rupiah |
| access\_days | INT NULL | NULL = seumur hidup |
| discord\_role\_id | VARCHAR(30) | role yang diberikan |
| is\_active | TINYINT(1) |  |
| created\_at, updated\_at | TIMESTAMP |  |

**orders**

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| id | BIGINT PK |  |
| order\_code | VARCHAR(32) UNIQUE | publik, acak, bukan auto-increment |
| class\_id | FK classes |  |
| buyer\_name | VARCHAR(120) |  |
| buyer\_email | VARCHAR(190) |  |
| buyer\_whatsapp | VARCHAR(30) |  |
| amount | INT |  |
| status | ENUM('pending','paid','expired','failed','refunded') |  |
| paid\_at | DATETIME NULL |  |
| created\_at, updated\_at | TIMESTAMP |  |

**payments**

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| id | BIGINT PK |  |
| order\_id | FK orders |  |
| provider | VARCHAR(30) | midtrans/xendit |
| provider\_ref | VARCHAR(100) UNIQUE | untuk idempotency |
| method | VARCHAR(40) | qris/va/ewallet |
| raw\_payload | JSON | simpan webhook mentah untuk audit |
| status | VARCHAR(30) |  |
| created\_at | TIMESTAMP |  |

**access\_codes**

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| id | BIGINT PK |  |
| order\_id | FK orders UNIQUE | satu order satu kode |
| code\_hash | CHAR(64) UNIQUE | hash kode |
| status | ENUM('active','redeemed','expired','revoked') |  |
| expires\_at | DATETIME NULL |  |
| redeemed\_at | DATETIME NULL |  |
| redeemed\_by\_discord\_id | VARCHAR(30) NULL |  |
| created\_at | TIMESTAMP |  |

**members** (hasil redeem)

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| id | BIGINT PK |  |
| discord\_user\_id | VARCHAR(30) |  |
| class\_id | FK classes |  |
| access\_code\_id | FK access\_codes |  |
| access\_until | DATETIME NULL |  |
| role\_granted\_at | DATETIME |  |
| status | ENUM('active','expired','revoked') |  |

**redeem\_attempts** (audit & rate limit)

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| id | BIGINT PK |  |
| discord\_user\_id | VARCHAR(30) |  |
| code\_hash\_tried | CHAR(64) |  |
| result | ENUM('success','invalid','used','expired','rate\_limited') |  |
| created\_at | TIMESTAMP | index (discord\_user\_id, created\_at) |

**admins**: id, name, email, password\_hash, created\_at.

Catatan: gunakan **transaksi database + `SELECT ... FOR UPDATE`** saat redeem supaya dua orang yang memasukkan kode yang sama bersamaan tidak sama-sama lolos.

## 7. Endpoint Utama

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/` | Landing page |
| POST | `/checkout` | Buat order + inisiasi pembayaran |
| GET | `/order/{order_code}` | Status order, tampilkan kode jika paid |
| POST | `/webhooks/payment` | Terima notifikasi gateway (verifikasi signature) |
| POST | `/api/internal/redeem` | Dipanggil bot; header secret; body: kode + discord\_user\_id |
| GET | `/admin/...` | Panel admin (auth) |
| GET | `/legal/{terms,privacy,risk}` | Halaman legal |

## 8. Keamanan & Risiko

- Verifikasi signature webhook; jangan percaya redirect "sukses" dari browser.
- Kode: panjang cukup (≥ 12 karakter acak), hash di DB, rate limit redeem, audit log.
- Endpoint internal bot dilindungi secret token + dibatasi IP bila memungkinkan.
- Semua secret (bot token, API key gateway) di `.env`, **jangan** masuk repo.
- Bot hanya perlu izin *Manage Roles*; jangan beri Administrator.
- Validasi dan sanitasi semua input; CSRF aktif untuk form; HTTPS wajib.
- Order code publik harus acak (bukan ID berurutan) supaya order orang lain tidak bisa ditebak.
- **Legal & konten:** tampilkan disclaimer risiko (trading forex berisiko tinggi, tidak ada jaminan profit) dan hindari klaim keuntungan yang dijanjikan. Sebelum launch, cek ketentuan periklanan dan edukasi perdagangan berjangka yang berlaku (mis. dari Bappebti/OJK) serta ketentuan Discord dan payment gateway soal konten terkait trading.
- Siapkan kebijakan refund dan tulis jelas di FAQ + Syarat & Ketentuan.

## 9. Metrik Keberhasilan

- Waktu dari pembayaran sukses sampai role aktif: **< 2 menit** (mayoritas kasus).
- Rasio bayar → redeem: target **> 90%** dalam 24 jam.
- Kasus kode ganda/bocor: **0**.
- Konversi landing → checkout dipantau (analytics ringan).
- Tiket support soal "tidak dapat akses" menurun dari waktu ke waktu.

## 10. Langkah Kerja (untuk Agentic AI)

Kerjakan **berurutan**. Selesaikan dan verifikasi satu fase sebelum lanjut. Setiap fase diakhiri commit git dengan pesan jelas.

### Fase 0 — Setup Proyek

- Inisialisasi Laravel, konfigurasi `.env`, koneksi MySQL, Tailwind, Alpine.js.
- Buat struktur folder bot Discord (`/bot`) dengan discord.js, `.env` terpisah.
- **Selesai bila:** `php artisan migrate` jalan dan halaman default tampil; bot bisa login dan online di server uji.

### Fase 1 — Database

- Buat migration + model + relasi untuk semua tabel di bagian 6; seeder untuk 1–3 paket contoh dan 1 admin.
- **Selesai bila:** migrate:fresh --seed sukses; relasi Eloquent teruji lewat tinker/test.

### Fase 2 — Landing Page Tanpa Navbar

- Bangun semua section bagian 3, floating CTA, dot indicator, progress bar, footer legal.
- Mobile-first; cek di lebar 360px, 768px, 1280px.
- **Selesai bila:** tidak ada navbar di halaman mana pun, semua section tampil rapi, Lighthouse mobile performance ≥ 80.

### Fase 3 — Checkout & Order

- Form checkout, validasi, pembuatan order `pending`, integrasi payment gateway (mode sandbox).
- Halaman `/order/{order_code}` dengan status.
- **Selesai bila:** order sandbox dapat dibuat dan diarahkan ke halaman pembayaran gateway.

### Fase 4 — Webhook & Pembuatan Kode

- Endpoint webhook + verifikasi signature + idempotency.
- Saat `paid`: transaksi DB → update order → generate kode → simpan hash → queue email.
- Halaman order menampilkan kode (sekali, aman) setelah paid.
- **Selesai bila:** simulasi webhook sandbox menghasilkan tepat satu kode; webhook ulang tidak membuat kode kedua; signature salah ditolak (401/403).

### Fase 5 — Bot Discord & Redeem

- Endpoint internal `/api/internal/redeem` dengan secret, transaksi + row lock.
- Slash command `/redeem` (ephemeral), mapping paket → role, rate limit, audit log.
- **Selesai bila:** kode valid memberi role; kode yang sama gagal di percobaan kedua; kode salah 5× memicu cooldown; semua tercatat di `redeem_attempts`.

### Fase 6 — Admin Panel

- Auth admin, daftar order/kode/member, aksi revoke dan generate manual, kirim ulang email, ringkasan dashboard.
- **Selesai bila:** semua aksi F19–F23 jalan dan hanya admin login yang bisa mengakses.

### Fase 7 — Pengerasan & Uji

- Test otomatis untuk: webhook idempotent, redeem race condition (dua request bersamaan), kode kedaluwarsa, signature invalid.
- Review keamanan sesuai bagian 8; audit `.env` dan permission bot.
- **Selesai bila:** semua test hijau, tidak ada secret di repo.

### Fase 8 — Deploy & Go-Live

- Deploy (VPS/hosting Laravel), HTTPS, queue worker + bot berjalan sebagai service (systemd/PM2/supervisor).
- Ganti gateway ke mode production, uji 1 transaksi nyata kecil end-to-end.
- **Selesai bila:** alur bayar → kode → `/redeem` → role berhasil di production.

## 11. Aturan untuk Agentic AI

1. Baca seluruh dokumen ini sebelum menulis kode; kerjakan per fase dan berhenti untuk konfirmasi di akhir tiap fase.
2. Jangan pernah menaruh secret di kode atau repo; gunakan `.env` dan sediakan `.env.example`.
3. Jangan mengubah skema database di luar migration.
4. Jika ada keputusan yang belum tercakup (lihat bagian 12), ajukan opsi + rekomendasi, jangan asal memilih.
5. Setiap fitur kritis (webhook, redeem) wajib punya test sebelum dianggap selesai.
6. Tulis kode rapi dan beri komentar singkat untuk logika bisnis penting.

## 12. Pertanyaan Terbuka (isi sebelum mulai)

- Nama brand dan domain?
- Berapa paket dan harganya? Akses seumur hidup atau berlangganan (mis. 1/3/6 bulan)?
- Payment gateway pilihan: Midtrans atau Xendit?
- Materi kelas dihosting di mana: murni di Discord (video/live), atau ada area materi di website?
- Satu kode boleh dipakai di akun Discord lain jika salah akun (kebijakan reset)?
- Apakah perlu program referral/kode promo di fase berikutnya?
- Apakah email notifikasi cukup, atau perlu notifikasi WhatsApp juga?

## 13. Pengembangan Lanjutan (Fase 2 Produk)

- Kode promo / referral dan afiliasi.
- Perpanjangan akses otomatis lewat pengingat sebelum kedaluwarsa.
- Multi-kelas dan bundle.
- Dashboard murid ringan (cek masa aktif) tanpa harus login lewat Discord.
- Analytics funnel: view → klik CTA → checkout → bayar → redeem.

## 14. Keputusan Final & Catatan Revisi (WAJIB DIBACA AGENT)

Bagian 14 sampai 21 adalah tambahan detail. Jika ada perbedaan dengan bagian 1 sampai 13, **bagian 14 sampai 21 yang berlaku** (terutama menggantikan bagian 3 tentang ide desain).

Keputusan final:

- Konsep desain: **A, Dark Market** (gelap, satu aksen hijau kalem, background animasi candlestick). Konsep lain dibuang.
- Stack: Laravel 11 (PHP 8.3), Blade, Tailwind CSS, Alpine.js, MySQL 8. Bot: discord.js v14 (Node 20).
- Payment gateway default: Midtrans Snap (sandbox dulu). Jika diganti Xendit, hanya kelas gateway yang berubah.
- Bahasa antarmuka: Bahasa Indonesia.
- Tidak ada navbar di halaman mana pun.
- **Pemberian role dilakukan oleh Laravel lewat Discord REST API**, bukan oleh bot. Bot hanya meneruskan perintah `/redeem` ke API internal dan menampilkan hasilnya. Alasannya: seluruh aturan bisnis dan retry ada di satu tempat.
- Referensi visual komposisi hero: https://claude.ai/artifact/PPc46e4fjJqKcSvo1cfpt4 (artboard A). Untuk nilai warna dan ukuran, ikuti dokumen ini.

## 15. Spesifikasi Desain Final

### 15.1 Prinsip

Tenang, rapi, terasa seperti platform finansial yang dikerjakan manusia, bukan template. Pilihan desain harus punya alasan, bukan sekadar dekorasi.

### 15.2 Design tokens

Definisikan sebagai CSS variables di satu tempat (`resources/css/tokens.css`) dan petakan ke konfigurasi Tailwind. **Dilarang memakai nilai warna atau ukuran di luar token.**

| Token | Nilai | Pemakaian |
| --- | --- | --- |
| `--bg-base` | #0B0E0D | latar utama |
| `--bg-raised` | #101512 | latar section selang-seling |
| `--surface` | #121815 | kartu |
| `--border` | rgba(255,255,255,0.08) | garis kartu dan pemisah |
| `--text` | #EEF2EF | teks utama |
| `--text-2` | #B3BEB8 | paragraf |
| `--text-muted` | #9AA7A0 | label, keterangan |
| `--accent` | #34C58A | CTA, penanda aktif, candle naik |
| `--accent-ink` | #04120B | teks di atas tombol aksen |
| `--down` | #E5535F | hanya untuk candle turun dan pesan error |
| `--dot-off` | #3A4540 | dot indikator tidak aktif |

Tipografi: **IBM Plex Sans** (400, 500, 600) dari Google Fonts dengan fallback `system-ui, sans-serif`. **IBM Plex Mono** (500) hanya untuk kode akses, harga, dan nomor modul.

| Elemen | Desktop | Mobile |
| --- | --- | --- |
| H1 | 64px / 1.05, weight 600, letter-spacing -0.02em | 38px / 1.1 |
| H2 | 40px / 1.15, weight 600 | 28px / 1.2 |
| H3 | 22px / 1.3, weight 600 | 20px |
| Body | 18-19px / 1.55 | 17px |
| Label kecil | 14-15px, weight 500 | 14px |

Spasi: kelipatan 8px. Padding vertikal section 120px (desktop) dan 72px (mobile). Lebar konten maksimum 1200px. Radius: tombol 6px, kartu 12px. Transisi 150-200ms ease-out.

### 15.3 Hero

- Tinggi minimal 100vh (minimal 680px). Kolom teks di kiri, lebar maksimum 640px, terpusat vertikal, jarak dari kiri 96px di desktop.
- Urutan: label brand (15px, `--text-muted`, format `[NAMA BRAND] · Kelas Trading Forex`), H1 `Belajar forex dengan sistem, bukan tebak-tebakan.` (satu warna, tanpa kata yang diwarnai), paragraf pendek, tombol CTA `Daftar Sekarang · [HARGA]`.
- Strip tiga langkah di kiri bawah (jarak 44px dari bawah): `1 Bayar`, `2 Terima kode akses`, `3 Aktifkan di Discord`. Angka berwarna aksen, teks `--text-muted`, 14px, teks polos tanpa kartu atau ikon.
- Progress bar scroll di paling atas, tinggi 3px, warna aksen.
- Tombol CTA: latar `--accent`, teks `--accent-ink`, weight 600, tinggi minimal 44px, radius 6px.

### 15.4 Background animasi (spesifikasi presisi)

Hanya hero yang memiliki background animasi. Section lain memakai latar statis.

**Lapisan (z-index):** background 0, overlay gradient 1, konten 2, elemen melayang (progress bar, CTA, dot) 3.

**Aset:** satu file `public/img/market-strip.svg` (ukuran sekitar 10 KB) yang dihasilkan oleh skrip `scripts/generate-candles.mjs`, bukan digambar manual. Isi SVG (viewBox 1280 x 760):

- Garis grid setiap 80px, stroke putih opacity 0.05.
- 48 candle. Wick 1.5px, badan lebar 9px. Candle naik `--accent`, turun `--down`.
- Garis moving average periode 5, stroke `--text` opacity 0.55, lebar 1.5px.
- Data berupa random walk dengan seed tetap (agar hasil selalu sama), lalu di-detrend sehingga harga akhir sama dengan harga awal. Ini membuat loop tidak terlihat sambungannya. Candle terakhir harus menyambung ke candle pertama, dan garis moving average dihitung secara siklik.

**Animasi:**

- Container berisi dua `<img src=market-strip.svg>` berdampingan, tinggi 100% hero, lebar otomatis, `aria-hidden=true`, `alt` kosong.
- Container dianimasikan dengan `transform: translateX(0)` ke `translateX(-50%)`, **120 detik, linear, infinite**. Hanya `transform` yang dianimasikan, tambahkan `will-change: transform`.
- Opacity container 0.55.
- Overlay: `linear-gradient(90deg, #0B0E0D 0%, rgba(11,14,13,0.92) 38%, rgba(11,14,13,0.2) 80%)` ditambah `linear-gradient(0deg, #0B0E0D 0%, transparent 28%)`.
- Mobile (di bawah 768px): opacity container 0.35, overlay kiri-ke-kanan dibuat rata 0.85, durasi 150 detik.
- `@media (prefers-reduced-motion: reduce)`: animasi dimatikan (`animation: none`).
- Jeda animasi (`animation-play-state: paused`) saat hero tidak terlihat, memakai IntersectionObserver.

**Kriteria diterima:** teks hero tetap terbaca (kontras minimal 4.5:1) di seluruh siklus animasi; tidak ada lonjakan di titik sambungan loop; CPU tidak naik terus-menerus (tidak ada layout thrash).

### 15.5 Pengganti navbar

- **Progress bar:** fixed di atas, lebar mengikuti persentase scroll. Update lewat `requestAnimationFrame` dengan listener scroll pasif.
- **CTA melayang:** desktop berupa pill di kanan bawah (jarak 32px), latar `--text`, teks `--bg-base`. Mobile berupa bar penuh di bawah (tinggi 56px, ditambah `env(safe-area-inset-bottom)`). Muncul dengan fade 200ms setelah hero lewat 60%, hilang saat section paket terlihat. Link menuju `#paket`.
- **Dot indikator:** hanya desktop (lebar 1024px ke atas), fixed di kanan (28px), terpusat vertikal, satu dot per section. Setiap dot adalah elemen `<a>` dengan `aria-label` nama section dan area klik minimal 24px. Dot aktif berwarna `--accent`, lainnya `--dot-off`. Aktif ditentukan oleh IntersectionObserver.
- Tidak ada hamburger menu. Semua tautan sekunder ada di footer.

### 15.6 Struktur section (urutan dan id anchor)

Semua teks diambil dari satu berkas `config/landing.php` agar mudah diganti tanpa menyentuh Blade.

1. `#hero` seperti bagian 15.3.
2. `#masalah`: dua kolom. Kiri: H2 tentang kenapa banyak trader pemula merugi. Kanan: tiga paragraf pendek tanpa ikon. **Tanpa janji profit.**
3. `#kurikulum`: daftar modul berbentuk accordion (`<details>` atau Alpine). Nomor modul memakai Plex Mono. Satu modul terbuka di awal.
4. `#cara-kerja`: tiga langkah (horizontal di desktop, vertikal di mobile) dengan garis penghubung 1px. Di sebelahnya dua kartu statis: kartu kode akses (font mono, contoh `K7QM-4WXD-9PTA`) dan kotak mirip chat Discord berisi `/redeem` dan balasan sukses. Ini menjelaskan sistem unikmu.
5. `#mentor`: foto rasio 4:5 (apa adanya, tanpa filter dekoratif), nama, bio, dan pengalaman yang bisa diverifikasi. Jika belum ada data, tampilkan blok placeholder bertanda `[ISI]`.
6. `#komunitas`: daftar channel server Discord ditulis sebagai teks mono (misal `# pengumuman`, `# materi`, `# live-session`, `# tanya-jawab`). Bukan screenshot palsu.
7. `#paket`: 1 sampai 3 kartu. Kartu unggulan hanya dibedakan dengan border 1px berwarna aksen (tanpa badge berkilau). Harga memakai Plex Mono. Tombol `Beli paket ini` mengirim ke checkout.
8. `#faq`: 6 sampai 8 pertanyaan (akses berapa lama, metode bayar, apa itu kode, cara redeem, refund, risiko).
9. Footer: tautan Syarat & Ketentuan, Kebijakan Privasi, Disclaimer Risiko, Kontak, plus satu kalimat disclaimer risiko trading.

### 15.7 Aturan supaya tampil natural dan profesional

Semua poin ini wajib dipatuhi dan diperiksa saat review:

- Tanpa emoji di antarmuka.
- Tanpa gradient pada teks, gradient mesh, glow neon, glassmorphism, atau blob dekoratif.
- Tanpa pola kartu tiga kolom dengan ikon di lingkaran berwarna di atas setiap fitur.
- Tanpa kartu dengan border kiri berwarna.
- **Dilarang mengarang angka, statistik, atau testimoni** (misal jumlah murid atau persen keberhasilan). Isi hanya dengan data nyata. Placeholder wajib bertanda `[ISI]`, dan skrip pemeriksaan sebelum deploy harus gagal bila masih ada `[ISI]` di berkas view atau config.
- Tanpa klise pemasaran: revolusi, game changer, rahasia, cuan pasti, dijamin profit, dan semacamnya. Tanpa tanda seru.
- Copy: kalimat pendek, konkret, Bahasa Indonesia yang santai tapi baku.
- Satu warna aksen. Merah hanya untuk candle turun dan pesan error.
- Animasi: hanya hover (150-200ms) dan satu reveal halus pada judul section (opacity dan geser 8px, sekali). Tanpa bounce, tanpa parallax, tanpa animasi masuk di setiap elemen.
- Komponen Blade dipakai ulang (`x-button`, `x-section`, `x-card`) supaya konsisten.
- Kode bersih: tidak ada komentar placeholder seperti `// Hero section`, tidak ada lorem ipsum, TODO, atau `console.log` tersisa.

### 15.8 Responsif

Breakpoint: 640px, 1024px. Uji di 360, 390, 768, 1280, dan 1440. Tidak boleh ada scroll horizontal. Target sentuh minimal 44px. Di mobile: padding horizontal 24px, tombol CTA lebar penuh, dot indikator disembunyikan, strip tiga langkah turun menjadi daftar vertikal.

### 15.9 Aksesibilitas dan SEO

- Kontras teks minimal 4.5:1. Fokus keyboard terlihat (outline 2px `--accent`, offset 2px).
- Elemen semantik: `<main>`, `<section aria-labelledby>`, satu `<h1>`. Sediakan skip link.
- `<html lang=id>`, title, meta description, dan OpenGraph. Dekorasi SVG diberi `aria-hidden=true`.
- Semua elemen interaktif memakai `<a>` atau `<button>` asli.

## 16. Struktur Proyek

```
project/
  web/                         Laravel 11
    app/Http/Controllers/      LandingController, CheckoutController, OrderController,
                               PaymentWebhookController, Admin/*, Api/InternalRedeemController
    app/Services/              PaymentGateway/(GatewayContract, MidtransGateway),
                               AccessCodeService, RedeemService, OrderService, DiscordService
    app/Jobs/                  SendAccessCodeEmail, GrantDiscordRole, ExpireMembers, ExpirePendingOrders
    app/Models/                Class, Order, Payment, AccessCode, Member, RedeemAttempt, Admin
    config/landing.php         seluruh teks landing page
    resources/views/           landing, checkout, order, legal, admin, components
    resources/css/tokens.css   design tokens
    database/                  migrations, seeders
    tests/                     Feature, Unit
  bot/                         discord.js v14
    src/                       index.js, deploy-commands.js, api.js, config.js, commands/redeem.js, commands/status.js
  scripts/generate-candles.mjs
  README.md
```

Nama kelas, method, dan variabel memakai bahasa Inggris. Teks yang tampil ke pengguna memakai Bahasa Indonesia.

## 17. Environment Variables

Sediakan `web/.env.example` dan `bot/.env.example` dengan nilai kosong. **Jangan commit `.env` asli.**

```
# web/.env
APP_URL=
DB_HOST=
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
CODE_PEPPER=              # string acak panjang, dipakai untuk hash kode
INTERNAL_API_TOKEN=       # dipakai bot untuk memanggil API internal
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
DISCORD_INVITE_URL=
MAIL_*=                   # SMTP atau penyedia email

# bot/.env
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=
INTERNAL_API_URL=
INTERNAL_API_TOKEN=
```

## 18. Aturan Bisnis Rinci

### 18.1 Kode akses

- Alfabet: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (tanpa I, L, O, 0, 1). Panjang 12 karakter, ditampilkan 3 grup dipisah tanda hubung (`XXXX-XXXX-XXXX`). Gunakan `random_int` (kriptografis), bukan `rand` atau `Str::random`.
- Normalisasi input: huruf besar, buang spasi dan tanda hubung, sebelum hashing.
- Hash: `hash_hmac('sha256', normalizedCode, CODE_PEPPER)` disimpan di `code_hash` (UNIQUE). Jika bentrok saat generate, ulangi maksimal 5 kali.
- **Tambahan skema:** kolom `code_encrypted` (TEXT, dienkripsi dengan `Crypt::encryptString`) di tabel `access_codes` agar kode bisa ditampilkan ulang di halaman order dan dikirim ulang oleh admin. Tambahkan juga `role_status` ENUM('pending','granted','failed') di tabel `members`.
- Satu kode untuk satu order untuk satu kali redeem.

### 18.2 Order dan pembayaran

- `order_code`: 20 karakter acak (ULID atau acak aman), bukan ID berurutan.
- Order `pending` kedaluwarsa setelah 24 jam (job terjadwal mengubah menjadi `expired`). Batas waktu pembayaran di gateway disamakan.
- Jumlah order dihitung di server dari harga paket. **Jangan percaya harga dari form.**

**Alur webhook (urutan wajib):**

1. Verifikasi signature. Untuk Midtrans: `sha512(order_id + status_code + gross_amount + ServerKey)` harus sama dengan `signature_key`. Jika berbeda, balas 401 dan berhenti.
2. Cari order berdasarkan `order_id`. Pastikan `gross_amount` sama dengan `orders.amount`. Jika berbeda, catat dan jangan proses.
3. Mulai transaksi database, `lockForUpdate` pada order.
4. Simpan/cek payment dengan `provider_ref` UNIQUE. Jika sudah ada dan sudah diproses, balas 200 tanpa efek lain (idempotent).
5. Petakan status: `settlement` atau `capture` (fraud accept) menjadi paid; `pending` tetap pending; `deny`, `cancel`, `failure` menjadi failed; `expire` menjadi expired.
6. Jika menjadi paid dan belum punya kode: generate kode, simpan hash dan versi terenkripsi, isi `paid_at`, ubah status order.
7. Commit transaksi, lalu dispatch job `SendAccessCodeEmail` (di luar transaksi).
8. Balas 200. Simpan `raw_payload` untuk audit.

### 18.3 Kontrak API redeem

`POST /api/internal/redeem`

Header: `Authorization: Bearer <INTERNAL_API_TOKEN>`, `Accept: application/json`.

Body:

```
{ "code": "K7QM-4WXD-9PTA", "discord_user_id": "123456789012345678" }
```

Respons sukses (200):

```
{ "status": "ok", "class_name": "...", "access_until": "2026-12-31T23:59:59+07:00" | null, "role_status": "granted" | "pending" }
```

Respons gagal (422): `{ "status": "invalid" | "used" | "expired" | "revoked" | "rate_limited" }`. Token salah: 401.

Logika di dalam satu transaksi:

1. Cek rate limit: maksimal 5 percobaan gagal per `discord_user_id` dalam 60 menit. Jika terlampaui, kembalikan `rate_limited`.
2. Normalisasi kode, hitung hash, `SELECT ... FOR UPDATE` pada `access_codes`.
3. Validasi berurutan: ada, status active, belum lewat `expires_at`, order berstatus paid.
4. Tandai `redeemed`, isi `redeemed_at` dan `redeemed_by_discord_id`.
5. Buat atau perbarui `members`. Jika pengguna sudah punya akses aktif untuk kelas yang sama, **perpanjang** `access_until` dari tanggal akses terakhir.
6. Catat ke `redeem_attempts` (berhasil maupun gagal).
7. Setelah commit, `DiscordService` memberi role lewat REST (`PUT /guilds/{guild}/members/{user}/roles/{role}`). Jika gagal (pengguna belum ada di server, izin kurang, atau error jaringan), set `role_status = pending` dan dispatch `GrantDiscordRole` dengan retry (backoff 1, 5, 15 menit). Setelah 3 kali gagal, set `failed` dan kirim notifikasi ke channel admin.

### 18.4 Perilaku bot

- Perintah: `/redeem kode:<teks>` dan `/status`. Semua balasan **ephemeral**. Bot memanggil `deferReply` lebih dulu karena batas respons 3 detik.
- Bot tidak pernah mencatat kode lengkap ke log. Cukup 4 karakter terakhir.

Pesan balasan (Bahasa Indonesia):

| Status | Pesan |
| --- | --- |
| ok, granted | Berhasil. Role kelas sudah aktif, silakan buka channel kelas. |
| ok, pending | Kode diterima. Role sedang diproses dan akan aktif dalam beberapa menit. |
| invalid | Kode tidak ditemukan. Periksa kembali penulisannya. |
| used | Kode ini sudah pernah dipakai. |
| expired | Kode ini sudah kedaluwarsa. Hubungi admin. |
| revoked | Kode ini sudah tidak berlaku. Hubungi admin. |
| rate\_limited | Terlalu banyak percobaan. Coba lagi nanti. |
| error | Terjadi gangguan. Coba lagi sebentar atau hubungi admin. |

### 18.5 Kedaluwarsa akses

Job harian `ExpireMembers`: untuk `members` yang `access_until` lewat, ubah status menjadi `expired` dan Laravel mencabut role lewat REST (`DELETE .../roles/{role}`). Opsional: pengingat email 3 hari sebelum berakhir.

### 18.6 Email kode akses

Subjek: `Kode akses kelas kamu - [NAMA BRAND]`. Isi: sapaan dengan nama, kode (font mono), tiga langkah singkat (masuk server Discord, ketik `/redeem`, tempel kode), tombol ke `DISCORD_INVITE_URL`, dan kontak bantuan. Tanpa gambar berat.

### 18.7 Pengaturan server Discord

- Channel `#verifikasi` terlihat semua orang. Channel kelas hanya terlihat role kelas.
- Role bot berada **di atas** role kelas dalam hierarki, dengan izin *Manage Roles* saja. Jangan beri Administrator.
- Daftarkan slash command per guild (`deploy-commands.js`) agar langsung muncul.

## 19. Edge Case yang Harus Ditangani

- Webhook datang dua kali atau tidak berurutan (`pending` setelah `settlement`): status paid tidak boleh mundur.
- Pembayaran sukses setelah order ditandai expired: tetap proses sebagai paid dan beri notifikasi admin.
- Dua orang meredeem kode yang sama bersamaan: hanya satu yang berhasil.
- Pengguna meredeem sebelum bergabung ke server: role pending lalu otomatis diberikan saat berhasil dicoba ulang.
- Email gagal terkirim: kode tetap tampil di halaman order dan admin bisa mengirim ulang.
- Admin me-revoke kode yang sudah diredeem: member menjadi `revoked` dan role dicabut.
- Gateway timeout saat membuat transaksi: order tetap `pending`, pengguna melihat pesan dan bisa mencoba lagi tanpa membuat order ganda (gunakan `order_code` yang sama selama masih pending).

## 20. Test Wajib

**Feature test (PHPUnit/Pest):**

- Checkout membuat order dengan harga dari server, bukan dari input.
- Webhook dengan signature salah ditolak (401) dan tidak mengubah apa pun.
- Webhook valid membuat tepat satu kode; webhook yang sama dikirim ulang tidak membuat kode kedua.
- Webhook dengan `gross_amount` tidak cocok tidak memproses order.
- Redeem sukses mengubah status kode, membuat member, dan memanggil `DiscordService` (di-mock).
- Redeem kode yang sama kedua kali mengembalikan `used`.
- Redeem kode kedaluwarsa atau revoked ditolak.
- Percobaan gagal ke-6 dalam satu jam menghasilkan `rate_limited`.
- Dua request redeem paralel pada kode yang sama: tepat satu berhasil.
- Endpoint internal tanpa token atau dengan token salah mengembalikan 401.
- Kegagalan `DiscordService` membuat `role_status = pending` dan retry dijadwalkan.

**Pemeriksaan non-fungsional:**

- Lighthouse mobile: performance minimal 85, accessibility minimal 95.
- Tidak ada scroll horizontal di 360px.
- Tidak ada string `[ISI]` tersisa di build production.
- Tidak ada secret di riwayat git (`git log -p` bersih dari token).

## 21. Cara Mengeksekusi (untuk Agentic AI)

### 21.1 Prompt pembuka (salin ke agent)

```
Kamu adalah senior full-stack engineer. Baca seluruh PRD ini sebelum menulis kode.
Bagian 14 sampai 21 menggantikan bagian lain jika ada konflik.
Kerjakan berurutan sesuai Fase 0 sampai 8 di bagian 10.
Berhenti di akhir setiap fase, laporkan hasilnya, dan tunggu konfirmasi sebelum lanjut.
Jangan mengarang konten (angka, testimoni, nama). Gunakan placeholder [ISI].
Jangan menaruh secret di kode. Jangan mengubah skema di luar migration.
Jika ada keputusan yang tidak tercakup, ajukan opsi dan rekomendasimu, jangan memilih sendiri.
```

### 21.2 Format laporan akhir tiap fase

1. Apa yang dibuat (daftar berkas utama).
2. Cara menjalankan dan mengujinya (perintah persis).
3. Hasil test dan kriteria diterima mana yang sudah terpenuhi.
4. Keputusan atau asumsi yang diambil.
5. Hal yang masih perlu dari pemilik (konten, kunci API, akun).

### 21.3 Rincian tambahan per fase

- **Fase 2 (landing):** kerjakan berurutan: tokens dan komponen dasar, hero beserta background animasi (15.4), pengganti navbar (15.5), section 2 sampai 9 (15.6), lalu pemeriksaan responsif (15.8) dan aksesibilitas (15.9).
- **Fase 3-5:** ikuti alur dan kontrak di bagian 18. Tulis test (bagian 20) bersamaan dengan fitur, bukan di akhir.
- **Fase 7:** jalankan seluruh test wajib dan pemeriksaan non-fungsional, lalu periksa kembali aturan 15.7.

### 21.4 Checklist sebelum go-live

- [ ] Semua placeholder `[ISI]` sudah diganti konten nyata.
- [ ] Disclaimer risiko, Syarat & Ketentuan, Kebijakan Privasi, dan kebijakan refund sudah ada dan ditinjau.
- [ ] Gateway pembayaran sudah mode production dan satu transaksi nyata kecil berhasil sampai role aktif.
- [ ] Queue worker, scheduler, dan bot berjalan sebagai service dan otomatis hidup kembali setelah restart.
- [ ] Backup database harian aktif.
- [ ] Token bot dan kunci gateway sudah dirotasi dari nilai uji.
- [ ] Role bot sudah di atas role kelas, dan channel kelas tersembunyi dari non-member.
