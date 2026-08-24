import { useCallback, useEffect, useState } from "react";

import { fetchShiftStatus } from "@/lib/client/shift";
import type { Shift } from "@/lib/server/shift/types";

const POS_KODELOKASI = "TOKO";

export function useShiftSession() {
  const [shift, setShift]         = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchShiftStatus(POS_KODELOKASI)
      .then((data) => {
        if (!ignore) setShift(data);
      })
      .catch((error) => {
        if (!ignore) setLoadError(error instanceof Error ? error.message : "Gagal memuat data shift");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    const data = await fetchShiftStatus(POS_KODELOKASI);
    setShift(data);
    return data;
  }, []);

  return { isLoading, loadError, refresh, setShift, shift };
}
