"use client";

import EditSupplierForm from "@/components/forms/EditSupplierForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";

import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
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

interface Suppliers {
  supplier_id: number;
  supplier_name: string;
  contact_person: string;
  contact: string;
  address: string;
  email: string;
  vat_num: string;
  status: string;
}

interface EditProductDialogProps {
  supplier_id: number;
  onSuccess: () => void;
}

interface DeleteSupplierDialogProps {
  supplier_id: number;
  onSuccess: () => void;
}

const EditSupplierDialog = ({ supplier_id, onSuccess }: EditProductDialogProps) => {
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
          <DialogDescription>Update the supplier&apos;s information</DialogDescription>
        </DialogHeader>
        <EditSupplierForm
          supplier_id={supplier_id}
          onSuccess={(data) => {
            onSuccess()
            console.log("From the columns component", data)
          }}
        />
      </DialogContent>
    </Dialog>
    </>
  );
};

const deleteItem = async ({
  supplier_id,
  onSuccess,
}: DeleteSupplierDialogProps) => {
  try {
    await axios.delete(
      `http://127.0.0.1:8000/pharmacy/suppliers/${supplier_id}/`
    );
    console.log("✅ Item deleted successfully");

    if (onSuccess) {
      onSuccess(); // Call onSuccess callback if provided
    }
  } catch (error) {
    console.error("❌ Error deleting supplier:", error);
    console.log("Supplier ID Delete:", supplier_id);
  }
};



export const columns: (onSuccess: () => void) => ColumnDef<Suppliers>[] = (
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
    accessorKey: "contact",
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
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const supplier = row.original;
      const handleDelete = () => {
        deleteItem({
          supplier_id: supplier.supplier_id,
          onSuccess: onSuccess,
        });
      };
      return (
        <>
        <div className="flex gap-2">

        <EditSupplierDialog
        supplier_id={supplier.supplier_id}
        onSuccess={() => {
          onSuccess();
        }}></EditSupplierDialog>

<AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {supplier.supplier_name}?
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
