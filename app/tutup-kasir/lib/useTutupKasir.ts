"use client";

import { useCallback, useEffect, useState } from "react";

import type { Shift } from "@/app/tutup-kasir/lib/types";
import { closeShift as closeShiftApi, fetchActiveShift } from "@/lib/client/shift";

export function useTutupKasir() {
  const [shift, setShift]             = useState<Shift | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [isClosing, setIsClosing]     = useState(false);
  const [closeError, setCloseError]   = useState<string | null>(null);
  const [closedShift, setClosedShift] = useState<Shift | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActiveShift() {
      try {
        const activeShift = await fetchActiveShift();

        if (isMounted) {
          setShift(activeShift);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Gagal memuat data shift");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadActiveShift();

    return () => {
      isMounted = false;
    };
  }, []);

  const closeShift = useCallback(async (kasAktual: number, catatan?: string) => {
    setIsClosing(true);
    setCloseError(null);

    try {
      setClosedShift(await closeShiftApi({ kasAktual, catatan }));
    } catch (error) {
      setCloseError(error instanceof Error ? error.message : "Gagal menutup shift");
    } finally {
      setIsClosing(false);
    }
  }, []);

  return { closeError, closeShift, closedShift, isClosing, isLoading, loadError, shift };
}
