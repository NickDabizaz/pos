"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useRef,
  useState,
} from "react";

const MINIMUM_COLUMN_WIDTH = 64;
const KEYBOARD_RESIZE_STEP  = 12;
const RESIZE_HANDLE_SPACE   = 8;

type ColumnWidths = Record<string, number>;

type ColumnResizeLimits = {
  minWidth?: CSSProperties["width"];
  maxWidth?: CSSProperties["width"];
};

type ResizeSession = {
  columnId        : string;
  initialDataWidth: number;
  initialWidth    : number;
  initialX        : number;
  maximumWidth    : number;
  minimumWidth    : number;
  pointerId       : number;
  widths          : ColumnWidths;
};

export function useDataTableColumnResize() {
  const tableRef = useRef<HTMLTableElement>(null);
  const resizeSession = useRef<ResizeSession | null>(null);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({});
  const [tableWidth, setTableWidth] = useState<number | null>(null);

  function startResize(
    event: PointerEvent<HTMLButtonElement>,
    columnId: string,
    configuredLimits: ColumnResizeLimits,
  ) {
    const measurement = measureColumns(tableRef.current);
    const initialWidth = measurement.widths[columnId];

    if (!initialWidth) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const limits = calculateResizeLimits(
      tableRef.current,
      measurement,
      columnId,
      configuredLimits,
    );
    resizeSession.current = {
      columnId,
      initialDataWidth: measurement.totalWidth,
      initialWidth,
      initialX        : event.clientX,
      maximumWidth    : limits.maximumWidth,
      minimumWidth    : limits.minimumWidth,
      pointerId       : event.pointerId,
      widths          : measurement.widths,
    };
    setColumnWidths(measurement.widths);
    setTableWidth(measurement.totalWidth);
  }

  function continueResize(event: PointerEvent<HTMLButtonElement>) {
    const session = resizeSession.current;

    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    const requestedWidth = session.initialWidth + event.clientX - session.initialX;
    const nextWidth = clamp(
      requestedWidth,
      session.minimumWidth,
      session.maximumWidth,
    );
    const nextDataWidth =
      session.initialDataWidth - session.initialWidth + nextWidth;

    setColumnWidths({ ...session.widths, [session.columnId]: nextWidth });
    setTableWidth(nextDataWidth);
  }

  function stopResize(event: PointerEvent<HTMLButtonElement>) {
    if (resizeSession.current?.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resizeSession.current = null;
  }

  function resizeWithKeyboard(
    event: KeyboardEvent<HTMLButtonElement>,
    columnId: string,
    configuredLimits: ColumnResizeLimits,
  ) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const measurement = measureColumns(tableRef.current);
    const currentWidth = measurement.widths[columnId];

    if (!currentWidth) {
      return;
    }

    const limits = calculateResizeLimits(
      tableRef.current,
      measurement,
      columnId,
      configuredLimits,
    );
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextWidth = clamp(
      currentWidth + direction * KEYBOARD_RESIZE_STEP,
      limits.minimumWidth,
      limits.maximumWidth,
    );
    const nextDataWidth = measurement.totalWidth - currentWidth + nextWidth;

    setColumnWidths({ ...measurement.widths, [columnId]: nextWidth });
    setTableWidth(nextDataWidth);
  }

  return {
    columnWidths,
    tableRef,
    tableWidth,
    continueResize,
    resizeWithKeyboard,
    startResize,
    stopResize,
  };
}

function measureColumns(table: HTMLTableElement | null) {
  const widths: ColumnWidths = {};
  const minimumWidths: ColumnWidths = {};

  table?.querySelectorAll<HTMLElement>("th[data-column-id]").forEach((cell) => {
    const columnId = cell.dataset.columnId;

    if (columnId) {
      const content = cell.querySelector<HTMLElement>("[data-column-content]");
      const style = getComputedStyle(cell);
      const horizontalPadding =
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight);

      widths[columnId] = cell.getBoundingClientRect().width;
      minimumWidths[columnId] = Math.max(
        MINIMUM_COLUMN_WIDTH,
        (content?.scrollWidth ?? 0) + horizontalPadding + RESIZE_HANDLE_SPACE,
      );
    }
  });

  return {
    containerWidth: table?.parentElement?.clientWidth ?? 0,
    widths,
    minimumWidths,
    totalWidth: Object.values(widths).reduce((total, width) => total + width, 0),
  };
}

function calculateResizeLimits(
  table: HTMLTableElement | null,
  measurement: ReturnType<typeof measureColumns>,
  columnId: string,
  configuredLimits: ColumnResizeLimits,
) {
  const currentWidth = measurement.widths[columnId];
  const configuredMinimum = resolveCssWidth(
    configuredLimits.minWidth,
    table?.parentElement,
  );
  const minimumWidth = Math.max(
    MINIMUM_COLUMN_WIDTH,
    configuredMinimum ?? measurement.minimumWidths[columnId],
  );
  const configuredMaximum = resolveCssWidth(
    configuredLimits.maxWidth,
    table?.parentElement,
  );
  const defaultMaximum = Math.max(
    minimumWidth,
    currentWidth,
    measurement.containerWidth,
  );

  return {
    minimumWidth,
    maximumWidth: Math.max(
      minimumWidth,
      currentWidth,
      configuredMaximum ?? defaultMaximum,
    ),
  };
}

function resolveCssWidth(
  width: CSSProperties["width"] | undefined,
  container: HTMLElement | null | undefined,
) {
  if (width === undefined || width === null || !container) {
    return null;
  }

  if (typeof width === "number") {
    return width;
  }

  const probe = document.createElement("div");

  probe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;height:0;";
  probe.style.width = String(width);
  container.appendChild(probe);

  const resolvedWidth = probe.getBoundingClientRect().width;

  probe.remove();

  return Number.isFinite(resolvedWidth) && resolvedWidth > 0
    ? resolvedWidth
    : null;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
