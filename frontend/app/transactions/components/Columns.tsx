"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Transaction } from "@/app/lib/types/transactions";
import ViewTransactionDetails from "./ViewTransactionDetails";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export const columns: (
  onSuccess: () => void
) => ColumnDef<Transaction>[] = () => [
  {
    id: "invoice",
    header: "Invoice",
    accessorFn: (row) => row.pos?.invoice || "N/A",
  },
  {
    accessorKey: "transaction_date",
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
    id: "order_type",
    header: "Transaction Type",
    accessorFn: (row) => {
      const orderType = row.pos?.order_type || "N/A";

      // If order type is N/A or empty, just return it
      if (!orderType || orderType === "N/A") return orderType;

      // Special case for DSWD - make it all uppercase
      if (orderType.toLowerCase() === "dswd") return "DSWD";

      // For all other order types, capitalize the first letter of each word
      return orderType
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    },
  },
  {
    id: "totalAmount",
    header: "Total Amount",
    accessorFn: (row) => row.pos?.total_amount || 0,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <>
          <ViewTransactionDetails transaction={row.original} />
        </>
      );
    },
  },
];
