"use client";

import { useState } from "react";

import FilterLokasi from "@/app/laporan/components/FilterLokasi";
import LaporanShell from "@/app/laporan/components/LaporanShell";
import { useOpsiLokasi } from "@/app/laporan/components/useLaporanView";
import { buatUrlLaporanPembelian } from "@/lib/client/laporan/pembelian";
import { rentangMingguTerakhir } from "@/lib/client/laporan/shared";

const rentangAwal = rentangMingguTerakhir();

export default function LaporanPembelianPage() {
  const [dari, setDari] = useState(rentangAwal.dari);
  const [sampai, setSampai] = useState(rentangAwal.sampai);
  const [termasukDibatalkan, setTermasukDibatalkan] = useState(false);
  const { opsi, terpilih, setTerpilih } = useOpsiLokasi();

  return (
    <LaporanShell
      buatUrl={() =>
        buatUrlLaporanPembelian({ dari, sampai, termasukDibatalkan, idlokasi: terpilih, totalLokasi: opsi.length })
      }
      judul="Laporan Pembelian"
    >
      <label className="flex flex-col gap-1 text-sm text-foreground">
        Dari Tanggal
        <input
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
          onChange={(event) => setDari(event.target.value)}
          type="date"
          value={dari}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-foreground">
        Sampai Tanggal
        <input
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
          onChange={(event) => setSampai(event.target.value)}
          type="date"
          value={sampai}
        />
      </label>
      <FilterLokasi onChangeAction={setTerpilih} opsi={opsi} terpilih={terpilih} />
      <label className="flex items-center gap-2 pb-1.5 text-sm text-foreground">
        <input
          checked={termasukDibatalkan}
          onChange={(event) => setTermasukDibatalkan(event.target.checked)}
          type="checkbox"
        />
        Tampilkan dibatalkan
      </label>
    </LaporanShell>
  );
}
