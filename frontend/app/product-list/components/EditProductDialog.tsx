import { ProductFormProps } from "@/app/lib/types/inventory/product-props";
import { useState } from "react";
import EditProductForm from "./EditProductForm";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function EditProductDialog({
  product_id,
  onSuccess,
}: ProductFormProps) {
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
              onSuccess={() => {
                setOpen(false);
                onSuccess();
              }}
            ></EditProductForm>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
