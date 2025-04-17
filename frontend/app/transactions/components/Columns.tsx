"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Transaction } from "@/app/lib/types/transactions";
import ViewTransactionDetails from "./ViewTransactionDetails";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export const columns: (onSuccess: () => void) => ColumnDef<Transaction>[] = (
  onSuccess
) => [
  {
    accessorKey: "invoice",
    header: "Invoice",
  },
  {
    accessorKey: "sale_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "total_amount",
    header: "Total Amount",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const pos_id = row.original.pos_id;
      return (
        <>
          <ViewTransactionDetails pos_id={pos_id.toString()} />
        </>
      );
    },
  },
];
