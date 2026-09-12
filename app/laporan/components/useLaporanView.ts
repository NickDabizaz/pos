"use client";

import { useEffect, useRef, useState } from "react";

import { fetchLokasiLaporan, type LokasiPilihan } from "@/lib/client/laporan/shared";

/** State `src` iframe laporan. `null` sampai "Tampilkan" ditekan pertama kali — tak ada auto-load. */
export function useLaporanView(buatUrl: () => string) {
  const [src, setSrc] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleTampilkan() {
    setSrc(buatUrl());
  }

  function handleCetak() {
    iframeRef.current?.contentWindow?.print();
  }

  return { src, sudahTampil: src !== null, handleTampilkan, handleCetak, iframeRef };
}

/** Daftar Lokasi + set terpilih; default seluruh Lokasi tercentang begitu daftar termuat. */
export function useOpsiLokasi() {
  const [opsi, setOpsi] = useState<LokasiPilihan[]>([]);
  const [terpilih, setTerpilih] = useState<number[]>([]);

  useEffect(() => {
    fetchLokasiLaporan()
      .then((list) => {
        setOpsi(list);
        setTerpilih(list.map((lokasi) => lokasi.idlokasi));
      })
      .catch(() => {
        setOpsi([]);
        setTerpilih([]);
      });
  }, []);

  return { opsi, terpilih, setTerpilih };
}
