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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReceiveItemsForm from "./ReceiveItemsForm";

const statusColorMap: Record<string, string> = {
  draft: "gray",
  ordered: "green",
  delayed: "orange",
  completed: "blue",
  cancelled: "red",
};

interface LineItemsTableProps {
  lineItems: LineItem[];
  editable?: boolean;
  onStatusChange?: (id: string, status: string) => void;
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

export function LineItemsTable({
  lineItems,
  editable = false,
  onStatusChange,
}: LineItemsTableProps) {
  //change this with the data
  //   const [items, setItems] = useState(
  //     lineItems.map((item) => ({
  //       ...item,
  //       status: item.status || "pending",
  //       receivedQuantity: item.receivedQuantity || 0,
  //       issues: item.issues || { expired: 0, damaged: 0, notes: "" },
  //     }))
  //   );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Ordered</TableHead>
            <TableHead className="text-right">Received</TableHead>
            <TableHead className="text-right">Issues</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Status</TableHead>
            {editable && <TableHead className="text-center">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((item) => (
            <TableRow key={item.poi_id}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              {/* replace this with received quantity */}
              <TableCell className="text-right">{item.quantity}</TableCell>
              {/* replace this with issues */}
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">
                ${item.supplier_price.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ${item.poi_total.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {item.po_item_status}
              </TableCell>
              <TableCell className="text-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Receive Items</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Receive Items - {item.description}
                      </DialogTitle>
                      <DialogDescription>
                        Record received quantities and any issues
                      </DialogDescription>
                    </DialogHeader>
                    <ReceiveItemsForm purchase_order_item_id={item.purchase_order_item_id}></ReceiveItemsForm>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
