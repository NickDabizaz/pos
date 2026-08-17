import Image from "next/image";

type SideBarHeaderProps = {
  isCollapsed           : boolean;
  logoSrc              ?: string;
  onLogoClickAction    ?: () => void;
  onToggleCollapseAction: () => void;
  title                ?: string;
};

export default function SideBarHeader({
  isCollapsed,
  logoSrc = "/logo.png",
  onLogoClickAction,
  onToggleCollapseAction,
  title = "KASIR POS",
}: SideBarHeaderProps) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 px-3.5">
      <button
        aria-label = {`Buka beranda ${title}`}
        className  = "group flex min-w-0 items-center gap-2.5 rounded-xl p-1 text-left transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick    = {onLogoClickAction}
        type       = "button"
      >
        <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xs transition-transform group-hover:scale-105">
          <Image
            alt       = {title}
            className = "size-full object-contain"
            height    = {36}
            priority
            src       = {logoSrc}
            width     = {36}
          />
        </div>

        {!isCollapsed && (
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-black tracking-wider uppercase text-foreground">
                {title}
              </span>
              <span className="inline-flex rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] font-bold tracking-wide uppercase text-emerald-600">
                PRO
              </span>
            </div>
            <span className="truncate text-[10px] font-medium text-muted-foreground">
              Point of Sale System
            </span>
          </div>
        )}
      </button>

      <button
        aria-label = {isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        className  = "flex size-7 items-center justify-center rounded-lg text-muted-foreground/80 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick    = {onToggleCollapseAction}
        title      = {isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        type       = "button"
      >
        <svg
          aria-hidden = "true"
          className   = {`size-4 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
          fill        = "none"
          stroke      = "currentColor"
          strokeWidth = "2"
          viewBox     = "0 0 24 24"
        >
          <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
