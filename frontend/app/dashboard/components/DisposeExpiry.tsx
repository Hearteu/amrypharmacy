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

export default function DisposeExpiryDialog() {
  return (
    <>
      <Dialog>
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
              <DropdownMenuItem>Dispose</DropdownMenuItem>
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
                <p className="text-sm">EXP001</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Name
                </p>
                <p className="text-sm">Amoxicillin 500mg Capsules</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Quantity
                </p>
                <p className="text-sm">24</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Expiry Date
                </p>
                <p className="text-sm">2023-11-15</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock-out-quantity">Quantity to Stock Out</Label>
              <Input
                id="stock-out-quantity"
                type="number"
                min="1"
                max={24}
                defaultValue={1}
                className=""
              />
              <p className="text-sm text-muted-foreground">
                23 units will remain in inventory.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Confirm Stock Out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
