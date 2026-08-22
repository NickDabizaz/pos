import { useCallback, useEffect, useState } from "react";

import { fetchCurrentShift } from "@/lib/client/shift";
import type { Shift } from "@/lib/server/shift/types";

export function useShiftSession() {
  const [shift, setShift]         = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchCurrentShift()
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
    const data = await fetchCurrentShift();
    setShift(data);
    return data;
  }, []);

  return { isLoading, loadError, refresh, setShift, shift };
}
