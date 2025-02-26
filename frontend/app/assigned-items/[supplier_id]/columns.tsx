"use client";

import EditSupplierForm from "@/components/forms/EditSupplierForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface AssignedItems {
    supplier_item_id: number;
    product_name: string
    supplier_price: string;
}

interface EditAssignedItemsProps {
  supplier_item_id: number;
  onSuccess: () => void;
}


const EditSupplierDialog = ({
    supplier_item_id,
    onSuccess,
}: EditAssignedItemsProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Edit</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier Details</DialogTitle>
            <DialogDescription>
              Update the supplier&apos;s information
            </DialogDescription>
          </DialogHeader>
          {/* <EditSupplierForm
            supplier_item_id={supplier_item_id}
            onSuccess={(data) => {
              onSuccess();
              console.log("From the columns component", data);
            }}
          /> */}
        </DialogContent>
      </Dialog>
    </>
  );
};

export const columns: (onSuccess: () => void) => ColumnDef<AssignedItems>[] = (
  onSuccess
) => [
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
    accessorKey: "product_name",
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
    accessorKey: "supplier_price",
    header: "Supplier Price",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const supplier_item = row.original;
      return (
        <>
          <div className="flex gap-2">
            
            
          </div>
        </>
      );
    },
  },
];
