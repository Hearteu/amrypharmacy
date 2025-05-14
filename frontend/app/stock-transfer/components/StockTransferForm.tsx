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
import { Textarea } from "@/components/ui/textarea";

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
  expected_date: z.date({
    required_error: "Please select a date",
  }),
  notes: z.string(),
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

  async function fetchLocations() {
    try {
      const response = await fetch("http://127.0.0.1:8000/pharmacy/locations/");
      const data: Location[] = await response.json();

      // Filter locations with ID 1, 2, or 3
      const filteredData = data.filter((location) =>
        [1, 2, 3].includes(location.location_id)
      );

      setLocations(filteredData);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch("http://127.0.0.1:8000/pharmacy/products/");
      const data: Products[] = await response.json();
      setProducts(data);
      console.log("products", data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }

  useEffect(() => {
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
      expected_date: new Date(),
      notes: "",
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

  console.log("initialData", initialData);
  useEffect(() => {
    if (initialData?.src_location_id) {
      setSelectedBranch(initialData.src_location_id);
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

      if (item.ordered_quantity > availableStock) {
        alert(
          `❌ Error: Ordered quantity exceeds available stock for product ${item.product_id}`
        );
        setIsSubmitting(false);
        return;
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
                            "justify-between w-full",
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
                  <FormLabel>Destination Location</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between w-full",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {locations.find(
                            (location) =>
                              location.location_id.toString() === field.value
                          )?.location || "Select destination location"}
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
                    The date when the stock is scheduled to leave the source
                    location.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected Delivery Date</FormLabel>
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
                    The estimated date when the stock is expected to arrive at
                    the destination location.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter any additional notes or instructions"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-4 ">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Transfer Items</h3>
            </div>

            <div className="space-y-4">
              {form.watch("transferItems").map((item, index) => {
                return (
                  <div key={index} className="flex items-end gap-4 w-full">
                    <FormField
                      control={form.control}
                      name={`transferItems.${index}.product_id`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col flex-1">
                          <div className="flex flex-row items-center gap-2">
                            <FormLabel>Select Products</FormLabel>
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
                                  {(() => {
                                    const selectedProduct = products.find(
                                      (product) =>
                                        product.product_id.toString() ===
                                        field.value
                                    );
                                    const stockForSelectedBranch =
                                      selectedProduct?.stock_per_location.find(
                                        (stock) =>
                                          stock.location_id.toString() ===
                                          selectedBranch
                                      );

                                    return selectedProduct ? (
                                      <div className="flex flex-row gap-4">
                                        <span>
                                          {selectedProduct.full_product_name}
                                        </span>
                                        {stockForSelectedBranch ? (
                                          <span className="text-gray-500 text-sm">
                                            {stockForSelectedBranch.quantity} in
                                            stock
                                          </span>
                                        ) : (
                                          <span className="text-red-500 text-sm">
                                            Out of stock
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      "Select product"
                                    );
                                  })()}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 ">
                              <Command>
                                <CommandInput placeholder="Search products..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No products found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {products.map((product) => {
                                      const stockForSelectedBranch =
                                        product.stock_per_location.find(
                                          (stock) =>
                                            stock.location_id.toString() ===
                                            selectedBranch
                                        );

                                      return (
                                        <CommandItem
                                          key={product.product_id}
                                          value={product.full_product_name}
                                          onSelect={() => {
                                            field.onChange(
                                              product.product_id.toString()
                                            );
                                          }}
                                        >
                                          <div className="flex justify-between w-full">
                                            <span>
                                              {product.full_product_name}
                                            </span>
                                            {stockForSelectedBranch ? (
                                              <span className="text-gray-500">
                                                (
                                                {
                                                  stockForSelectedBranch.quantity
                                                }{" "}
                                                in stock)
                                              </span>
                                            ) : (
                                              <span className="text-red-500">
                                                Out of stock
                                              </span>
                                            )}
                                          </div>
                                        </CommandItem>
                                      );
                                    })}
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={addItem}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>

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
