"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/client/auth";

type SideBarFooterProps = {
  isCollapsed : boolean;
  userProfile?: {
    avatarUrl ?: string;
    branchName?: string;
    name       : string;
    role       : string;
  };
};

export default function SideBarFooter({
  isCollapsed,
  userProfile = {
    branchName: "Cabang Utama",
    name      : "Nicklaus",
    role      : "Kasir / Admin",
  },
}: SideBarFooterProps) {
  const router                = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  const initials = userProfile.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  async function handleLogout() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative shrink-0 border-t border-border/80 p-3" ref={containerRef}>
      {isMenuOpen && (
        <div className="absolute inset-x-3 bottom-full z-20 mb-2 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl shadow-slate-950/10">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-status-danger-fg transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={handleLogout}
            type="button"
          >
            {isSigningOut ? "Keluar..." : "Logout"}
          </button>
        </div>
      )}

      <button
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-secondary/60"
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-bold text-xs text-white shadow-xs">
          {initials}
          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
        </div>

        {!isCollapsed && (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between">
              <span className="truncate text-xs font-bold text-foreground">
                {userProfile.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="truncate">{userProfile.role}</span>
              {userProfile.branchName && (
                <>
                  <span>•</span>
                  <span className="truncate text-[10px] text-muted-foreground/80">
                    {userProfile.branchName}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
