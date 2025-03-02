"use client";

import { useEffect, useState } from "react";
import {
  type ColumnDef,
  type Row,
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

export default function PurchaseOrdersTable() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrders[]>([]);

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
  
  useEffect(() => {
    fetchPO();
  }, []);

  async function cancelPurchaseOrder(orderId: number) {
    console.log(orderId)
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
      cell: ({ row }) => {
        const statusId = row.original.status_id;
        const statusName = statusMap[statusId] ?? "Unknown";
        const color = statusColorMap[statusName] ?? "gray";
        return (
          <Badge
            variant={statusId === 1 ? "outline" : "default"}
            className={`bg-${color}-100 text-${color}-800 border-${color}-200`}
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
    },
  ];

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data: purchaseOrders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter purchase orders..."
          value={(table.getColumn("po_id")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("po_id")?.setFilterValue(event.target.value)
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
                  No purchase orders found.
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
