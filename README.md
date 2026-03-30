# Finance Tracker Telegram Bot

Bot Telegram untuk mencatat pemasukan/pengeluaran, melihat ringkasan & analisis, mengatur budget per kategori, dan mengejar target tabungan (goal). Dibangun dengan **Telegraf** + **PostgreSQL** + **Prisma**.

## Fitur

- **Catat transaksi cepat** lewat chat (bukan slash command):
  - Pemasukan: `+50000 gaji`
  - Pengeluaran: `-25000 makan`
- **Ringkasan**:
  - Semua waktu: income, expense, saldo (`/summary`)
  - Hari ini: daftar transaksi (`/today`)
  - Bulan ini: totals + insight kategori pengeluaran terbesar (`/monthly`)
- **Analisis bulan berjalan** (`/analysis`):
  - Pengeluaran weekday vs weekend
  - Total bulan ini + perbandingan vs bulan lalu (%
  - Top kategori pengeluaran (hingga 5) + porsi %
  - Rata-rata pengeluaran per hari (dibagi jumlah hari di bulan)
  - Jika ada budget: ringkasan budget terkait (pemakaian vs limit)
- **Budget per kategori**:
  - Set / ubah (`/setbudget <category> <amount>`)
  - Lihat bulan ini: nominal terpakai, limit, persentase, progress bar teks (`/budget`)
  - Peringatan otomatis setelah input expense jika pemakaian **≥ 80%** atau **≥ 100%**
- **Goal (target tabungan)**:
  - Set / ubah (`/setgoal <nama...> <nominal>` — nominal selalu di akhir, nama bisa beberapa kata)
  - Lihat progress (`/goal`): berdasarkan **saldo bersih** (total pemasukan − total pengeluaran sepanjang waktu), bukan hanya total gaji
- **Operasional transaksi**:
  - Daftar transaksi terbaru (`/last` atau `/last <N>`, maks. 20, default 5)
  - Hapus satu transaksi by id (`/delete <id> CONFIRM`)
- **Hapus data massal** dengan konfirmasi untuk mode sensitif (`/clear ...`)
- **Quick actions**: `/start` menampilkan panduan + tombol inline (ringkasan, hari ini, bulan ini, analisis, budget, bantuan clear)

## Tampilan & aturan input

- **Nominal**: harus **angka bulat** (rupiah, tanpa desimal) untuk transaksi chat, `/setbudget`, dan `/setgoal`.
- **Kategori di UI**: bot menampilkan label ramah pengguna (mis. Gaji, Makan & Kopi) sambil tetap menyimpan kode internal (`salary`, `food`, …) untuk budget dan query.

## Stack

- **Runtime**: Node.js (ESM)
- **Bot**: `telegraf`
- **Database**: PostgreSQL
- **ORM**: Prisma + `@prisma/adapter-pg`

## Prasyarat

- Node.js versi LTS (disarankan)
- PostgreSQL (local / docker / managed)
- Token bot dari **@BotFather**

## Konfigurasi environment

Aplikasi membutuhkan:

- **`BOT_TOKEN`**: token bot dari @BotFather
- **`DATABASE_URL`**: connection string PostgreSQL

```bash
cp .env.example .env
```

Isi `.env` dengan nilai milik kamu (jangan commit).

## Setup database (Prisma)

1. Install dependency:

```bash
npm install
```

2. Pastikan `DATABASE_URL` benar dan database sudah ada.
3. Jalankan migration:

```bash
npx prisma migrate deploy
```

Opsional:

```bash
npx prisma studio
```

## Menjalankan bot

```bash
node index.js
```

Saat sukses muncul log `Bot running...`.

## Command bot

Command terdaftar ke menu Telegram saat bot start:

| Command | Deskripsi |
|--------|------------|
| `/start` | Panduan + quick actions (inline keyboard) |
| `/summary` | Ringkasan semua transaksi (income / expense / saldo) |
| `/today` | Transaksi hari ini |
| `/monthly` | Ringkasan bulan ini + insight kategori terbesar |
| `/analysis` | Analisis pengeluaran bulan ini (top kategori, avg/hari, budget, dll.) |
| `/setbudget` | Set budget per kategori |
| `/budget` | Budget bulan ini + progress bar |
| `/setgoal` | Set target goal |
| `/goal` | Progress goal (saldo bersih vs target) |
| `/last` | Transaksi terakhir (`/last` atau `/last 10`) |
| `/delete` | Hapus transaksi (`/delete <id> CONFIRM`) |
| `/clear` | Hapus data (lihat bawah) |

## Format input transaksi (via chat)

Bukan command; kirim teks:

- **Pemasukan**: `+<nominal_bulat> <catatan...>`
- **Pengeluaran**: `-<nominal_bulat> <catatan...>`

Contoh:

- `+50000 gaji`
- `-25000 makan siang`
- `-15000 kopi`

## Kategori otomatis

Dari isi `note` (case-insensitive):

| Kata kunci (contoh) | Kode disimpan |
|---------------------|---------------|
| makan, kopi | `food` |
| bensin | `transport` |
| gaji | `salary` |
| lainnya | `general` |

Kategori dipakai untuk ringkasan, budget, dan analisis.

## Budget

- **Set**: `/setbudget food 1000000` (kategori = kode yang dipakai di DB, huruf kecil)
- **Lihat**: `/budget`
- **Warning** setelah expense: ≥ 80% (peringatan), ≥ 100% (habis)

## Goal

- **Set**: `/setgoal nabung 10000000`
- **Progress** di `/goal`: `saldo bersih = Σ income − Σ expense` dibanding `target` per goal yang kamu set.

## Transaksi terakhir & hapus satu

- `/last` — 5 transaksi terakhir  
- `/last 15` — hingga 20  
- `/delete 42 CONFIRM` — hapus transaksi id 42 milik user kamu

## Hapus data (`/clear`)

Sebagian mode butuh `CONFIRM`:

- **Transaksi**: `/clear today`, `/clear month`, `/clear all CONFIRM`
- **Budget saja**: `/clear budgets CONFIRM`
- **Semua (transaksi + budget + goal)**: `/clear everything CONFIRM`

Tanpa argumen: `/clear` menampilkan bantuan.

## Skema database (ringkas)

- **User** — `telegramId` unik; relasi ke transaksi, budget, goal
- **Transaction** — `type`: `income` / `expense`; `amount`; `category`; `note?`; `createdAt`
- **Budget** — unik (`userId`, `category`); `limitAmount`
- **Goal** — unik (`userId`, `name`); `target`

Detail: `prisma/schema.prisma`.

## Troubleshooting

- **Bot tidak jalan / “Missing env var”** — pastikan `.env` berisi `BOT_TOKEN` dan `DATABASE_URL`.
- **Prisma gagal koneksi** — cek `DATABASE_URL` dan Postgres aktif.
- **Command tidak muncul di menu** — restart bot agar `setMyCommands` jalan lagi.
- **Parsing Markdown di `/start`** — nama kamu di-escape agar tidak merusak format pesan.

## Keamanan

- Jangan commit `.env` (biasanya di `.gitignore`).
- Jika token terpapar, **rotate** di @BotFather.
