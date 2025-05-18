import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Expiration } from "@/app/lib/types/inventory/products";
import { format } from "date-fns";

interface DisposeExpiryDialogProps {
  expiration: Expiration;
  onSuccess?: () => void; // optional callback after disposal
}

export default function DisposeExpiryDialog({
  expiration,
  onSuccess,
}: DisposeExpiryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quantity, setQuantity] = useState<number>(expiration.quantity || 1);

  const handleDispose = async () => {
    if (!expiration || quantity < 1) return;

    setIsSubmitting(true);
    try {
      const disposalData = {
        expiration_id: expiration.expiration_id,
        stock_item_id: expiration.Stock_Item.stock_item_id,
        quantity: quantity,
        disposal_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"), // Formatted timestamp
        note: "Expired Item",
      };

      console.log(disposalData);

      const response = await fetch(
        "http://127.0.0.1:8000/pharmacy/expirations/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(disposalData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to dispose items");
      }

      setIsOpen(false); // close the dialog
      if (onSuccess) {
        onSuccess(); // refresh or notify parent
      }
    } catch (error) {
      console.error("Error disposing items:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={() => setIsOpen(true)}>
              Dispose
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock Out Confirmation</DialogTitle>
          <DialogDescription>
            Please confirm the quantity of items to stock out.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Item ID
              </p>
              <p className="text-sm">
                EXP
                {expiration?.expiration_id.toString().padStart(3, "0") || "001"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">
                {expiration?.Stock_Item?.Product?.full_product_name ||
                  "Unknown Product"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Location
              </p>
              <p className="text-sm">{expiration?.location || ""}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Expiry Date
              </p>
              <p className="text-sm">{expiration?.expiry_date || "Unknown"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock-out-quantity">Quantity to Stock Out</Label>
            <Input
              id="stock-out-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDispose}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Disposing..." : "Confirm Stock Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
