"use client";

import { useCallback, useEffect, useState } from "react";

import DataTable, { type DataTableColumn } from "@/components/DataTable";
import ConfirmDialog from "@/components/ConfirmDialog";

import HakMenuModal from "@/app/manajemen-user/components/HakMenuModal";
import InvitationModal from "@/app/manajemen-user/components/InvitationModal";
import type { Anggota } from "@/app/manajemen-user/lib/types";
import {
  cabutStatusOwner,
  fetchAnggotaList,
  keluarkanAnggota,
} from "@/lib/client/manajemenUser";

type ConfirmState = { action: "keluarkan" | "cabut-owner"; anggota: Anggota } | null;

const columns: DataTableColumn<Anggota>[] = [
  { type: "rowNumber", width: "64px" },
  {
    key     : "name",
    label   : "Nama",
    maxWidth: "320px",
    minWidth: "160px",
    width   : "220px",
  },
  {
    key     : "email",
    label   : "Email",
    maxWidth: "360px",
    minWidth: "200px",
    width   : "260px",
  },
  {
    align : "center",
    key   : "isowner",
    label : "Status",
    render: (value) => (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          value
            ? "border border-status-active-border bg-status-active-bg text-status-active-fg"
            : "border border-border bg-secondary text-muted-foreground"
        }`}
      >
        <span className={`size-1.5 rounded-full ${value ? "bg-status-active-dot" : "bg-slate-400"}`} />
        {value ? "Owner" : "Anggota"}
      </span>
    ),
    width: "120px",
  },
  {
    align : "center",
    key   : "kodemenuAktif",
    label : "Hak Menu",
    render: (value, row) => (row.isowner ? "Selalu aktif" : `${(value as string[]).length} menu`),
    width : "140px",
  },
];

export default function ManajemenUserPage() {
  const [items, setItems]             = useState<Anggota[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selected, setSelected]       = useState<Anggota | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [hakMenuTarget, setHakMenuTarget] = useState<Anggota | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await fetchAnggotaList();
      setItems(data);

      setSelected((current) => (current ? data.find((row) => row.iduser === current.iduser) ?? null : null));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Gagal memuat data anggota");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialAnggota() {
      try {
        const data = await fetchAnggotaList();

        if (isMounted) {
          setItems(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat data anggota");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialAnggota();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleConfirm() {
    if (!confirmState) return;

    setActionError(null);
    setIsConfirming(true);

    try {
      if (confirmState.action === "keluarkan") {
        await keluarkanAnggota(confirmState.anggota.iduser);
      } else {
        await cabutStatusOwner(confirmState.anggota.iduser);
      }

      setSelected(null);
      setConfirmState(null);
      await refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menjalankan aksi");
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Manajemen User
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola anggota Perusahaan dan Hak Menu tiap karyawan.
        </p>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
          {actionError}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="ml-auto flex items-center gap-3">
          {selected && !selected.isowner && (
            <button
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              onClick={() => setHakMenuTarget(selected)}
              type="button"
            >
              Kelola Hak Menu
            </button>
          )}
          {selected && selected.isowner && (
            <button
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              onClick={() => setConfirmState({ action: "cabut-owner", anggota: selected })}
              type="button"
            >
              Cabut Status Owner
            </button>
          )}
          {selected && (
            <button
              className="rounded-lg bg-status-danger-dot px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-90"
              onClick={() => setConfirmState({ action: "keluarkan", anggota: selected })}
              type="button"
            >
              Keluarkan Anggota
            </button>
          )}
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            onClick={() => setIsInviteOpen(true)}
            type="button"
          >
            Invite Anggota
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
          data             = {items}
          emptyMessage     = {isLoading ? "Memuat data..." : "Belum ada anggota"}
          onRowClickAction = {(row) => setSelected(row)}
          rowKey           = "iduser"
        />
      )}

      {isInviteOpen && <InvitationModal onClose={() => setIsInviteOpen(false)} />}

      {hakMenuTarget && (
        <HakMenuModal
          anggota  = {hakMenuTarget}
          onClose  = {async () => {
            setHakMenuTarget(null);
            await refresh();
          }}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          confirmLabel   = {confirmState.action === "keluarkan" ? "Keluarkan" : "Cabut"}
          description    = {
            confirmState.action === "keluarkan"
              ? `Apakah Anda yakin ingin mengeluarkan ${confirmState.anggota.name} dari Perusahaan ini? Seluruh Hak Menu miliknya akan turut dihapus.`
              : `Apakah Anda yakin ingin mencabut status Owner dari ${confirmState.anggota.name}?`
          }
          isConfirming   = {isConfirming}
          onCancelAction = {() => setConfirmState(null)}
          onConfirmAction= {handleConfirm}
          title          = {confirmState.action === "keluarkan" ? "Keluarkan Anggota" : "Cabut Status Owner"}
        />
      )}
    </>
  );
}
