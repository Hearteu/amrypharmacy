import { Button } from "@/components/ui/button";
import PurchaseOrdersTable from "./components/PurchaseOrdersTable";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function PurchaseOrders() {
  return (
    <div className="p-4">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Purchase Orders
            </h1>
            <p className="text-muted-foreground">
              Manage and track your purchase orders
            </p>
          </div>
          <Button asChild>
            <Link href="/purchase-orders/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Purchase Order
            </Link>
          </Button>
        </div>

        <PurchaseOrdersTable />
      </div>
    </div>
  );
}
