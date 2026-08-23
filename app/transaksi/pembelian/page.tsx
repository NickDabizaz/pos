"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { filterPembelian } from "@/app/transaksi/pembelian/lib/filterPembelian";
import type { PembelianFilter } from "@/app/transaksi/pembelian/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import { cancelPembelian, fetchPembelianList } from "@/lib/client/pembelian";
import type { Pembelian } from "@/lib/server/pembelian/types";

const emptyFilter: PembelianFilter = {
  query        : "",
  tanggalDari  : "",
  tanggalSampai: "",
};

const columns: DataTableColumn<Pembelian>[] = [
  { type: "rowNumber", width: "56px" },
  { key: "kodebeli", label: "Kode", width: "160px" },
  { key: "tanggal", label: "Tanggal", width: "120px" },
  { key: "namasupplier", label: "Supplier", minWidth: "160px", width: "180px" },
  { key: "namalokasi", label: "Lokasi", minWidth: "140px", width: "160px" },
  {
    key   : "total",
    label : "Total",
    width : "130px",
    align : "right",
    format: { type: "currency", decimalPlaces: 0 },
  },
  {
    key   : "ppn",
    label : "PPN",
    width : "120px",
    align : "right",
    format: { type: "currency", decimalPlaces: 0 },
  },
  {
    key   : "diskon",
    label : "Diskon",
    width : "120px",
    align : "right",
    format: { type: "currency", decimalPlaces: 0 },
  },
  {
    key   : "grandtotal",
    label : "Grand Total",
    width : "150px",
    align : "right",
    format: { type: "currency", decimalPlaces: 0 },
  },
  {
    align : "center",
    key   : "status",
    label : "Status",
    width : "110px",
    render: (value) => (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          value === "S"
            ? "border border-status-active-border bg-status-active-bg text-status-active-fg"
            : "border border-status-danger-border bg-status-danger-bg text-status-danger-fg"
        }`}
      >
        <span className={`size-1.5 rounded-full ${value === "S" ? "bg-status-active-dot" : "bg-status-danger-dot"}`} />
        {value === "S" ? "Selesai" : "Dibatalkan"}
      </span>
    ),
  },
];

export default function PembelianPage() {
  const router = useRouter();
  const [items, setItems]                       = useState<Pembelian[]>([]);
  const [isLoading, setIsLoading]                = useState(true);
  const [loadError, setLoadError]                = useState<string | null>(null);
  const [filter, setFilter]                      = useState<PembelianFilter>(emptyFilter);
  const [selected, setSelected]                  = useState<Pembelian | null>(null);
  const [isCancelling, setIsCancelling]          = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [actionError, setActionError]            = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialPembelian() {
      try {
        const data = await fetchPembelianList();

        if (isMounted) {
          setItems(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat data pembelian");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialPembelian();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => filterPembelian(items, filter), [items, filter]);

  async function confirmCancel(alasan?: string) {
    if (!selected) return;

    setActionError(null);
    setIsCancelling(true);

    try {
      const updated = await cancelPembelian(selected.kodebeli, alasan);

      setItems((prev) => prev.map((item) => (item.kodebeli === updated.kodebeli ? updated : item)));
      setSelected(null);
      setIsConfirmingCancel(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal membatalkan pembelian");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Pembelian
        </h1>
        <p className="text-sm text-muted-foreground">
          Riwayat transaksi pembelian barang dari Supplier.
        </p>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
          {actionError}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="query">Cari</label>
          <input
            className="w-56 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs"
            id="query"
            onChange={(event) => setFilter((prev) => ({ ...prev, query: event.target.value }))}
            placeholder="Kode atau nama supplier..."
            type="text"
            value={filter.query}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="tanggalDari">Dari Tanggal</label>
          <input
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs"
            id="tanggalDari"
            onChange={(event) => setFilter((prev) => ({ ...prev, tanggalDari: event.target.value }))}
            type="date"
            value={filter.tanggalDari}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="tanggalSampai">Sampai Tanggal</label>
          <input
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs"
            id="tanggalSampai"
            onChange={(event) => setFilter((prev) => ({ ...prev, tanggalSampai: event.target.value }))}
            type="date"
            value={filter.tanggalSampai}
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {selected && selected.status !== "D" && (
            <button
              className="rounded-lg bg-status-danger-dot px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-90"
              onClick={() => setIsConfirmingCancel(true)}
              type="button"
            >
              Batalkan
            </button>
          )}
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            onClick={() => router.push("/transaksi/pembelian/form")}
            type="button"
          >
            Tambah Pembelian
          </button>
        </div>
      </div>

      {loadError ? (
        <p className="rounded-2xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-sm text-status-danger-fg">
          {loadError}
        </p>
      ) : (
        <DataTable
          columns               = {columns}
          data                  = {filteredItems}
          emptyMessage          = {isLoading ? "Memuat data..." : "Tidak ada transaksi pembelian yang cocok"}
          getRowClassNameAction = {(row) => (row.status === "D" ? "bg-status-danger-bg/40 hover:bg-status-danger-bg/60" : "")}
          onRowClickAction      = {(row) => setSelected(row)}
          onRowDoubleClickAction= {(row) => router.push(`/transaksi/pembelian/${row.kodebeli}`)}
          rowKey                 = "kodebeli"
        />
      )}

      {isConfirmingCancel && selected && (
        <ConfirmDialog
          alasan
          confirmLabel   = "Batalkan"
          description    = {`Apakah Anda yakin ingin membatalkan pembelian ${selected.kodebeli}?`}
          isConfirming   = {isCancelling}
          onCancelAction = {() => setIsConfirmingCancel(false)}
          onConfirmAction= {(alasan) => confirmCancel(alasan)}
          title          = "Batalkan Pembelian"
        />
      )}
    </>
  );
}
