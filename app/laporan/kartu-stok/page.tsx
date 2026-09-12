"use client";

import { useEffect, useState } from "react";

import FilterLokasi from "@/app/laporan/components/FilterLokasi";
import LaporanShell from "@/app/laporan/components/LaporanShell";
import { useOpsiLokasi } from "@/app/laporan/components/useLaporanView";
import ComboGrid from "@/components/ComboGrid";
import { fetchBarangList, type Barang } from "@/lib/client/barang";
import { buatUrlLaporanKartuStok } from "@/lib/client/laporan/kartuStok";
import { rentangMingguTerakhir } from "@/lib/client/laporan/shared";

const rentangAwal = rentangMingguTerakhir();

const kolomBarang = [
  { key: "namabarang" as const, label: "Nama Barang" },
  { key: "kodebarang" as const, label: "Kode" },
];

export default function LaporanKartuStokPage() {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [idbarang, setIdbarang] = useState<number | null>(null);
  const [dari, setDari] = useState(rentangAwal.dari);
  const [sampai, setSampai] = useState(rentangAwal.sampai);
  const { opsi, terpilih, setTerpilih } = useOpsiLokasi();

  useEffect(() => {
    fetchBarangList().then(setBarangList).catch(() => setBarangList([]));
  }, []);

  return (
    <LaporanShell
      buatUrl={() =>
        buatUrlLaporanKartuStok({ idbarang, dari, sampai, idlokasi: terpilih, totalLokasi: opsi.length })
      }
      judul="Laporan Kartu Stok"
    >
      <div className="min-w-60">
        <ComboGrid
          columns={kolomBarang}
          data={barangList}
          emptyMessage="Semua Barang"
          label="Barang"
          labelKey="namabarang"
          onChangeAction={(_value, row) => setIdbarang(row ? row.idbarang : null)}
          placeholder="Semua Barang (ketik untuk mencari)"
          searchKeys={["namabarang", "kodebarang"]}
          value={idbarang ?? undefined}
          valueKey="idbarang"
        />
      </div>
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
