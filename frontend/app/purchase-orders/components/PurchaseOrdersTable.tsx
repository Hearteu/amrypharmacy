"use client";

import { useEffect, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Check,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions";
import { DataTablePagination } from "@/components/table/DataTablePagination";
import axios from "axios";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusMap: Record<number, string> = {
  1: "Draft",
  2: "Ordered",
  3: "Delayed",
  4: "Completed",
  5: "Cancelled",
};

const statusColorMap: Record<string, string> = {
  Draft: "gray",
  Ordered: "green",
  Delayed: "orange",
  Completed: "blue",
  Cancelled: "red",
};

interface PurchaseOrders {
  purchase_order_id: number;
  po_id: string;
  supplier: SupplierArray;
  order_date: string;
  status: string;
  status_id: number;
}

interface SupplierArray {
  name: string;
}

interface POStatus {
  purchase_order_status_id: number;
  purchase_order_status: string;
}

export default function PurchaseOrdersTable() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrders[]>([]);
  const [poStatus, setPOStatus] = useState<POStatus[]>([]);

  async function fetchPO() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/pharmacy/purchase-orders/"
      );
      const data: PurchaseOrders[] = await response.json();
      setPurchaseOrders(data);
    } catch (error) {
      console.error("Error fetching purchase order", error);
    }
  }

  async function fetchPOStatus() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/pharmacy/purchase-order-status/"
      );

      const data: POStatus[] = await response.json();
      setPOStatus(data);
    } catch (error) {
      console.error("error fetching status", error);
    }
  }

  useEffect(() => {
    fetchPO();
    fetchPOStatus();
  }, []);

  async function cancelPurchaseOrder(orderId: number) {
    console.log(orderId);
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/purchase-orders/${orderId}/`
      );

      console.log("Purchase order canceled:", response.data);
      fetchPO();
      return response.data;
    } catch (error) {
      console.error("Error canceling purchase order:", error);
      throw error;
    }
  }

  const columns: ColumnDef<PurchaseOrders>[] = [
    {
      accessorKey: "po_id",
      header: "PO Number",
      cell: ({ row }) => (
        <Link
          href={`/purchase-orders/${row.original.purchase_order_id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("po_id")}
        </Link>
      ),
    },
    {
      id: "supplier",
      accessorFn: (row) => row.supplier?.name || "No Supplier",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Supplier
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "order_date",
      header: "Order Date",
      cell: ({ row }) => {
        const date = new Date(row.original.order_date);
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      accessorKey: "status_id",
      header: "Status",
      filterFn: "weakEquals", 
      cell: ({ row }) => {
        const statusId = row.original.status_id;
        const [open, setOpen] = useState(false);
        const [selectedStatus, setSelectedStatus] = useState(statusId);

        const statusName = statusMap[selectedStatus] ?? "Unknown";
        const color = statusColorMap[statusName] ?? "gray";

        async function updateStatus(newStatusId: number) {
          try {
            const response = await axios.put(
                `http://127.0.0.1:8000/pharmacy/purchase-orders/${row.original.purchase_order_id}/`,
                { purchase_order_status_id: newStatusId },
                { headers: { "Content-Type": "application/json" } }
              );
              setSelectedStatus(newStatusId);
              row.original.status_id = newStatusId;
              
              console.log("✅ Status update response:", row.original.status_id);
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
                  className={cn("px-2 py-1 rounded-md border", {
                    "bg-gray-100 text-gray-800 border-gray-200":
                      color === "gray",
                    "bg-green-100 text-green-800 border-green-200":
                      color === "green",
                    "bg-orange-100 text-orange-800 border-orange-200":
                      color === "orange",
                    "bg-blue-100 text-blue-800 border-blue-200":
                      color === "blue",
                    "bg-red-100 text-red-800 border-red-200": color === "red",
                  })}
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
                    {poStatus.map((status) => {
                      const statusLabel = status.purchase_order_status;
                      const statusColor = statusColorMap[statusLabel] ?? "gray";

                      return (
                        <CommandItem
                          key={status.purchase_order_status_id}
                          value={statusLabel}
                          onSelect={() => {
                            updateStatus(status.purchase_order_status_id);
                            setOpen(false);
                          }}
                        >
                          <Badge
                            className={`bg-${statusColor}-100 text-${statusColor}-800 border-${statusColor}-200 px-2 py-1 rounded-md`}
                          >
                            {statusLabel}
                          </Badge>
                          <Check
                            className={cn(
                              "ml-auto",
                              status.purchase_order_status_id === selectedStatus
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
      },
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const po = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(po.po_id)}
              >
                Copy PO number
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link
                  href={`/purchase-orders/${po.purchase_order_id}`}
                  className="flex w-full"
                >
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href={`/purchase-orders/${po.purchase_order_id}/edit`}
                  className="flex w-full"
                >
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => cancelPurchaseOrder(po.purchase_order_id)}
              >
                Cancel Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      filterFn: (row, columnId, filterValue) => {
        const rowValue = row.getValue(columnId);
        if (filterValue === undefined || filterValue === null) return true;
        return rowValue === filterValue;
      },
    },
  ];

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [statusFilter, setStatusFilter] = useState<string>("all"); // ✅ Track selected status

  const table = useReactTable({
    data: purchaseOrders, // ✅ Use tableData instead of purchaseOrders
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    debugTable: true, // Helps with debugging
  });

  

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-x-4">
        <Input
          placeholder="Filter purchase orders..."
          value={(table.getColumn("po_id")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("po_id")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);

            if (value === "all") {
              table.getColumn("status_id")?.setFilterValue(undefined);
            } else {
              const numericValue = Number(value);
              if (!isNaN(numericValue)) {
                table.getColumn("status_id")?.setFilterValue([numericValue]);
              } else {
                console.error("Invalid status value:", value);
              }
            }
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Status">
              {statusFilter === "all"
                ? "All"
                : statusMap[Number(statusFilter)] ?? "Select Status"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>{" "}
            {/* ✅ "All" option to clear filter */}
            {Object.entries(statusMap).map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DataTableViewOptions table={table} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No Purchase Orders Found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
