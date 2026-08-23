"use client";

import { useEffect, useMemo, useState } from "react";

import type { PembelianFormErrors, PembelianFormValues } from "@/app/transaksi/pembelian/lib/types";
import { validatePembelianForm } from "@/app/transaksi/pembelian/lib/validatePembelianForm";
import type { Lokasi } from "@/app/master/lokasi/lib/types";
import type { Supplier } from "@/app/master/supplier/lib/types";
import ComboGrid, { type ComboGridColumn } from "@/components/ComboGrid";
import DatePicker from "@/components/DatePicker";
import ItemLinesTable from "@/components/ItemLinesTable";
import { fetchBarangList } from "@/lib/client/barang";
import { fetchLokasiList } from "@/lib/client/lokasi";
import { fetchSupplierList } from "@/lib/client/supplier";
import { formatRupiah } from "@/lib/format";
import type { Barang } from "@/lib/server/barang/types";
import { calculateHeaderTotals } from "@/lib/server/transaksi/calculations";
import type { TransaksiItem } from "@/lib/server/transaksi/types";

const supplierColumns: ComboGridColumn<Supplier>[] = [
  { key: "kodesupplier", label: "Kode", width: "120px" },
  { key: "namasupplier", label: "Nama Supplier", width: "220px" },
  { key: "telepon", label: "Telepon", width: "150px" },
];

const lokasiColumns: ComboGridColumn<Lokasi>[] = [
  { key: "kodelokasi", label: "Kode", width: "120px" },
  { key: "namalokasi", label: "Nama Lokasi", width: "220px" },
];

const emptyValues: PembelianFormValues = {
  tanggal     : new Date().toISOString().slice(0, 10),
  kodesupplier: "",
  namasupplier: "",
  kodelokasi  : "",
  namalokasi  : "",
  items       : [],
};

type PembelianFormProps = {
  mode          : "create" | "view";
  initialValues?: PembelianFormValues;
  onSubmit?     : (values: PembelianFormValues) => Promise<void>;
};

export default function PembelianForm({ mode, initialValues, onSubmit }: PembelianFormProps) {
  const isView = mode === "view";
  const startingValues = initialValues ?? emptyValues;

  const [tanggal, setTanggal]           = useState(startingValues.tanggal);
  const [kodesupplier, setKodesupplier] = useState(startingValues.kodesupplier);
  const [namasupplier, setNamasupplier] = useState(startingValues.namasupplier);
  const [kodelokasi, setKodelokasi]     = useState(startingValues.kodelokasi);
  const [namalokasi, setNamalokasi]     = useState(startingValues.namalokasi);
  const [items, setItems]               = useState<TransaksiItem[]>(startingValues.items);
  const [suppliers, setSuppliers]       = useState<Supplier[]>([]);
  const [lokasiList, setLokasiList]     = useState<Lokasi[]>([]);
  const [barangList, setBarangList]     = useState<Barang[]>([]);
  const [errors, setErrors]             = useState<PembelianFormErrors>({});
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = useMemo(() => calculateHeaderTotals(items), [items]);

  useEffect(() => {
    if (isView) return;

    let isMounted = true;

    async function loadOptions() {
      const [supplierData, lokasiData, barangData] = await Promise.all([
        fetchSupplierList(),
        fetchLokasiList(),
        fetchBarangList(),
      ]);

      if (isMounted) {
        setSuppliers(supplierData);
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

    const candidate: PembelianFormValues = {
      tanggal,
      kodesupplier,
      namasupplier,
      kodelokasi,
      namalokasi,
      items,
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
              columns        = {supplierColumns}
              data           = {isView ? [{ idsupplier: 0, kodesupplier, namasupplier, kontakperson: "", telepon: "", email: "", alamat: "", status: 1 }] : suppliers.filter((supplier) => supplier.status === 1)}
              disabled       = {isView}
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
        <div className={isView ? "pointer-events-none opacity-75" : undefined}>
          <ItemLinesTable
            barangList     = {barangList}
            items          = {items}
            onChangeAction = {isView ? () => {} : setItems}
            priceField     = "hargabeli"
            priceLabel     = "Harga Beli"
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
            {isSubmitting ? "Menyimpan..." : "Simpan Pembelian"}
          </button>
        </div>
      )}
    </div>
  );
}
