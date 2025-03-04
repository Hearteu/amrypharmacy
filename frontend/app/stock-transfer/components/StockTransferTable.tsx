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

interface StockTransfer {
  stock_transfer_id: number;
  transfer_date: string;
  stock_transfer_status: string;

}

export default function StockTransferTable() {
  const [stockTransfer, setStockTransfer] = useState<StockTransfer[]>([]);

  async function fetchStockTransfer() {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/pharmacy/stock-transfers/"
      );
      const data: StockTransfer[] = await response.json();
      setStockTransfer(data);
    } catch (error) {
      console.error("Error fetching stock transfer", error);
    }
  }

  useEffect(() => {
    fetchStockTransfer();
  }, []);

  const columns: ColumnDef<StockTransfer>[] = [
    {
      accessorKey: "stock_transfer_id",
      header: "Stock Transfer ID",
      cell: ({ row }) => (
        <Link
          href={`/purchase-orders/`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("po_id")}
        </Link>
      ),
    },
    {
      accessorKey: "transfer_date",
      header: "Transfer Date",
      cell: ({ row }) => (
        <Link
          href={`/purchase-orders/`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("po_id")}
        </Link>
      ),
    },
    {
        accessorKey: "stock_transfer_status",
        header: "Stock Transfer Date",
        cell: ({ row }) => (
          <Link
            href={`/purchase-orders/`}
            className="font-medium text-primary hover:underline"
          >
            {row.getValue("po_id")}
          </Link>
        ),
      },
    {
      id: "actions",
      cell: ({ row }) => {
        const stock_transfer = row.original;
        return <></>;
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
