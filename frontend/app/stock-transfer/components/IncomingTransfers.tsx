"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Sample data - in a real app, this would come from your database
const transfersData = {
  pending: [
    {
      id: "ST-2024-007",
      sourceLocation: "Main Warehouse",
      date: "2024-03-10",
      expectedDelivery: "2024-03-12",
      items: 8,
      status: "pending",
      priority: "normal",
    },
    {
      id: "ST-2024-008",
      sourceLocation: "Central Pharmacy",
      date: "2024-03-11",
      expectedDelivery: "2024-03-13",
      items: 5,
      status: "pending",
      priority: "high",
    },
  ],
  in_transit: [
    {
      id: "ST-2024-009",
      sourceLocation: "Main Warehouse",
      date: "2024-03-08",
      expectedDelivery: "2024-03-11",
      items: 12,
      status: "in_transit",
      priority: "normal",
    },
    {
      id: "ST-2024-010",
      sourceLocation: "Regional Distribution Center",
      date: "2024-03-09",
      expectedDelivery: "2024-03-12",
      items: 15,
      status: "in_transit",
      priority: "urgent",
    },
  ],
  received: [
    {
      id: "ST-2024-011",
      sourceLocation: "Main Warehouse",
      date: "2024-03-05",
      receivedDate: "2024-03-07",
      items: 10,
      status: "received",
      priority: "normal",
    },
  ],
  completed: [
    {
      id: "ST-2024-012",
      sourceLocation: "Central Pharmacy",
      date: "2024-03-01",
      receivedDate: "2024-03-03",
      completedDate: "2024-03-04",
      items: 7,
      status: "completed",
      priority: "normal",
    },
  ],
};

type Transfer =
  | (typeof transfersData.pending)[0]
  | (typeof transfersData.in_transit)[0]
  | (typeof transfersData.received)[0]
  | (typeof transfersData.completed)[0];

interface IncomingTransfersListProps {
  status: "pending" | "in_transit" | "received" | "completed";
}

export function IncomingTransfersList({ status }: IncomingTransfersListProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState([]);

  const columns: ColumnDef<Transfer>[] = [
    {
      accessorKey: "id",
      header: "Transfer ID",
      cell: ({ row }) => (
        <Link
          href={`/pharmacy/incoming-transfers/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("id")}
        </Link>
      ),
    },
    {
      accessorKey: "sourceLocation",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Source
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Transfer Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      accessorKey: "expectedDelivery",
      header: "Expected Delivery",
      cell: ({ row }) => {
        if (!row.original.expectedDelivery) return <div>-</div>;
        const date = new Date(row.original.expectedDelivery);
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      accessorKey: "receivedDate",
      header: "Received Date",
      cell: ({ row }) => {
        if (!row.original.receivedDate) return <div>-</div>;
        const date = new Date(row.original.receivedDate);
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      accessorKey: "items",
      header: () => <div className="text-right">Items</div>,
      cell: ({ row }) => {
        return <div className="text-right">{row.getValue("items")}</div>;
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string;
        const colorMap = {
          normal: "bg-gray-100 text-gray-800",
          high: "bg-amber-100 text-amber-800",
          urgent: "bg-red-100 text-red-800",
        };
        return (
          <div
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              colorMap[priority as keyof typeof colorMap]
            }`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return (
          //   <TransferStatusBadge status={row.getValue("status") as string} />
          row.getValue("status")
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/pharmacy/incoming-transfers/${row.original.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
        );
      },
    },
  ];

  const data = transfersData[status] || [];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
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
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {data.length}{" "}
          transfers
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
