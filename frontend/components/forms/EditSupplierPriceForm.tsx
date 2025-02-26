"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface EditSupplierPriceProps {
  supplier_item_id: number;
  onSuccess: (data: AxiosResponse) => void;
}

const formSchema = z.object({
  supplier_price: z.string().nonempty({ message: "Input a price" }),
});

export default function EditSupplierPriceForm({
  supplier_item_id,
  onSuccess,
}: EditSupplierPriceProps) {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_price: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/supplier-items/edit/${supplier_item_id}/`,
        values
      );
      onSuccess(response);
      console.log(response.data);
    } catch (error) {
      console.log("❌ Error editting suppliers item:", error);

      if (axios.isAxiosError(error)) {
        console.error("⚠️ Axios Error Response:", error.response?.data);
      }
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Supplier Price (Editable) */}
          <FormField
            control={form.control}
            name="supplier_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier Price</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Supplier Price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit">Update Price</Button>
          </div>
        </form>
      </Form>
    </>
  );
}
