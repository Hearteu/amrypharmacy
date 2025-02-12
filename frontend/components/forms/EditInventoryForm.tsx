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

export default function EditInventoryForm() {
  const [open, setOpen] = useState(false);

  const formMethods = useForm({
    defaultValues: {
      product_name: "",
      stockroom_inventory: "",
      display_inventory: "",
      branch: "",
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
    console.log("Edit Inventory Data:", data);
    setOpen(false); // Close dialog after submission
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Edit Inventory Item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Inventory</DialogTitle>
        </DialogHeader>

        {/* Wrap the form in FormProvider */}
        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium">Product Name</label>
              <Input 
                {...register("product_name", { required: "Product name is required" })} 
                readOnly
                className="bg-gray-100"
              />
              {errors.product_name && <p className="text-red-500 text-sm">{errors.product_name.message}</p>}
            </div>

            {/* Stockroom Inventory */}
            <div>
              <label className="block text-sm font-medium">Stockroom Inventory</label>
              <Input {...register("product_name", { required: "Stockroom inventory is required" })} />
              {errors.stockroom_inventory && <p className="text-red-500 text-sm">{errors.stockroom_inventory.message}</p>}
            </div>

            {/* Display Inventory */}
            <div>
              <label className="block text-sm font-medium">Category</label>
              <Input {...register("product_name", { required: "Category is required" })} />
              {errors.display_inventory && <p className="text-red-500 text-sm">{errors.display_inventory.message}</p>}
            </div>            

            {/* Branch */}
            <div>
              <label className="block text-sm font-medium">Unit of Measure</label>
              <Controller
                control={control}
                name="branch"
                rules={{ required: "Branch is required" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="talaingod">Talaingod</SelectItem>
                      <SelectItem value="asuncion">Asuncion</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.branch && <p className="text-red-500 text-sm">{errors.branch.message}</p>}
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