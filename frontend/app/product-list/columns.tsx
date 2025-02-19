"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import EditProductForm from "@/components/forms/EditProductForm";
interface Products {
  product_id: number;
  full_product_name: string;
  category: string;
  price: string;
  net_content: string;
  unit: string;
}

interface EditProductDialogProps {
  product_id: number;
  onSuccess: () => void;
}

const EditProductDialog = ({
  product_id,
  onSuccess,
}: EditProductDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Edit</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product Details</DialogTitle>
            <DialogDescription>
              Update the product&apos;s information
            </DialogDescription>
            <EditProductForm
              product_id={product_id}
              onSuccess={(data) => {
                setOpen(false);
                onSuccess();
                console.log("From the columns component", data);
              }}
            ></EditProductForm>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const columns: (onSuccess: () => void) => ColumnDef<Products>[] = (
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
    accessorKey: "full_product_name",
    header: "Product Name",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "price",
    header: "Price",
  },
  {
    accessorKey: "net_content",
    header: "Net Content",
  },
  {
    accessorKey: "unit",
    header: "Unit",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
      // console.log(product.product_id)

      return <EditProductDialog product_id={product.product_id} onSuccess={(data) => {
        console.log("Data:", data)
        onSuccess()
      }}></EditProductDialog>
    },
  },
];
