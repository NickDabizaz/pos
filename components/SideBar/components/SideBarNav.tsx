import SideBarNavItem from "@/components/SideBar/components/SideBarNavItem";
import type { MenuNode } from "@/components/SideBar/lib/types";

type SideBarNavProps = {
  activeKey     ?: string;
  errorMessage  ?: string | null;
  expandedKeys   : Set<string>;
  isCollapsed    : boolean;
  items          : MenuNode[];
  onSelectAction?: (node: MenuNode) => void;
  onToggleExpand : (kodemenu: string) => void;
};

export default function SideBarNav({
  activeKey,
  errorMessage,
  expandedKeys,
  isCollapsed,
  items,
  onSelectAction,
  onToggleExpand,
}: SideBarNavProps) {
  if (errorMessage) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-status-danger-fg">{errorMessage}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">Tidak ada menu tersedia.</p>
      </div>
    );
  }

  return (
    <nav
      className={`custom-scrollbar flex-1 overflow-y-auto overscroll-contain py-3 ${
        isCollapsed ? "flex flex-col items-center space-y-1.5 px-2" : "space-y-1 px-3"
      }`}
    >
      {items.map((node) => (
        <SideBarNavItem
          activeKey      = {activeKey}
          expandedKeys   = {expandedKeys}
          isCollapsed    = {isCollapsed}
          key            = {node.kodemenu}
          node           = {node}
          onSelectAction = {onSelectAction}
          onToggleExpand = {onToggleExpand}
        />
      ))}
    </nav>
  );
}
