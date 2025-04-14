"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableViewOptions } from "@/components/data-table/DataTableViewOptions";
import { DataTablePagination } from "@/components/data-table/DataTablePagination";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { StockTransfer } from "@/app/lib/types/stock-transfer";
import { getStockTransfer } from "@/app/lib/services/stock-transfer";
import { DataTableLoading } from "@/components/data-table/DataTableLoading";
import axios from "axios";

const statusMap: Record<number, string> = {
  1: "Draft",
  2: "In Transit",
  3: "Delayed",
  4: "Completed",
  5: "Cancelled",
  6: "Processing",
};

const statusColorMap: Record<string, string> = {
  Draft: "gray",
  "In Transit": "yellow",
  Delayed: "orange",
  Completed: "green",
  Cancelled: "red",
  Processing: "blue",
};

export default function StockTransferTable() {
  const [stockTransfer, setStockTransfer] = useState<StockTransfer[]>([]);
  const [error, setError] = useState<string | null>(null); // Error state
  const [loading, setLoading] = useState(true); // Loading state

  const refreshData = async () => {
    console.log("Refreshing data...");
    setLoading(true);
    try {
      const poData = await getStockTransfer();
      setStockTransfer(poData);
    } catch {
      console.error("Error fetching data", error);
      setError("Failed to load products");
      setStockTransfer([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  async function cancelStockTransfer(orderId: number) {
    console.log(orderId);
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/stock-transfer/${orderId}/`,
        { purchase_order_status_id: 5 },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Stock Transfer canceled:", response.data);
      refreshData();
      return response.data;
    } catch (error) {
      console.error("Error canceling stock transfer:", error);
      throw error;
    }
  }

  async function processingStockTransfer(orderId: number) {
    console.log(orderId);
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/stock-transfer/${orderId}/`,
        { purchase_order_status_id: 6 },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Stock Transfer ordered:", response.data);
      refreshData();
      return response.data;
    } catch (error) {
      console.error("Error canceling stock transfer:", error);
      throw error;
    }
  }

  async function inTransitStockTransfer(orderId: number) {
    console.log(orderId);
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/stock-transfer/${orderId}/`,
        { purchase_order_status_id: 2 },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Stock Transfer:", response.data);
      refreshData();
      return response.data;
    } catch (error) {
      console.error("Error stock transfer:", error);
      throw error;
    }
  }

  const columns: ColumnDef<StockTransfer>[] = [
    {
      accessorKey: "transfer_id",
      header: "ST Number",
      cell: ({ row }) => (
        <Link
          href={`/stock-transfer/${row.original.stock_transfer_id}/`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("transfer_id")}
        </Link>
      ),
    },
    {
      accessorKey: "transfer_date",
      header: "Transfer Date",
      cell: ({ row }) => {
        const date = new Date(row.original.transfer_date);
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      accessorKey: "src_location_name",
      header: "From",
    },
    {
      accessorKey: "des_location_name",
      header: "To",
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
              "bg-blue-100 text-blue-800 border-blue-200": color === "blue",
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
        const stock_transfer = row.original;
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
                onClick={() =>
                  navigator.clipboard.writeText(stock_transfer.transfer_id)
                }
              >
                Copy PO number
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link
                  href={`/stock-transfer/${stock_transfer.stock_transfer_id}/`}
                  className="flex w-full"
                >
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href={`/stock-transfer/${stock_transfer.stock_transfer_id}/edit`}
                  className={cn(
                    "flex w-full",
                    stock_transfer.status_id === 4 &&
                      "pointer-events-none opacity-50"
                  )}
                >
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  processingStockTransfer(stock_transfer.stock_transfer_id)
                }
              >
                Mark as Processing
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  inTransitStockTransfer(stock_transfer.stock_transfer_id)
                }
              >
                Mark as In Transit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() =>
                  cancelStockTransfer(stock_transfer.stock_transfer_id)
                }
              >
                Cancel Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data: stockTransfer,
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
          value={
            (table.getColumn("transfer_id")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("transfer_id")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

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
                  No Stock Transfer Found
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
