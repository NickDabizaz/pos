"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  KELOMPOK_URUT,
  KUNCI_KODE_DOKUMEN,
  URUT_MODUL_KODE,
  kelompokDari,
  kunciBaris,
  labelModul,
  labelPilihan,
  metaKunci,
} from "@/app/pengaturan/lib/metaKunci";
import type { ItemConfig, Kelompok, KelompokConfig } from "@/app/pengaturan/lib/types";
import { validasiNilai } from "@/app/pengaturan/lib/validasi";
import { fetchPengaturan, updatePengaturan, updatePengaturanModul } from "@/lib/client/pengaturan";
import { terapkanTema } from "@/components/TemaApplier";

export default function PengaturanPage() {
  const [kelompok, setKelompok]         = useState<KelompokConfig[]>([]);
  const [draf, setDraf]                 = useState<Record<string, string>>({});
  const [tab, setTab]                   = useState<Kelompok>("GLOBAL");
  const [isLoading, setIsLoading]       = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [pesanPerBaris, setPesanPerBaris] = useState<Record<string, string>>({});
  const [sedangSimpan, setSedangSimpan]   = useState<Record<string, boolean>>({});

  const muat = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await fetchPengaturan();
      setKelompok(data);
      setDraf(Object.fromEntries(data.flatMap((k) => k.items.map((item) => [kunciBaris(k.modul, item.config), item.nilai]))));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Gagal memuat pengaturan");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void muat();
  }, [muat]);

  const modulPerKelompok = useMemo(() => {
    const hasil: Record<Kelompok, KelompokConfig[]> = { GLOBAL: [], MASTER: [], TRANSAKSI: [] };

    for (const grup of kelompok) {
      hasil[kelompokDari(grup.modul)].push(grup);
    }
    for (const nama of KELOMPOK_URUT) {
      hasil[nama].sort(
        (a, b) => URUT_MODUL_KODE[nama].indexOf(a.modul) - URUT_MODUL_KODE[nama].indexOf(b.modul),
      );
    }

    return hasil;
  }, [kelompok]);

  function tandaiTersimpan(modul: string, updates: ItemConfig[]) {
    setKelompok((sebelumnya) =>
      sebelumnya.map((grup) =>
        grup.modul === modul
          ? {
              ...grup,
              items: grup.items.map((item) => {
                const cocok = updates.find((u) => u.config === item.config);

                return cocok ? { ...item, nilai: cocok.nilai } : item;
              }),
            }
          : grup,
      ),
    );
  }

  async function simpanSatu(modul: string, config: string) {
    const kunci = kunciBaris(modul, config);
    const nilai = (draf[kunci] ?? "").trim();

    const pesanValidasi = validasiNilai(modul, config, nilai);
    if (pesanValidasi) {
      setPesanPerBaris((s) => ({ ...s, [kunci]: pesanValidasi }));
      return;
    }

    setSedangSimpan((s) => ({ ...s, [kunci]: true }));
    setPesanPerBaris((s) => {
      const next = { ...s };
      delete next[kunci];

      return next;
    });

    try {
      const nilaiBaru = nilai.toUpperCase();
      const row = await updatePengaturan(modul, config, nilaiBaru);
      tandaiTersimpan(row.modul, [{ config: row.config, nilai: row.nilai }]);
      setDraf((s) => ({ ...s, [kunci]: row.nilai }));
      if (row.modul === "TAMPILAN" && row.config === "TEMA" && (row.nilai === "LIGHT" || row.nilai === "DARK")) {
        terapkanTema(row.nilai);
      }
    } catch (error) {
      setPesanPerBaris((s) => ({
        ...s,
        [kunci]: error instanceof Error ? error.message : "Gagal menyimpan pengaturan",
      }));
    } finally {
      setSedangSimpan((s) => ({ ...s, [kunci]: false }));
    }
  }

  async function simpanBarisKode(modul: string) {
    const items = KUNCI_KODE_DOKUMEN.map((config) => ({
      config,
      nilai: (draf[kunciBaris(modul, config)] ?? "").trim().toUpperCase(),
    }));

    for (const item of items) {
      const pesanValidasi = validasiNilai(modul, item.config, item.nilai);
      if (pesanValidasi) {
        setPesanPerBaris((s) => ({ ...s, [modul]: pesanValidasi }));
        return;
      }
    }

    setSedangSimpan((s) => ({ ...s, [modul]: true }));
    setPesanPerBaris((s) => {
      const next = { ...s };
      delete next[modul];

      return next;
    });

    try {
      const rows = await updatePengaturanModul(modul, items);
      tandaiTersimpan(modul, rows.map((row) => ({ config: row.config, nilai: row.nilai })));
      setDraf((s) => {
        const next = { ...s };
        for (const row of rows) {
          next[kunciBaris(modul, row.config)] = row.nilai;
        }

        return next;
      });
    } catch (error) {
      setPesanPerBaris((s) => ({
        ...s,
        [modul]: error instanceof Error ? error.message : "Gagal menyimpan pengaturan",
      }));
    } finally {
      setSedangSimpan((s) => ({ ...s, [modul]: false }));
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Atur format Kode Dokumen tiap modul, PPN, serta tema tampilan Perusahaan.
        </p>
      </div>

      {loadError && (
        <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
          {loadError}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat pengaturan...</p>
      ) : (
        <>
          <div className="mb-6 flex gap-1 border-b border-border">
            {KELOMPOK_URUT.map((nama) => (
              <button
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  tab === nama
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                key={nama}
                onClick={() => setTab(nama)}
                type="button"
              >
                {nama}
              </button>
            ))}
          </div>

          {tab === "GLOBAL" ? (
            <TabGlobal
              draf={draf}
              grup={modulPerKelompok.GLOBAL}
              pesanPerBaris={pesanPerBaris}
              sedangSimpan={sedangSimpan}
              setDraf={setDraf}
              simpanSatu={simpanSatu}
            />
          ) : (
            <TabKode
              draf={draf}
              grup={modulPerKelompok[tab]}
              pesanPerBaris={pesanPerBaris}
              sedangSimpan={sedangSimpan}
              setDraf={setDraf}
              simpanBarisKode={simpanBarisKode}
            />
          )}
        </>
      )}
    </>
  );
}

type TabGlobalProps = {
  draf         : Record<string, string>;
  grup         : KelompokConfig[];
  pesanPerBaris: Record<string, string>;
  sedangSimpan : Record<string, boolean>;
  setDraf      : (updater: (s: Record<string, string>) => Record<string, string>) => void;
  simpanSatu   : (modul: string, config: string) => void;
};

function TabGlobal({ draf, grup, pesanPerBaris, sedangSimpan, setDraf, simpanSatu }: TabGlobalProps) {

  if (grup.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Belum ada pengaturan Global.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {grup.map((seksi) => (
        <section className="overflow-hidden rounded-2xl border border-border bg-card" key={seksi.modul}>
          <header className="border-b border-border-subtle bg-muted px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {labelModul(seksi.modul)}
            </h2>
          </header>
          <div className="divide-y divide-border-subtle">
            {seksi.items.map((item) => {
              const meta = metaKunci(item.config);
              const kunci = kunciBaris(seksi.modul, item.config);
              const pesan = pesanPerBaris[kunci];

              return (
                <div
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
                  key={item.config}
                >
                  <label
                    className="w-full text-sm font-medium text-foreground sm:w-56 sm:shrink-0"
                    htmlFor={`input-${kunci}`}
                  >
                    {meta.label}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{item.config}</span>
                  </label>

                  <div className="flex flex-1 items-center gap-3">
                    {meta.tipe === "pilihan" ? (
                      <select
                        className="w-full max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs"
                        id={`input-${kunci}`}
                        onChange={(event) =>
                          setDraf((s) => ({ ...s, [kunci]: event.target.value }))
                        }
                        value={draf[kunci] ?? item.nilai}
                      >
                        {(meta.pilihan ?? []).map((pilihan) => (
                          <option key={pilihan} value={pilihan}>
                            {labelPilihan(pilihan)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="w-full max-w-xs rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm text-foreground shadow-xs"
                        id={`input-${kunci}`}
                        onChange={(event) =>
                          setDraf((s) => ({ ...s, [kunci]: event.target.value }))
                        }
                        type="text"
                        value={draf[kunci] ?? item.nilai}
                      />
                    )}

                    <button
                      className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                      disabled={sedangSimpan[kunci] === true}
                      onClick={() => simpanSatu(seksi.modul, item.config)}
                      type="button"
                    >
                      {sedangSimpan[kunci] ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>

                  {pesan && <p className="text-xs text-status-danger-fg sm:basis-full">{pesan}</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

type TabKodeProps = {
  draf           : Record<string, string>;
  grup           : KelompokConfig[];
  pesanPerBaris  : Record<string, string>;
  sedangSimpan   : Record<string, boolean>;
  setDraf        : (updater: (s: Record<string, string>) => Record<string, string>) => void;
  simpanBarisKode: (modul: string) => void;
};

function TabKode({ draf, grup, pesanPerBaris, sedangSimpan, setDraf, simpanBarisKode }: TabKodeProps) {

  if (grup.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Belum ada modul pada kelompok ini.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-160 border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">Modul</th>
            <th className="px-4 py-3">Awalan Kode</th>
            <th className="px-4 py-3">Pakai Tanggal</th>
            <th className="px-4 py-3">Panjang Nomor</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {grup.map((seksi) => {
            const pesan = pesanPerBaris[seksi.modul];

            return (
              <tr key={seksi.modul}>
                <td className="px-4 py-3 align-top font-medium text-foreground">
                  {labelModul(seksi.modul)}
                  {pesan && <p className="mt-1 max-w-xs text-xs font-normal text-status-danger-fg">{pesan}</p>}
                </td>
                <td className="px-4 py-3">
                  <input
                    aria-label={`Awalan Kode ${labelModul(seksi.modul)}`}
                    className="w-28 rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm text-foreground shadow-xs"
                    onChange={(event) =>
                      setDraf((s) => ({ ...s, [kunciBaris(seksi.modul, "AWALAN")]: event.target.value }))
                    }
                    type="text"
                    value={draf[kunciBaris(seksi.modul, "AWALAN")] ?? ""}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    aria-label={`Pakai Tanggal ${labelModul(seksi.modul)}`}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs"
                    onChange={(event) =>
                      setDraf((s) => ({ ...s, [kunciBaris(seksi.modul, "PAKAITANGGAL")]: event.target.value }))
                    }
                    value={draf[kunciBaris(seksi.modul, "PAKAITANGGAL")] ?? "0"}
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    aria-label={`Panjang Nomor ${labelModul(seksi.modul)}`}
                    className="w-20 rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm text-foreground shadow-xs"
                    onChange={(event) =>
                      setDraf((s) => ({ ...s, [kunciBaris(seksi.modul, "PANJANGNOMOR")]: event.target.value }))
                    }
                    type="text"
                    value={draf[kunciBaris(seksi.modul, "PANJANGNOMOR")] ?? ""}
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                    disabled={sedangSimpan[seksi.modul] === true}
                    onClick={() => simpanBarisKode(seksi.modul)}
                    type="button"
                  >
                    {sedangSimpan[seksi.modul] ? "Menyimpan..." : "Simpan"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
