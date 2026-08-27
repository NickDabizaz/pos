"use client";

import { useEffect } from "react";

import { fetchTema, type Tema } from "@/lib/client/pengaturan";

export function terapkanTema(tema: Tema): void {
  document.documentElement.dataset.tema = tema;
}

export default function TemaApplier() {
  useEffect(() => {
    let isMounted = true;

    fetchTema()
      .then((tema) => {
        if (isMounted) {
          terapkanTema(tema);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
