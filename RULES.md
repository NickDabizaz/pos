# Coding Rules

Aturan penulisan kode di project ini. Dibaca sebelum nulis atau generate
kode baru, supaya style dan struktur kodenya konsisten.

## Jangan bikin fungsi wrapper yang cuma pass-through

**Don't:** bikin fungsi yang isinya cuma manggil fungsi lain dan langsung
return hasilnya, tanpa ada logic tambahan.

```ts
export async function listSesuatu(param: string) {
  return findAllSesuatu(param);
}
```

**Do:** panggil langsung `findAllSesuatu`, tidak usah lewat `listSesuatu`.

```ts
const data = await findAllSesuatu(param);
```

Wrapper boleh dibuat kalau dia beneran nambah sesuatu, misalnya validasi,
cek not-found, cek permission, atau gabungan beberapa pemanggilan fungsi.
Kalau isinya cuma satu baris "return fungsi lain" tanpa tambahan apa-apa,
hapus saja wrappernya.

## Tampung hasil ke variabel dulu, jangan langsung return

**Don't:**

```ts
function cariPaket(kodepaket: string) {
  return PAKET_LANGGANAN.find((paket) => paket.kodepaket === kodepaket);
}
```

**Do:**

```ts
function findPaketByKode(kodepaket: string) {
  const paket = PAKET_LANGGANAN.find((item) => item.kodepaket === kodepaket);

  return paket;
}
```

Meskipun fungsinya cuma 1 baris logic, tetap tampung ke variabel dulu baru
di-return. Ini bikin gampang dikasih nama yang jelas dan gampang ditambah
`console.log`/breakpoint waktu debug, tanpa harus ubah struktur kode. Kasih
baris kosong sebelum `return` supaya keliatan jelas dan gak nempel dengan
logic di atasnya.

## Nama fungsi harus jelas dan konsisten (programmable), jangan ambigu

**Don't:** `cariPaket`, `turunkanNamaDatabase`, `daftarDenganKodeKetikan`

**Do:** `findPaketByKode`, `toLowerNamaDatabase`, `daftarDenganKodeInputan`

Pakai prefix yang konsisten sesuai maksud fungsinya, misalnya:
- `find...` — cari/ambil data
- `create...` / `insert...` — bikin data baru
- `to...` — konversi/transformasi nilai
- `is...` / `has...` — hasilnya boolean

Hindari kata yang ambigu, terlalu umum, atau bahasa sehari-hari yang bisa
ditafsirkan macam-macam (`cari`, `turunkan`, `ketikan`). Nama fungsi harus
langsung ketebak isinya ngapain tanpa perlu buka body-nya.

Hindari juga istilah teknis/textbook yang berat kayak `assert...` atau
`ensure...` kalau ada kata yang lebih sederhana dan langsung dimengerti,
misalnya `cek...` (untuk validasi) atau `pastikan...`.

**Don't:** `assertValidNamaDatabase`, `ensureDatabaseExists`

**Do:** `cekValidNamaDatabase`, `cekDatabaseExists`

Pakai satu istilah domain yang konsisten di seluruh project, jangan campur
istilah asing yang beda makna dengan istilah domain yang sudah dipakai.
Misalnya kalau project ini sudah pakai istilah "Perusahaan", jangan ada
kode yang tiba-tiba pakai istilah "Tenant" untuk hal yang sama.

## Jangan bikin custom Error class per kasus, cukup pesan error yang jelas

**Don't:**

```ts
export class PaketTidakDitemukanError extends Error {}

throw new PaketTidakDitemukanError(`Paket "${kodepaket}" tidak ditemukan`);
```

**Do:**

```ts
throw new Error(`Paket "${kodepaket}" tidak ditemukan`);
```

Class error satu-satu per kasus cuma nambah boilerplate dan bikin file penuh
deklarasi class di paling atas tanpa manfaat besar. Cukup lempar `Error`
biasa dengan pesan yang jelas menjelaskan masalahnya.

Ini berlaku juga walaupun beda kasus error butuh beda HTTP status code di
route handler. Jangan bikin 1 class error custom dengan field `code` buat
nampung semua kemungkinan kasus — cukup lempar `Error` biasa dengan pesan
yang beda-beda, lalu di route handler bedakan kasusnya dari isi
`error.message` (misalnya pakai `.includes(...)`).

## Jangan bikin fungsi terpisah kalau cuma dipakai sekali dan simpel

**Don't:** ekstrak logic simpel yang cuma dipakai di satu tempat jadi
fungsi tersendiri, sehingga pembaca harus lompat-lompat ke banyak fungsi
kecil buat ngerti satu alur logic.

**Do:** kalau logic-nya pendek dan cuma dipakai sekali, tulis langsung
inline di tempat pemakaiannya.

Fungsi terpisah baru dibuat kalau memang dipakai berulang di beberapa
tempat, atau kalau logic-nya cukup panjang/kompleks sehingga perlu diberi
nama sendiri biar jelas.

## Kumpulkan semua const statis jadi satu grup di atas

**Don't:** const statis/konfigurasi ditulis tersebar di tengah-tengah file,
di antara fungsi-fungsi lain.

**Do:** semua const statis ditaruh jadi satu grup di bagian atas file,
tepat setelah import, sebelum fungsi pertama.

Tujuannya biar pembaca bisa lihat semua konfigurasi/konstanta di satu
tempat sekali baca, tanpa harus scroll bolak-balik ke tengah file.
