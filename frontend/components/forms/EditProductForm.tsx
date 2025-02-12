"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormProvider,
  useForm,
  Controller,
} from "react-hook-form";

export default function EditProductForm() {
  const [open, setOpen] = useState(false);

  const formMethods = useForm({
    defaultValues: {
      product_name: "",
      category: "",
      price: "",
      dosage_strength: "",
      dosage_form: "",
      net_content: "",
      unit_measure: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = formMethods;

  const onSubmit = (data: any) => {
    console.log("Edit Product Data:", data);
    setOpen(false); // Close dialog after submission
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Edit Item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        {/* Wrap the form in FormProvider */}
        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium">Product Name</label>
              <Input {...register("product_name", { required: "Product name is required" })} />
              {errors.product_name && <p className="text-red-500 text-sm">{errors.product_name.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium">Category</label>
              <Input {...register("product_name", { required: "Category is required" })} />
              {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
            </div>

            {/* Price Input */}
            <div>
              <label className="block text-sm font-medium">Price</label>
              <Input type="number" {...register("price", { required: "Price is required" })} />
              {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
            </div>

            {/* Dosage strength */}
            <div>
              <label className="block text-sm font-medium">Dosage Strength</label>
              <Input type="number" {...register("price", { required: "Price is required" })} />
              {errors.dosage_strength && <p className="text-red-500 text-sm">{errors.dosage_strength.message}</p>}
            </div>

            {/* Dosage form */}
            <div>
              <label className="block text-sm font-medium">Dosage Form</label>
              <Input type="number" {...register("price", { required: "Price is required" })} />
              {errors.dosage_form && <p className="text-red-500 text-sm">{errors.dosage_form.message}</p>}
            </div>

            {/* Net Content */}
            <div>
              <label className="block text-sm font-medium">Net Content</label>
              <Input type="number" {...register("price", { required: "Price is required" })} />
              {errors.net_content && <p className="text-red-500 text-sm">{errors.net_content.message}</p>}
            </div>

            {/* Unit of Measure Dropdown */}
            <div>
              <label className="block text-sm font-medium">Unit of Measure</label>
              <Controller
                control={control}
                name="unit_measure"
                rules={{ required: "Unit is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Gram (g)</SelectItem>
                      <SelectItem value="kg">Milligram (mg)</SelectItem>
                      <SelectItem value="liters">Milliliter (ml)</SelectItem>
                      <SelectItem value="liters">Liter (L)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.unit_measure && <p className="text-red-500 text-sm">{errors.unit_measure.message}</p>}
            </div>           
            
            <DialogFooter>
              <Button type="submit">Save Edit</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}