"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";

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
import { Products } from "../../lib/types/inventory/products";
import { ProductFormProps } from "@/app/lib/types/inventory/product-props";
import EditProductDialog from "@/app/product-list/components/EditProductDialog";
import EditInventoryForm from "./EditInventoryForm";
import { ArrowUpDown } from "lucide-react";

const deleteItem = async ({ product_id, onSuccess }: ProductFormProps) => {
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 font-medium"
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    sortingFn: "text", // You can use "text", "datetime", "basic" or a custom function
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      return isNaN(price) ? "N/A" : `₱${price.toFixed(2)}`;
    },
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
    accessorKey: "talaingod",
    header: "Talaingod",
    accessorFn: (row) =>
      row.stock_per_location?.find((loc) => loc.location_id === 2)
        ?.total_quantity || 0,
  },
  {
    accessorKey: "asuncion_stockroom",
    header: "Asuncion - Stockroom",
    accessorFn: (row) =>
      row.stock_per_location?.find((loc) => loc.location_id === 3)
        ?.total_quantity || 0,
  },
  {
    accessorKey: "asuncion_physical",
    header: "Asuncion - Physical",
    accessorFn: (row) =>
      row.stock_per_location?.find((loc) => loc.location_id === 1)
        ?.total_quantity || 0,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
      const handleDelete = () => {
        if (
          product.stock_per_location.every((loc) => loc.total_quantity === 0)
        ) {
          deleteItem({
            product_id: product.product_id,
            onSuccess: onSuccess,
          });
        } else {
          alert("Product has stock in other locations");
          console.log("Product has stock in other locations");
        }
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
            <EditInventoryForm
              product={product}
              onSuccess={() => {
                onSuccess();
                console.log("individual", product);
              }}
            />
            {/* Delete Button */}
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
