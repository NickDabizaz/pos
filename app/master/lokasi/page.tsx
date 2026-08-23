"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";

import LokasiFormModal from "@/app/master/lokasi/components/LokasiFormModal";
import { filterLokasi } from "@/app/master/lokasi/lib/filterLokasi";
import type { Lokasi } from "@/app/master/lokasi/lib/types";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  createLokasi,
  deleteLokasi,
  fetchLokasiList,
  updateLokasi,
} from "@/lib/client/lokasi";

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; values: Lokasi };

const emptyLokasi: Lokasi = {
  kodelokasi: "",
  namalokasi: "",
  keterangan: "",
  status    : 1,
};

const columns: DataTableColumn<Lokasi>[] = [
  { type: "rowNumber", width: "64px" },
  {
    key  : "kodelokasi",
    label: "Kode",
    width: "140px",
  },
  {
    key     : "namalokasi",
    label   : "Nama Lokasi",
    maxWidth: "380px",
    minWidth: "180px",
    width   : "260px",
  },
  {
    key     : "keterangan",
    label   : "Keterangan",
    maxWidth: "480px",
    minWidth: "200px",
    width   : "300px",
  },
  {
    align : "center",
    key   : "status",
    label : "Status",
    render: (value) => (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          value === 1
            ? "border border-status-active-border bg-status-active-bg text-status-active-fg"
            : "border border-status-danger-border bg-status-danger-bg text-status-danger-fg"
        }`}
      >
        <span className={`size-1.5 rounded-full ${value === 1 ? "bg-status-active-dot" : "bg-status-danger-dot"}`} />
        {value === 1 ? "Aktif" : "Nonaktif"}
      </span>
    ),
    width: "110px",
  },
];

export default function MasterLokasiPage() {
  const [items, setItems]                           = useState<Lokasi[]>([]);
  const [isLoading, setIsLoading]                   = useState(true);
  const [loadError, setLoadError]                   = useState<string | null>(null);
  const [actionError, setActionError]               = useState<string | null>(null);
  const [query, setQuery]                           = useState("");
  const [selected, setSelected]                     = useState<Lokasi | null>(null);
  const [modalState, setModalState]                 = useState<ModalState | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting]                 = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      setItems(await fetchLokasiList());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Gagal memuat data lokasi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialLokasi() {
      try {
        const data = await fetchLokasiList();

        if (isMounted) {
          setItems(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat data lokasi");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialLokasi();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => filterLokasi(items, query), [items, query]);

  async function confirmDelete() {
    if (!selected) return;

    setActionError(null);
    setIsDeleting(true);

    try {
      await deleteLokasi(selected.kodelokasi);

      setSelected(null);
      setIsConfirmingDelete(false);
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menghapus lokasi");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleFormSubmit(values: Lokasi) {
    const isEdit = modalState?.mode === "edit";

    try {
      const result = isEdit
        ? await updateLokasi(modalState.values.kodelokasi, values)
        : await createLokasi(values);

      if (isEdit && selected?.kodelokasi === modalState.values.kodelokasi) {
        setSelected(result);
      }

      setModalState(null);
      await refresh();
    } catch (error) {
      throw error;
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Master Lokasi
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola data toko, gudang penyimpanan, dan rak barang.
        </p>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
          {actionError}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="w-full max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama lokasi, kode..."
          type="text"
          value={query}
        />

        <div className="ml-auto flex items-center gap-3">
          {selected && (
            <button
              className="rounded-lg bg-status-danger-dot px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-90"
              onClick={() => setIsConfirmingDelete(true)}
              type="button"
            >
              Hapus
            </button>
          )}
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            onClick={() => setModalState({ mode: "create" })}
            type="button"
          >
            Tambah
          </button>
        </div>
      </div>

      {loadError ? (
        <p className="rounded-2xl border border-status-danger-border bg-status-danger-bg px-4 py-3 text-sm text-status-danger-fg">
          {loadError}
        </p>
      ) : (
        <DataTable
          columns                = {columns}
          data                   = {filteredItems}
          emptyMessage           = {isLoading ? "Memuat data..." : "Tidak ada lokasi yang cocok"}
          onRowClickAction       = {(row) => setSelected(row)}
          onRowDoubleClickAction = {(row) => setModalState({ mode: "edit", values: row })}
          rowKey                 = "kodelokasi"
        />
      )}

      {modalState && (
        <LokasiFormModal
          initialValues = {modalState.mode === "edit" ? modalState.values : emptyLokasi}
          mode          = {modalState.mode}
          onCancel      = {() => setModalState(null)}
          onSubmit      = {handleFormSubmit}
        />
      )}

      {isConfirmingDelete && selected && (
        <ConfirmDialog
          confirmLabel   = "Hapus"
          description    = {`Apakah Anda yakin ingin menghapus lokasi ${selected.namalokasi}? Tindakan ini tidak dapat dibatalkan.`}
          isConfirming   = {isDeleting}
          onCancelAction = {() => setIsConfirmingDelete(false)}
          onConfirmAction= {confirmDelete}
          title          = "Hapus Lokasi"
        />
      )}
    </>
  );
}
