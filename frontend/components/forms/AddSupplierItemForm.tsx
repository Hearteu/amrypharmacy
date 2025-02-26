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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

const formSchema = z.object({
  supplier_id: z.string().nonempty(),
  product_id: z.string().nonempty({ message: "Select a product" }),
  supplier_price: z.string().nonempty({ message: "Input a price" }),
});

interface Products {
  product_id: number;
  full_product_name: string;
}

interface AddSupplierItemProps {
  onSuccess: (data: AxiosResponse) => void;
  supplier_id: number;
}
export default function AddSupplierItemForm({
  onSuccess,
  supplier_id,
}: AddSupplierItemProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_id: supplier_id.toString(),
      product_id: "",
      supplier_price: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/pharmacy/supplier-items/",
        values
      );
      console.log("Supplier added", response);
      onSuccess(response);
    } catch (error) {
      console.error("Error Adding Supplier Item", error);

      if (axios.isAxiosError(error)) {
        console.error("⚠️ Axios Error Response:", error.response);
      }
    }
  };

  const [products, setProducts] = useState<Products[]>([]);
  const [prodOpen, setProdOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      const productsRes = await fetch(
        "http://127.0.0.1:8000/pharmacy/products/"
      );
      const productsData: Products[] = await productsRes.json();

      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products data:", error);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  const [supplierName, setSupplierName] = useState<string>("");
  useEffect(() => {
    const fetchSupplierName = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/pharmacy/suppliers/${supplier_id}/`
        );
        const data = await res.json();
        setSupplierName(data.supplier_name); // Assuming the response has 'supplier_name'
      } catch (error) {
        console.error("Error fetching supplier name:", error);
      }
    };

    fetchSupplierName();
  }, [supplier_id]);
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <FormField
          control={form.control}
          name="supplier_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <FormControl>
                <Input value={supplierName} readOnly className="bg-gray-100" />
              </FormControl>
            </FormItem>
          )}
        />

          <FormField
            control={form.control}
            name="product_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Category</FormLabel>
                <Popover open={prodOpen} onOpenChange={setProdOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-[370px] justify-between truncate",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {products.find(
                          (product) =>
                            product.product_id.toString() == field.value
                        )?.full_product_name || "Select Category"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search products..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No Products Found</CommandEmpty>
                        <CommandGroup>
                          {products.map((product) => (
                            <CommandItem
                              key={product.product_id}
                              value={product.full_product_name}
                              onSelect={() => {
                                field.onChange(product.product_id.toString());
                                setProdOpen(false);
                              }}
                            >
                              {product.full_product_name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  product.full_product_name === field.value
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

          <FormField
            control={form.control}
            name="supplier_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier Price:</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Supplier Price" {...field} />
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
