"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface ReceiveItemsProps {
  purchase_order_item_id: number;
  onSuccess: () => void;
}

interface POItemStatus {
  purchase_order_item_status_id: number;
  po_item_status: string;
}

interface POIStatus {
  purchase_order_item_status_id: string;
  ordered_qty: number;
  expiry_date: Date;
  received_qty: number;
  expired_qty: number;
  damaged_qty: number;
}

const getFormSchema = (orderedQuantity: number | null) =>
  z
    .object({
      purchase_order_item_status_id: z
        .string()
        .min(1, "Please select a status."),
      expiry_date: z.date().optional(), // Optional initially
      received_qty: z.coerce
        .number()
        .min(0, "Received quantity cannot be negative."),
      expired_qty: z.coerce
        .number()
        .min(0, "Expired quantity cannot be negative."),
      damaged_qty: z.coerce
        .number()
        .min(0, "Damaged quantity cannot be negative."),
    })
    // ✅ General rule: Total received, expired, and damaged should not exceed ordered quantity.
    .refine(
      (data) => {
        if (orderedQuantity === null) return true; // Skip validation if not loaded
        const total = data.received_qty + data.expired_qty + data.damaged_qty;
        return total <= orderedQuantity;
      },
      {
        message:
          "Total quantity (Received + Expired + Damaged) cannot be more than the Ordered Quantity.",
        path: ["purchase_order_item_status_id"],
      }
    )
    // ✅ Status: "2" (Received) - Expired and Damaged must be 0.
    .refine(
      (data) => {
        if (data.purchase_order_item_status_id === "2") {
          return data.expired_qty === 0 && data.damaged_qty === 0;
        }
        return true;
      },
      {
        message:
          "Expired and damaged quantities must be 0 when the order is marked as Received.",
        path: ["purchase_order_item_status_id"],
      }
    )
    .refine(
      (data) => {
        if (data.purchase_order_item_status_id === "2") {
          return data.received_qty === orderedQuantity;
        }
        return true;
      },
      {
        message:
          "Received quantity must be equal to the Ordered Quantity when the order is marked as Received.",
        path: ["received_qty"],
      }
    )
    // ✅ Status: "3" (Partially Received) - Received quantity must NOT be equal to ordered quantity.
    .refine(
      (data) => {
        if (
          data.purchase_order_item_status_id === "3" &&
          orderedQuantity !== null
        ) {
          return data.received_qty !== orderedQuantity;
        }
        return true;
      },
      {
        message:
          "Received quantity must be less than the Ordered Quantity for a Partially Received order.",
        path: ["received_qty"],
      }
    )
    .refine(
      (data) => {
        if (
          data.purchase_order_item_status_id === "3" &&
          orderedQuantity !== null
        ) {
          return (data.damaged_qty ?? 0) > 0 || (data.expired_qty ?? 0) > 0;
        }
        return true;
      },
      {
        message:
          "Either Damaged Quantity or Expired Quantity is required for a Partially Received order.",
        path: ["purchase_order_item_status_id"],
      }
    )
    // ✅ Status: "4" (Missing) - Received, Expired, and Damaged must all be 0.
    .refine(
      (data) => {
        if (data.purchase_order_item_status_id === "4") {
          return (
            data.received_qty === 0 &&
            data.expired_qty === 0 &&
            data.damaged_qty === 0
          );
        }
        return true;
      },
      {
        message:
          "This order is marked as Missing. Received, Expired, and Damaged quantities must all be 0.",
        path: ["purchase_order_item_status_id"],
      }
    )
    // ✅ Status: "5" (Defective) - Received must be 0, but Expired or Damaged should have a value.
    .refine(
      (data) => {
        if (data.purchase_order_item_status_id === "5") {
          return (
            data.received_qty === 0 &&
            (data.expired_qty > 0 || data.damaged_qty > 0)
          );
        }
        return true;
      },
      {
        message:
          "This order is marked as Defective. Enter Expired or Damaged quantity, and Received must be 0.",
        path: ["purchase_order_item_status_id"],
      }
    )
    .refine(
      (data) => {
        if (data.purchase_order_item_status_id === "5") {
          return (
            (data.expired_qty ?? 0) + (data.damaged_qty ?? 0) ===
            orderedQuantity
          );
        }
        return true;
      },
      {
        message:
          "The total of Expired and Damaged quantities must be equal to the Ordered Quantity",
        path: ["purchase_order_item_status_id"],
      }
    )
    // ✅ Status: NOT "4" or "5" - Expiry date is required.
    .refine(
      (data) => {
        if (!["4", "5"].includes(data.purchase_order_item_status_id)) {
          return !!data.expiry_date;
        }
        return true;
      },
      {
        message: "Please provide an expiry date for this status.",
        path: ["expiry_date"],
      }
    );

type FormValues = z.infer<ReturnType<typeof getFormSchema>>;

export default function ReceiveItemsForm({
  purchase_order_item_id,
  onSuccess,
}: ReceiveItemsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poItemStatus, setPOItemStatus] = useState<POItemStatus[]>([]);
  const [statusOpen, setStatusOpen] = useState(false);
  const [initialData, setInitialData] = useState<Partial<POIStatus> | null>(
    null
  );
  const [orderedQuantity, setOrderedQuantity] = useState<number | null>(null);

  // Fetch PO Item Statuses
  useEffect(() => {
    async function fetchPOItemStatus() {
      try {
        const response = await axios.get<POItemStatus[]>(
          "http://127.0.0.1:8000/pharmacy/purchase-order-item-status/"
        );
        setPOItemStatus(response.data);
      } catch (error) {
        console.error("Error fetching PO item status:", error);
      }
    }
    fetchPOItemStatus();
  }, []);

  useEffect(() => {
    async function fetchPOItemData() {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/pharmacy/purchase-order-items/${purchase_order_item_id}/`
        );
        const data = response.data;

        console.log("🛠️ API Data: ", data); // ✅ Log raw data

        if (!Array.isArray(data) || data.length === 0) {
          console.warn("⚠️ API returned an empty array or invalid data.");
          return;
        }

        // ✅ Extract the first object from the array
        const item = data[0];
        setOrderedQuantity(Number(item.ordered_qty) || 0);
        console.log("ordered qty", item.ordered_qty);

        const formattedData: Partial<POIStatus> = {
          purchase_order_item_status_id: String(
            item.purchase_order_item_status_id
          ),
          expiry_date: item.expiry_date
            ? new Date(item.expiry_date)
            : undefined,
          received_qty: Number(item.received_qty) || 0,
          expired_qty: Number(item.expired_qty) || 0,
          damaged_qty: Number(item.damaged_qty) || 0,
        };

        console.log("✅ Formatted Data: ", formattedData);
        setInitialData(formattedData);
      } catch (error) {
        console.error("❌ Error fetching initial PO item data:", error);
      }
    }

    if (purchase_order_item_id) {
      fetchPOItemData();
    }
  }, [purchase_order_item_id]);

  // ✅ Initialize form without `defaultValues` to allow updates
  const form = useForm<FormValues>({
    resolver: zodResolver(getFormSchema(orderedQuantity)),
    defaultValues: {
      purchase_order_item_status_id: "",
      expiry_date: undefined,
      received_qty: 0,
      damaged_qty: 0,
      expired_qty: 0,
    },
  });

  // ✅ Ensure `initialData` updates properly
  useEffect(() => {
    if (initialData) {
      console.log("🔄 Updating form with initial data:", initialData);
      form.reset({
        ...initialData,
        expiry_date: initialData.expiry_date
          ? new Date(initialData.expiry_date)
          : undefined,
      });
    }
  }, [initialData]);

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    const formattedData = {
      purchase_order_item_status_id:
        parseInt(data.purchase_order_item_status_id, 10) || null,
      expiry_date: data.expiry_date
        ? format(new Date(data.expiry_date), "yyyy-MM-dd")
        : null,
      received_qty: data.received_qty ?? 0,
      expired_qty: data.expired_qty ?? 0,
      damaged_qty: data.damaged_qty ?? 0,
    };

    console.log("🔄 Submitting PUT request with data:", formattedData);

    try {
      await axios.put(
        `http://127.0.0.1:8000/pharmacy/purchase-order-items/${purchase_order_item_id}/`,
        formattedData,
        { headers: { "Content-Type": "application/json" } }
      );
      onSuccess();
      console.log("✅ Successfully updated PO item:", purchase_order_item_id);
    } catch (error) {
      console.error("❌ Error updating PO item:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col space-y-4">
        {orderedQuantity !== null && (
          <p className="text-sm text-gray-600">
            Ordered quantity:{" "}
            <span className="text-green-600">{orderedQuantity}</span>
          </p>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col space-y-4"
          >
            {/* Status */}
            <FormField
              control={form.control}
              name="purchase_order_item_status_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "mt-1 w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? poItemStatus.find(
                                (status) =>
                                  status.purchase_order_item_status_id.toString() ===
                                  field.value
                              )?.po_item_status
                            : "Select status"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full">
                      <Command>
                        <CommandInput placeholder="Search status..." />
                        <CommandList>
                          <CommandEmpty>No status found.</CommandEmpty>
                          <CommandGroup>
                            {poItemStatus.map((status) => (
                              <CommandItem
                                key={status.purchase_order_item_status_id}
                                value={status.po_item_status}
                                onSelect={() => {
                                  field.onChange(
                                    status.purchase_order_item_status_id.toString()
                                  );
                                  setStatusOpen(false);
                                }}
                              >
                                {status.po_item_status}
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

            {/* Received Quantity */}
            <FormField
              control={form.control}
              name="received_qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Receive:</FormLabel>
                  <FormControl>
                    <Input className="mt-1" type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expired Quantity */}
            <FormField
              control={form.control}
              name="expired_qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expired Items:</FormLabel>
                  <FormControl>
                    <Input className="mt-1" type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Damaged Quantity */}
            <FormField
              control={form.control}
              name="damaged_qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Damaged Items:</FormLabel>
                  <FormControl>
                    <Input className="mt-1" type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiry Date */}
            <FormField
              control={form.control}
              name="expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="mt-1 w-full">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(field.value, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Updating..." : "Receive Items"}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
}
