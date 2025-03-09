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
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions";
import { DataTablePagination } from "@/components/table/DataTablePagination";
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
import { MoreHorizontal } from "lucide-react";

interface StockTransfer {
  stock_transfer_id: number;
  transfer_id: string;
  transfer_date: string;
  status: string;
  status_id: number;
  src_location_name: string;
  des_location_name: string;
}

const statusMap: Record<number, string> = {
  1: "Draft",
  2: "Processing ",
  3: "In Transit",
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

export default function StockTransferTable() {
  const [stockTransfer, setStockTransfer] = useState<StockTransfer[]>([]);

  async function fetchStockTransfer() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/pharmacy/stock-transfers/"
      );
      const data: StockTransfer[] = await response.json();
      setStockTransfer(data);
      console.log(data);
    } catch (error) {
      console.error("Error fetching stock transfer", error);
    }
  }

  useEffect(() => {
    fetchStockTransfer();
  }, []);

  const columns: ColumnDef<StockTransfer>[] = [
    {
      accessorKey: "transfer_id",
      header: "ST Number",
      cell: ({ row }) => (
        <Link
          href={`/stock_transfer/${row.original.stock_transfer_id}/`}
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
      header: "Status",
      cell: ({ row }) => {
        const statusId = row.original.status_id;
        const [open, setOpen] = useState(false);
        const [selectedStatus, setSelectedStatus] = useState(statusId);

        const statusName = statusMap[selectedStatus] ?? "Unknown";
        const color = statusColorMap[statusName] ?? "gray";

        return (
          <div>
            <Badge
              className={cn("px-2 py-1 rounded-md border", {
                "bg-gray-100 text-gray-800 border-gray-200": color === "gray",
                "bg-yellow-100 text-yellow-800 border-yellow-200":
                  color === "yellow",
                "bg-orange-100 text-orange-800 border-orange-200":
                  color === "orange",
                "bg-green-100 text-green-800 border-green-200":
                  color === "green",
                "bg-red-100 text-red-800 border-red-200": color === "red",
              })}
            >
              {statusName}
            </Badge>
          </div>
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
                onClick={() => navigator.clipboard.writeText(stock_transfer.transfer_id)}
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
                  className="flex w-full"
                >
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                // onClick={() => cancelPurchaseOrder(po.purchase_order_id)}
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
  const [statusFilter, setStatusFilter] = useState<string>("all"); // ✅ Track selected status

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

  return (
    <>
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
                    Loading...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} />
      </div>
    </>
  );
}
