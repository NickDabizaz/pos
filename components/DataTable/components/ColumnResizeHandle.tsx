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
      className       = "group/resize absolute inset-y-0 right-0 z-10 flex w-3 translate-x-1/2 cursor-col-resize items-center justify-center touch-none bg-transparent focus-visible:outline-none"
      onClick         = {(event) => event.stopPropagation()}
      onKeyDown       = {onKeyDown}
      onPointerCancel = {onPointerCancel}
      onPointerDown   = {onPointerDown}
      onPointerMove   = {onPointerMove}
      onPointerUp     = {onPointerUp}
      type            = "button"
    >
      <span className="h-3.5 w-px bg-border-strong/40 transition-all duration-150 group-hover/resize:h-full group-hover/resize:w-0.5 group-hover/resize:bg-primary group-focus-visible/resize:h-full group-focus-visible/resize:w-0.5 group-focus-visible/resize:bg-primary group-active/resize:h-full group-active/resize:w-0.5 group-active/resize:bg-primary" />
    </button>
  );
}
