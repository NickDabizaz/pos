"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";

import BarangFormModal from "@/app/modules/master/barang/components/BarangFormModal";
import { filterBarang } from "@/app/modules/master/barang/lib/filterBarang";
import { kategoriOptions } from "@/app/modules/master/barang/lib/kategoriOptions";
import type { Barang } from "@/app/modules/master/barang/lib/types";

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; values: Barang };

type ApiResponse<T> = {
  data   ?: T;
  message : string;
};

async function fetchBarangList(): Promise<Barang[]> {
  const response = await fetch("/api/master/barang", {
    headers: { Accept: "application/json" },
  });
  const json: ApiResponse<Barang[]> = await response.json();

  if (!response.ok) {
    throw new Error(json.message);
  }

  return json.data ?? [];
}

const emptyBarang: Barang = {
  kodebarang: "",
  namabarang: "",
  kategori  : "",
  satuan    : "",
  hargabeli : 0,
  hargajual : 0,
  stok      : 0,
};

const columns: DataTableColumn<Barang>[] = [
  { type: "rowNumber", width: "64px" },
  {
    key  : "kodebarang",
    label: "Kode",
    width: "140px",
  },
  {
    key     : "namabarang",
    label   : "Nama Barang",
    maxWidth: "480px",
    minWidth: "180px",
    width   : "240px",
  },
  {
    key  : "kategori",
    label: "Kategori",
    width: "140px",
  },
  {
    key  : "satuan",
    label: "Satuan",
    width: "100px",
  },
  {
    align : "right",
    format: "currency",
    key   : "hargabeli",
    label : "Harga Beli",
    width : "160px",
  },
  {
    align : "right",
    format: "currency",
    key   : "hargajual",
    label : "Harga Jual",
    width : "160px",
  },
  {
    align : "center",
    format: "quantity",
    key   : "stok",
    label : "Stok",
    width : "90px",
  },
];

export default function MasterBarangPage() {
  const [items, setItems]                   = useState<Barang[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [loadError, setLoadError]           = useState<string | null>(null);
  const [actionError, setActionError]       = useState<string | null>(null);
  const [query, setQuery]                   = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [selected, setSelected]             = useState<Barang | null>(null);
  const [modalState, setModalState]         = useState<ModalState | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      setItems(await fetchBarangList());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Gagal memuat data barang");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialBarang() {
      try {
        const data = await fetchBarangList();

        if (isMounted) {
          setItems(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat data barang");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialBarang();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo(
    () => filterBarang(items, query, kategoriFilter),
    [items, kategoriFilter, query],
  );

  async function handleDelete() {
    if (!selected) return;

    setActionError(null);

    try {
      const response = await fetch(`/api/master/barang/${selected.kodebarang}`, {
        method: "DELETE",
      });
      const json: ApiResponse<never> = await response.json();

      if (!response.ok) {
        throw new Error(json.message);
      }

      setSelected(null);
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menghapus barang");
    }
  }

  async function handleFormSubmit(values: Barang, autoGenerateKode: boolean) {
    const isEdit = modalState?.mode === "edit";
    const url = isEdit
      ? `/api/master/barang/${modalState.values.kodebarang}`
      : "/api/master/barang";
    const response = await fetch(url, {
      method : isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify(isEdit ? values : { ...values, autoGenerateKode }),
    });
    const json: ApiResponse<Barang> = await response.json();

    if (!response.ok) {
      throw new Error(json.message);
    }

    if (isEdit && selected?.kodebarang === modalState.values.kodebarang) {
      setSelected(json.data ?? null);
    }

    setModalState(null);
    await refresh();
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Master Barang
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola data barang: tambah, ubah, dan hapus item.
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
          placeholder="Cari nama atau kode barang..."
          type="text"
          value={query}
        />

        <select
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs"
          onChange={(event) => setKategoriFilter(event.target.value)}
          value={kategoriFilter}
        >
          <option value="">Semua kategori</option>
          {kategoriOptions.map((kategori) => (
            <option key={kategori} value={kategori}>
              {kategori}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-3">
          {selected && (
            <button
              className="rounded-lg border border-status-danger-border bg-status-danger-bg px-4 py-2 text-sm font-medium text-status-danger-fg transition-colors hover:brightness-95"
              onClick={handleDelete}
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
          columns          = {columns}
          data             = {filteredItems}
          emptyMessage     = {isLoading ? "Memuat data..." : "Tidak ada barang yang cocok"}
          onRowClick       = {(row) => setSelected(row)}
          onRowDoubleClick = {(row) => setModalState({ mode: "edit", values: row })}
          rowKey           = "kodebarang"
        />
      )}

      {modalState && (
        <BarangFormModal
          initialValues   = {modalState.mode === "edit" ? modalState.values : emptyBarang}
          kategoriOptions = {kategoriOptions}
          mode            = {modalState.mode}
          onCancel        = {() => setModalState(null)}
          onSubmit        = {handleFormSubmit}
        />
      )}
    </>
  );
}
