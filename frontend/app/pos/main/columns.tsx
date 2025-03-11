"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Item = {
  item_name: string;
  form: string;
  size: string;
  price: number;
};

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "item_name",
    header: "Item Name",
    cell: ({ row }) => <span>{row.original.item_name}</span>,
  },
  {
    accessorKey: "form",
    header: "Form",
    cell: ({ row }) => <span>{row.original.form}</span>,
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => <span>{row.original.size}</span>,
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => <span>${row.original.price.toFixed(2)}</span>,
  },
];
