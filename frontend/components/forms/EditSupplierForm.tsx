"use client";

import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosResponse } from "axios";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface Suppliers {
  supplier_id: number;
  supplier_name: string;
  first_name: string;
  last_name: string;
  contact: string;
  email: string;
  address: string;
  vat_num: string;
  status_id: number;
}

interface Status {
  status_id: number;
  status: string;
}

interface EditSupplierFormProps {
  supplier_id: number;
  onSuccess: (data: AxiosResponse) => void;
}

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
    .regex(/^\d{10}$/, { message: "Contact must be a valid 10-digit number." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  vat_num: z.string(),
  status_id: z.string().nonempty({ message: "Status is required." }),
});

export default function EditSupplierForm({
  supplier_id,
  onSuccess,
}: EditSupplierFormProps) {
  const [supplierData, setSupplierData] = useState<Suppliers | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_name: "",
      first_name: "",
      last_name: "",
      contact: "",
      email: "",
      address: "",
      vat_num: "",
      status_id: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        const supplierResponse = await axios.get(
          `http://127.0.0.1:8000/pharmacy/suppliers/${supplier_id}/`
        );

        console.log("Raw API Response:", supplierResponse.data);

        // Ensure productData is an object, not an array
        const supplier = Array.isArray(supplierResponse.data)
          ? supplierResponse.data[0] // If it's an array, get the first item
          : supplierResponse.data; // Otherwise, use it directly

        if (supplier) {
          setSupplierData(supplier);
          // console.log("Product data set successfully:", product);
        } else {
          console.warn("API returned no product data.");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };

    if (supplier_id) {
      console.log(`Fetching product data for product_id: ${supplier_id}`);
      fetchSupplierData(); // ✅ Call the function!
    }
  }, [supplier_id]);

  useEffect(() => {
    if (supplierData) {
      form.reset({
        supplier_name: supplierData.supplier_name || "",
        first_name: supplierData.first_name || "",
        last_name: supplierData.last_name || "",
        contact: String(supplierData.contact) || "",
        email: supplierData.email || "",
        address: supplierData.address || "",
        vat_num: supplierData.vat_num || "",
        status_id: String(supplierData.status_id) || "",
      });

      console.log("Form reset with supplier data:", supplierData);
    }
  }, [supplierData]);

  //Combo box for Status
  const [status, setStatus] = useState<Status[]>([]);

  const fetchStatus = async () => {
    try {
      const statusRes = await fetch("http://127.0.0.1:8000/pharmacy/status/");
      const statusData: Status[] = await statusRes.json();
      setStatus(statusData);
    } catch (error) {
      console.error("Error fetching brand data", error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/suppliers/${supplier_id}/`,
        values
      );
      onSuccess(response);
      console.log(response.data);
    } catch (error) {
      console.log("❌ Error adding new suppliers:", error);

      if (axios.isAxiosError(error)) {
        console.error("⚠️ Axios Error Response:", error.response?.data);
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
                <FormLabel>Supplier Name</FormLabel>
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
                <FormLabel>Contact Person First Name</FormLabel>
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
                <FormLabel>Contact Person Last Name</FormLabel>
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
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter supplier contact number"
                    {...field}
                  />
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
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter supplier email" {...field} />
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
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter supplier address" {...field} />
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
                <FormLabel>VAT Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter VAT Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Category</FormLabel>
                <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-[200px] justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {
                          status.find(
                            (stat) => stat.status_id.toString() == field.value
                          )?.status
                        }
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search category..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>
                          Press ENTER to Add New Category
                        </CommandEmpty>
                        <CommandGroup>
                          {status.map((stat) => (
                            <CommandItem
                              key={stat.status_id}
                              value={stat.status}
                              onSelect={() => {
                                field.onChange(stat.status_id.toString());
                                setStatusOpen(false);
                              }}
                            >
                              {stat.status}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  stat.status === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
