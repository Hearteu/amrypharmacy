import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import ReceiveItemsForm from "./ReceiveItemsForm";
import clsx from "clsx";
import { PurchaseOrderItem } from "@/app/lib/types/purchase-order";

const statusColorMap: Record<string, string> = {
  Pending: "bg-gray-500",
  Received: "bg-green-500",
  "Partially Received": "bg-orange-500",
  Missing: "bg-red-500",
  Defective: "bg-red-500",
};
interface LineItemsTableProps {
  lineItems: PurchaseOrderItem[];
  onStatusChange?: (id: string, status: string) => void;
  onSuccess: () => void;
}

export function LineItemsTable({ lineItems, onSuccess }: LineItemsTableProps) {
  const [openDialog, setOpenDialog] = useState<number | null>(null);

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
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((item) => (
            <TableRow key={item.purchase_order_item_id}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{item.ordered_qty}</TableCell>
              {/* replace this with received quantity */}
              <TableCell className="text-right">{item.received_qty}</TableCell>
              {/* replace this with issues */}
              <TableCell className="text-right">
                {item.expired_qty !== undefined && (
                  <>Expired: {item.expired_qty}</>
                )}
                {item.damaged_qty !== undefined && (
                  <>
                    <br /> Damaged: {item.damaged_qty}
                  </>
                )}
              </TableCell>
              <TableCell className="text-right">
                ₱{item.supplier_price.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ₱{item.poi_total.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant="outline"
                  className={clsx(
                    "text-white px-2 py-1 rounded-md",
                    statusColorMap[item.po_item_status] || "bg-gray-500"
                  )}
                >
                  {item.po_item_status}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Dialog
                  open={openDialog === item.purchase_order_item_id}
                  onOpenChange={(isOpen) =>
                    setOpenDialog(isOpen ? item.purchase_order_item_id : null)
                  }
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setOpenDialog(item.purchase_order_item_id)}
                      disabled={item.purchase_order_item_status !== 1} // Disables if not "1"
                    >
                      Receive Items
                    </Button>
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
                    <ReceiveItemsForm
                      purchase_order_item_id={item.purchase_order_item_id}
                      onSuccess={() => {
                        onSuccess();
                        setOpenDialog(null);
                      }}
                    />
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
