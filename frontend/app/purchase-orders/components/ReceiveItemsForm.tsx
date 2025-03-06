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
  initialData?: Partial<FormValues>;
  purchase_order_item_id: number;
}

interface POItemStatus {
  purchase_order_item_status_id: number;
  po_item_status: string;
}

const formSchema = z.object({
  purchase_order_item_id: z.string().optional(),
  purchase_order_item_status_id: z.string().min(1, "Status is required"),
  expiry_date: z.date().optional(),
  received_qty: z.union([z.coerce.number(), z.undefined()]).nullable(),
  expired_qty: z.union([z.coerce.number(), z.undefined()]).nullable(),
  damaged_qty: z.union([z.coerce.number(), z.undefined()]).nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ReceiveItemsForm({ initialData, purchase_order_item_id }: ReceiveItemsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poItemStatus, setPOItemStatus] = useState<POItemStatus[]>([]);
  const [statusOpen, setStatusOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(!!initialData);
    console.log(purchase_order_item_id, "Purchase order item")
  useEffect(() => {
    setIsEditing(!!initialData);
  }, [initialData]);

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


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchase_order_item_id: purchase_order_item_id.toString() ,
      purchase_order_item_status_id:
        initialData?.purchase_order_item_status_id ?? "",
      expiry_date: initialData?.expiry_date
        ? new Date(initialData.expiry_date)
        : new Date(),
      received_qty: initialData?.received_qty ?? 0,
      damaged_qty: initialData?.damaged_qty ?? 0,
      expired_qty: initialData?.expired_qty ?? 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      console.log("🔄 Updating form with initialData:", initialData);
      form.reset(initialData);
    }
  }, [initialData]);

  async function onSubmit(data: FormValues) {
    const formattedData = {
      ...data,
      purchase_order_item_id: purchase_order_item_id.toString(),
      expiry_date: data?.expiry_date
        ? format(new Date(data.expiry_date), "yyyy-MM-dd")
        : null,
    };

    try {
      const url = isEditing
        ? `http://127.0.0.1:8000/pharmacy/purchase-order-items/put/`
        : "http://127.0.0.1:8000/pharmacy/purchase-order-items/post/";

      await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      console.log("Submitted data", JSON.stringify(formattedData));
      console.log(formattedData)
    } catch (error) {
      console.error("error submiting", error);
    }
  }

  return (
    <>
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
                              (poItemStatus) =>
                                poItemStatus.purchase_order_item_status_id.toString() ===
                                field.value
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

          <FormField
            control={form.control}
            name="received_qty"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>To Receive:</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expired & Damaged Items */}
          <FormField
            control={form.control}
            name="expired_qty"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Expired Items:</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="damaged_qty"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Damaged Items:</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expiry Date - Full Width */}
          <FormField
            control={form.control}
            name="expiry_date"
            render={({ field }) => (
              <FormItem className="col-span-4 flex flex-col">
                <FormLabel>Expiry Date</FormLabel>
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

          {/* Submit Button */}
          <div className="col-span-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Purchase Order"
                : "Create Purchase Order"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
