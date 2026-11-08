# JarchiFX

Website penjualan kelas trading forex dengan sistem kode akses dan role Discord otomatis.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS 4)
- MySQL 8 + Prisma 7
- discord.js 14
- Midtrans Snap (sandbox, dengan mode mock untuk pengembangan)

## Struktur

```
web/      aplikasi Next.js (landing, checkout, order, admin, API)
bot/      bot Discord
scripts/  generator candle SVG dan pemeriksaan konten
```

## Menjalankan

```powershell
# dari folder web
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Worker untuk email, retry role Discord, dan job terjadwal:

```powershell
npm run worker
```

Bot Discord:

```powershell
cd ../bot
npm install
npm run deploy
npm start
```

## Admin panel

Buka `http://localhost:3000/admin`. Login memakai akun hasil seed:

- Email: `admin@jarchifx.local`
- Password: `admin12345`

Ganti password seed sebelum deploy. Panel menyediakan ringkasan penjualan, daftar order dan kode, kirim ulang email, generate kode manual, revoke kode/member, serta pengaturan paket dan role Discord.

## Environment

Salin `web/.env.example` menjadi `web/.env` dan `bot/.env.example` menjadi `bot/.env`, lalu isi nilainya. Jangan commit file `.env`.

Midtrans dan Discord tidak wajib diisi untuk pengembangan. Dengan `PAYMENT_MOCK=true`, halaman order menyediakan tombol simulasi pembayaran yang tetap melewati verifikasi signature webhook.
