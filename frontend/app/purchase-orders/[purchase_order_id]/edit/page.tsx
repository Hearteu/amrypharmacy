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

interface Supplier {
    supplier_id: number;
}

interface PurchaseOrder {
  supplier: Supplier
  order_date: Date
  expected_delivery_date: Date
  lineItems: LineItems[]
}

export default function EditPurchaseOrderPage({
  params,
}: {
  params: { purchase_order_id: string }
}) {
    const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null)

    useEffect(() => {
      if (!params?.purchase_order_id) {
        console.error("❌ Purchase Order ID is undefined")
        return
      }
  
      async function fetchPurchaseOrder() {
        try {
          console.log(`📡 Fetching purchase order with ID: ${params.purchase_order_id}`);
    
          const response = await axios.get(`http://127.0.0.1:8000/pharmacy/purchase-orders/${params.purchase_order_id}/`);
    
          console.log("✅ API Response:", response.data); // Debug API response

        console.log("🔎 lineItems from API:", response.data.lineItems);

    
          // Transform data to match `useForm` defaultValues
          const formattedPurchaseOrder = {
            supplier_id: String(response.data.supplier.supplier_id), // Convert number to string
            order_date: new Date(response.data.order_date), // Ensure Date conversion
            expected_delivery_date: new Date(response.data.expected_date), // Ensure Date conversion
            lineItems: response.data.lineItems.map((item) => ({
              product_id: String(item.product_id), // Convert to string
              unit_id: String(item.unit_id), // Convert to string
              ordered_quantity: item.quantity, // Match expected field name
              supplier_price: item.supplier_price,
            })),
          };
    
          console.log("🛠️ Formatted Purchase Order (matches useForm defaults):", formattedPurchaseOrder);
    
          setPurchaseOrder(formattedPurchaseOrder);
        } catch (error) {
          console.error("❌ Error fetching purchase order:", error);
        }
      }
    
      fetchPurchaseOrder();
    }, [params?.purchase_order_id]);

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

