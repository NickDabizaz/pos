import type { KeyboardEventHandler, PointerEventHandler } from "react";

type ColumnResizeHandleProps = {
  label          : string;
  onKeyDown      : KeyboardEventHandler<HTMLButtonElement>;
  onPointerCancel: PointerEventHandler<HTMLButtonElement>;
  onPointerDown  : PointerEventHandler<HTMLButtonElement>;
  onPointerMove  : PointerEventHandler<HTMLButtonElement>;
  onPointerUp    : PointerEventHandler<HTMLButtonElement>;
};

export default function ColumnResizeHandle({
  label,
  onKeyDown,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ColumnResizeHandleProps) {
  return (
    <button
      aria-label      = {`Ubah lebar kolom ${label}`}
      className       = "group/resize absolute inset-y-0 right-0 z-10 w-2 translate-x-1/2 cursor-col-resize touch-none bg-slate-100 transition-colors hover:bg-slate-200 focus-visible:bg-slate-200 focus-visible:outline-none"
      onClick         = {(event) => event.stopPropagation()}
      onKeyDown       = {onKeyDown}
      onPointerCancel = {onPointerCancel}
      onPointerDown   = {onPointerDown}
      onPointerMove   = {onPointerMove}
      onPointerUp     = {onPointerUp}
      type            = "button"
    >
      <span className="mx-auto block h-5 w-px bg-slate-300 transition-colors group-hover/resize:bg-slate-950 group-focus-visible/resize:bg-slate-950" />
    </button>
  );
}
