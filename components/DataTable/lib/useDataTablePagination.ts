"use client";

import { type SetStateAction, useMemo, useState } from "react";

type ResettablePage<T> = {
  dataSnapshot: T[];
  page        : number;
};

function normalizePageSizes(options: number[], initialPageSize: number) {
  return Array.from(
    new Set([initialPageSize, ...options].filter((size) => size > 0)),
  ).sort((a, b) => a - b);
}

export function useDataTablePagination<T>(
  data: T[],
  initialPageSize: number,
  pageSizeOptions: number[],
) {
  const defaultPageSize = initialPageSize > 0 ? initialPageSize : 10;
  const [page, setPage]         = usePageResetOnDataChange(data);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const totalPages              = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage             = Math.min(page, totalPages);
  const startIndex              = (currentPage - 1) * pageSize;
  const rows                    = data.slice(startIndex, startIndex + pageSize);
  const firstVisibleRow         = data.length === 0 ? 0 : startIndex + 1;
  const lastVisibleRow          = Math.min(startIndex + pageSize, data.length);
  
  const availablePageSizes = useMemo(
    () => normalizePageSizes(pageSizeOptions, defaultPageSize),
    [defaultPageSize, pageSizeOptions],
  );

  function goToPreviousPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    setPage((current) => Math.min(totalPages, current + 1));
  }

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
  }

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize);
    setPage(1);
  }

  return {
    rows,
    startIndex,
    currentPage,
    totalPages,
    pageSize,
    availablePageSizes,
    firstVisibleRow,
    lastVisibleRow,
    changePageSize,
    goToNextPage,
    goToPage,
    goToPreviousPage,
  };
}

function usePageResetOnDataChange<T>(data: T[]) {
  const [state, setState] = useState<ResettablePage<T>>({
    dataSnapshot: data,
    page        : 1,
  });

  if (state.dataSnapshot !== data) {
    setState({
      dataSnapshot: data,
      page        : 1,
    });
  }

  function setPage(nextPage: SetStateAction<number>) {
    setState((current) => {
      const currentPage = current.dataSnapshot === data ? current.page : 1;

      return {
        dataSnapshot: data,
        page        :
          typeof nextPage === "function" ? nextPage(currentPage) : nextPage,
      };
    });
  }

  return [state.page, setPage] as const;
}
