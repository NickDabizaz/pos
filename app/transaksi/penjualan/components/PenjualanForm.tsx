"use client";

import { useEffect, useMemo, useState } from "react";

import type { PenjualanFormErrors, PenjualanFormValues } from "@/app/transaksi/penjualan/lib/types";
import { validatePenjualanForm } from "@/app/transaksi/penjualan/lib/validatePenjualanForm";
import type { Lokasi } from "@/app/master/lokasi/lib/types";
import ComboGrid, { type ComboGridColumn } from "@/components/ComboGrid";
import DatePicker from "@/components/DatePicker";
import ItemLinesTable from "@/components/ItemLinesTable";
import { fetchBarangList } from "@/lib/client/barang";
import { fetchCustomerList } from "@/lib/client/customer";
import { fetchLokasiList } from "@/lib/client/lokasi";
import { formatRupiah } from "@/lib/format";
import type { Barang } from "@/lib/server/barang/types";
import type { Customer } from "@/lib/server/customer/types";
import { calculateHeaderTotals } from "@/lib/server/transaksi/calculations";
import type { TransaksiItem } from "@/lib/server/transaksi/types";

const customerColumns: ComboGridColumn<Customer>[] = [
  { key: "kodecustomer", label: "Kode", width: "120px" },
  { key: "namacustomer", label: "Nama Customer", width: "220px" },
  { key: "telepon", label: "Telepon", width: "150px" },
];

const lokasiColumns: ComboGridColumn<Lokasi>[] = [
  { key: "kodelokasi", label: "Kode", width: "120px" },
  { key: "namalokasi", label: "Nama Lokasi", width: "220px" },
];

const emptyValues: PenjualanFormValues = {
  tanggal     : new Date().toISOString().slice(0, 10),
  kodecustomer: "",
  namacustomer: "",
  kodelokasi  : "",
  namalokasi  : "",
  items       : [],
};

type PenjualanFormProps = {
  mode          : "create" | "view";
  initialValues?: PenjualanFormValues;
  onSubmit?     : (values: PenjualanFormValues) => Promise<void>;
};

export default function PenjualanForm({ mode, initialValues, onSubmit }: PenjualanFormProps) {
  const isView = mode === "view";
  const startingValues = initialValues ?? emptyValues;

  const [tanggal, setTanggal]           = useState(startingValues.tanggal);
  const [kodecustomer, setKodecustomer] = useState(startingValues.kodecustomer);
  const [namacustomer, setNamacustomer] = useState(startingValues.namacustomer);
  const [kodelokasi, setKodelokasi]     = useState(startingValues.kodelokasi);
  const [namalokasi, setNamalokasi]     = useState(startingValues.namalokasi);
  const [items, setItems]               = useState<TransaksiItem[]>(startingValues.items);
  const [customers, setCustomers]       = useState<Customer[]>([]);
  const [lokasiList, setLokasiList]     = useState<Lokasi[]>([]);
  const [barangList, setBarangList]     = useState<Barang[]>([]);
  const [errors, setErrors]             = useState<PenjualanFormErrors>({});
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = useMemo(() => calculateHeaderTotals(items), [items]);

  useEffect(() => {
    if (isView) return;

    let isMounted = true;

    async function loadOptions() {
      const [customerData, lokasiData, barangData] = await Promise.all([
        fetchCustomerList(),
        fetchLokasiList(),
        fetchBarangList(),
      ]);

      if (isMounted) {
        setCustomers(customerData);
        setLokasiList(lokasiData);
        setBarangList(barangData);
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [isView]);

  async function handleSubmit() {
    if (!onSubmit) return;

    const candidate: PenjualanFormValues = {
      tanggal,
      kodecustomer,
      namacustomer,
      kodelokasi,
      namalokasi,
      items,
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
        <h2 className="mb-4 text-sm font-semibold text-foreground">Informasi Transaksi</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePicker
            disabled       = {isView}
            label          = "Tanggal"
            onChangeAction = {setTanggal}
            required
            value          = {tanggal}
          />

          <div>
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

          <div className="sm:col-span-2">
            <ComboGrid
              columns        = {customerColumns}
              data           = {isView ? [{ idcustomer: 0, kodecustomer, namacustomer, telepon: null, email: null, alamat: null, status: 1 }] : customers.filter((customer) => customer.status === 1)}
              disabled       = {isView}
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
        <div className={isView ? "pointer-events-none opacity-75" : undefined}>
          <ItemLinesTable
            barangList     = {barangList}
            items          = {items}
            onChangeAction = {isView ? () => {} : setItems}
            priceField     = "hargajual"
            priceLabel     = "Harga Jual"
          />
        </div>
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

      {!isView && (
        <div className="flex justify-end gap-3">
          <button
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={handleSubmit}
            type="button"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Penjualan"}
          </button>
        </div>
      )}
    </div>
  );
}
