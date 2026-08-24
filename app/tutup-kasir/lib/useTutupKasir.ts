"use client";

import { useCallback, useState } from "react";

import { cancelCloseShift as cancelCloseShiftApi, closeShift as closeShiftApi } from "@/lib/client/shift";
import { useShiftSession } from "@/lib/client/useShiftSession";

const POS_KODELOKASI = "TOKO";

export function useTutupKasir() {
  const { isLoading, loadError, setShift, shift: sessionShift } = useShiftSession();
  const [isClosing, setIsClosing]                 = useState(false);
  const [closeError, setCloseError]               = useState<string | null>(null);
  const [isCancelingClose, setIsCancelingClose]   = useState(false);
  const [cancelCloseError, setCancelCloseError]   = useState<string | null>(null);

  const shift = sessionShift?.status === "TERBUKA" ? sessionShift : null;
  const closedShift = sessionShift?.status === "TERTUTUP" ? sessionShift : null;

  const closeShift = useCallback(async (kasaktual: number, catatan?: string) => {
    setIsClosing(true);
    setCloseError(null);

    try {
      setShift(await closeShiftApi({ kodelokasi: POS_KODELOKASI, kasaktual, catatan }));
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
      setShift(await cancelCloseShiftApi(POS_KODELOKASI));
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
