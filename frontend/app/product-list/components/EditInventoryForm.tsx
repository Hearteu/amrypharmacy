import axios from "axios";
import { z } from "zod";
import {
  InventorySchema,
  useInventoryForm,
} from "../../lib/services/schemas/inventorySchema";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

type EditInventoryDialogProps = {
  product: {
    product_id: number;
    full_product_name: string;
    stock_per_location: Array<{
      location: string;
      location_id: number;
      total_quantity: number;
    }>;
  };
  onSuccess: () => void;
};

export default function EditInventoryForm({
  product,
  onSuccess,
}: EditInventoryDialogProps) {
  const form = useInventoryForm({ product_id: product.product_id });
  const [open, setOpen] = useState(false);

  // console.log("individual", product);

  const onSubmit = async (values: z.infer<typeof InventorySchema>) => {
    // Validate inputs
    console.log("values", values);
    if (values.quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }

    // Ensure product is defined before proceeding
    if (!product || !product.product_id) {
      console.error("Product is undefined or missing product_id");
      throw new Error("Invalid product data");
    }
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/stock-items/${product.product_id}/`,
        values
      );
      onSuccess();
      return response.data;
    } catch (error) {
      console.error("Failed to update inventory:", error);
      throw new Error("Failed to update inventory");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit Inventory
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Inventory</DialogTitle>
          <DialogDescription>
            Update inventory quantity for {product.full_product_name}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      console.log("Selected location_id:", value);
                      field.onChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {product.stock_per_location.map((location) => (
                        <SelectItem
                          key={location.location_id}
                          value={location.location_id.toString()}
                        >
                          {location.location} (Current:{" "}
                          {location.total_quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any notes "
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
