export type Lokasi = {
  kodelokasi: string;
  namalokasi: string;
  keterangan: string;
  status    : number;
};

export type LokasiFormErrors = {
  kodelokasi?: string;
  namalokasi?: string;
  keterangan?: string;
};
