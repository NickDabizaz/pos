"use client";

import DataTable, { type DataTableColumn } from "@/components/DataTable";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "Aktif" | "Habis";
  internalCode: string;
};

const products: Product[] = Array.from({ length: 27 }, (_, index) => ({
  id: index + 1,
  name: `Produk ${index + 1}`,
  category: ["Makanan", "Minuman", "Kebutuhan"][index % 3],
  price: 12_500 + index * 2_500,
  stock: index % 5 === 0 ? 0 : 8 + index,
  status: index % 5 === 0 ? "Habis" : "Aktif",
  internalCode: `SKU-${String(index + 1).padStart(4, "0")}`,
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

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground shadow-xs">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Inventaris POS
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Daftar Produk
          </h1>
          <p className="text-sm text-muted-foreground">
            Katalog produk dan stok barang aktif dalam sistem kasir POS.
          </p>
        </div>

        <DataTable columns={columns} data={products} rowKey="id" />
      </div>
    </main>
  );
}
