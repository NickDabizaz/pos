"use client";

import { useCallback, useEffect, useState } from "react";

import { labelModul, metaKunci } from "@/app/pengaturan/lib/metaKunci";
import type { KelompokConfig } from "@/app/pengaturan/lib/types";
import { validasiNilai } from "@/app/pengaturan/lib/validasi";
import { fetchPengaturan, updatePengaturan } from "@/lib/client/pengaturan";
import { terapkanTema } from "@/components/TemaApplier";

export default function PengaturanPage() {
  const [kelompok, setKelompok]                           = useState<KelompokConfig[]>([]);
  const [draf, setDraf]                                   = useState<Record<string, string>>({});
  const [isLoading, setIsLoading]                         = useState(true);
  const [loadError, setLoadError]                         = useState<string | null>(null);
  const [pesanPerBaris, setPesanPerBaris]                 = useState<Record<string, string>>({});
  const [sedangSimpan, setSedangSimpan]                   = useState<Record<string, boolean>>({});

  const kunciBaris = (modul: string, config: string) => `${modul}/${config}`;

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

  async function simpan(modul: string, config: string) {
    const kunci = kunciBaris(modul, config);
    const nilai = draf[kunci] ?? "";

    const pesanValidasi = validasiNilai(modul, config, nilai);
    if (pesanValidasi) {
      setPesanPerBaris((sebelumnya) => ({ ...sebelumnya, [kunci]: pesanValidasi }));
      return;
    }

    setSedangSimpan((sebelumnya) => ({ ...sebelumnya, [kunci]: true }));
    setPesanPerBaris((sebelumnya) => {
      const berikutnya = { ...sebelumnya };
      delete berikutnya[kunci];

      return berikutnya;
    });

    try {
      const nilaiBaru = nilai.trim();
      await updatePengaturan(modul, config, nilaiBaru);
      setKelompok((sebelumnya) =>
        sebelumnya.map((grup) =>
          grup.modul === modul
            ? { ...grup, items: grup.items.map((item) => (item.config === config ? { ...item, nilai: nilaiBaru } : item)) }
            : grup,
        ),
      );
      if (config === "tema" && (nilaiBaru === "terang" || nilaiBaru === "gelap")) {
        terapkanTema(nilaiBaru);
      }
    } catch (error) {
      setPesanPerBaris((sebelumnya) => ({
        ...sebelumnya,
        [kunci]: error instanceof Error ? error.message : "Gagal menyimpan pengaturan",
      }));
    } finally {
      setSedangSimpan((sebelumnya) => ({ ...sebelumnya, [kunci]: false }));
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Pengaturan
        </h1>
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
        <div className="flex flex-col gap-6">
          {kelompok.map((grup) => (
            <section
              className="overflow-hidden rounded-2xl border border-border bg-card"
              key={grup.modul}
            >
              <header className="border-b border-border-subtle bg-muted px-5 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {labelModul(grup.modul)}
                </h2>
              </header>
              <div className="divide-y divide-border-subtle">
                {grup.items.map((item) => {
                  const meta = metaKunci(item.config);
                  const kunci = kunciBaris(grup.modul, item.config);
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
                              setDraf((sebelumnya) => ({ ...sebelumnya, [kunci]: event.target.value }))
                            }
                            value={draf[kunci] ?? item.nilai}
                          >
                            {(meta.pilihan ?? []).map((pilihan) => (
                              <option key={pilihan} value={pilihan}>
                                {pilihan}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="w-full max-w-xs rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm text-foreground shadow-xs"
                            id={`input-${kunci}`}
                            onChange={(event) =>
                              setDraf((sebelumnya) => ({ ...sebelumnya, [kunci]: event.target.value }))
                            }
                            type="text"
                            value={draf[kunci] ?? item.nilai}
                          />
                        )}

                        <button
                          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                          disabled={sedangSimpan[kunci] === true}
                          onClick={() => void simpan(grup.modul, item.config)}
                          type="button"
                        >
                          {sedangSimpan[kunci] ? "Menyimpan..." : "Simpan"}
                        </button>
                      </div>

                      {pesan && (
                        <p className="text-xs text-status-danger-fg sm:basis-full">{pesan}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {kelompok.length === 0 && !loadError && (
            <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              Belum ada pengaturan yang tersedia.
            </p>
          )}
        </div>
      )}
    </>
  );
}
