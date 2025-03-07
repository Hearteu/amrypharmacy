"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import PurchaseOrderForm from "../../components/PurchaseOrdersForm";

interface LineItems {
  purchase_order_item_id: string;
  product_id: string;
  unit_id: string;
  ordered_quantity: number;
  supplier_price: number;
}
interface PurchaseOrder {
  purchase_order_id: string;
  supplier_id: string;
  order_date: Date;
  expected_delivery_date: Date;
  lineItems: LineItems[];
}

export default function EditPurchaseOrderPage({
  params,
}: {
  params: { purchase_order_id: string };
}) {
  const [purchaseOrder, setPurchaseOrder] = useState<
    Partial<PurchaseOrder> | undefined
  >(undefined);

  useEffect(() => {
    if (!params?.purchase_order_id) {
      console.error("❌ Purchase Order ID is undefined");
      return;
    }

    async function fetchPurchaseOrder() {
      try {
        console.log(
          `📡 Fetching purchase order with ID: ${params.purchase_order_id}`
        );

        const response = await axios.get(
          `http://127.0.0.1:8000/pharmacy/purchase-orders/${params.purchase_order_id}/`
        );

        console.log("✅ API Response:", response.data); // Debug API response

        console.log("🔎 lineItems from API:", response.data.lineItems);

        const formattedPurchaseOrder: Partial<PurchaseOrder> = {
          purchase_order_id: response.data.purchase_order_id
            ? String(response.data.purchase_order_id)
            : undefined,
        
          supplier_id: response.data.supplier?.supplier_id
            ? String(response.data.supplier.supplier_id) // ✅ Fix: Extract only the string
            : undefined,
        
          order_date: response.data.order_date
            ? new Date(response.data.order_date)
            : undefined,
        
          expected_delivery_date: response.data.expected_date
            ? new Date(response.data.expected_date)
            : undefined,
        
          lineItems:
            response.data.lineItems?.map((item: any) => ({
              purchase_order_item_id: item.purchase_order_item_id
                ? String(item.purchase_order_item_id)
                : undefined,
              product_id: String(item.product_id),
              unit_id: String(item.unit_id),
              ordered_quantity: item.quantity,
              supplier_price: item.supplier_price,
            })) ?? [],
        };
        

        console.log(
          "🛠️ Formatted Purchase Order (matches useForm defaults):",
          formattedPurchaseOrder
        );

        setPurchaseOrder(formattedPurchaseOrder);
      } catch (error) {
        console.error("❌ Error fetching purchase order:", error);
      }
    }

    fetchPurchaseOrder();
  }, [params?.purchase_order_id]);

  console.log(purchaseOrder);
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={"/purchase-orders/"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Edit Purchase Order
        </h1>
      </div>

      {/* Pass the correctly formatted `purchaseOrder` */}
      <PurchaseOrderForm initialData={purchaseOrder} isEditing />
    </div>
  );
}
