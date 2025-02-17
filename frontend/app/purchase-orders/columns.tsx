"use client"

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table"

import { ArrowUpDown } from "lucide-react"
 
interface StockTransfer{
    stock_transfer_id: number;
    source: string;
    destination: string;
    date: Date;
}
export const columns: ColumnDef<StockTransfer>[] = [
    {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "stock_transfer_id",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Stock Transfer ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
      },
      {
        accessorKey: "destination",
        header: "Destination",
      },
      {
          id: "actions",
          cell: ({ }) => {
            
            return (
              <>
              <div className="flex gap-2">
              <Button variant="destructive" asChild >
                <button>View Details</button>
              </Button>
              </div>
              </>
            )
          },
        },
]