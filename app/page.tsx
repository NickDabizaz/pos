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
  { type: "rowNumber", width: "72px" },
  {
    key     : "name",
    label   : "Nama Produk",
    width   : "240px",
    minWidth: "180px",
    maxWidth: "480px",
  },
  { key: "category", label: "Kategori", width: "160px" },
  {
    key: "price",
    label: "Harga",
    align: "right",
    width: "180px",
    format: {
      type: "currency",
      decimalPlaces: 2,
    },
  },
  {
    key: "stock",
    label: "Stok",
    align: "center",
    width: "100px",
    format: {
      type: "quantity",
      decimalPlaces: 0,
    },
  },
  {
    key: "status",
    label: "Status",
    align: "center",
    width: "140px",
    sortable: false,
    render: (value) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          value === "Aktif"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700"
        }`}
      >
        {value}
      </span>
    ),
  },
  {
    key: "internalCode",
    label: "Kode Internal",
    hide: true,
    width: "160px",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Data Produk
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Daftar Produk
          </h1>
          <p className="mt-2 text-slate-600">
            Contoh penggunaan komponen tabel global dengan pagination.
          </p>
        </div>

        <DataTable columns={columns} data={products} rowKey="id" />
      </div>
    </main>
  );
}
