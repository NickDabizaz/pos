"use client";

import type { LokasiPilihan } from "@/lib/client/laporan/shared";

type Props = {
  opsi          : LokasiPilihan[];
  terpilih      : number[];
  onChangeAction: (idlokasi: number[]) => void;
};

/** Panel checkbox multi-pilih Lokasi dengan "Semua". Default (di pemanggil) seluruh Lokasi tercentang. */
export default function FilterLokasi({ opsi, terpilih, onChangeAction }: Props) {
  const semuaTercentang = opsi.length > 0 && terpilih.length === opsi.length;

  function toggle(idlokasi: number, aktif: boolean) {
    onChangeAction(aktif ? [...terpilih, idlokasi] : terpilih.filter((id) => id !== idlokasi));
  }

  function toggleSemua(aktif: boolean) {
    onChangeAction(aktif ? opsi.map((lokasi) => lokasi.idlokasi) : []);
  }

  return (
    <div className="flex flex-col gap-1 text-sm text-foreground">
      <span>Lokasi</span>
      <div className="flex max-w-[420px] flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border px-3 py-2">
        {opsi.length === 0 ? (
          <span className="text-muted-foreground">Memuat…</span>
        ) : (
          <>
            <label className="flex items-center gap-1.5 font-medium">
              <input checked={semuaTercentang} onChange={(event) => toggleSemua(event.target.checked)} type="checkbox" />
              Semua
            </label>
            {opsi.map((lokasi) => (
              <label className="flex items-center gap-1.5" key={lokasi.idlokasi}>
                <input
                  checked={terpilih.includes(lokasi.idlokasi)}
                  onChange={(event) => toggle(lokasi.idlokasi, event.target.checked)}
                  type="checkbox"
                />
                {lokasi.namalokasi}
              </label>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
