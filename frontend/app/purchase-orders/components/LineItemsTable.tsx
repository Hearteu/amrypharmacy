import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const statusColorMap: Record<string, string> = {
  draft: "gray",
  ordered: "green",
  delayed: "orange",
  completed: "blue",
  cancelled: "red",
};

interface LineItemsTableProps {
  lineItems: LineItem[];
}

interface LineItem {
  purchase_order_item_id: number;
  poi_id: string;
  description: string;
  quantity: number;
  supplier_price: number;
  poi_total: number;
  purchase_order_item_status: number;
  po_item_status: string;
}

export function LineItemsTable({ lineItems }: LineItemsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((item) => (
            <TableRow key={item.poi_id}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">
                {item.quantity}
              </TableCell>
              <TableCell className="text-right">
                ${item.supplier_price.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ${item.poi_total.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
