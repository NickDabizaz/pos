"use client";

import { useEffect, useMemo, useState } from "react";

import type { JenisKas, KasFormErrors, KasFormValues, KasRincian } from "@/app/transaksi/kas/lib/types";
import { validateKasForm } from "@/app/transaksi/kas/lib/validateKasForm";
import type { Lokasi } from "@/app/master/lokasi/lib/types";
import ComboGrid, { type ComboGridColumn } from "@/components/ComboGrid";
import DatePicker from "@/components/DatePicker";
import Dropdown, { type DropdownOption } from "@/components/Dropdown";
import { fetchLokasiList } from "@/lib/client/lokasi";
import { formatRupiah } from "@/lib/format";

const jenisOptions: DropdownOption<JenisKas>[] = [
  { value: "MASUK", label: "Kas Masuk" },
  { value: "KELUAR", label: "Kas Keluar" },
];

const lokasiColumns: ComboGridColumn<Lokasi>[] = [
  { key: "kodelokasi", label: "Kode", width: "120px" },
  { key: "namalokasi", label: "Nama Lokasi", width: "220px" },
];

const emptyValues: KasFormValues = {
  tanggal   : new Date().toISOString().slice(0, 10),
  jenis     : "MASUK",
  kodelokasi: "",
  namalokasi: "",
  rincian   : [],
};

type KasFormProps = {
  mode          : "create" | "view";
  initialValues?: KasFormValues;
  onSubmit?     : (values: KasFormValues) => Promise<void>;
};

function parseNominal(raw: string): number {
  return Number(raw.replace(/\D/g, "")) || 0;
}

export default function KasForm({ mode, initialValues, onSubmit }: KasFormProps) {
  const isView = mode === "view";
  const startingValues = initialValues ?? emptyValues;

  const [tanggal, setTanggal]           = useState(startingValues.tanggal);
  const [jenis, setJenis]               = useState<JenisKas>(startingValues.jenis);
  const [kodelokasi, setKodelokasi]     = useState(startingValues.kodelokasi);
  const [namalokasi, setNamalokasi]     = useState(startingValues.namalokasi);
  const [rincian, setRincian]           = useState<KasRincian[]>(startingValues.rincian);
  const [lokasiList, setLokasiList]     = useState<Lokasi[]>([]);
  const [errors, setErrors]             = useState<KasFormErrors>({});
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grandtotal = useMemo(() => rincian.reduce((total, item) => total + (item.nominal || 0), 0), [rincian]);

  useEffect(() => {
    if (isView) return;

    let isMounted = true;

    async function loadOptions() {
      const data = await fetchLokasiList();

      if (isMounted) {
        setLokasiList(data);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [isView]);

  function addRincian() {
    setRincian((prev) => [...prev, { keterangan: "", nominal: 0 }]);
  }

  function removeRincian(index: number) {
    setRincian((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRincianKeterangan(index: number, keterangan: string) {
    setRincian((prev) => prev.map((item, i) => (i === index ? { ...item, keterangan } : item)));
  }

  function updateRincianNominal(index: number, raw: string) {
    const nominal = parseNominal(raw);
    setRincian((prev) => prev.map((item, i) => (i === index ? { ...item, nominal } : item)));
  }

  async function handleSubmit() {
    if (!onSubmit) return;

    const candidate: KasFormValues = {
      tanggal,
      jenis,
      kodelokasi,
      namalokasi,
      rincian,
    };

    const validationErrors = validateKasForm(candidate);

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
      setSubmitError(error instanceof Error ? error.message : "Gagal menyimpan kas");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {submitError && (
        <p className="rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
          {submitError}
        </p>
      )}

      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs ring-1 ring-slate-950/5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Informasi Kas</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePicker
            disabled       = {isView}
            label          = "Tanggal"
            onChangeAction = {setTanggal}
            required
            value          = {tanggal}
          />

          <div>
            <Dropdown<JenisKas>
              disabled       = {isView}
              label          = "Jenis"
              onChangeAction = {setJenis}
              options        = {jenisOptions}
              required
              value          = {jenis}
            />
          </div>

          <div className="sm:col-span-2">
            <ComboGrid
              columns        = {lokasiColumns}
              data           = {isView ? [{ kodelokasi, namalokasi, keterangan: "", status: 1 }] : lokasiList.filter((lokasi) => lokasi.status === 1)}
              disabled       = {isView}
              label          = "Lokasi"
              labelKey       = "namalokasi"
              onChangeAction = {(value, row) => {
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
          <h2 className="text-sm font-semibold text-foreground">Rincian</h2>
          {!isView && (
            <button
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              onClick={addRincian}
              type="button"
            >
              + Tambah Baris
            </button>
          )}
        </div>

        {rincian.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
            Belum ada rincian
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rincian.map((item, index) => (
              <div className="flex items-start gap-2" key={index}>
                <div className="flex-1">
                  <input
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                    disabled={isView}
                    onChange={(e) => updateRincianKeterangan(index, e.target.value)}
                    placeholder="Keterangan..."
                    type="text"
                    value={item.keterangan}
                  />
                </div>
                <div className="w-44">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-muted-foreground">
                      Rp
                    </span>
                    <input
                      className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      disabled={isView}
                      onChange={(e) => updateRincianNominal(index, e.target.value)}
                      type="text"
                      value={item.nominal ? item.nominal.toLocaleString("id-ID") : ""}
                    />
                  </div>
                </div>
                {!isView && (
                  <button
                    className="rounded-lg border border-status-danger-border px-2.5 py-2 text-xs font-medium text-status-danger-fg transition-colors hover:bg-status-danger-bg"
                    onClick={() => removeRincian(index)}
                    type="button"
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {errors.rincian && <p className="mt-2 text-xs text-status-danger-fg">{errors.rincian}</p>}

        <div className="mt-4 flex justify-end border-t border-border pt-4 text-sm">
          <div className="flex w-56 justify-between text-base font-bold text-foreground">
            <span>Grand Total</span>
            <span>{formatRupiah(grandtotal)}</span>
          </div>
        </div>
      </section>

      {!isView && (
        <div className="flex justify-end gap-3">
          <button
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={handleSubmit}
            type="button"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Kas"}
          </button>
        </div>
      )}
    </div>
  );
}
