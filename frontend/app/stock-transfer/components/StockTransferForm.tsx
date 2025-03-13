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

interface Stock {
  location_id: number;
  location: string;
  quantity: number;
}
interface Products {
  product_id: number;
  full_product_name: string;
  stock_per_location: Stock[];
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

  const [selectedBranch, setSelectedBranch] = useState<string | null>(
    initialData?.src_location_id || null
  );
  const [selectedProducts, setSelectedProducts] = useState<{
    [key: number]: string | null;
  }>({});

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
        console.log("products", data);
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

  useEffect(() => {
    if (initialData?.src_location_id) {
      setSelectedBranch(initialData.src_location_id);
    }

    if (initialData?.transferItems) {
      const initialSelectedProducts = initialData.transferItems.reduce(
        (acc, item, index) => {
          acc[index] = item.product_id?.toString() || null;
          return acc;
        },
        {} as { [key: number]: string | null }
      );

      setSelectedProducts(initialSelectedProducts);
    }
  }, [initialData]);

  const getStockForBranch = (productId: number) => {
    const product = products.find((p) => p.product_id === productId);

    if (!product) {
      console.log("❌ Product not found in products list!", product);
      return 0;
    }

    // Find the stock entry matching the selected branch
    const stock = product.stock_per_location.find(
      (s) => s.location_id === Number(selectedBranch) // Ensure type consistency
    );

    if (!stock) {
      console.log("⚠️ No stock data found for this branch.");
      return 0;
    }
    return stock.quantity;
  };

  async function onSubmit(data: TransferFormValues) {
    setIsSubmitting(true);

    // Manually validate ordered_quantity against stock
    for (const item of data.transferItems) {
      const availableStock = getStockForBranch(Number(item.product_id));

      console.log(
        `🔍 Checking: Product ${item.product_id} | Ordered ${item.ordered_quantity} | Available ${availableStock}`
      );

      if (item.ordered_quantity > availableStock) {
        alert(
          `❌ Error: Ordered quantity exceeds available stock for product ${item.product_id}`
        );
        setIsSubmitting(false);
        return; // Stop submission
      }
    }

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

  const { setError, clearErrors, watch } = form;

  // Watch for changes in transferItems
  // useEffect(() => {
  //   const subscription = watch((value) => {
  //     const transferItems = value?.transferItems ?? []; // Ensure it's an array

  //     transferItems.forEach((item, index) => {
  //       if (!item) return; // Skip if item is undefined

  //       const availableStock = getStockForBranch(Number(item.product_id))  // Default to 0
  //       const orderedQuantity = item.ordered_quantity ?? 0; // Default to 0

  //       console.log("Ordered Quantity:", orderedQuantity);
  //       console.log("Available Stock:", availableStock);

  //       if (orderedQuantity > availableStock) { // Only trigger when greater
  //         setError(`transferItems.${index}.ordered_quantity`, {
  //           type: "manual",
  //           message: "Ordered quantity exceeds available stock",
  //         });
  //       } else {
  //         clearErrors(`transferItems.${index}.ordered_quantity`);
  //       }
  //     });
  //   });

  //   return () => subscription.unsubscribe();
  // }, [watch]);

  useEffect(() => {
    const transferItems = form.watch("transferItems") ?? [];

    transferItems.forEach((item, index) => {
      if (!item) return; // Skip if item is undefined

      const availableStock = item.product_id
        ? getStockForBranch(Number(item.product_id))
        : 0;
      const orderedQuantity = item.ordered_quantity ?? 0;

      if (orderedQuantity > availableStock) {
        setError(`transferItems.${index}.ordered_quantity`, {
          type: "manual",
          message: "Ordered quantity exceeds available stock",
        });
      } else {
        clearErrors(`transferItems.${index}.ordered_quantity`);
      }
    });
  }, [form.watch("transferItems")]); // Only runs when transferItems change

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
    <>
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
                                  field.onChange(
                                    location.location_id.toString()
                                  );
                                  setSelectedBranch(
                                    location.location_id.toString()
                                  );
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
                                  field.onChange(
                                    location.location_id.toString()
                                  );
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {form.watch("transferItems").map((item, index) => {
                const productId = form.watch(
                  `transferItems.${index}.product_id`
                );
                const orderedQuantity =
                  form.watch(`transferItems.${index}.ordered_quantity`) ?? 0;
                const availableStock = productId
                  ? getStockForBranch(Number(productId))
                  : 0; // Get available stock only if productId exists

                return (
                  <div key={index} className="flex items-end gap-4">
                    <FormField
                      control={form.control}
                      name={`transferItems.${index}.product_id`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col w-8/12">
                          <div className="flex flex-row items-center gap-2">
                            <FormLabel>Select Products</FormLabel>
                            {selectedProducts[index] && (
                              <p className="text-sm text-gray-500">
                                Stock Available:{" "}
                                {getStockForBranch(
                                  Number(selectedProducts[index])
                                )}
                              </p>
                            )}
                            <FormMessage />
                          </div>
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
                                  <CommandEmpty>
                                    No products found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {products.map((product) => (
                                      <CommandItem
                                        key={product.product_id}
                                        value={product.full_product_name}
                                        onSelect={() => {
                                          field.onChange(
                                            product.product_id.toString()
                                          );
                                          setSelectedProducts((prev) => ({
                                            ...prev,
                                            [index]:
                                              product.product_id.toString(),
                                          }));
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
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`transferItems.${index}.ordered_quantity`}
                      render={({ field }) => (
                        <FormItem className="w-[150px]">
                          <div className="flex flex-row items-center gap-2">
                            <FormLabel className={cn(index !== 0 && "sr-only")}>
                              Quantity
                            </FormLabel>
                            <FormMessage />
                          </div>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
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
                );
              })}
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
    </>
  );
}
