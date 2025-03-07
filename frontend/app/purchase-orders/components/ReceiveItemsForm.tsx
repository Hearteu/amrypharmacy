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
}

interface POItemStatus {
  purchase_order_item_status_id: number;
  po_item_status: string;
}

const formSchema = z.object({
  purchase_order_item_status_id: z.string().min(1, "Status is required"),
  expiry_date: z.date().optional(),
  received_qty: z.coerce.number().min(0, "Quantity cannot be negative"),
  expired_qty: z.coerce.number().min(0, "Quantity cannot be negative"),
  damaged_qty: z.coerce.number().min(0, "Quantity cannot be negative"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ReceiveItemsForm({ purchase_order_item_id }: ReceiveItemsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poItemStatus, setPOItemStatus] = useState<POItemStatus[]>([]);
  const [statusOpen, setStatusOpen] = useState(false);
  const [initialData, setInitialData] = useState<Partial<FormValues> | null>(null);

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

  // Fetch Initial Data for the Form
  useEffect(() => {
    async function fetchPOItemData() {
      try {
        const response = await axios.get<FormValues>(
          `http://127.0.0.1:8000/pharmacy/purchase-order-items/${purchase_order_item_id}/`
        );
        const data = response.data;

        setInitialData({
          purchase_order_item_status_id: data.purchase_order_item_status_id.toString(),
          expiry_date: data.expiry_date ? new Date(data.expiry_date) : undefined,
          received_qty: data.received_qty ?? 0,
          expired_qty: data.expired_qty ?? 0,
          damaged_qty: data.damaged_qty ?? 0,
        });
      } catch (error) {
        console.error("Error fetching initial PO item data:", error);
      }
    }

    fetchPOItemData();
  }, [purchase_order_item_id]);

  // Initialize Form with Data (after fetch)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      purchase_order_item_status_id: "",
      expiry_date: undefined,
      received_qty: 0,
      damaged_qty: 0,
      expired_qty: 0,
    },
  });

  // Update Form when Initial Data is Set
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    const formattedData = {
      purchase_order_item_status_id: parseInt(data.purchase_order_item_status_id, 10) || null,
      expiry_date: data.expiry_date ? format(new Date(data.expiry_date), "yyyy-MM-dd") : null,
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

      console.log("✅ Successfully updated PO item:", purchase_order_item_id);
    } catch (error) {
      console.error("❌ Error updating PO item:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-4 gap-4 py-4"
      >
        {/* Status & To Receive */}
        <FormField
          control={form.control}
          name="purchase_order_item_status_id"
          render={({ field }) => (
            <FormItem className="flex flex-col col-span-2">
              <FormLabel>Status</FormLabel>
              <Popover open={statusOpen} onOpenChange={setStatusOpen}>
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
                        ? poItemStatus.find(
                            (status) =>
                              status.purchase_order_item_status_id.toString() === field.value
                          )?.po_item_status
                        : "Select status"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0">
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
                              field.onChange(status.purchase_order_item_status_id.toString());
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

        {/* Other Fields (Received, Expired, Damaged) */}
        <FormField control={form.control} name="received_qty" render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>To Receive:</FormLabel>
            <FormControl>
              <Input type="number" min={0} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="expired_qty" render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>Expired Items:</FormLabel>
            <FormControl>
              <Input type="number" min={0} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="damaged_qty" render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>Damaged Items:</FormLabel>
            <FormControl>
              <Input type="number" min={0} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Expiry Date */}
        <FormField control={form.control} name="expiry_date" render={({ field }) => (
          <FormItem className="col-span-4 flex flex-col">
            <FormLabel>Expiry Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )} />

        <div className="col-span-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Updating..." : "Update Purchase Order Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
