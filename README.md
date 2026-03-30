# Finance Tracker Telegram Bot

Bot Telegram sederhana untuk mencatat pemasukan/pengeluaran, melihat ringkasan, dan mengelola budget per kategori. Dibangun dengan **Telegraf** + **PostgreSQL** + **Prisma**.

## Fitur

- **Catat transaksi cepat** lewat chat:
  - Income: `+50000 gaji`
  - Expense: `-25000 makan`
- **Ringkasan**:
  - Semua transaksi (`/summary`)
  - Hari ini (`/today`)
  - Bulan ini + insight kategori terbesar (`/monthly`)
- **Budget per kategori**:
  - Set budget (`/setbudget <category> <amount>`)
  - Lihat budget bulan ini (`/budget`)
  - Notifikasi saat pemakaian >= 80% atau >= 100%
- **Hapus data dengan konfirmasi** (`/clear ...`)

## Stack

- **Runtime**: Node.js (ESM)
- **Bot**: `telegraf`
- **Database**: PostgreSQL
- **ORM**: Prisma + `@prisma/adapter-pg`

## Prasyarat

- Node.js versi LTS (disarankan)
- PostgreSQL (local / docker / managed)
- Token Bot Telegram dari **@BotFather**

## Konfigurasi Environment (tanpa membocorkan `.env`)

Aplikasi membutuhkan 2 environment variable berikut:

- **`BOT_TOKEN`**: token bot dari @BotFather
- **`DATABASE_URL`**: connection string PostgreSQL

Gunakan file contoh `.env.example`, lalu buat `.env` sendiri.

```bash
cp .env.example .env
```

Isi `.env` dengan nilai milik kamu (jangan commit).

## Setup Database (Prisma)

1. Install dependency:

```bash
npm install
```

2. Pastikan `DATABASE_URL` sudah benar dan database sudah ada.
3. Jalankan migration Prisma:

```bash
npx prisma migrate deploy
```

Opsional (untuk melihat data via UI Prisma Studio):

```bash
npx prisma studio
```

## Menjalankan Bot

Jalankan:

```bash
node index.js
```

Saat sukses, akan muncul log `Bot running...`.

## Command Bot

Bot akan mendaftarkan command berikut ke Telegram saat start:

- **`/start`**: panduan + tombol quick actions
- **`/summary`**: ringkasan semua transaksi (income/expense/saldo)
- **`/today`**: daftar transaksi hari ini
- **`/monthly`**: ringkasan bulan ini + kategori expense terbesar
- **`/setbudget`**: set budget per kategori
  - Format: `/setbudget food 1000000`
- **`/budget`**: lihat budget bulan ini + persentase pemakaian
- **`/clear`**: bantuan hapus data + mode hapus

## Format Input Transaksi (via chat)

Kirim pesan teks (bukan command) dengan format:

- **Income**: `+<amount> <note...>`
- **Expense**: `-<amount> <note...>`

Contoh:

- `+50000 gaji`
- `-25000 makan siang`
- `-15000 kopi`

Jika format nominal tidak valid, bot akan membalas contoh format yang benar.

## Kategori Otomatis

Bot akan mencoba menebak kategori dari `note` (huruf kecil):

- `makan` / `kopi` → `food`
- `bensin` → `transport`
- `gaji` → `salary`
- selain itu → `general`

Catatan: kategori ini dipakai untuk ringkasan per kategori dan budget warning.

## Budget Warning

Saat kamu mencatat **expense**, bot akan mengecek budget kategori terkait untuk bulan berjalan:

- **>= 80%**: peringatan
- **>= 100%**: budget dianggap habis

## Hapus Data (`/clear`)

Perintah `/clear` punya beberapa mode (sebagian butuh `CONFIRM`):

- **Transaksi**
  - `/clear today`
  - `/clear month`
  - `/clear all CONFIRM`
- **Budget**
  - `/clear budgets CONFIRM`
- **Semua data**
  - `/clear everything CONFIRM`

## Skema Database (ringkas)

- **User**
  - `telegramId` unik per user Telegram
  - relasi ke transaksi dan budget
- **Transaction**
  - `type`: `income` atau `expense` (string)
  - `amount`: float
  - `category`: string (hasil deteksi)
  - `note`: opsional
  - `createdAt`: waktu dibuat
- **Budget**
  - unik per kombinasi (`userId`, `category`)
  - `limitAmount`: float

Detail ada di `prisma/schema.prisma`.

## Troubleshooting

- **Bot tidak jalan / error “Missing env var”**
  - Pastikan `.env` ada dan berisi `BOT_TOKEN` + `DATABASE_URL`.
- **Prisma gagal konek database**
  - Cek `DATABASE_URL` dan pastikan server Postgres aktif & database tersedia.
- **Command tidak muncul di menu Telegram**
  - Restart bot agar `setMyCommands` dieksekusi ulang.

## Keamanan

- Jangan pernah commit `.env` (sudah diabaikan oleh `.gitignore`).
- Jika token bot pernah terpapar, **rotate token** di @BotFather.

