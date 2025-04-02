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
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";

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
import { DataTableViewOptions } from "@/components/data-table/DataTableViewOptions";
import { DataTablePagination } from "@/components/data-table/DataTablePagination";
import axios from "axios";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PurchaseOrders } from "@/app/lib/types/purchase-order";
import { getPO } from "@/app/lib/services/purchase-order";
import { DataTableLoading } from "@/components/data-table/DataTableLoading";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PurchaseOrdersTable() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrders[]>([]);
  const [error, setError] = useState<string | null>(null); // Error state
  const [loading, setLoading] = useState(true); // Loading state

  const refreshData = async () => {
    console.log("Refreshing data...");
    setLoading(true);
    try {
      const poData = await getPO();
      setPurchaseOrders(poData);
    } catch {
      console.error("Error fetching data", error);
      setError("Failed to load products");
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  async function cancelPurchaseOrder(orderId: number) {
    console.log(orderId);
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/purchase-orders/${orderId}/`,
        { purchase_order_status_id: 5 },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Purchase order canceled:", response.data);
      refreshData();
      return response.data;
    } catch (error) {
      console.error("Error canceling purchase order:", error);
      throw error;
    }
  }

  async function orderPurchaseOrder(orderId: number) {
    console.log(orderId);
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/purchase-orders/${orderId}/`,
        { purchase_order_status_id: 2 },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Purchase order ordered:", response.data);
      refreshData();
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      filterFn: "weakEquals",
      cell: ({ row }) => {
        const statusId = row.original.status_id;
        const statusName = statusMap[statusId] ?? "Unknown";
        const color = statusColorMap[statusName] ?? "gray";

        return (
          <Badge
            className={cn("px-2 py-1 rounded-md border", {
              "bg-gray-100 text-gray-800 border-gray-200": color === "gray",
              "bg-yellow-100 text-yellow-800 border-yellow-200":
                color === "yellow",
              "bg-orange-100 text-orange-800 border-orange-200":
                color === "orange",
              "bg-green-100 text-green-800 border-green-200": color === "green",
              "bg-red-100 text-red-800 border-red-200": color === "red",
            })}
          >
            {statusName}
          </Badge>
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
              {/* to be changed */}
              <DropdownMenuItem
                onClick={() => orderPurchaseOrder(po.purchase_order_id)}
              >
                Mark as Ordered
              </DropdownMenuItem>
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

  return loading ? (
    <DataTableLoading columnCount={columns.length} rowCount={10} />
  ) : (
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
            <SelectItem value="all">All</SelectItem>
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
