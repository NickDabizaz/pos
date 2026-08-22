"use client";

import { useEffect, useState } from "react";

import type { MenuNode, MenuTreeApiResponse } from "@/components/SideBar/lib/types";

type UseSideBarOptions = {
  activeKey       ?: string;
  apiUrl          ?: string;
  defaultCollapsed?: boolean;
  initialItems    ?: MenuNode[];
};

export function useSideBar({
  activeKey: controlledActiveKey,
  apiUrl           = "/api/menu/tree",
  defaultCollapsed = false,
  initialItems,
}: UseSideBarOptions = {}) {
  const hasInitialItems = Boolean(initialItems && initialItems.length > 0);
  const [fetchedItems, setFetchedItems] = useState<MenuNode[]>([]);
  const [isLoading, setIsLoading]       = useState<boolean>(!hasInitialItems);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed]   = useState<boolean>(defaultCollapsed);
  const [internalActiveKey, setInternalActiveKey] = useState<string | undefined>();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    if (initialItems && initialItems.length > 0) {
      const keys = new Set<string>();
      for (const node of initialItems) {
        if (node.children && node.children.length > 0) {
          keys.add(node.kodemenu);
        }
      }
      return keys;
    }
    return new Set();
  });

  const items = hasInitialItems ? (initialItems as MenuNode[]) : fetchedItems;
  const activeKey = controlledActiveKey !== undefined ? controlledActiveKey : internalActiveKey;

  useEffect(() => {
    if (hasInitialItems) {
      return;
    }

    let isMounted = true;

    async function loadMenuTree() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await fetch(apiUrl, {
          headers: {
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Gagal mengambil data menu (${response.status})`);
        }

        const json: MenuTreeApiResponse = await response.json();
        const menuData = json.data ?? [];

        if (isMounted) {
          setFetchedItems(menuData);
          setIsLoading(false);

          const defaultExpanded = new Set<string>();
          for (const node of menuData) {
            if (node.children && node.children.length > 0) {
              defaultExpanded.add(node.kodemenu);
            }
          }
          setExpandedKeys(defaultExpanded);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Terjadi kesalahan saat memuat menu",
          );
          setIsLoading(false);
        }
      }
    }

    loadMenuTree();

    return () => {
      isMounted = false;
    };
  }, [apiUrl, hasInitialItems]);

  function toggleExpand(kodemenu: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(kodemenu)) {
        next.delete(kodemenu);
      } else {
        next.add(kodemenu);
      }
      return next;
    });
  }

  function toggleCollapse() {
    setIsCollapsed((prev) => !prev);
  }

  function selectItem(node: MenuNode) {
    setInternalActiveKey(node.kodemenu);
  }

  return {
    activeKey,
    errorMessage,
    expandedKeys,
    isCollapsed,
    isLoading,
    items,
    selectItem,
    setActiveKey: setInternalActiveKey,
    setIsCollapsed,
    toggleCollapse,
    toggleExpand,
  };
}
