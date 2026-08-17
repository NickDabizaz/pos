"use client";

import { useEffect, useMemo, useState } from "react";

import type { Penjualan, PenjualanFormErrors } from "@/app/penjualan/lib/types";
import { validatePenjualanForm } from "@/app/penjualan/lib/validatePenjualanForm";
import ComboGrid, { type ComboGridColumn } from "@/components/ComboGrid";
import DatePicker from "@/components/DatePicker";
import ItemLinesTable from "@/components/ItemLinesTable";
import { formatRupiah } from "@/lib/format";
import { fetchBarangList } from "@/lib/client/barang";
import { fetchCustomerList } from "@/lib/client/customer";
import type { Barang } from "@/lib/server/barang/types";
import type { Customer } from "@/lib/server/customer/types";
import { calculateHeaderTotals } from "@/lib/server/transaksi/calculations";
import type { TransaksiItem } from "@/lib/server/transaksi/types";

const customerColumns: ComboGridColumn<Customer>[] = [
  { key: "kodecustomer", label: "Kode", width: "120px" },
  { key: "namacustomer", label: "Nama Customer", width: "220px" },
  { key: "telepon", label: "Telepon", width: "150px" },
];

type PenjualanFormProps = {
  initialValues: Penjualan;
  mode         : "create" | "edit";
  onSubmit     : (values: Penjualan) => Promise<void>;
};

export default function PenjualanForm({ initialValues, mode, onSubmit }: PenjualanFormProps) {
  const [tanggal, setTanggal]           = useState(initialValues.tanggal);
  const [kodecustomer, setKodecustomer] = useState(initialValues.kodecustomer);
  const [namacustomer, setNamacustomer] = useState(initialValues.namacustomer);
  const [items, setItems]               = useState<TransaksiItem[]>(initialValues.items);
  const [syncedItems, setSyncedItems]   = useState(initialValues.items);
  const [customers, setCustomers]       = useState<Customer[]>([]);
  const [barangList, setBarangList]     = useState<Barang[]>([]);
  const [errors, setErrors]             = useState<PenjualanFormErrors>({});
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
      const [customerData, barangData] = await Promise.all([fetchCustomerList(), fetchBarangList()]);

      if (isMounted) {
        setCustomers(customerData);
        setBarangList(barangData);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit() {
    const candidate: Penjualan = {
      ...initialValues,
      tanggal,
      kodecustomer,
      namacustomer,
      items,
      ...totals,
    };

    const validationErrors = validatePenjualanForm(candidate);

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
      setSubmitError(error instanceof Error ? error.message : "Gagal menyimpan penjualan");
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
          <div className="flex items-center gap-2">
            {mode === "edit" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {initialValues.jenistransaksi === "POS" ? "Jenis Transaksi: POS" : "Jenis Transaksi: Penjualan Pesanan"}
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

          <div className="sm:col-span-2">
            <ComboGrid
              columns        = {customerColumns}
              data           = {customers.filter((customer) => customer.status === 1)}
              label          = "Customer"
              labelKey       = "namacustomer"
              onChangeAction = {(value, row) => {
                setKodecustomer(row ? row.kodecustomer : "");
                setNamacustomer(row ? row.namacustomer : "");
              }}
              placeholder    = "Cari nama atau kode customer..."
              required
              searchKeys     = {["namacustomer", "kodecustomer", "telepon"]}
              value          = {kodecustomer || undefined}
              valueKey       = "kodecustomer"
            />
            {errors.kodecustomer && <p className="mt-1 text-xs text-status-danger-fg">{errors.kodecustomer}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs ring-1 ring-slate-950/5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Daftar Barang</h2>
        <ItemLinesTable
          barangList     = {barangList}
          items          = {items}
          onChangeAction = {setItems}
          priceField     = "hargajual"
          priceLabel     = "Harga Jual"
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
          {isSubmitting ? "Menyimpan..." : "Simpan Penjualan"}
        </button>
      </div>
    </div>
  );
}
