"use client";

import { useState } from "react";

import FilterLokasi from "@/app/laporan/components/FilterLokasi";
import LaporanShell from "@/app/laporan/components/LaporanShell";
import { useOpsiLokasi } from "@/app/laporan/components/useLaporanView";
import { buatUrlLaporanJurnal } from "@/lib/client/laporan/jurnal";
import { rentangMingguTerakhir } from "@/lib/client/laporan/shared";

const rentangAwal = rentangMingguTerakhir();

export default function LaporanJurnalPage() {
  const [kodetrans, setKodetrans] = useState("");
  const [dari, setDari] = useState(rentangAwal.dari);
  const [sampai, setSampai] = useState(rentangAwal.sampai);
  const { opsi, terpilih, setTerpilih } = useOpsiLokasi();

  return (
    <LaporanShell
      buatUrl={() =>
        buatUrlLaporanJurnal({ kodetrans, dari, sampai, idlokasi: terpilih, totalLokasi: opsi.length })
      }
      judul="Laporan Jurnal Transaksi"
    >
      <label className="flex flex-col gap-1 text-sm text-foreground">
        Kode Transaksi
        <input
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
          onChange={(event) => setKodetrans(event.target.value)}
          placeholder="mis. JL2608"
          type="text"
          value={kodetrans}
        />
      </label>
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
    </LaporanShell>
  );
}
