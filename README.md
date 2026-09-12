# POS Boilerplate

Boilerplate [Next.js](https://nextjs.org) untuk membangun aplikasi
Point of Sale (POS). Repositori ini bukan aplikasi POS jadi, melainkan
fondasi (struktur modul, autentikasi, multi-tenant database, dsb.) yang
siap dipakai sebagai titik awal.

Silakan **fork** repo ini untuk membuat versi POS milikmu sendiri.

## Teknologi

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** untuk styling
- **Prisma** dengan dua skema database: `global` dan `perusahaan` (multi-tenant)
- **Better Auth** untuk autentikasi
- **Vitest** untuk testing

## Memulai

Salin `.env.example` (jika ada) menjadi `.env`, sesuaikan koneksi database,
lalu jalankan generate & migrasi Prisma:

```bash
npm install
npm run db:generate
npm run db:migrate
```

Jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur modul

Modul global dengan behavior kompleks diletakkan di `components/<NamaModul>/`,
dipisah antara UI (`components/`) dan logika non-UI (`lib/`). Lihat
[AGENTS.md](AGENTS.md) untuk konvensi lengkap penamaan, struktur folder,
dan modul global yang sudah tersedia (`DataTable`, `ConfirmDialog`, dll).

## Testing

```bash
npm test
```

Test menggunakan Vitest dan ditempatkan di folder `__tests__/` di samping
kode yang diuji, bukan langsung bersebelahan dengan file sumbernya.

## Database

Proyek ini memakai dua skema Prisma terpisah:

- `prisma/global` — data lintas perusahaan (mis. autentikasi, konfigurasi global)
- `prisma/perusahaan` — data milik satu perusahaan (multi-tenant)

Gunakan `npm run db:migrate` saat development dan `npm run db:deploy` saat
deploy ke production.

## Kontribusi & Fork

Karena ini adalah boilerplate, setiap orang dipersilakan fork dan
mengembangkannya sesuai kebutuhan masing-masing (fitur POS, integrasi
pembayaran, laporan, dsb.) tanpa perlu meminta izin ke repo asal.
