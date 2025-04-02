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
import { useRouter } from "next/navigation";

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


const EditSupplierDialog = ({
  supplier_id,
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
            <DialogTitle>Edit Supplier Details</DialogTitle>
            <DialogDescription>
              Update the supplier&apos;s information
            </DialogDescription>
          </DialogHeader>
          <EditSupplierForm
            supplier_id={supplier_id}
            onSuccess={(data) => {
              onSuccess();
              console.log("From the columns component", data);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

const AssignItemButton = ({ supplierId }: { supplierId: string }) => {
  const router = useRouter(); // ✅ Use Next.js router instead of useNavigate()

  return (
    <>
<Button onClick={() => router.push(`/assigned-items/${supplierId}`)}>
Assign an Item
      </Button>
    </>
  );
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
      return (
        <>
          <div className="flex gap-2">
            <EditSupplierDialog
              supplier_id={supplier.supplier_id}
              onSuccess={() => {
                onSuccess();
              }}
            ></EditSupplierDialog>
            <AssignItemButton supplierId={supplier.supplier_id.toString()} />;
          </div>
        </>
      );
    },
  },
];
