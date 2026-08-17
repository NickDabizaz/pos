import type { ReactElement } from "react";

export function getMenuIcon(namamenu: string, kodemenu = "", className = "size-4"): ReactElement {
  const name = (namamenu || "").toLowerCase().trim();
  const code = (kodemenu || "").toLowerCase().trim();

  // Dashboard / Beranda
  if (name.includes("dashboard") || name.includes("beranda") || code.includes("dash")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <rect height="7" rx="1.5" width="7" x="3" y="3" />
        <rect height="7" rx="1.5" width="7" x="14" y="3" />
        <rect height="7" rx="1.5" width="7" x="14" y="14" />
        <rect height="7" rx="1.5" width="7" x="3" y="14" />
      </svg>
    );
  }

  // Master Data / Master
  if (name === "master" || name.includes("master data") || code.includes("mst")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Barang / Produk / Item
  if (name.includes("barang") || name.includes("produk") || name.includes("item") || code.includes("prod")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m3.3 7 8.7 5 8.7-5M12 22V12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Customer / Pelanggan / Member
  if (name.includes("customer") || name.includes("pelanggan") || name.includes("member") || code.includes("cust")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Supplier / Vendor / Pemasok
  if (name.includes("supplier") || name.includes("vendor") || name.includes("pemasok") || code.includes("sup")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17" cy="18" r="2" />
        <circle cx="7" cy="18" r="2" />
      </svg>
    );
  }

  // Lokasi / Gudang / Cabang / Rak
  if (name.includes("lokasi") || name.includes("gudang") || name.includes("outlet") || name.includes("cabang") || name.includes("rak") || code.includes("lok")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }

  // Pembelian / Purchase / Order
  if (name.includes("beli") || name.includes("pembelian") || code.includes("beli") || code.includes("buy")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 6h18M16 10a4 4 0 0 1-8 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Penjualan / Transaksi / Kasir POS / Sales
  if (name.includes("jual") || name.includes("penjualan") || name.includes("kasir") || name.includes("pos") || name.includes("transaksi") || code.includes("trx") || code.includes("jual")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <rect height="14" rx="2" width="20" x="2" y="5" />
        <path d="M2 10h20M6 15h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Tutup Kasir / Shift / Register
  if (name.includes("tutup kasir") || name.includes("shift") || name.includes("closing") || code.includes("tutup")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <rect height="11" rx="2" width="18" x="3" y="11" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4M12 15v2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Keuangan / Arus Kas / Finance
  if (name.includes("keuangan") || name.includes("finance") || code.includes("fin")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Kas / Cash / Bank
  if (name === "kas" || name.includes("kas masuk") || name.includes("kas keluar") || code.includes("kas")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <rect height="12" rx="2" width="20" x="2" y="6" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      </svg>
    );
  }

  // Akuntansi / Accounting / Jurnal
  if (name.includes("akuntansi") || name.includes("accounting") || name.includes("jurnal") || code.includes("akt")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 6h10M6 10h10M6 14h6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Kategori / Kategori Produk
  if (name.includes("kategori") || code.includes("kat")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Laporan / Report / Analitik
  if (name.includes("laporan") || name.includes("report") || name.includes("analitik") || code.includes("lap")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m19 9-5 5-4-4-3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Pengaturan / Setting
  if (name.includes("pengaturan") || name.includes("setting") || name.includes("sistem") || code.includes("set")) {
    return (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  // Default sleek file / item icon
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
