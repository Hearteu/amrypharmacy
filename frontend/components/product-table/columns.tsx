"use client"

import { ColumnDef } from "@tanstack/react-table"

import { ArrowUpDown } from "lucide-react"
 
import { Button } from "@/components/ui/button"
import { Checkbox } from "../ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import EditProductForm from "../forms/EditProductForm"
import { useState } from "react"
import axios from "axios"

interface MergedProductData {
  products_id: number;
  product_name: string; // Now includes brand, dosage strength, and form
  category_name: string;
  current_price: number;
  net_content: string;
  unit_of_measure: string;
}
interface EditProductDialogProps {
  products_id: number;
}

const EditProductDialog = ({ products_id}: EditProductDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Edit</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product Details</DialogTitle>
          <DialogDescription>Update the products&apos;s information</DialogDescription>
        </DialogHeader>
        <EditProductForm products_id={products_id}></EditProductForm>
      </DialogContent>
    </Dialog>
  )
}

const deleteItem = async (id: number) => {
  try {
    await axios.delete(`http://127.0.0.1:8000/products/${id}/`);
    console.log("Item deleted successfully");
  } catch (error) {
    console.error("Error deleting item:", error);
  }
};


export const columns: ColumnDef<MergedProductData>[] = [
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "category_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "current_price",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const current_price = parseFloat(row.getValue("current_price"))
      const formatted = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(current_price)

      return <div className="text-right font-medium">{formatted}</div>
    }
  },
  {
    accessorKey: "net_content",
    header: "Net Content",
  },
  {
    accessorKey: "unit_of_measure",
    header: "Unit of Measurement",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      
      const products = row.original
      
      console.log(products)
      return (
        <>
        <div className="flex gap-2">
        <EditProductDialog  products_id={products.products_id}/>
        <Button variant="destructive" asChild >
          <button onClick={() => deleteItem(products.products_id)}>Delete</button>
        </Button>
        </div>
        </>
      )
    },
  },
]
