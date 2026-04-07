"use client";

import { API_URL } from "@/app/lib/api-config";
import { offlineSync } from "@/app/lib/services/offline-sync";

import type React from "react";

import { format } from "date-fns";
import { Calculator, FileText, Receipt, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [change, setChange] = useState<number>(0);
  const [transactionComplete, setTransactionComplete] = useState<boolean>(false);
  const [invoiceId, setInvoiceId] = useState<string>("");
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
        paymentMethod,
        change,
      };
    } else {
      // For DSWD customers, set payment and change to 0
      transactionData = {
        ...orderData,
        paymentAmount: 0,
        paymentMethod: "DSWD",
        change: 0,
      };
    }

    console.log("Submitting transaction:", transactionData);

    const completeTransaction = (invoiceFallback: string) => {
      setInvoiceId(invoiceFallback);
      setTransactionComplete(true);
      localStorage.removeItem("orderSummary");
    };

    if (!navigator.onLine) {
      offlineSync.saveTransaction(transactionData)
        .then(() => {
          console.log("Order saved offline");
          completeTransaction("OFFLINE-" + Math.floor(Math.random() * 10000));
        })
        .catch(err => {
          console.error("Failed to save offline tx", err);
          alert("Error saving offline order.");
        });
      return;
    }

    fetch(`${API_URL}/pos/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transactionData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Order submitted successfully:", data);
        completeTransaction(data.invoice || "INV-0000");
      })
      .catch((error) => {
        console.error("Error submitting order, falling back to offline", error);
        offlineSync.saveTransaction(transactionData)
          .then(() => completeTransaction("OFFLINE-" + Math.floor(Math.random() * 10000)))
          .catch(err => alert("Error submitting order. Please try again."));
      });
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (transactionComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/50 p-4">
        {/* Style block for 80mm thermal printer */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            #printable-receipt, #printable-receipt * { visibility: visible; }
            #printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 300px; /* 80mm approx */
              font-family: monospace;
              color: black;
              background: white;
              padding: 10px;
            }
          }
        `}} />

        {/* The screen UI for successful transaction */}
        <Card className="w-full max-w-md shadow-lg border-green-200 hide-on-print">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Transaction Complete!</CardTitle>
            <CardDescription className="text-base">
              Invoice #{invoiceId} has been saved successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
             <div className="rounded-lg bg-slate-50 p-4 border space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Total:</span>
                 <span className="font-semibold">{isDSWD ? "FREE" : formatCurrency(orderData.total)}</span>
               </div>
               {!isDSWD && (
                 <>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Amount Paid ({paymentMethod}):</span>
                     <span className="font-semibold">{formatCurrency(Number.parseFloat(paymentAmount))}</span>
                   </div>
                   <Separator className="my-2" />
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Change:</span>
                     <span className="font-semibold text-green-600">{formatCurrency(change)}</span>
                   </div>
                 </>
               )}
             </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button onClick={handlePrintReceipt} size="lg" className="w-full">
              Print Receipt
            </Button>
            <Button onClick={() => router.push("/pos")} variant="outline" className="w-full">
              New Transaction
            </Button>
          </CardFooter>
        </Card>

        {/* The printable 80mm Receipt */}
        <div id="printable-receipt" className="hidden print:block text-xs">
           <div className="text-center font-bold text-sm mb-2">
              AMRY PHARMACY
           </div>
           <div className="text-center mb-4">
              Receipt: {invoiceId}<br/>
              Date: {format(new Date(), "MM/dd/yyyy HH:mm")}<br/>
              {orderData.branch ? `Branch: ${orderData.branch}` : ""}
           </div>
           
           <div className="border-t border-dashed border-black my-2"></div>
           
           <table className="w-full mb-2">
             <tbody>
               {orderData.items.map(item => (
                 <tr key={item.id}>
                   <td className="align-top py-1">
                     <div className="font-bold">{item.full_product_name}</div>
                     <div>{item.quantity} x {formatCurrency(item.price)}</div>
                   </td>
                   <td className="text-right align-bottom py-1">
                     {formatCurrency(item.price * item.quantity)}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>

           <div className="border-t border-dashed border-black my-2"></div>
           
           <div className="flex justify-between">
             <span>Subtotal:</span>
             <span>{formatCurrency(orderData.subtotal)}</span>
           </div>
           {hasDiscount && (
             <div className="flex justify-between">
               <span>Discount:</span>
               <span>-{formatCurrency(orderData.discount)}</span>
             </div>
           )}
           <div className="flex justify-between font-bold text-sm my-1">
             <span>Total:</span>
             <span>{isDSWD ? "FREE" : formatCurrency(orderData.total)}</span>
           </div>
           
           <div className="border-t border-dashed border-black my-2"></div>
           
           {!isDSWD && (
             <>
               <div className="flex justify-between">
                 <span>Paid ({paymentMethod}):</span>
                 <span>{formatCurrency(Number.parseFloat(paymentAmount || "0"))}</span>
               </div>
               <div className="flex justify-between font-bold">
                 <span>Change:</span>
                 <span>{formatCurrency(change)}</span>
               </div>
             </>
           )}
           
           <div className="text-center mt-6">
              Thank you for choosing Amry Pharmacy!
           </div>
        </div>
      </div>
    );
  }

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
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger id="payment-method">
                        <SelectValue placeholder="Select Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="GCash">GCash</SelectItem>
                        <SelectItem value="Card">Credit/Debit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                            className={`text-xl font-bold ${change < 0 ? "text-red-500" : ""
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
