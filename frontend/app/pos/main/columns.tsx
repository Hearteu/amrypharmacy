import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MergedInventoryData {
  inventory_id: number;
  item_name: string;
  form: string;
  size: string;
  stock_quantity: number;
  price: number;
}

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "item_name",
    header: "Item Name",
    cell: ({ row }) => <span className="font-medium">{row.original.item_name}</span>,
  },
  {
    accessorKey: "form",
    header: "Form",
  },
  {
    accessorKey: "size",
    header: "Size",
  },
  {
    accessorKey: "stock_quantity",
    header: "Stock Qty",
    cell: ({ row }) => {
      const stock = row.original.stock_quantity;
      const isLowStock = stock < 10;

      return (
        <span className={isLowStock ? "text-red-500 font-bold" : ""}>
          {stock}
        </span>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => `₱${row.original.price.toFixed(2)}`,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
        onClick={() => console.log(`Added ${row.original.item_name} to order`)}
      >
      +
      </button>
    ),
  },
];
