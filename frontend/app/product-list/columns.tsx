"use client";

import { ColumnDef } from "@tanstack/react-table";

interface Products {
  product_id: number;
  full_product_name: string;
  category: string;
  price: string;
  net_content: string;
  unit: string;
};

export const columns: ColumnDef<Products>[] = [
  {
    accessorKey: "full_product_name",
    header: "Status",
  },
  {
    accessorKey: "category",
    header: "Email",
  },
  {
    accessorKey: "price",
    header: "Amount",
  },
  {
    accessorKey: "net_content",
    header: "Amount",
  },
  {
    accessorKey: "unit",
    header: "Amount",
  },

];
