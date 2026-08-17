# ComboGrid module

`ComboGrid` is a standalone data-picker. It intentionally does not import,
render, or extend `DataTable`: its dropdown table is deliberately compact and
selection-focused.

- Define dropdown columns with `ComboGridColumn`, never `DataTableColumn`.
- Keep the dropdown to six visible body rows; overflow uses vertical scrolling.
- Do not add pagination, sorting, resizing, or table-card chrome.
- The module has no `"use client"` boundary. It must be used by a Client
  Component when callbacks or interactive behavior are needed.
