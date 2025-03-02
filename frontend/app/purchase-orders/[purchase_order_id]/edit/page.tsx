"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { useEffect, useState } from "react"
import PurchaseOrderForm from "../../components/PurchaseOrdersForm"

interface LineItems {
  product_id: string
  unit_id: string
  ordered_quantity: number
  supplier_price: number
}

interface PurchaseOrder {
  supplier_id: string
  order_date: Date
  expected_delivery_date: Date
  lineItems: LineItems[]
}

export default function EditPurchaseOrderPage({
  params,
}: {
  params: { purchase_order_id: string }
}) {
  const [purchaseOrder, setPurchaseOrder] = useState<Partial<PurchaseOrder> | undefined>(undefined)

  useEffect(() => {
    if (!params?.purchase_order_id) {
      console.error("Purchase Order ID is undefined")
      return // Prevent the API call if `params.id` is missing
    }

    async function fetchPurchaseOrder() {
      try {
        const response = await axios.get<PurchaseOrder>(`http://127.0.0.1:8000/pharmacy/purchase-orders/${params.purchase_order_id}/`)

        const formattedPurchaseOrder: PurchaseOrder = {
          supplier_id: String(response.data.supplier_id), // Ensure string
          order_date: new Date(response.data.order_date), // Convert to Date
          expected_delivery_date: new Date(response.data.expected_delivery_date), // Convert to Date
          lineItems: response.data.lineItems.map((item) => ({
            product_id: String(item.product_id), // Ensure string
            unit_id: String(item.unit_id), // Ensure string
            ordered_quantity: item.ordered_quantity, // Use correct field
            supplier_price: item.supplier_price,
          })),
        }

        setPurchaseOrder(formattedPurchaseOrder)
      } catch (error) {
        console.error("Error fetching purchase order:", error)
      }
    }

    fetchPurchaseOrder()
  }, [params?.purchase_order_id]) // Use optional chaining here too

  console.log(purchaseOrder)
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/purchase-orders/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Purchase Order</h1>
      </div>

      {/* Pass the correctly formatted `purchaseOrder` */}
      <PurchaseOrderForm initialData={purchaseOrder} isEditing />
    </div>
  )
}

