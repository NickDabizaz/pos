"use client";

import { useEffect, useMemo, useState } from "react";

import type { Barang } from "@/app/master/barang/lib/types";
import type { Lokasi } from "@/app/master/lokasi/lib/types";
import type {
  OpnameStokFormErrors,
  OpnameStokFormRow,
  OpnameStokFormValues,
} from "@/app/transaksi/opname-stok/lib/types";
import { validateOpnameStokForm } from "@/app/transaksi/opname-stok/lib/validateOpnameStokForm";
import ComboGrid, { type ComboGridColumn } from "@/components/ComboGrid";
import DatePicker from "@/components/DatePicker";
import { fetchBarangList } from "@/lib/client/barang";
import { fetchLokasiList } from "@/lib/client/lokasi";
import { fetchSaldoStok } from "@/lib/client/opnameStok";

const lokasiColumns: ComboGridColumn<Lokasi>[] = [
  { key: "kodelokasi", label: "Kode", width: "120px" },
  { key: "namalokasi", label: "Nama Lokasi", width: "220px" },
];

const barangColumns: ComboGridColumn<Barang>[] = [
  { key: "kodebarang", label: "Kode", width: "120px" },
  { key: "namabarang", label: "Nama Barang", width: "220px" },
  { key: "satuan", label: "Satuan", width: "100px" },
];

const emptyValues: OpnameStokFormValues = {
  tanggal   : new Date().toISOString().slice(0, 10),
  kodelokasi: "",
  namalokasi: "",
  rows      : [],
};

const barisKosong: OpnameStokFormRow = {
  kodebarang: "",
  namabarang: "",
  satuan    : "",
  jmlsistem : 0,
  jmlfisik  : 0,
};

type OpnameStokFormProps = {
  mode          : "create" | "view" | "edit";
  initialValues?: OpnameStokFormValues;
  onSubmit?     : (values: OpnameStokFormValues) => Promise<void>;
};

export default function OpnameStokForm({ mode, initialValues, onSubmit }: OpnameStokFormProps) {
  const isView = mode === "view";
  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const startingValues = initialValues ?? emptyValues;

  const [tanggal, setTanggal]       = useState(startingValues.tanggal);
  const [kodelokasi, setKodelokasi] = useState(startingValues.kodelokasi);
  const [namalokasi, setNamalokasi] = useState(startingValues.namalokasi);
  const [rows, setRows]             = useState<OpnameStokFormRow[]>(startingValues.rows);
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [errors, setErrors]         = useState<OpnameStokFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRows, setIsLoadingRows] = useState(false);

  const totalSelisih = useMemo(
    () => rows.reduce((total, row) => total + (row.jmlfisik - row.jmlsistem), 0),
    [rows],
  );

  useEffect(() => {
    if (isView) return;

    let isMounted = true;
    Promise.all([fetchLokasiList(), fetchBarangList()]).then(([lokasiData, barangData]) => {
      if (isMounted) {
        setLokasiList(lokasiData);
        setBarangList(barangData);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isView]);

  async function muatSemuaBarang() {
    if (!kodelokasi) {
      setErrors((prev) => ({ ...prev, kodelokasi: "Pilih Lokasi dulu sebelum memuat barang" }));
      return;
    }

    setIsLoadingRows(true);
    setSubmitError(null);

    try {
      const saldo = await fetchSaldoStok(kodelokasi, tanggal);

      setRows(
        saldo.map((item) => ({
          kodebarang: item.kodebarang,
          namabarang: item.namabarang,
          satuan    : item.satuan,
          jmlsistem : item.jmlsistem,
          jmlfisik  : item.jmlsistem,
        })),
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gagal memuat saldo stok");
    } finally {
      setIsLoadingRows(false);
    }
  }

  function tambahBaris() {
    setRows((prev) => [...prev, { ...barisKosong }]);
  }

  function pilihBarang(index: number, barang: Barang | undefined) {
    setRows((prev) =>
      prev.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        if (!barang) return { ...row, kodebarang: "", namabarang: "", satuan: "" };

        return { ...row, kodebarang: barang.kodebarang, namabarang: barang.namabarang, satuan: barang.satuan };
      }),
    );
  }

  function ubahJmlFisik(index: number, nilai: number) {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, jmlfisik: nilai } : row)));
  }

  function hapusBaris(index: number) {
    setRows((prev) => prev.filter((_row, rowIndex) => rowIndex !== index));
  }

  async function handleSubmit() {
    if (!onSubmit) return;

    const candidate: OpnameStokFormValues = { tanggal, kodelokasi, namalokasi, rows };
    const validationErrors = validateOpnameStokForm(candidate);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(candidate);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gagal menyimpan opname stok");
    } finally {
      setIsSubmitting(false);
    }
  }

  const barangTersedia = barangList.filter((barang) => barang.pakaistok && barang.status === 1);

  return (
    <div className="flex flex-col gap-6">
      {submitError && (
        <p className="rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
          {submitError}
        </p>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs ring-1 ring-slate-950/5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Informasi Dokumen</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePicker
            disabled       = {!isCreate}
            label          = "Tanggal"
            onChangeAction = {setTanggal}
            required
            value          = {tanggal}
          />

          <div>
            <ComboGrid
              columns        = {lokasiColumns}
              data           = {isCreate ? lokasiList.filter((lokasi) => lokasi.status === 1) : [{ kodelokasi, namalokasi, keterangan: "", status: 1 }]}
              disabled       = {!isCreate}
              label          = "Lokasi"
              labelKey       = "namalokasi"
              onChangeAction = {(_value, row) => {
                setKodelokasi(row ? row.kodelokasi : "");
                setNamalokasi(row ? row.namalokasi : "");
              }}
              placeholder    = "Cari nama atau kode lokasi..."
              required
              searchKeys     = {["namalokasi", "kodelokasi"]}
              value          = {kodelokasi || undefined}
              valueKey       = "kodelokasi"
            />
            {errors.kodelokasi && <p className="mt-1 text-xs text-status-danger-fg">{errors.kodelokasi}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs ring-1 ring-slate-950/5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Hasil Hitung Fisik</h2>
          {!isView && (
            <button
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
              disabled={isLoadingRows}
              onClick={muatSemuaBarang}
              type="button"
            >
              {isLoadingRows ? "Memuat..." : "Muat Semua Barang"}
            </button>
          )}
        </div>

        <div className="rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-secondary/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="min-w-64 px-2 py-2 text-left">Barang</th>
                  <th className="w-24 px-2 py-2 text-left">Satuan</th>
                  <th className="w-24 px-2 py-2 text-right">Sistem</th>
                  <th className="w-28 px-2 py-2 text-right">Fisik</th>
                  <th className="w-24 px-2 py-2 text-right">Selisih</th>
                  {!isView && <th className="w-10 px-2 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-muted-foreground" colSpan={isView ? 5 : 6}>
                      Belum ada baris barang. Klik &quot;Muat Semua Barang&quot; atau &quot;Tambah Baris&quot;.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const selisih = row.jmlfisik - row.jmlsistem;
                    const dipilih = new Set(rows.filter((_r, i) => i !== index).map((r) => r.kodebarang));

                    return (
                      <tr key={index}>
                        <td className="px-2 py-2">
                          {row.kodebarang ? (
                            <span>
                              <span className="font-medium text-foreground">{row.kodebarang}</span>{" "}
                              <span className="text-muted-foreground">— {row.namabarang}</span>
                            </span>
                          ) : (
                            <ComboGrid
                              columns        = {barangColumns}
                              data           = {barangTersedia.filter((barang) => !dipilih.has(barang.kodebarang))}
                              labelKey       = "namabarang"
                              onChangeAction = {(_value, barang) => pilihBarang(index, barang)}
                              placeholder    = "Cari barang..."
                              searchKeys     = {["namabarang", "kodebarang"]}
                              valueKey       = "kodebarang"
                            />
                          )}
                        </td>
                        <td className="px-2 py-2">{row.satuan}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{row.jmlsistem}</td>
                        <td className="px-2 py-2 text-right">
                          {isView ? (
                            <span className="tabular-nums">{row.jmlfisik}</span>
                          ) : (
                            <input
                              className="w-24 rounded-lg border border-border bg-card px-2 py-1 text-right text-sm tabular-nums"
                              min={0}
                              onChange={(event) => ubahJmlFisik(index, Number(event.target.value))}
                              type="number"
                              value={row.jmlfisik}
                            />
                          )}
                        </td>
                        <td
                          className={`px-2 py-2 text-right tabular-nums ${
                            selisih === 0 ? "text-muted-foreground" : selisih > 0 ? "text-status-active-fg" : "text-status-danger-fg"
                          }`}
                        >
                          {selisih > 0 ? `+${selisih}` : selisih}
                        </td>
                        {!isView && (
                          <td className="px-2 py-2 text-right">
                            <button
                              className="text-xs text-status-danger-fg hover:underline"
                              onClick={() => hapusBaris(index)}
                              type="button"
                            >
                              Hapus
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isView && (
          <button
            className="mt-3 self-start rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            onClick={tambahBaris}
            type="button"
          >
            + Tambah Baris
          </button>
        )}

        {errors.rows && <p className="mt-2 text-xs text-status-danger-fg">{errors.rows}</p>}

        <div className="mt-4 flex justify-end border-t border-border pt-3 text-sm">
          <div className="flex w-56 justify-between font-semibold text-foreground">
            <span>Total Selisih</span>
            <span className="tabular-nums">{totalSelisih > 0 ? `+${totalSelisih}` : totalSelisih}</span>
          </div>
        </div>
      </section>

      {!isView && (
        <div className="flex justify-end">
          <button
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={handleSubmit}
            type="button"
          >
            {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Opname Stok"}
          </button>
        </div>
      )}
    </div>
  );
}
