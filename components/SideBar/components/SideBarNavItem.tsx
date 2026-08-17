import { getMenuIcon } from "@/components/SideBar/components/SideBarIcons";
import type { MenuNode } from "@/components/SideBar/lib/types";

type SideBarNavItemProps = {
  activeKey     ?: string;
  depth         ?: number;
  expandedKeys   : Set<string>;
  isCollapsed    : boolean;
  node           : MenuNode;
  onSelectAction?: (node: MenuNode) => void;
  onToggleExpand : (kodemenu: string) => void;
};

export default function SideBarNavItem({
  activeKey,
  depth = 0,
  expandedKeys,
  isCollapsed,
  node,
  onSelectAction,
  onToggleExpand,
}: SideBarNavItemProps) {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isExpanded  = expandedKeys.has(node.kodemenu);
  const isActive    = activeKey === node.kodemenu;

  // Parent Group with collapsible submenus
  if (hasChildren) {
    if (isCollapsed) {
      return (
        <button
          aria-label = {node.namamenu}
          className  = {`flex size-10 items-center justify-center rounded-xl transition-all ${
            isExpanded || isActive
              ? "bg-secondary text-foreground shadow-xs"
              : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
          }`}
          onClick    = {() => onToggleExpand(node.kodemenu)}
          title      = {node.namamenu}
          type       = "button"
        >
          {getMenuIcon(node.namamenu, node.kodemenu, "size-5")}
        </button>
      );
    }

    return (
      <div className="flex flex-col">
        <button
          aria-expanded = {isExpanded}
          className     = {`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-colors ${
            isExpanded
              ? "bg-secondary/40 font-semibold text-foreground"
              : "text-slate-600 hover:bg-secondary/60 hover:text-foreground"
          }`}
          onClick       = {() => onToggleExpand(node.kodemenu)}
          type          = "button"
        >
          <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
            <span className="shrink-0 text-slate-500 group-hover:text-foreground">
              {getMenuIcon(node.namamenu, node.kodemenu, "size-4.5")}
            </span>
            <span className="truncate tracking-tight font-medium text-xs">
              {node.namamenu}
            </span>
          </div>

          <svg
            aria-hidden = "true"
            className   = {`size-3.5 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-hover:text-foreground ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill        = "none"
            stroke      = "currentColor"
            strokeWidth = "2"
            viewBox     = "0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Clean Typographic Submenu with subtle vertical tree guide line and mini icons */}
        {isExpanded && (
          <div className="relative mt-0.5 ml-4 flex flex-col space-y-0.5 border-l border-border/70 pl-2.5">
            {node.children.map((child) => (
              <SideBarNavItem
                activeKey      = {activeKey}
                depth          = {depth + 1}
                expandedKeys   = {expandedKeys}
                isCollapsed    = {isCollapsed}
                key            = {child.kodemenu}
                node           = {child}
                onSelectAction = {onSelectAction}
                onToggleExpand = {onToggleExpand}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Clickable Menu Item (For ALL leaf nodes including Kasir POS, Dashboard, etc.)
  if (isCollapsed) {
    return (
      <button
        aria-label = {node.namamenu}
        className  = {`flex size-10 items-center justify-center rounded-xl transition-all ${
          isActive
            ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/20"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
        onClick    = {() => onSelectAction?.(node)}
        title      = {node.namamenu}
        type       = "button"
      >
        {getMenuIcon(node.namamenu, node.kodemenu, "size-5")}
      </button>
    );
  }

  return (
    <button
      className = {`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
        isActive
          ? "bg-primary font-semibold text-primary-foreground shadow-xs"
          : "font-medium text-slate-600 hover:bg-secondary/60 hover:text-foreground"
      } ${depth > 0 ? "py-1.5 text-[11.5px] font-normal" : ""}`}
      onClick   = {() => onSelectAction?.(node)}
      type      = "button"
    >
      <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
        <span
          className={`shrink-0 transition-colors ${
            isActive
              ? "text-primary-foreground"
              : "text-slate-500 group-hover:text-foreground"
          }`}
        >
          {getMenuIcon(node.namamenu, node.kodemenu, depth > 0 ? "size-3.5" : "size-4.5")}
        </span>
        <span className="truncate tracking-tight">{node.namamenu}</span>
      </div>

      {isActive && (
        <span className="size-1.5 rounded-full bg-primary-foreground/90 shrink-0 ml-2" />
      )}
    </button>
  );
}
