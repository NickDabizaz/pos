import { useEffect, useState } from "react";

import type { Anggota, MenuOption } from "@/app/manajemen-user/lib/types";
import { fetchMenuOptions, matikanHakMenu, nyalakanHakMenu } from "@/lib/client/manajemenUser";

type HakMenuModalProps = {
  anggota: Anggota;
  onClose: () => Promise<void>;
};

export default function HakMenuModal({ anggota, onClose }: HakMenuModalProps) {
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([]);
  const [aktif, setAktif]             = useState<Set<string>>(new Set(anggota.kodemenuAktif));
  const [isLoading, setIsLoading]     = useState(true);
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [togglingKode, setTogglingKode] = useState<string | null>(null);
  const [toggleError, setToggleError]   = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMenuOptions() {
      try {
        const options = await fetchMenuOptions();
        if (isMounted) {
          setMenuOptions(options);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat daftar menu");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMenuOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleToggle(kodemenu: string, nyalakan: boolean) {
    setTogglingKode(kodemenu);
    setToggleError(null);

    try {
      if (nyalakan) {
        await nyalakanHakMenu(anggota.iduser, kodemenu);
      } else {
        await matikanHakMenu(anggota.iduser, kodemenu);
      }

      setAktif((current) => {
        const next = new Set(current);
        if (nyalakan) {
          next.add(kodemenu);
        } else {
          next.delete(kodemenu);
        }
        return next;
      });
    } catch (error) {
      setToggleError(error instanceof Error ? error.message : "Gagal mengatur Hak Menu");
    } finally {
      setTogglingKode(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xs ring-1 ring-slate-950/5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Kelola Hak Menu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {anggota.name} ({anggota.email})
          </p>
        </div>

        {toggleError && (
          <p className="mb-4 rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            {toggleError}
          </p>
        )}

        {loadError ? (
          <p className="rounded-lg border border-status-danger-border bg-status-danger-bg px-3 py-2 text-sm text-status-danger-fg">
            {loadError}
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
            {isLoading ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">Memuat daftar menu...</p>
            ) : (
              <ul className="divide-y divide-border">
                {menuOptions.map((menu) => {
                  const isAktif = aktif.has(menu.kodemenu);
                  const isToggling = togglingKode === menu.kodemenu;

                  return (
                    <li className="flex items-center justify-between gap-3 px-3 py-2" key={menu.kodemenu}>
                      <label className="flex min-w-0 items-center gap-2 text-sm text-foreground" htmlFor={`hakmenu-${menu.kodemenu}`}>
                        <input
                          checked  = {isAktif}
                          disabled = {isToggling}
                          id       = {`hakmenu-${menu.kodemenu}`}
                          onChange = {(event) => handleToggle(menu.kodemenu, event.target.checked)}
                          type     = "checkbox"
                        />
                        <span className="truncate">{menu.namamenu}</span>
                      </label>
                      {isToggling && <span className="shrink-0 text-xs text-muted-foreground">Menyimpan...</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            onClick={() => onClose()}
            type="button"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
