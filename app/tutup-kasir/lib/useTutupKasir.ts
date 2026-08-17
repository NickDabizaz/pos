"use client";

import { useCallback, useState } from "react";

import { cancelCloseShift as cancelCloseShiftApi, closeShift as closeShiftApi } from "@/lib/client/shift";
import { useShiftSession } from "@/lib/client/useShiftSession";

export function useTutupKasir() {
  const { isLoading, loadError, setShift, shift: sessionShift } = useShiftSession();
  const [isClosing, setIsClosing]                 = useState(false);
  const [closeError, setCloseError]               = useState<string | null>(null);
  const [isCancelingClose, setIsCancelingClose]   = useState(false);
  const [cancelCloseError, setCancelCloseError]   = useState<string | null>(null);

  const shift = sessionShift?.status === "OPEN" ? sessionShift : null;
  const closedShift = sessionShift?.status === "CLOSED" ? sessionShift : null;

  const closeShift = useCallback(async (kasAktual: number, catatan?: string) => {
    setIsClosing(true);
    setCloseError(null);

    try {
      setShift(await closeShiftApi({ kasAktual, catatan }));
    } catch (error) {
      setCloseError(error instanceof Error ? error.message : "Gagal menutup shift");
    } finally {
      setIsClosing(false);
    }
  }, [setShift]);

  const cancelClose = useCallback(async () => {
    setIsCancelingClose(true);
    setCancelCloseError(null);

    try {
      setShift(await cancelCloseShiftApi());
    } catch (error) {
      setCancelCloseError(error instanceof Error ? error.message : "Gagal membatalkan penutupan shift");
    } finally {
      setIsCancelingClose(false);
    }
  }, [setShift]);

  return {
    cancelClose,
    cancelCloseError,
    closeError,
    closedShift,
    closeShift,
    isCancelingClose,
    isClosing,
    isLoading,
    loadError,
    shift,
  };
}
