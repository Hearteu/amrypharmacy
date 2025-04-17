import { getTransaction } from "@/app/lib/services/transactions";
import { Transaction } from "@/app/lib/types/transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

export default function ViewTransactionDetails({ pos_id }: { pos_id: string }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const result = await getTransaction(pos_id);
      setTransaction(result);
    } catch (err) {
      console.error("Error fetching data", err);
      setError("Failed to fetch transaction.");
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FileText className="h-4 w-4" />
          <span className="sr-only">View Details</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Invoice: {transaction?.invoice ?? "N/A"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : transaction ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.sale_date}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Amount</p>
                <p className="text-sm text-muted-foreground">
                  ₱{transaction.total_amount.toFixed(2)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Items</p>
              <div className="border rounded-md p-2">
                {transaction.items.map((item) => (
                  <p
                    key={item.pos_item_id}
                    className="text-sm text-muted-foreground"
                  >
                    {item.full_product_name} - {item.quantity} x ₱
                    {item.price.toFixed(2)} = ₱{item.total_price.toFixed(2)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p>No transaction data found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
