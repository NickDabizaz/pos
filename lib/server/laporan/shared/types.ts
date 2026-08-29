/** Konteks bersama yang dirakit satu tempat lalu diteruskan ke tiap `render` laporan. */
export type KonteksLaporan = {
  namaPerusahaan  : string;
  judul           : string;
  keteranganFilter: string[];
  waktuCetak      : Date;
};
