"use client";

import type React from "react";

import { format } from "date-fns";
import { Calculator, FileText, Receipt, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Item {
  id: number;
  full_product_name: string;
  price: number;
  category: string;
  quantity: number;
}

interface CustomerInfo {
  patient_name: string;
  client_name: string;
  guaranteeLetterNo: string;
  guaranteeLetterDate: string;
  receivedDate: string;
  invoiceNumber: string;
}

interface DiscountInfo {
  name: string;
  address: string;
  type: string;
  idNumber: string;
  discountRate: number;
}

interface PrescriptionInfo {
  doctorName: string;
  PRCNumber: string;
  PTRNumber: string;
  prescriptionDate: string;
  notes: string;
}

interface OrderData {
  user_id: number;
  branch: string;
  customerType: string;
  customerInfo?: CustomerInfo;
  discount: number;
  discountInfo?: DiscountInfo;
  items: Item[];
  prescriptionInfo?: PrescriptionInfo;
  subtotal: number;
  total: number;
  timestamp: string;
}

export default function OrderSummaryPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [change, setChange] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const storedData = localStorage.getItem("orderSummary");
    if (storedData) {
      setOrderData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    if (orderData && paymentAmount) {
      const payment = Number.parseFloat(paymentAmount);
      if (!isNaN(payment)) {
        setChange(payment - orderData.total);
      }
    }
  }, [paymentAmount, orderData]);

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentAmount(e.target.value);
  };

  if (!orderData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>No order data available.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isDSWD = orderData.customerType === "dswd";
  const hasDiscount =
    orderData.customerType === "discount" && orderData.discountInfo;
  const hasPrescription =
    orderData.prescriptionInfo &&
    (orderData.prescriptionInfo.doctorName ||
      orderData.prescriptionInfo.prescriptionDate);
  const hasCustomerInfo =
    orderData.customerInfo &&
    (orderData.customerInfo.patient_name ||
      orderData.customerInfo.guaranteeLetterNo);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = () => {
    if (!orderData) {
      alert("No order data available.");
      return;
    }

    let transactionData; // Declare it outside the blocks

    if (!isDSWD) {
      const payment = Number.parseFloat(paymentAmount);
      if (isNaN(payment) || payment < orderData.total) {
        alert("Insufficient payment amount.");
        return;
      }

      // Set transaction data with payment info for regular customers
      transactionData = {
        ...orderData,
        paymentAmount: payment,
        change,
      };
    } else {
      // For DSWD customers, set payment and change to 0
      transactionData = {
        ...orderData,
        paymentAmount: 0,
        change: 0,
      };
    }

    console.log("Submitting transaction:", transactionData);

    fetch("http://127.0.0.1:8000/pharmacy/pos/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transactionData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Order submitted successfully:", data);
        alert("Transaction completed successfully!");
        // Clear order data from localStorage
        localStorage.removeItem("orderSummary");
        // Navigate back to the POS page
        router.push("/pos");
      })
      .catch((error) => {
        console.error("Error submitting order:", error);
        alert("Error submitting order. Please try again.");
      });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-2xl">Order Summary</CardTitle>
              <CardDescription>
                {orderData.timestamp &&
                  format(
                    new Date(orderData.timestamp),
                    "MMMM d, yyyy 'at' h:mm a"
                  )}
              </CardDescription>
            </div>
            <Badge
              variant={
                isDSWD ? "destructive" : hasDiscount ? "secondary" : "default"
              }
            >
              {isDSWD
                ? "DSWD"
                : hasDiscount
                ? `${orderData.discountInfo?.type} (20%)`
                : "Regular"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Branch:</span>
                <span>{orderData.branch}</span>
              </div>

              {hasCustomerInfo && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <h3 className="font-medium">Customer Information</h3>
                  </div>
                  <Separator />
                  {orderData.customerInfo?.patient_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Name:</span>
                      <span>{orderData.customerInfo.patient_name}</span>
                    </div>
                  )}
                  {orderData.customerInfo?.guaranteeLetterNo && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Guarantee Letter No:
                      </span>
                      <span>{orderData.customerInfo.guaranteeLetterNo}</span>
                    </div>
                  )}
                  {orderData.customerInfo?.invoiceNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Contact Number:
                      </span>
                      <span>{orderData.customerInfo.invoiceNumber}</span>
                    </div>
                  )}
                </div>
              )}

              {hasPrescription && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <h3 className="font-medium">Prescription Information</h3>
                  </div>
                  <Separator />
                  {orderData.prescriptionInfo?.doctorName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Doctor:</span>
                      <span>{orderData.prescriptionInfo.doctorName}</span>
                    </div>
                  )}
                  {orderData.prescriptionInfo?.PRCNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">PRC No:</span>
                      <span>{orderData.prescriptionInfo.PRCNumber}</span>
                    </div>
                  )}
                  {orderData.prescriptionInfo?.PTRNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">PTR No:</span>
                      <span>{orderData.prescriptionInfo.PTRNumber}</span>
                    </div>
                  )}
                  {orderData.prescriptionInfo?.prescriptionDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Date:</span>
                      <span>
                        {format(
                          new Date(orderData.prescriptionInfo.prescriptionDate),
                          "MMMM d, yyyy"
                        )}
                      </span>
                    </div>
                  )}
                  {orderData.prescriptionInfo?.notes && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Notes:</span>
                      <span>{orderData.prescriptionInfo.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              <CardTitle>Items</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderData.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.full_product_name}
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Subtotal</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(orderData.subtotal)}
                  </TableCell>
                </TableRow>
                {hasDiscount && (
                  <TableRow>
                    <TableCell colSpan={4}>Discount (20%)</TableCell>
                    <TableCell className="text-right">
                      -₱{orderData.discount}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right font-bold">
                    {isDSWD ? "FREE" : formatCurrency(orderData.total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <CardTitle>Payment</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isDSWD ? (
                <div className="rounded-md bg-red-50 p-4 text-center">
                  <p className="text-red-800 font-medium">
                    DSWD Transaction - No Payment Required
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="payment">Payment Amount</Label>
                    <Input
                      id="payment"
                      type="number"
                      placeholder="Enter payment amount"
                      value={paymentAmount}
                      onChange={handlePaymentChange}
                    />
                  </div>

                  {paymentAmount &&
                    !isNaN(Number.parseFloat(paymentAmount)) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label>Total</Label>
                          <div className="text-xl font-bold">
                            {formatCurrency(orderData.total)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Change</Label>
                          <div
                            className={`text-xl font-bold ${
                              change < 0 ? "text-red-500" : ""
                            }`}
                          >
                            {change < 0
                              ? "Insufficient"
                              : formatCurrency(change)}
                          </div>
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button onClick={handleSubmit}>Complete Transaction</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
