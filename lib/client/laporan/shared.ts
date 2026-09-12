import { parseResponse } from "@/lib/client/apiResponse";

export type LokasiPilihan = {
  idlokasi  : number;
  namalokasi: string;
};

type LokasiApiRow = {
  idlokasi  : number;
  namalokasi: string;
  status    : number;
};

/** Daftar Lokasi untuk kontrol filter laporan — hanya Lokasi aktif, ringkas ke id + nama. */
export async function fetchLokasiLaporan(): Promise<LokasiPilihan[]> {
  const response = await fetch("/api/master/lokasi", { headers: { Accept: "application/json" } });
  const data = (await parseResponse<LokasiApiRow[] | undefined>(response)) ?? [];

  return data
    .filter((row) => row.status === 1)
    .map((row) => ({ idlokasi: row.idlokasi, namalokasi: row.namalokasi }));
}

function formatTanggalLokal(tanggal: Date): string {
  const tahun = tanggal.getFullYear();
  const bulan = String(tanggal.getMonth() + 1).padStart(2, "0");
  const hari = String(tanggal.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${hari}`;
}

export type RentangTanggal = {
  dari  : string;
  sampai: string;
};

/** Rentang default seluruh laporan: 7 hari terakhir sampai hari ini (inklusif), format `yyyy-mm-dd`. */
export function rentangMingguTerakhir(hariIni: Date = new Date()): RentangTanggal {
  const awal = new Date(hariIni);
  awal.setDate(awal.getDate() - 6);

  return { dari: formatTanggalLokal(awal), sampai: formatTanggalLokal(hariIni) };
}

/**
 * Nilai query `idlokasi`. Semua Lokasi terpilih (atau daftar pilihan belum termuat) = `null`,
 * artinya parameter tidak disertakan. Sebagian terpilih = daftar id dipisah koma. Tak satu pun
 * terpilih = `"0"` (tidak akan cocok dengan Lokasi mana pun).
 */
export function paramIdlokasi(terpilih: number[], totalLokasi: number): string | null {
  if (totalLokasi === 0 || terpilih.length === totalLokasi) {
    return null;
  }
  if (terpilih.length === 0) {
    return "0";
  }

  return terpilih.join(",");
}
