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
import { ArrowUpDown, Eye, PlusCircle } from "lucide-react";
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
const outgoingTransfersData = {
  draft: [
    {
      id: "ST-2024-101",
      destinationLocation: "Branch Pharmacy C",
      date: "2024-03-15",
      expectedDelivery: "2024-03-17",
      items: 6,
      status: "draft",
      reason: "Low stock replenishment",
    },
    {
      id: "ST-2024-102",
      destinationLocation: "Rural Clinic",
      date: "2024-03-16",
      expectedDelivery: "2024-03-19",
      items: 4,
      status: "draft",
      reason: "Monthly supply",
    },
  ],
  ordered: [
    {
      id: "ST-2024-103",
      destinationLocation: "Branch Pharmacy D",
      date: "2024-03-14",
      expectedDelivery: "2024-03-16",
      items: 8,
      status: "ordered",
      reason: "Stock balancing",
    },
  ],
  in_progress: [
    {
      id: "ST-2024-104",
      destinationLocation: "Community Health Center",
      date: "2024-03-12",
      expectedDelivery: "2024-03-15",
      items: 10,
      status: "pending",
      reason: "Emergency supply",
    },
    {
      id: "ST-2024-105",
      destinationLocation: "Branch Pharmacy A",
      date: "2024-03-13",
      expectedDelivery: "2024-03-16",
      items: 5,
      status: "in_transit",
      reason: "Medication shortage",
    },
  ],
  completed: [
    {
      id: "ST-2024-106",
      destinationLocation: "Rural Clinic",
      date: "2024-03-01",
      expectedDelivery: "2024-03-04",
      completedDate: "2024-03-03",
      items: 12,
      status: "completed",
      reason: "Monthly supply",
    },
  ],
};

type OutgoingTransfer =
  | (typeof outgoingTransfersData.draft)[0]
  | (typeof outgoingTransfersData.ordered)[0]
  | (typeof outgoingTransfersData.in_progress)[0]
  | (typeof outgoingTransfersData.completed)[0];

interface OutgoingTransfersListProps {
  status: "draft" | "ordered" | "in_progress" | "completed";
}

export function OutgoingTransfersList({ status }: OutgoingTransfersListProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState([]);

  const columns: ColumnDef<OutgoingTransfer>[] = [
    {
      accessorKey: "id",
      header: "Transfer ID",
      cell: ({ row }) => (
        <Link
          href={`/stock-transfers/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue("id")}
        </Link>
      ),
    },
    {
      accessorKey: "destinationLocation",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Destination
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Request Date",
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
      accessorKey: "items",
      header: () => <div className="text-right">Items</div>,
      cell: ({ row }) => {
        return <div className="text-right">{row.getValue("items")}</div>;
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        return (
          <div
            className="max-w-[200px] truncate"
            title={row.getValue("reason")}
          >
            {row.getValue("reason")}
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
            <Link href={`/stock-transfers/${row.original.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
        );
      },
    },
  ];

  // Map the status to the corresponding data
  const statusDataMap = {
    draft: outgoingTransfersData.draft,
    ordered: outgoingTransfersData.ordered,
    in_progress: outgoingTransfersData.in_progress,
    completed: outgoingTransfersData.completed,
  };

  const data = statusDataMap[status] || [];

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
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/stock-transfer/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Transfer Request
          </Link>
        </Button>
      </div>

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
                  No transfer requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {data.length}{" "}
          transfer requests
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
