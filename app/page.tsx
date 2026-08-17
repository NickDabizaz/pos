"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ComboGrid, { type ComboGridColumn } from "@/components/ComboGrid";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import SideBar, { type MenuNode } from "@/components/SideBar";
import { menuRoutes } from "@/lib/menuRoutes";

type Product = {
  category    : string;
  id          : number;
  internalCode: string;
  name        : string;
  price       : number;
  status      : "Aktif" | "Habis";
  stock       : number;
};

const products: Product[] = Array.from({ length: 27 }, (_, index) => ({
  category    : ["Makanan", "Minuman", "Kebutuhan"][index % 3],
  id          : index + 1,
  internalCode: `SKU-${String(index + 1).padStart(4, "0")}`,
  name        : `Produk ${index + 1}`,
  price       : 12_500 + index * 2_500,
  status      : index % 5 === 0 ? "Habis" : "Aktif",
  stock       : index % 5 === 0 ? 0 : 8 + index,
}));

const columns: DataTableColumn<Product>[] = [
  { type: "rowNumber", width: "64px" },
  {
    key     : "name",
    label   : "Nama Produk",
    maxWidth: "480px",
    minWidth: "180px",
    width   : "240px",
  },
  {
    key  : "category",
    label: "Kategori",
    width: "150px",
  },
  {
    align : "right",
    format: {
      decimalPlaces: 2,
      type         : "currency",
    },
    key   : "price",
    label : "Harga",
    width : "180px",
  },
  {
    align : "center",
    format: {
      decimalPlaces: 0,
      type         : "quantity",
    },
    key   : "stock",
    label : "Stok",
    width : "80px",
  },
  {
    align   : "center",
    key     : "status",
    label   : "Status",
    render  : (value) => (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          value === "Aktif"
            ? "border border-status-active-border bg-status-active-bg text-status-active-fg"
            : "border border-status-danger-border bg-status-danger-bg text-status-danger-fg"
        }`}
      >
        <span
          className={`size-1.5 rounded-full ${
            value === "Aktif"
              ? "bg-status-active-dot"
              : "bg-status-danger-dot"
          }`}
        />
        {value}
      </span>
    ),
    sortable: false,
    width   : "80px",
  },
  {
    hide : true,
    key  : "internalCode",
    label: "Kode Internal",
    width: "160px",
  },
];

const comboGridColumns: ComboGridColumn<Product>[] = [
  {
    key  : "internalCode",
    label: "Kode",
    width: "140px",
  },
  {
    key  : "name",
    label: "Nama Produk",
    width: "240px",
  },
  {
    key  : "category",
    label: "Kategori",
    width: "150px",
  },
  {
    align : "right",
    format: "currency",
    key   : "price",
    label : "Harga",
    width : "180px",
  },
  {
    align : "center",
    format: "quantity",
    key   : "stock",
    label : "Stok",
    width : "80px",
  },
];

export default function Home() {
  const router = useRouter();
  const [selectedProductId, setSelectedProductId] = useState<number>();
  const [activeMenu, setActiveMenu]               = useState<MenuNode>();
  const selectedProduct = products.find(({ id }) => id === selectedProductId);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <SideBar
        activeKey      = {activeMenu?.kodemenu}
        apiUrl         = "/api/menu/tree"
        onLogoClick    = {() => setActiveMenu(undefined)}
        onSelectAction = {(node) => {
          setActiveMenu(node);

          const route = menuRoutes[node.kodemenu];

          if (route) {
            router.push(route);
          }
        }}
      />

      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground shadow-xs">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Inventaris POS
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {activeMenu ? activeMenu.namamenu : "Daftar Produk"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Katalog produk dan stok barang aktif dalam sistem kasir POS.
            </p>
          </div>

          <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-xs ring-1 ring-slate-950/5 sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Contoh penggunaan
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                Tambah produk ke transaksi
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cari berdasarkan kode, nama, atau kategori, lalu pilih satu baris.
              </p>
            </div>
            <ComboGrid
              className       = "max-w-2xl"
              columns         = {comboGridColumns}
              data            = {products}
              label           = "Produk"
              labelKey        = "name"
              onChangeAction  = {(value) => setSelectedProductId(value as number)}
              placeholder     = "Ketik nama atau kode produk..."
              searchKeys      = {["name", "internalCode", "category"]}
              value           = {selectedProductId}
              valueKey        = "id"
            />
            <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
              {selectedProduct
                ? `Nilai tersimpan: ${selectedProduct.id} · ${selectedProduct.name}`
                : "Belum ada produk yang dipilih."}
            </p>
          </section>

          <DataTable columns={columns} data={products} rowKey="id" />
        </div>
      </main>
    </div>
  );
}
