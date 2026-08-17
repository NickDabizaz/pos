# POS Boilerplate

This repository is a Next.js boilerplate for building a Point of Sale (POS)
application. Use TypeScript for application code and Tailwind CSS for styling.

## Global modules

Place a reusable module with complex behavior under
`components/<ModuleName>/` using this structure:

```text
<ModuleName>/
├── index.tsx
├── components/
│   └── <PascalCase>.tsx
└── lib/
    ├── <camelCase>.ts
    └── types.ts
```

- Use `PascalCase` for module folders and React component files.
- Use `camelCase` for hooks, formatters, and other TypeScript implementation files.
- Keep `index.tsx` as the module's public interface; consumers import from the module root.
- Keep UI implementation in `components/` and non-UI implementation in `lib/`.
- Align `:` vertically within adjacent TypeScript property declarations and object literals.
- Add a scoped `AGENTS.md` inside a global module when agents need module-specific instructions.

## DataTable

`DataTable` is the project's global module for displaying structured tabular
data. Before creating or changing a table, read `components/DataTable/AGENTS.md`
and reuse this module.

## ConfirmDialog

`ConfirmDialog` is the project's global module for confirming a destructive
or consequential action. Before building a confirm popup, read
`components/ConfirmDialog/AGENTS.md` and reuse this module.

## Testing

Tests use Vitest (`npm test`). Never place a `*.test.ts` file next to the code
it tests — put it in a `__tests__/` folder alongside the file(s) it covers,
keeping the same base name:

```text
lib/server/menu/
├── service.ts
└── __tests__/
    └── service.test.ts
```

This keeps directory listings free of test/non-test clutter and makes it
obvious which folder is safe to skim for implementation only.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
