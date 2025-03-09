"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StockTransferForm } from "../../components/StockTransferForm";
import { useEffect, useState } from "react";
import axios from "axios";

interface LineItems {
  stock_transfer_item_id: string;
  product_id: string;
  ordered_quantity: number;
}

interface StockTransfer {
  stock_transfer_id: string;
  transfer_date: Date;
  src_location_id: string;
  des_location_id: string;
  transferItems: LineItems[];
}
export default function EditPurchaseOrderPage({
    params,
  }: {
    params: { stock_transfer_id: string }
  }) {
    const [stockTransfer, setStockTransfer] = useState<
        Partial<StockTransfer> | undefined
      >(undefined); 

    useEffect(() => {
      if (!params?.stock_transfer_id) {
        console.error("❌ Stock Transfer ID is undefined");
        return;
      }
  
      async function fetchStockTransfer() {
        try {
          console.log(
            `📡 Fetching purchase order with ID: ${params.stock_transfer_id}`
          );
  
          const response = await axios.get(
            `http://127.0.0.1:8000/pharmacy/stock-transfers/${params.stock_transfer_id}/`
          );
  
          console.log("✅ API Response:", response.data); // Debug API response
  
          console.log("🔎 lineItems from API:", response.data.lineItems);
  
          const formattedStockTransfer: Partial<StockTransfer> = {
            stock_transfer_id: response.data.stock_transfer_id
              ? String(response.data.stock_transfer_id)
              : undefined,
          
              src_location_id: response.data.src_location_id
              ? String(response.data.src_location_id) 
              : undefined,

              des_location_id: response.data.des_location_id
              ? String(response.data.des_location_id) 
              : undefined,
          
              transfer_date: response.data.transfer_date
              ? new Date(response.data.transfer_date)
              : undefined,
          
              transferItems:
              response.data.transferItems?.map((item: any) => ({
                stock_transfer_item_id: item.stock_transfer_item_id
                  ? String(item.stock_transfer_item_id)
                  : undefined,
                product_id: String(item.product_id),
                ordered_quantity: item.ordered_quantity,
              })) ?? [],
          };
          
  
          console.log(
            "🛠️ Formatted Purchase Order (matches useForm defaults):",
            formattedStockTransfer
          );
  
          setStockTransfer(formattedStockTransfer);
        } catch (error) {
          console.error("❌ Error fetching purchase order:", error);
        }
      }
  
      fetchStockTransfer();
    }, [params?.stock_transfer_id]);
  

    return(
      <>
      <div className="p-4">
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/purchase-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Stock Tansfer</h1>
      </div>
      <StockTransferForm initialData={stockTransfer} isEditing></StockTransferForm>
    </div>
    </div>
      
      </>
    )
  }