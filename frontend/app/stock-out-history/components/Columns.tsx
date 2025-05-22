import { Transaction } from "@/app/lib/types/transactions";
import { ColumnDef } from "@tanstack/react-table";

export const columns: (
  onSuccess: () => void
) => ColumnDef<Transaction>[] = () => [
  {
    accessorKey: "transaction_type",
    header: "Transaction Type",
  },

  {
    accessorKey: "transaction_date",
    header: "Transaction Date",
    enableSorting: true,
  },
  {
    accessorKey: "quantity_change",
    header: "Quantity Change",
  },
];
