import { useState } from "react";
import axios from "axios";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const statusMap: Record<number, string> = {
  1: "Draft",
  2: "Ordered",
  3: "Delayed",
  4: "Completed",
  5: "Cancelled",
};

const statusColorMap: Record<string, string> = {
  Draft: "gray",
  Ordered: "yellow",
  Delayed: "orange",
  Completed: "green",
  Cancelled: "red",
};

interface StatusComboBoxProps {
  statusId: number;
  purchaseOrderId: number;
  onStatusChange: (newStatusId: number) => void;
}

export default function StatusComboBox({
  statusId,
  purchaseOrderId,
  onStatusChange,
}: StatusComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(statusId);

  const statusName = statusMap[selectedStatus] ?? "Unknown";
  const color = statusColorMap[statusName] ?? "gray";

  async function updateStatus(newStatusId: number) {
    try {
      await axios.put(
        `http://127.0.0.1:8000/pharmacy/purchase-orders/${purchaseOrderId}/`,
        { purchase_order_status_id: newStatusId },
        { headers: { "Content-Type": "application/json" } }
      );
      setSelectedStatus(newStatusId);
      if (onStatusChange) onStatusChange(newStatusId);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-[130px] justify-between"
        >
          <Badge
            className={`bg-${color}-100 text-${color}-800 border-${color}-200 px-2 py-1 rounded-md`}
          >
            {statusName}
          </Badge>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[130px] p-0">
        <Command>
          <CommandInput placeholder="Search status..." className="h-9" />
          <CommandList>
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup>
              {Object.entries(statusMap).map(([id, label]) => {
                const statusColor = statusColorMap[label] ?? "gray";
                return (
                  <CommandItem
                    key={id}
                    value={label}
                    onSelect={() => {
                      updateStatus(Number(id));
                      setOpen(false);
                    }}
                  >
                    <Badge
                      className={`bg-${statusColor}-100 text-${statusColor}-800 border-${statusColor}-200 px-2 py-1 rounded-md`}
                    >
                      {label}
                    </Badge>
                    <Check
                      className={cn(
                        "ml-auto",
                        Number(id) === selectedStatus
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
