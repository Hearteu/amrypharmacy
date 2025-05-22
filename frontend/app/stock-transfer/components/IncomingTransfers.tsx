"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockTransfer } from "@/app/lib/types/stock-transfer";
import { DataTablePagination } from "@/components/data-table/DataTablePagination";

interface IncomingTransfersListProps {
  data: StockTransfer[];
}

export function IncomingTransfersList({ data }: IncomingTransfersListProps) {
  const [sorting, setSorting] = useState([]);

  const columns: ColumnDef<StockTransfer>[] = [
    {
      accessorKey: "transfer_id",
      header: "Transfer ID",
      cell: ({ row }) => (
        <Link
          href={`/incoming-transfer/${row.original.stock_transfer_id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("transfer_id")}
        </Link>
      ),
    },
    {
      accessorKey: "src_location_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Source
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "des_location_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Destination
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "transfer_date",
      header: "Transfer Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("transfer_date"));
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => row.getValue("status"),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/stock-transfer/${row.original.stock_transfer_id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                  No transfers found.
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
