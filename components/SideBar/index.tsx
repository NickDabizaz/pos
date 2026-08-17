"use client";

import SideBarFooter from "@/components/SideBar/components/SideBarFooter";
import SideBarHeader from "@/components/SideBar/components/SideBarHeader";
import SideBarNav from "@/components/SideBar/components/SideBarNav";
import SideBarSkeleton from "@/components/SideBar/components/SideBarSkeleton";
import type { MenuNode, SideBarProps } from "@/components/SideBar/lib/types";
import { useSideBar } from "@/components/SideBar/lib/useSideBar";

export type {
  MenuNode,
  MenuNodeType,
  SideBarProps,
} from "@/components/SideBar/lib/types";

export default function SideBar({
  activeKey: controlledActiveKey,
  apiUrl           = "/api/menu/tree",
  className        = "",
  defaultCollapsed = false,
  initialItems,
  logoSrc          = "/logo.png",
  onLogoClickAction,
  onSelectAction,
  onToggleCollapseAction,
  title            = "KASIR POS",
  userProfile,
}: SideBarProps) {
  const {
    activeKey,
    errorMessage,
    expandedKeys,
    isCollapsed,
    isLoading,
    items,
    selectItem,
    setActiveKey,
    toggleCollapse,
    toggleExpand,
  } = useSideBar({
    activeKey       : controlledActiveKey,
    apiUrl,
    defaultCollapsed,
    initialItems,
  });

  function handleToggleCollapse() {
    toggleCollapse();
    onToggleCollapseAction?.(!isCollapsed);
  }

  function handleSelect(node: MenuNode) {
    selectItem(node);
    onSelectAction?.(node);
  }

  function handleLogoClick() {
    if (onLogoClickAction) {
      onLogoClickAction();
    } else {
      setActiveKey(undefined);
    }
  }

  return (
    <aside
      aria-label = "Sidebar navigasi aplikasi"
      className  = {`flex h-screen flex-col border-r border-border bg-card shadow-xs transition-all duration-300 ${
        isCollapsed ? "w-18" : "w-60"
      } ${className}`.trim()}
    >
      <SideBarHeader
        isCollapsed            = {isCollapsed}
        logoSrc                = {logoSrc}
        onLogoClickAction      = {handleLogoClick}
        onToggleCollapseAction = {handleToggleCollapse}
        title                  = {title}
      />

      {isLoading ? (
        <SideBarSkeleton isCollapsed={isCollapsed} />
      ) : (
        <SideBarNav
          activeKey      = {activeKey}
          errorMessage   = {errorMessage}
          expandedKeys   = {expandedKeys}
          isCollapsed    = {isCollapsed}
          items          = {items}
          onSelectAction = {handleSelect}
          onToggleExpand = {toggleExpand}
        />
      )}

      <SideBarFooter isCollapsed={isCollapsed} userProfile={userProfile} />
    </aside>
  );
}
