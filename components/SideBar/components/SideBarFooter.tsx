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
  const initials = userProfile.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="shrink-0 border-t border-border/80 p-3">
      <div className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-secondary/60">
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
      </div>
    </div>
  );
}
