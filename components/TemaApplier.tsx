"use client";

import { useEffect } from "react";

import { fetchTema, type Tema } from "@/lib/client/pengaturan";

export function terapkanTema(tema: Tema): void {
  if (tema === "DARK") {
    document.documentElement.dataset.tema = "DARK";
  } else {
    delete document.documentElement.dataset.tema;
  }
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
