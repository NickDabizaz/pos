"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { calculateKasSummary } from "@/app/transaksi/kas/lib/calculations";
import { filterKas } from "@/app/transaksi/kas/lib/filterKas";
import type { JenisKas, Kas, KasFilter } from "@/app/transaksi/kas/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import { cancelKas, fetchKasList } from "@/lib/client/kas";
import { fetchLokasiList } from "@/lib/client/lokasi";
import { formatRupiah } from "@/lib/format";
import type { Lokasi } from "@/lib/client/lokasi";

const emptyFilter: KasFilter = {
  query        : "",
  jenis        : "SEMUA",
  kodelokasi   : "SEMUA",
  tanggalDari  : "",
  tanggalSampai: "",
};

const columns: DataTableColumn<Kas>[] = [
  { type: "rowNumber", width: "56px" },
  { key: "kodekas", label: "Kode", width: "170px" },
  { key: "tanggal", label: "Tanggal", width: "120px" },
  {
    key   : "jenis",
    label : "Jenis",
    width : "120px",
    align : "center",
    render: (value) => (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          value === "MASUK"
            ? "border border-status-active-border bg-status-active-bg text-status-active-fg"
            : "border border-status-danger-border bg-status-danger-bg text-status-danger-fg"
        }`}
      >
        {value === "MASUK" ? "Kas Masuk" : "Kas Keluar"}
      </span>
    ),
  },
  { key: "namalokasi", label: "Lokasi", minWidth: "160px", width: "180px" },
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
        {value === "S" ? "Aktif" : "Dibatalkan"}
      </span>
    ),
  },
];

export default function KasPage() {
  const router = useRouter();
  const [items, setItems]                           = useState<Kas[]>([]);
  const [lokasiList, setLokasiList]                 = useState<Lokasi[]>([]);
  const [isLoading, setIsLoading]                   = useState(true);
  const [loadError, setLoadError]                   = useState<string | null>(null);
  const [filter, setFilter]                         = useState<KasFilter>(emptyFilter);
  const [selected, setSelected]                     = useState<Kas | null>(null);
  const [isCancelling, setIsCancelling]             = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [actionError, setActionError]               = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [kasData, lokasiData] = await Promise.all([fetchKasList(), fetchLokasiList()]);

        if (isMounted) {
          setItems(kasData);
          setLokasiList(lokasiData);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat data kas");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => filterKas(items, filter), [items, filter]);
  const summary = useMemo(() => calculateKasSummary(filteredItems), [filteredItems]);

  async function confirmCancel(alasan?: string) {
    if (!selected) return;

    setActionError(null);
    setIsCancelling(true);

    try {
      const updated = await cancelKas(selected.kodekas, alasan);

      setItems((prev) => prev.map((item) => (item.kodekas === updated.kodekas ? updated : item)));
      setSelected(null);
      setIsConfirmingCancel(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal membatalkan kas");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Kas
        </h1>
        <p className="text-sm text-muted-foreground">
          Catatan kas masuk dan kas keluar di luar transaksi penjualan dan pembelian.
        </p>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
          {actionError}
        </p>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-status-active-border bg-status-active-bg p-4">
          <p className="text-xs font-medium text-status-active-fg">Total Kas Masuk</p>
          <p className="mt-1 text-lg font-bold text-status-active-fg">{formatRupiah(summary.totalMasuk)}</p>
        </div>
        <div className="rounded-2xl border border-status-danger-border bg-status-danger-bg p-4">
          <p className="text-xs font-medium text-status-danger-fg">Total Kas Keluar</p>
          <p className="mt-1 text-lg font-bold text-status-danger-fg">{formatRupiah(summary.totalKeluar)}</p>
        </div>
        <div className="rounded-2xl border border-status-info-border bg-status-info-bg p-4">
          <p className="text-xs font-medium text-status-info-fg">Saldo Bersih</p>
          <p className="mt-1 text-lg font-bold text-status-info-fg">{formatRupiah(summary.saldoBersih)}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="query">Cari</label>
          <input
            className="w-56 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs"
            id="query"
            onChange={(event) => setFilter((prev) => ({ ...prev, query: event.target.value }))}
            placeholder="Kode atau keterangan..."
            type="text"
            value={filter.query}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="jenis">Jenis</label>
          <select
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs"
            id="jenis"
            onChange={(event) => setFilter((prev) => ({ ...prev, jenis: event.target.value as JenisKas | "SEMUA" }))}
            value={filter.jenis}
          >
            <option value="SEMUA">Semua</option>
            <option value="MASUK">Kas Masuk</option>
            <option value="KELUAR">Kas Keluar</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="kodelokasi">Lokasi</label>
          <select
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs"
            id="kodelokasi"
            onChange={(event) => setFilter((prev) => ({ ...prev, kodelokasi: event.target.value }))}
            value={filter.kodelokasi}
          >
            <option value="SEMUA">Semua</option>
            {lokasiList.map((lokasi) => (
              <option key={lokasi.kodelokasi} value={lokasi.kodelokasi}>
                {lokasi.namalokasi}
              </option>
            ))}
          </select>
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
            onClick={() => router.push("/transaksi/kas/form")}
            type="button"
          >
            Tambah Kas
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
          emptyMessage          = {isLoading ? "Memuat data..." : "Tidak ada entri kas yang cocok"}
          getRowClassNameAction = {(row) => (row.status === "D" ? "bg-status-danger-bg/40 hover:bg-status-danger-bg/60" : "")}
          onRowClickAction      = {(row) => setSelected(row)}
          onRowDoubleClickAction= {(row) => router.push(`/transaksi/kas/${row.kodekas}`)}
          rowKey                 = "kodekas"
        />
      )}

      {isConfirmingCancel && selected && (
        <ConfirmDialog
          alasan
          confirmLabel   = "Batalkan"
          description    = {`Apakah Anda yakin ingin membatalkan kas ${selected.kodekas}?`}
          isConfirming   = {isCancelling}
          onCancelAction = {() => setIsConfirmingCancel(false)}
          onConfirmAction= {(alasan) => confirmCancel(alasan)}
          title          = "Batalkan Kas"
        />
      )}
    </>
  );
}
