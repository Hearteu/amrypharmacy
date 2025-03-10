"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface StockTransferFormProps {
  initialData?: Partial<TransferFormValues>;
  isEditing?: boolean;
}
interface Products {
  product_id: number;
  full_product_name: string;
}

interface Location {
  location_id: number;
  location: string;
}

const transferSchema = z.object({
  stock_transfer_id: z.string().optional(),
  src_location_id: z.string().min(1, "Please select a source location"),
  des_location_id: z.string().min(1, "Please select a destination location"),
  transfer_date: z.date({
    required_error: "Please select a date",
  }),
  transferItems: z
    .array(
      z.object({
        stock_transfer_item_id: z.string().optional(),
        product_id: z.string({
          required_error: "Please select a product",
        }),
        ordered_quantity: z.coerce
          .number()
          .min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one item is required"),
});

type TransferFormValues = z.infer<typeof transferSchema>;

export function StockTransferForm({
  initialData,
  isEditing = false,
}: StockTransferFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState<Products[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  async function fetchLocations() {
    try {
      const response = await fetch("http://127.0.0.1:8000/pharmacy/locations/");
      const data: Location[] = await response.json();

      // Filter locations with ID 1, 2, or 3
      const filteredData = data.filter((location) =>
        [1, 2, 3].includes(location.location_id)
      );

      setLocations(filteredData);
      console.log("3 location", filteredData);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/pharmacy/products/"
        );
        const data: Products[] = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    }
    fetchProducts();
    fetchLocations();
  }, []);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: initialData || {
      src_location_id: "",
      des_location_id: "",
      stock_transfer_id: undefined,
      transfer_date: new Date(),
      transferItems: [{ product_id: "", ordered_quantity: 1 }],
    },
  });

  useEffect(() => {
    if (initialData) {
      console.log("🔄 Updating form with initialData:", initialData);
      form.reset(initialData);
    }
    console.log(initialData);
  }, [initialData, form.reset]);

  async function onSubmit(data: TransferFormValues) {
    setIsSubmitting(true);

    const formattedData = {
      ...data,
      transfer_date: format(data.transfer_date, "yyyy-MM-dd"),
    };

    try {
      const url = isEditing
        ? `http://127.0.0.1:8000/pharmacy/stock-transfers/${formattedData.stock_transfer_id}/`
        : "http://127.0.0.1:8000/pharmacy/stock-transfers/";

      await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });
      router.push("/stock-transfer");
      console.log("🟢 Submitted Data:", JSON.stringify(formattedData));
    } catch (error) {
      console.error("❌ Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function addItem() {
    const currentItems = form.getValues("transferItems");
    form.setValue("transferItems", [
      ...currentItems,
      { product_id: "", ordered_quantity: 1 },
    ]);
  }

  function removeItem(index: number) {
    const currentItems = form.getValues("transferItems");
    if (currentItems.length > 1) {
      form.setValue(
        "transferItems",
        currentItems.filter((_, i) => i !== index)
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="src_location_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Source Location</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "justify-between w-[200px]",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {locations.find(
                          (location) =>
                            location.location_id.toString() === field.value
                        )?.location || "Select source location"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className=" p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search location..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                          {locations.map((location) => (
                            <CommandItem
                              key={location.location_id}
                              value={location.location}
                              onSelect={() => {
                                field.onChange(location.location_id.toString());
                              }}
                            >
                              {location.location}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  location.location_id.toString() ===
                                    field.value
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="des_location_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Supplier</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "justify-between w-[200px]",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {locations.find(
                          (location) =>
                            location.location_id.toString() === field.value
                        )?.location || "Select vendor"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search location..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                          {locations.map((location) => (
                            <CommandItem
                              key={location.location_id}
                              value={location.location}
                              onSelect={() => {
                                field.onChange(location.location_id.toString());
                              }}
                            >
                              {location.location}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  location.location_id.toString() ===
                                    field.value
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transfer_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Transfer Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  The date when the transfer will take place
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Transfer Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {form.watch("transferItems").map((item, index) => (
              <div key={index} className="flex items-end gap-4">
                <FormField
                  control={form.control}
                  name={`transferItems.${index}.product_id`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Select Products</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? products.find(
                                    (product) =>
                                      product.product_id.toString() ===
                                      field.value
                                  )?.full_product_name
                                : "Select product"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Command>
                            <CommandInput placeholder="Search products..." />
                            <CommandList>
                              <CommandEmpty>No products found.</CommandEmpty>
                              <CommandGroup>
                                {products.map((product) => (
                                  <CommandItem
                                    key={product.product_id}
                                    value={product.full_product_name}
                                    onSelect={() => {
                                      field.onChange(
                                        product.product_id.toString()
                                      );
                                    }}
                                  >
                                    {product.full_product_name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`transferItems.${index}.ordered_quantity`}
                  render={({ field }) => (
                    <FormItem className="w-[150px]">
                      <FormLabel className={cn(index !== 0 && "sr-only")}>
                        Quantity
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={form.watch("transferItems").length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/stock-transfers")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
              ? "Update Stock Transfer"
              : "Create Stock Transfer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
