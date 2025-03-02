"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineItemsTable } from "../components/LineItemsTable";
import { Separator } from "@/components/ui/separator";

interface PurchaseOrderItem {
  purchase_order_item_id: number;
  poi_id: string;
  description: string;
  quantity: number;
  supplier_price: number;
  poi_total: number;
  purchase_order_item_status: number;
  po_item_status: string;
}

interface Supplier {
    name: string;
    contact: string;
    email: string;
    phone: string;
    address: string;
  }

interface PurchaseOrder {
  purchase_order_id: number;
  po_id: string;
  supplier: Supplier;
  order_date: string;
  expected_date: string;
  po_total: number;
  status: string;
  notes: string;
  lineItems: PurchaseOrderItem[];
}

export default function PurchaseOrderPage({
  params,
}: {
  params: { purchase_order_id: string };
}) {
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchaseOrderData = async () => {
      try {
        const response = await axios.get<PurchaseOrder>(
          `http://127.0.0.1:8000/pharmacy/purchase-orders/${params.purchase_order_id}/`
        );

        setPurchaseOrder(response.data);
      } catch (error) {
        console.error("Error fetching purchase order:", error);
        setError("Failed to load purchase order.");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrderData();
  }, [params.purchase_order_id]);

  if (loading) return <p>Loading purchase order...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <div className="container mx-auto py-6 space-y-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/purchase-orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {purchaseOrder?.po_id}
            </h1>
            <Badge className="ml-2">
              {purchaseOrder?.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm">Edit Order</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>
                View and manage order information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="items">
                <TabsList>
                  <TabsTrigger value="items">Items</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="items" className="pt-4">
                  <LineItemsTable lineItems={purchaseOrder?.lineItems ?? []} />
                  <div className="flex justify-end mt-4">
                    <div className="w-64 space-y-2">
                  
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>${purchaseOrder?.po_total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="notes" className="pt-4">
                  <p>{purchaseOrder?.notes || "No notes available."}</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {purchaseOrder?.supplier?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {purchaseOrder?.supplier?.address}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="text-sm font-medium">Contact:</span>
                    <span>{purchaseOrder?.supplier?.contact}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="text-sm font-medium">Email:</span>
                    <span>{purchaseOrder?.supplier?.email}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="text-sm font-medium">Phone:</span>
                    <span>{purchaseOrder?.supplier?.phone}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="text-sm font-medium">Order Date:</span>
                    <span>
                      {purchaseOrder?.order_date
                        ? new Date(
                            purchaseOrder.order_date
                          ).toLocaleDateString()
                        : "No delivery date available"}
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr]">
                    <span className="text-sm font-medium">Expected:</span>
                    <span>
                      {purchaseOrder?.expected_delivery_date
                        ? new Date(
                            purchaseOrder.expected_delivery_date
                          ).toLocaleDateString()
                        : "No delivery date available"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
