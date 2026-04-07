"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Session } from "@/app/lib/types/session";
import { fetchActiveShift, startShift, endShift, addCashMovement, CashShift } from "@/app/lib/services/cash-shift";
import { Wallet, Banknote, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ShiftManagerProps {
  session: Session | undefined;
  onShiftActive: (shift: CashShift | null) => void;
}

export function ShiftManager({ session, onShiftActive }: ShiftManagerProps) {
  const [activeShift, setActiveShift] = useState<CashShift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startingCash, setStartingCash] = useState<string>("");
  
  // Modals state
  const [isCashMovementOpen, setCashMovementOpen] = useState(false);
  const [movementType, setMovementType] = useState<"CASH_IN" | "CASH_OUT">("CASH_IN");
  const [movementAmount, setMovementAmount] = useState<string>("");
  const [movementReason, setMovementReason] = useState<string>("");

  const [isEndShiftOpen, setEndShiftOpen] = useState(false);
  const [endingCash, setEndingCash] = useState<string>("");

  useEffect(() => {
    if (!session?.user?.user_id) return;
    
    fetchActiveShift(session.user.user_id)
      .then((shift) => {
        setActiveShift(shift);
        onShiftActive(shift);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [session, onShiftActive]);

  const handleStartShift = async () => {
    if (!session?.user?.user_id || !session?.user?.location_id || !startingCash || isNaN(Number(startingCash))) return;
    
    try {
      const shift = await startShift({
        user_id: session.user.user_id,
        location_id: session.user.location_id,
        starting_cash: parseFloat(startingCash)
      });
      setActiveShift(shift);
      onShiftActive(shift);
      toast.success("Shift Started Successfully");
    } catch (e) {
      toast.error("Error starting shift");
    }
  };

  const handleCashMovement = async () => {
    if (!activeShift || !session?.user?.user_id || !movementAmount || !movementReason) return;
    
    try {
      await addCashMovement({
        shift_id: activeShift.shift_id,
        user_id: session.user.user_id,
        movement_type: movementType,
        amount: parseFloat(movementAmount),
        reason: movementReason
      });
      setCashMovementOpen(false);
      setMovementAmount("");
      setMovementReason("");
      toast.success("Cash movement recorded");
    } catch (e) {
      toast.error("Error recording movement");
    }
  };

  const handleEndShift = async () => {
    if (!activeShift || !endingCash || isNaN(Number(endingCash))) return;
    
    try {
      await endShift(activeShift.shift_id, parseFloat(endingCash));
      setActiveShift(null);
      onShiftActive(null);
      setEndShiftOpen(false);
      setEndingCash("");
      toast.success("Shift Ended Successfully");
    } catch (e) {
      toast.error("Error ending shift");
    }
  };

  if (isLoading) return null;

  // Render open shift modal blocker if no active shift
  if (!activeShift) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} hideCloseButton>
          <DialogHeader>
            <DialogTitle>Open Cash Drawer</DialogTitle>
            <DialogDescription>
              You must open a shift and declare your starting cash amount before making sales.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="starting_cash" className="text-right">
                Starting Cash
              </Label>
              <Input
                id="starting_cash"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="col-span-3"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleStartShift} disabled={!startingCash || isNaN(Number(startingCash))}>
              Start Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render POS Header Tools when shift is active
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            Cash Drawer
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Shift Management</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { setMovementType("CASH_IN"); setCashMovementOpen(true); }}>
            <ArrowDownCircle className="mr-2 h-4 w-4 text-green-500" />
            <span>Cash In (Add Cash)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setMovementType("CASH_OUT"); setCashMovementOpen(true); }}>
            <ArrowUpCircle className="mr-2 h-4 w-4 text-orange-500" />
            <span>Cash Out (Remove Cash)</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEndShiftOpen(true)}>
            <Banknote className="mr-2 h-4 w-4 text-destructive" />
            <span className="text-destructive font-medium">End Shift (Z-Reading)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Cash Movement Modal */}
      <Dialog open={isCashMovementOpen} onOpenChange={setCashMovementOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {movementType === "CASH_IN" ? "Cash In (Add)" : "Cash Out (Remove)"}
            </DialogTitle>
            <DialogDescription>
              Record manual cash movements for auditing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="col-span-3"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">Reason</Label>
              <Input
                id="reason"
                type="text"
                placeholder="e.g. Change addition, Petty Cash"
                className="col-span-3"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setCashMovementOpen(false)}>Cancel</Button>
            <Button onClick={handleCashMovement} disabled={!movementAmount || !movementReason}>
              Record Movement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* End Shift Modal */}
      <Dialog open={isEndShiftOpen} onOpenChange={setEndShiftOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Close Cash Drawer</DialogTitle>
            <DialogDescription>
              Enter the exact amount of cash in the drawer before ending your shift.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ending_cash" className="text-right">Ending Cash</Label>
              <Input
                id="ending_cash"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="col-span-3"
                value={endingCash}
                onChange={(e) => setEndingCash(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setEndShiftOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleEndShift} disabled={!endingCash || isNaN(Number(endingCash))}>
              Confirm and End Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
