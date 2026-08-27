const POLA_AWALAN = /^[A-Za-z0-9-]+$/;
const POLA_ANGKA_BULAT = /^\d+$/;
const POLA_DESIMAL = /^\d+(\.\d+)?$/;

function pesan(modul: string, config: string, alasan: string): string {
  return `Nilai untuk modul "${modul}", kunci "${config}" tidak sah: ${alasan}`;
}

export function validasiNilai(modul: string, config: string, nilai: string): string | null {
  const modulNorm = modul.trim().toUpperCase();
  const configNorm = config.trim().toUpperCase();
  const bersih = nilai.trim().toUpperCase();

  if (configNorm === "AWALAN") {
    if (!bersih) return pesan(modulNorm, configNorm, "awalan tidak boleh kosong");
    if (!POLA_AWALAN.test(bersih)) return pesan(modulNorm, configNorm, "awalan hanya boleh berisi huruf, angka, dan tanda hubung");

    return null;
  }

  if (configNorm === "PAKAITANGGAL" || configNorm === "STATUS") {
    if (bersih !== "0" && bersih !== "1") return pesan(modulNorm, configNorm, `harus "0" atau "1"`);

    return null;
  }

  if (configNorm === "PANJANGNOMOR") {
    if (!POLA_ANGKA_BULAT.test(bersih) || Number(bersih) <= 0) {
      return pesan(modulNorm, configNorm, "panjangnomor harus bilangan bulat positif");
    }

    return null;
  }

  if (configNorm === "PERSENTASE") {
    if (!POLA_DESIMAL.test(bersih) || Number(bersih) < 0 || Number(bersih) > 100) {
      return pesan(modulNorm, configNorm, "persentase harus angka antara 0 sampai 100");
    }

    return null;
  }

  if (configNorm === "TEMA") {
    if (bersih !== "LIGHT" && bersih !== "DARK") {
      return pesan(modulNorm, configNorm, `tema harus "LIGHT" atau "DARK"`);
    }

    return null;
  }

  return null;
}
