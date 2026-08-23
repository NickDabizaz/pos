export type Lokasi = {
  idlokasi  : number;
  kodelokasi: string;
  namalokasi: string;
  keterangan: string | null;
  status    : number;
};

export type CreateLokasiInput = {
  namalokasi: string;
  keterangan?: string | null;
};

export type UpdateLokasiInput = {
  namalokasi?: string;
  keterangan?: string | null;
};
