"use client";

import { useEffect, useMemo, useState } from "react";

import type { Pembelian, PembelianFormErrors } from "@/app/pembelian/lib/types";
import { validatePembelianForm } from "@/app/pembelian/lib/validatePembelianForm";
import ComboGrid, { type ComboGridColumn } from "@/components/ComboGrid";
import DatePicker from "@/components/DatePicker";
import ItemLinesTable from "@/components/ItemLinesTable";
import { formatRupiah } from "@/lib/format";
import { fetchBarangList } from "@/lib/client/barang";
import { fetchSupplierList } from "@/lib/client/supplier";
import type { Barang } from "@/lib/server/barang/types";
import type { Supplier } from "@/lib/server/supplier/types";
import { calculateHeaderTotals } from "@/lib/server/transaksi/calculations";
import type { TransaksiItem } from "@/lib/server/transaksi/types";

const supplierColumns: ComboGridColumn<Supplier>[] = [
  { key: "kodesupplier", label: "Kode", width: "120px" },
  { key: "namasupplier", label: "Nama Supplier", width: "220px" },
  { key: "telepon", label: "Telepon", width: "150px" },
];

type PembelianFormProps = {
  initialValues: Pembelian;
  mode         : "create" | "edit";
  onSubmit     : (values: Pembelian) => Promise<void>;
};

export default function PembelianForm({ initialValues, mode, onSubmit }: PembelianFormProps) {
  const [tanggal, setTanggal]           = useState(initialValues.tanggal);
  const [kodesupplier, setKodesupplier] = useState(initialValues.kodesupplier);
  const [namasupplier, setNamasupplier] = useState(initialValues.namasupplier);
  const [items, setItems]               = useState<TransaksiItem[]>(initialValues.items);
  const [syncedItems, setSyncedItems]   = useState(initialValues.items);
  const [suppliers, setSuppliers]       = useState<Supplier[]>([]);
  const [barangList, setBarangList]     = useState<Barang[]>([]);
  const [errors, setErrors]             = useState<PembelianFormErrors>({});
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = useMemo(() => calculateHeaderTotals(items), [items]);
  const isCancelled = mode === "edit" && initialValues.status === "D";

  if (initialValues.items !== syncedItems) {
    setSyncedItems(initialValues.items);
    setItems(initialValues.items);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      const [supplierData, barangData] = await Promise.all([fetchSupplierList(), fetchBarangList()]);

      if (isMounted) {
        setSuppliers(supplierData);
        setBarangList(barangData);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit() {
    const candidate: Pembelian = {
      ...initialValues,
      tanggal,
      kodesupplier,
      namasupplier,
      items,
      ...totals,
    };

    const validationErrors = validatePembelianForm(candidate);

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
      setSubmitError(error instanceof Error ? error.message : "Gagal menyimpan pembelian");
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
          <h2 className="text-sm font-semibold text-foreground">Informasi Transaksi</h2>
          {isCancelled && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-danger-border bg-status-danger-bg px-2.5 py-0.5 text-xs font-medium text-status-danger-fg">
              <span className="size-1.5 rounded-full bg-status-danger-dot" />
              Dibatalkan
            </span>
          )}
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

          <div className="sm:col-span-2">
            <ComboGrid
              columns        = {supplierColumns}
              data           = {suppliers.filter((supplier) => supplier.status === 1)}
              label          = "Supplier"
              labelKey       = "namasupplier"
              onChangeAction = {(value, row) => {
                setKodesupplier(row ? row.kodesupplier : "");
                setNamasupplier(row ? row.namasupplier : "");
              }}
              placeholder    = "Cari nama atau kode supplier..."
              required
              searchKeys     = {["namasupplier", "kodesupplier", "telepon"]}
              value          = {kodesupplier || undefined}
              valueKey       = "kodesupplier"
            />
            {errors.kodesupplier && <p className="mt-1 text-xs text-status-danger-fg">{errors.kodesupplier}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs ring-1 ring-slate-950/5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Daftar Barang</h2>
        <ItemLinesTable
          barangList     = {barangList}
          items          = {items}
          onChangeAction = {setItems}
          priceField     = "hargabeli"
          priceLabel     = "Harga Beli"
        />
        {errors.items && <p className="mt-2 text-xs text-status-danger-fg">{errors.items}</p>}

        <div className="mt-4 flex flex-col items-end gap-1 border-t border-border pt-4 text-sm">
          <div className="flex w-56 justify-between text-muted-foreground">
            <span>Total</span>
            <span className="font-medium text-foreground">{formatRupiah(totals.total)}</span>
          </div>
          <div className="flex w-56 justify-between text-muted-foreground">
            <span>Diskon</span>
            <span className="font-medium text-foreground">-{formatRupiah(totals.diskon)}</span>
          </div>
          <div className="flex w-56 justify-between text-muted-foreground">
            <span>PPN</span>
            <span className="font-medium text-foreground">{formatRupiah(totals.ppn)}</span>
          </div>
          <div className="flex w-56 justify-between border-t border-border pt-1 text-base font-bold text-foreground">
            <span>Grand Total</span>
            <span>{formatRupiah(totals.grandtotal)}</span>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || isCancelled}
          onClick={handleSubmit}
          title={isCancelled ? "Transaksi yang sudah dibatalkan tidak dapat diubah" : undefined}
          type="button"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Pembelian"}
        </button>
      </div>
    </div>
  );
}
