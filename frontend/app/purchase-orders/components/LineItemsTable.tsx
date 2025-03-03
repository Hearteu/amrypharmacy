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
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 items-center gap-4">
                        <div>
                          <label className="text-sm font-medium">
                            Item Status
                          </label>
                          <Select
                            // value={receiveStatus}
                            onValueChange={(value) => {
                              //   setReceiveStatus(value)
                              //   if (value === "not-received" || value === "out-of-stock" || value === "backordered") {
                              //     setReceiveQuantity(0)
                              //   }
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="receiving">
                                Receiving Items
                              </SelectItem>
                              <SelectItem value="not-received">
                                Not Received
                              </SelectItem>
                              <SelectItem value="out-of-stock">
                                Out of Stock
                              </SelectItem>
                              <SelectItem value="backordered">
                                Backordered
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Quantity to Receive
                          </label>
                          <Input
                            type="number"
                            min={0}
                            // max={item.quantity - (item.receivedQuantity || 0)}
                            // value={receiveQuantity}
                            // onChange={(e) => setReceiveQuantity(Number(e.target.value))}
                            className="mt-1"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            {/* {item.quantity - (item.receivedQuantity || 0)} remaining */}
                          </p>
                        </div>
                      </div>

                      {/* {receiveStatus === "receiving" ? ( */}
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">
                              Expired Items
                            </label>
                            <Input
                              type="number"
                              min={0}
                              // value={expiredQuantity}
                              // onChange={(e) => setExpiredQuantity(Number(e.target.value))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Damaged Items
                            </label>
                            <Input
                              type="number"
                              min={0}
                              //   value={damagedQuantity}
                              //   onChange={(e) => setDamagedQuantity(Number(e.target.value))}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </>
                      {/* ) : null} */}

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {}}>
                          Cancel
                        </Button>
                        <Button
                        //   onClick={() => handleReceiveItems(item)}
                        //   disabled={
                        //     receiveStatus === "receiving" &&
                        //     receiveQuantity + expiredQuantity + damagedQuantity === 0
                        //   }
                        >
                          Record Receipt
                        </Button>
                      </div>
                    </div>
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
