const POLA_AWALAN = /^[A-Za-z0-9-]+$/;
const POLA_ANGKA_BULAT = /^\d+$/;
const POLA_DESIMAL = /^\d+(\.\d+)?$/;

function pesan(modul: string, config: string, alasan: string): string {
  return `Nilai untuk modul "${modul}", kunci "${config}" tidak sah: ${alasan}`;
}

export function validasiNilai(modul: string, config: string, nilai: string): string | null {
  const bersih = nilai.trim();

  if (config === "awalan") {
    if (!bersih) return pesan(modul, config, "awalan tidak boleh kosong");
    if (!POLA_AWALAN.test(bersih)) return pesan(modul, config, "awalan hanya boleh berisi huruf, angka, dan tanda hubung");

    return null;
  }

  if (config === "pakaitanggal" || config === "status") {
    if (bersih !== "0" && bersih !== "1") return pesan(modul, config, `harus "0" atau "1"`);

    return null;
  }

  if (config === "panjangnomor") {
    if (!POLA_ANGKA_BULAT.test(bersih) || Number(bersih) <= 0) {
      return pesan(modul, config, "panjangnomor harus bilangan bulat positif");
    }

    return null;
  }

  if (config === "persentase") {
    if (!POLA_DESIMAL.test(bersih) || Number(bersih) < 0 || Number(bersih) > 100) {
      return pesan(modul, config, "persentase harus angka antara 0 sampai 100");
    }

    return null;
  }

  if (config === "tema") {
    if (bersih !== "terang" && bersih !== "gelap") {
      return pesan(modul, config, `tema harus "terang" atau "gelap"`);
    }

    return null;
  }

  return null;
}
