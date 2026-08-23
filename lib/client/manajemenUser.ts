import { parseResponse } from "@/lib/client/apiResponse";
import type { Anggota, MenuOption } from "@/app/manajemen-user/lib/types";

export type { Anggota, MenuOption };

export async function fetchAnggotaList(): Promise<Anggota[]> {
  const response = await fetch("/api/manajemen-user", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<Anggota[] | undefined>(response)) ?? [];
}

export async function fetchMenuOptions(): Promise<MenuOption[]> {
  const response = await fetch("/api/manajemen-user/menu", {
    headers: { Accept: "application/json" },
  });

  return (await parseResponse<MenuOption[] | undefined>(response)) ?? [];
}

export async function keluarkanAnggota(iduser: string): Promise<void> {
  const response = await fetch(`/api/manajemen-user/${iduser}`, {
    method: "DELETE",
  });

  await parseResponse<undefined>(response);
}

export async function cabutStatusOwner(iduser: string): Promise<void> {
  const response = await fetch(`/api/manajemen-user/${iduser}/owner`, {
    method: "DELETE",
  });

  await parseResponse<undefined>(response);
}

export async function nyalakanHakMenu(iduser: string, kodemenu: string): Promise<void> {
  const response = await fetch(`/api/manajemen-user/${iduser}/hak-menu/${kodemenu}`, {
    method: "PUT",
  });

  await parseResponse<undefined>(response);
}

export async function matikanHakMenu(iduser: string, kodemenu: string): Promise<void> {
  const response = await fetch(`/api/manajemen-user/${iduser}/hak-menu/${kodemenu}`, {
    method: "DELETE",
  });

  await parseResponse<undefined>(response);
}
