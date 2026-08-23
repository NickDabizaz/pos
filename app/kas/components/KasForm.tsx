"use client";

import { useEffect, useMemo, useState } from "react";

import type { JenisKas, Kas, KasFormErrors } from "@/app/kas/lib/types";
import { validateKasForm } from "@/app/kas/lib/validateKasForm";
import DatePicker from "@/components/DatePicker";
import Dropdown, { type DropdownOption } from "@/components/Dropdown";
import { fetchLokasiList } from "@/lib/client/lokasi";
import { formatRupiah } from "@/lib/format";
import type { Lokasi } from "@/lib/client/lokasi";

const jenisOptions: DropdownOption<JenisKas>[] = [
  { value: "MASUK", label: "Kas Masuk" },
  { value: "KELUAR", label: "Kas Keluar" },
];

type KasFormProps = {
  initialValues: Kas;
  mode         : "create" | "edit";
  onSubmit     : (values: Kas) => Promise<void>;
};

export default function KasForm({ initialValues, mode, onSubmit }: KasFormProps) {
  const [tanggal, setTanggal]         = useState(initialValues.tanggal);
  const [jenis, setJenis]             = useState<JenisKas>(initialValues.jenis);
  const [kodelokasi, setKodelokasi]   = useState(initialValues.kodelokasi);
  const [nominalInput, setNominalInput] = useState(initialValues.nominal ? String(initialValues.nominal) : "");
  const [keterangan, setKeterangan]   = useState(initialValues.keterangan);
  const [lokasiList, setLokasiList]   = useState<Lokasi[]>([]);
  const [errors, setErrors]           = useState<KasFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCancelled = mode === "edit" && initialValues.status === "D";
  const nominal = Number(nominalInput.replace(/\D/g, "")) || 0;

  const lokasiOptions = useMemo<DropdownOption[]>(
    () =>
      lokasiList
        .filter((lokasi) => lokasi.status === 1)
        .map((lokasi) => ({ value: lokasi.kodelokasi, label: lokasi.namalokasi })),
    [lokasiList],
  );

  useEffect(() => {
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
  }, []);

  async function handleSubmit() {
    const selectedLokasi = lokasiList.find((lokasi) => lokasi.kodelokasi === kodelokasi);

    const candidate: Kas = {
      ...initialValues,
      tanggal,
      jenis,
      kodelokasi,
      namalokasi: selectedLokasi ? selectedLokasi.namalokasi : initialValues.namalokasi,
      nominal,
      keterangan,
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Informasi Kas</h2>
          <div className="flex items-center gap-2">
            {mode === "edit" && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  initialValues.jenis === "MASUK"
                    ? "border-status-active-border bg-status-active-bg text-status-active-fg"
                    : "border-status-danger-border bg-status-danger-bg text-status-danger-fg"
                }`}
              >
                {initialValues.jenis === "MASUK" ? "Kas Masuk" : "Kas Keluar"}
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger-border bg-status-danger-bg px-2.5 py-0.5 text-xs font-medium text-status-danger-fg">
                <span className="size-1.5 rounded-full bg-status-danger-dot" />
                Dibatalkan
              </span>
            )}
          </div>
        </div>

        {isCancelled && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-status-danger-border bg-status-danger-bg/70 px-3.5 py-2.5">
            <svg className="mt-0.5 size-4 shrink-0 text-status-danger-fg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5l5 5m0-5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-status-danger-fg">
              <span className="font-semibold">Alasan pembatalan:</span>{" "}
              {initialValues.alasanBatal || "Tidak ada alasan yang dicatat."}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePicker
            label          = "Tanggal"
            onChangeAction = {setTanggal}
            required
            value          = {tanggal}
          />

          <div>
            <Dropdown<JenisKas>
              disabled       = {mode === "edit"}
              label          = "Jenis"
              onChangeAction = {setJenis}
              options        = {jenisOptions}
              required
              value          = {jenis}
            />
          </div>

          <div>
            <Dropdown
              label          = "Lokasi"
              onChangeAction = {setKodelokasi}
              options        = {lokasiOptions}
              placeholder    = "Pilih lokasi..."
              required
              value          = {kodelokasi || undefined}
            />
            {errors.kodelokasi && <p className="mt-1 text-xs text-status-danger-fg">{errors.kodelokasi}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="nominal">
              Nominal
              <span className="text-status-danger-fg"> *</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-muted-foreground">
                Rp
              </span>
              <input
                className="w-full rounded-lg border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                id="nominal"
                onChange={(e) => setNominalInput(e.target.value.replace(/\D/g, ""))}
                type="text"
                value={nominal ? nominal.toLocaleString("id-ID") : ""}
              />
            </div>
            {errors.nominal && <p className="mt-1 text-xs text-status-danger-fg">{errors.nominal}</p>}
            {nominal > 0 && <p className="mt-1 text-xs text-muted-foreground">{formatRupiah(nominal)}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="keterangan">
              Keterangan
              <span className="text-status-danger-fg"> *</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              id="keterangan"
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Jelaskan keperluan kas ini..."
              rows={3}
              value={keterangan}
            />
            {errors.keterangan && <p className="mt-1 text-xs text-status-danger-fg">{errors.keterangan}</p>}
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || isCancelled}
          onClick={handleSubmit}
          title={isCancelled ? "Kas yang sudah dibatalkan tidak dapat diubah" : undefined}
          type="button"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Kas"}
        </button>
      </div>
    </div>
  );
}
