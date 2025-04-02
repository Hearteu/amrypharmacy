import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import PurchaseOrderForm from "../components/PurchaseOrdersForm"

export default function CreatePurchaseOrderPage() {
  return (
    <div className="p-4">
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/purchase-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Purchase Order</h1>
      </div>
    <PurchaseOrderForm></PurchaseOrderForm>
    </div>
    </div>
  )
}
