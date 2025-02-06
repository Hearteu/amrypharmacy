"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";


interface NewProductFormProps {
  product_id: number;
}
export default function AddProductForm() {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      product_name: "",
      category: "",
      price: "",
      unit: "",
    },
  });

  const onSubmit = (data: any) => {
    console.log("New Product Data:", data);
    setOpen(false); // Close dialog after submission
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product Name */}
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Input {...register("product_name", { required: "Product name is required" })} />
            </FormControl>
            {errors.product_name && <FormMessage>{errors.product_name.message}</FormMessage>}
          </FormItem>

          {/* Category Dropdown */}
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <Select onValueChange={(value) => setValue("category", value, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="grocery">Grocery</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            {errors.category && <FormMessage>{errors.category.message}</FormMessage>}
          </FormItem>

          {/* Price Input */}
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <Input type="number" {...register("price", { required: "Price is required" })} />
            </FormControl>
            {errors.price && <FormMessage>{errors.price.message}</FormMessage>}
          </FormItem>

          {/* Unit of Measure Dropdown */}
          <FormItem>
            <FormLabel>Unit of Measure</FormLabel>
            <FormControl>
              <Select onValueChange={(value) => setValue("unit", value, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="liters">Liters (L)</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            {errors.unit && <FormMessage>{errors.unit.message}</FormMessage>}
          </FormItem>

          <DialogFooter>
            <Button type="submit">Save Product</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
