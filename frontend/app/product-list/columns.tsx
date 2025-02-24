"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

import EditProductForm from "@/components/forms/EditProductForm";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import axios from "axios";
import { useState } from "react";

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

interface DeleteProductDialogProps {
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

const deleteItem = async ({
  product_id,
  onSuccess,
}: DeleteProductDialogProps) => {
  try {
    await axios.delete(
      `http://127.0.0.1:8000/pharmacy/products/${product_id}/`
    );
    console.log("✅ Item deleted successfully");

    if (onSuccess) {
      onSuccess(); // Call onSuccess callback if provided
    }
  } catch (error) {
    console.error("❌ Error deleting item:", error);
    console.log("Product ID Delete:", product_id);
  }
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
      const handleDelete = () => {
        deleteItem({
          product_id: product.product_id,
          onSuccess: onSuccess,
        });
      };

      return (
        <>
          <div className="flex gap-2 ">
            <EditProductDialog
              product_id={product.product_id}
              onSuccess={() => {
                onSuccess();
              }}
            ></EditProductDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {product.full_product_name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      );
    },
  },
];
