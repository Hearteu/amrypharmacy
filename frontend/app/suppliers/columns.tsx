"use client"

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table"

import { ArrowUpDown } from "lucide-react"
 
interface Suppliers{
  supplier_id: number;
  supplier_name: string;
  contact_person: string;
  contact: string;
  address: string;
  email: string;
  vat_num: string;
  status_id: number;
}

export const columns: (onSuccess: () => void) => ColumnDef<Suppliers>[] = (onSuccess) => [
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
        accessorKey: "supplier_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Supplier Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "contact_person",
        header: "Contact Person",
      },
      {
        accessorKey: "address",
        header: "Address",
      },
      {
        accessorKey: "contact_no",
        header: "Contact No.",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "vat_num",
        header: "Vat Number",
      },
      {
        accessorKey: "status_id",
        header: "Status",
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const supplier = row.original;
          return <EditUserDialog user_id={supplier.user_id} onSuccess={(data) => {
            console.log("Data", data)
            onSuccess()
          }} />;
        },
      }
]