export type MenuNodeType = "DETAIL" | "HEADER";

export type MenuNode = {
  children : MenuNode[];
  jenis    : MenuNodeType;
  kodemenu : string;
  namamenu : string;
  urutan   : string | null;
};

export type SideBarProps = {
  activeKey       ?: string;
  apiUrl          ?: string;
  className       ?: string;
  defaultCollapsed?: boolean;
  initialItems    ?: MenuNode[];
  logoSrc               ?: string;
  onLogoClickAction     ?: () => void;
  onSelectAction        ?: (node: MenuNode) => void;
  onToggleCollapseAction?: (collapsed: boolean) => void;
  title                 ?: string;
  userProfile     ?: {
    avatarUrl ?: string;
    branchName?: string;
    name       : string;
    role       : string;
  };
};

export type MenuTreeApiResponse = {
  data   ?: MenuNode[];
  message : string;
};
