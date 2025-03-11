"use client";

import { Button } from "@/components/ui/button";
import axios from "axios";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface StockTransfer {
  stock_transfer_id: number;
  transfer_id: string;
  status_id: number;
  status: string;
  src_location_name: string;
  des_location_name: string;
  transfer_date: string;
  transferItems: TransferItems[];
}

interface TransferItems {
  sti_id: string;
  product_id: string;
  product_name: string;
  ordered_quantity: number;
}
export default function StockTransferPaga({
  params,
}: {
  params: { stock_transfer_id: string };
}) {
  const [stockTransfer, setStockTransfer] = useState<StockTransfer | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStockTransfer = async () => {
    try {
      const response = await axios.get<StockTransfer>(
        `http://127.0.0.1:8000/pharmacy/stock-transfers/${params.stock_transfer_id}/`
      );

      setStockTransfer(response.data);
    } catch (error) {
      console.error("Error fetching stock transfer:", error);
      setError("Failed to load stock transfer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockTransfer();
  }, []);

  const acknowledgeTransfer = async () => {
    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/pharmacy/stock-transfers/${params.stock_transfer_id}`,
        { status_id: 4 },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Stock transfer acknowledged:", response.data);
    } catch (error) {
      console.error("Error acknowledging receipt", error);
    }
  };
  

  if (loading) return <p>Loading stock transfer...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  return (
    <>
      <div>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" asChild>
                <Link href="/stock-transfer">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {stockTransfer?.transfer_id}
                </h1>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Transfer Details</CardTitle>
                <CardDescription>
                  Complete information about this stock transfer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockTransfer?.transferItems.map((item) => (
                        <TableRow key={item.sti_id}>
                          <TableCell className="font-medium">
                            {item.product_name}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.ordered_quantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {stockTransfer?.status}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Transfer Date</h3>
                  <p>{stockTransfer?.transfer_date}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2">From Location</h3>
                  <p>{stockTransfer?.src_location_name}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2">To Location</h3>
                  <p>{stockTransfer?.des_location_name}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2">Summary</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items</span>
                      <span>{stockTransfer?.transferItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Quantity
                      </span>
                      <span>
                        {stockTransfer?.transferItems.reduce(
                          (sum, item) => sum + item.ordered_quantity,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={acknowledgeTransfer}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Acknowledge Receipt
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
