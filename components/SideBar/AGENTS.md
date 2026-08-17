# SideBar module

`SideBar` is the global module for rendering clean, typographic hierarchical application navigation from the menu tree API (`/api/menu/tree`).

## Public interface

Import only from the module root:

```tsx
import SideBar, { type MenuNode, type SideBarProps } from "@/components/SideBar";
```

```tsx
<SideBar
  activeKey        = "MNU_PROD"
  apiUrl           = "/api/menu/tree"
  onLogoClick      = {() => console.log("home")}
  onSelectAction   = {(node) => console.log(node)}
  title            = "KASIR POS"
/>
```

## Structure and ownership

```text
SideBar/
├── index.tsx
├── AGENTS.md
├── components/
│   ├── SideBarFooter.tsx
│   ├── SideBarHeader.tsx
│   ├── SideBarNav.tsx
│   ├── SideBarNavItem.tsx
│   └── SideBarSkeleton.tsx
└── lib/
    ├── types.ts
    └── useSideBar.ts
```

- `index.tsx` owns the public interface and orchestrates header, search, nav list, and footer.
- `components/` owns visual rendering with clean typography and accordion state.
- `lib/` owns types, API fetching from `/api/menu/tree`, and expand/collapse state.
- Keep `:` vertically aligned within adjacent TypeScript property declarations and object literals.
- Preserve CSS variable colors from `globals.css` (`--card`, `--primary`, `--border`, `--table-header-bg`, etc.).
