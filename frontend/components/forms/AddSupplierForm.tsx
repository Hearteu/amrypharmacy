"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosResponse } from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

const formSchema = z.object({
  supplier_name: z
    .string()
    .min(2, { message: "Supplier name must be at least 2 characters." }),
  first_name: z
    .string()
    .min(2, { message: "First name must be at least 2 characters." }),
  last_name: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters." }),
  address: z
    .string()
    .min(5, { message: "Address must be at least 5 characters." }),
  contact: z
    .string()
    .regex(/^\d{11}$/, { message: "Contact must be a valid 11-digit number." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  vat_num: z.string(),
});

interface AddSupplierFormProps {
  onSuccess: (data: AxiosResponse) => void;
}

export default function AddSupplierForm({ onSuccess }: AddSupplierFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_name: "",
      first_name: "",
      last_name: "",
      address: "",
      contact: "",
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/pharmacy/suppliers/",
        values
      );
      console.log("Supplier added", response);
      onSuccess(response);
    } catch (error) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        console.error("⚠️ Axios Error Response:", error.response);
      }
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="supplier_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier Name:</FormLabel>
                <FormControl>
                  <Input placeholder="Enter supplier name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person First Name:</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter contact person first name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person Last Name:</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter contact person last name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address:</FormLabel>
                <FormControl>
                  <Input placeholder="Enter address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number:</FormLabel>
                <FormControl>
                  <Input placeholder="Enter contact number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email:</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vat_num"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VAT Number:</FormLabel>
                <FormControl>
                  <Input placeholder="Enter VAT Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Form>
    </>
  );
}
