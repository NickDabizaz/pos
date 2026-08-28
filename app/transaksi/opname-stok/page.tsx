"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { filterOpnameStok } from "@/app/transaksi/opname-stok/lib/filterOpnameStok";
import type { OpnameStokFilter } from "@/app/transaksi/opname-stok/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import { cancelOpnameStok, fetchOpnameStokList } from "@/lib/client/opnameStok";
import type { OpnameStok } from "@/lib/server/opnamestok/types";

const emptyFilter: OpnameStokFilter = {
  query        : "",
  tanggalDari  : "",
  tanggalSampai: "",
  status       : "SEMUA",
};

const columns: DataTableColumn<OpnameStok>[] = [
  { type: "rowNumber", width: "56px" },
  { key: "kodeopname", label: "Kode", width: "160px" },
  { key: "tanggal", label: "Tanggal", width: "120px" },
  { key: "namalokasi", label: "Lokasi", minWidth: "160px", width: "200px" },
  {
    key   : "items",
    label : "Jumlah Barang",
    width : "130px",
    align : "right",
    render: (value) => (Array.isArray(value) ? value.length : 0),
  },
  {
    align : "center",
    key   : "status",
    label : "Status",
    width : "120px",
    render: (value) => (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          value === "S"
            ? "border border-status-active-border bg-status-active-bg text-status-active-fg"
            : "border border-status-danger-border bg-status-danger-bg text-status-danger-fg"
        }`}
      >
        <span className={`size-1.5 rounded-full ${value === "S" ? "bg-status-active-dot" : "bg-status-danger-dot"}`} />
        {value === "S" ? "Tersimpan" : "Dibatalkan"}
      </span>
    ),
  },
];

export default function OpnameStokPage() {
  const router = useRouter();
  const [items, setItems]                 = useState<OpnameStok[]>([]);
  const [isLoading, setIsLoading]          = useState(true);
  const [loadError, setLoadError]          = useState<string | null>(null);
  const [filter, setFilter]               = useState<OpnameStokFilter>(emptyFilter);
  const [selected, setSelected]            = useState<OpnameStok | null>(null);
  const [isCancelling, setIsCancelling]    = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [actionError, setActionError]      = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchOpnameStokList()
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch((error) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : "Gagal memuat data opname stok");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => filterOpnameStok(items, filter), [items, filter]);

  async function confirmCancel(alasan?: string) {
    if (!selected) return;

    setActionError(null);
    setIsCancelling(true);

    try {
      const updated = await cancelOpnameStok(selected.kodeopname, alasan);

      setItems((prev) => prev.map((item) => (item.kodeopname === updated.kodeopname ? updated : item)));
      setSelected(null);
      setIsConfirmingCancel(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal membatalkan opname stok");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Opname Stok</h1>
        <p className="text-sm text-muted-foreground">
          Dokumen hasil hitung fisik barang, dibandingkan dengan saldo menurut Kartu Stok.
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
            placeholder="Kode atau nama lokasi..."
            type="text"
            value={filter.query}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="status">Status</label>
          <select
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs"
            id="status"
            onChange={(event) => setFilter((prev) => ({ ...prev, status: event.target.value as OpnameStokFilter["status"] }))}
            value={filter.status}
          >
            <option value="SEMUA">Semua</option>
            <option value="S">Tersimpan</option>
            <option value="D">Dibatalkan</option>
          </select>
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
            onClick={() => router.push("/transaksi/opname-stok/form")}
            type="button"
          >
            Tambah Opname Stok
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
          emptyMessage          = {isLoading ? "Memuat data..." : "Tidak ada dokumen opname stok yang cocok"}
          getRowClassNameAction = {(row) => (row.status === "D" ? "bg-status-danger-bg/40 hover:bg-status-danger-bg/60" : "")}
          onRowClickAction      = {(row) => setSelected(row)}
          onRowDoubleClickAction= {(row) => router.push(`/transaksi/opname-stok/${row.kodeopname}`)}
          rowKey                 = "kodeopname"
        />
      )}

      {isConfirmingCancel && selected && (
        <ConfirmDialog
          alasan
          confirmLabel   = "Batalkan"
          description    = {`Apakah Anda yakin ingin membatalkan opname stok ${selected.kodeopname}?`}
          isConfirming   = {isCancelling}
          onCancelAction = {() => setIsConfirmingCancel(false)}
          onConfirmAction= {(alasan) => confirmCancel(alasan)}
          title          = "Batalkan Opname Stok"
        />
      )}
    </>
  );
}
