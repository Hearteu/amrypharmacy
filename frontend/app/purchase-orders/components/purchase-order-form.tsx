"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import router from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface PurchaseOrderFormProps {
  initialData?: Partial<FormValues>;
  isEditing?: boolean;
}

interface SupplierItem {
  product_id: number;
  product_name: string;
  supplier_price: number;
}

interface Supplier {
  supplier_id: number;
  supplier_name: string;
}

interface Units {
    unit_id: number;
    unit: string;
}

const formSchema = z.object({
  supplier_id: z.string().min(1, "Supplier is required"),
  order_date: z.date(),
  expected_delivery_date: z.date(),
  lineItems: z
    .array(
      z.object({
        product_id: z.string().min(1, "Product is required"),
        unit_id: z.string().min(1, "Unit is required"),
        ordered_quantity: z.coerce
          .number()
          .min(1, "Quantity must be at least 1"),
        supplier_price: z.coerce
          .number()
          .min(0.01, "Price must be greater than 0"),
      })
    )
    .min(1, "At least one item is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function PurchaseOrderForm({
  initialData,
  isEditing = false,
}: PurchaseOrderFormProps) {
  //   const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [items, setItems] = useState<SupplierItem[]>([]);
  const [units, setUnits] = useState<Units[]>([]);

  // Fetch suppliers
  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/pharmacy/suppliers/"
        );
        const data: Supplier[] = await response.json();
        setSuppliers(data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    }
    fetchSuppliers();
  }, []);

  useEffect(() => {
    async function fetchUnits() {
        try {
            const response = await fetch(
                "http://127.0.0.1:8000/pharmacy/unit/"
              );
              const data: Units[] = await response.json();
              setUnits(data);
        } catch (error) {
            console.error("Error fetching Units", error)
        }
    }
    fetchUnits();
  }, [])

  // Fetch supplier items based on selected supplier
  useEffect(() => {
    if (selectedSupplier === null) return;

    async function fetchSupplierItems() {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/pharmacy/supplier-items/${selectedSupplier}/`
        );
        const data: SupplierItem[] = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching supplier items:", error);
      }
    }
    fetchSupplierItems();
  }, [selectedSupplier]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      supplier_id: "",
      order_date: new Date(),
      expected_delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      lineItems: [
        { product_id: "", unit_id: "", ordered_quantity: 1, supplier_price: 0 },
      ],
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    console.log("Submitted Data:", data);
  
    // Convert dates to YYYY-MM-DD format
    const formattedData = {
      ...data,
      order_date: format(data.order_date, "yyyy-MM-dd"),
      expected_delivery_date: format(data.expected_delivery_date, "yyyy-MM-dd"),
    };
  
    try {
      await fetch("http://127.0.0.1:8000/pharmacy/purchase-orders/", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });
      console.log(JSON.stringify(formattedData));
      // router.push("/purchase-orders");
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function addLineItem() {
    form.setValue("lineItems", [
      ...form.getValues("lineItems"),
      { product_id: "", unit_id: "", ordered_quantity: 1, supplier_price: 0 },
    ]);
  }

  function removeLineItem(index: number) {
    const items = form.getValues("lineItems");
    if (items.length > 1) {
      form.setValue(
        "lineItems",
        items.filter((_, i) => i !== index)
      );
    }
  }

  function selectProduct(index: number, product_id: string) {
    const product = items.find((p) => p.product_id.toString() === product_id);
    if (product) {
      form.setValue(`lineItems.${index}.product_id`, product_id);
      form.setValue(
        `lineItems.${index}.supplier_price`,
        product.supplier_price
      );
    }
  }

  const lineItems = form.watch("lineItems");
  const total = lineItems.reduce((sum, item) => {
    return sum + (item.ordered_quantity || 0) * (item.supplier_price || 0);
  }, 0);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
                <CardDescription>
                  Enter the details for this purchase order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="supplier_id"
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
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? suppliers.find(
                                    (supplier) =>
                                      supplier.supplier_id.toString() ===
                                      field.value
                                  )?.supplier_name
                                : "Select vendor"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Command>
                            <CommandInput placeholder="Search vendors..." />
                            <CommandList>
                              <CommandEmpty>No vendor found.</CommandEmpty>
                              <CommandGroup>
                                {suppliers.map((supplier) => (
                                  <CommandItem
                                    key={supplier.supplier_id}
                                    value={supplier.supplier_name}
                                    onSelect={() => {
                                        const selectedId = supplier.supplier_id.toString();
                                        form.setValue("supplier_id", selectedId);
                                        setSelectedSupplier(Number(selectedId)); 
                                    }}
                                  >
                                    {supplier.supplier_name}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="order_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Order Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expected_delivery_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expected Delivery</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Items</div>
                    <div className="text-2xl font-bold">{lineItems.length}</div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Total Amount</div>
                    <div className="text-2xl font-bold">
                      ${total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Add products to your purchase order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.product_id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn("justify-between w-full", !field.value && "text-muted-foreground")}
                                >
                                  {field.value
                                    ? items.find((item) => item.product_id.toString() === field.value)?.product_name
                                    : "Select product"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="p-0">
                              <Command>
                                <CommandInput placeholder="Search products..." />
                                <CommandList>
                                  <CommandEmpty>No product found.</CommandEmpty>
                                  <CommandGroup>
                                    {items.map((item) => (
                                      <CommandItem
                                        key={item.product_id}
                                        value={item.product_name}
                                        onSelect={() => {
                                          selectProduct(index, item.product_id.toString())
                                        }}
                                      >
                                        {item.product_name}
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
                  </div>

                  <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name={`lineItems.${index}.unit_id`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn("justify-between w-full", !field.value && "text-muted-foreground")}
                              >
                                {field.value
                                  ? units.find((unit) => unit.unit_id.toString() === field.value)?.unit
                                  : "Select unit"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
                            <Command>
                              <CommandInput placeholder="Search units..." />
                              <CommandList>
                                <CommandEmpty>No unit found.</CommandEmpty>
                                <CommandGroup>
                                  {units.map((unit) => (
                                    <CommandItem
                                      key={unit.unit_id}
                                      value={unit.unit}
                                      onSelect={() => {
                                        form.setValue(`lineItems.${index}.unit_id`, unit.unit_id.toString());
                                      }}
                                    >
                                      {unit.unit}
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
                  </div>

                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.ordered_quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.supplier_price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/purchase-orders")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Purchase Order"}
            </Button>
          </CardFooter>
        </Card>     

        </form>
      </Form>
    </>
  );
}
