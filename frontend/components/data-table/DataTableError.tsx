"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataTableErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function DataTableError({
  message = "Something went wrong while loading data.",
  onRetry,
}: DataTableErrorProps) {
  return (
    <div>
      {/* Search input with disabled state */}
      <div className="flex items-center">
        <Input
          placeholder="Search..."
          disabled
          className="max-w-sm opacity-70"
        />
        <div className="ml-auto">
          <Button variant="outline" disabled>
            Filter
          </Button>
        </div>
      </div>

      {/* Error state container */}
      <div className="rounded-md border my-4 p-8 flex flex-col items-center justify-center text-center text-muted-foreground gap-4">
        <AlertTriangle className="w-10 h-10 text-destructive" />
        <p className="text-sm">{message}</p>
      </div>

      {/* Pagination with disabled buttons */}
      <div className="flex items-center justify-between px-2 opacity-50">
        <span className="text-sm">0 of 0 entries</span>
        <div className="flex items-center space-x-2">
          <Button disabled size="sm" variant="outline">
            Prev
          </Button>
          <Button disabled size="sm" variant="outline">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
