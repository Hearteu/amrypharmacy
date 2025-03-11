"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface OrderItem {
  item_name: string;
  size: string;
  price: number;
  quantity: number;
}

interface OrdersProps {
  orders: OrderItem[];
  onIncrease: (item_name: string) => void;
  onDecrease: (item_name: string) => void;
  onRemove: (item_name: string) => void;
  onClear: () => void;
}

export function Orders({ orders, onIncrease, onDecrease, onRemove, onClear }: OrdersProps) {
  const router = useRouter();
  const [orderType, setOrderType] = React.useState<string>("regular");
  const [discountType, setDiscountType] = React.useState<string>("none");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // 🏷️ Calculate discounts dynamically
  const subtotal = orders.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  let discount = 0;

  if (discountType === "senior") {
    discount = subtotal * 0.2; // 20% discount for seniors/PWD
  }

  const total = subtotal + tax - discount;
  const orderNumber = "0001"; // Example order number
  const orderDate = new Date().toLocaleDateString("en-US");

  return (
    <Card className="border shadow-lg rounded-lg p-4 bg-white w-full max-w-lg h-[597px] flex flex-col">
      {/* Card Header */}
      <CardHeader>
        <CardTitle className="text-lg font-bold">Current Order</CardTitle>
      </CardHeader>

      {/* Order Type & Discount Dropdowns */}
      <CardContent className="flex flex-col">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Select
            value={orderType}
            onValueChange={(value) => {
              setOrderType(value);
              if (value === "dswd") {
                router.push("/pos/dswd/");
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="dswd">DSWD</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={discountType}
            onValueChange={(value) => setDiscountType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Discount" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="senior">PWD / Senior (20% Off)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      {/* Scrollable Order List */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="divide-y">
          {orders.length > 0 ? (
            orders.map((item) => (
              <div key={item.item_name} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{item.item_name} ({item.size})</p>
                  <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => onDecrease(item.item_name)}>
                    <Minus size={16} />
                  </Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button size="icon" variant="outline" onClick={() => onIncrease(item.item_name)}>
                    <Plus size={16} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onRemove(item.item_name)}>
                    <Trash size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-gray-500">No items added.</p>
          )}
        </div>
      </div>

      {/* Static Order Summary & Buttons */}
      <div className="bg-white shadow-md border-t p-4 mt-4 sticky bottom-0">
        <p className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></p>
        <p className="flex justify-between"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></p>
        {discount > 0 && (
          <p className="flex justify-between text-green-600">
            <span>Discount ({discountType === "senior" ? "20%" : "0%"})</span>
            <span>- ${discount.toFixed(2)}</span>
          </p>
        )}
        <p className="flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></p>

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={onClear}>Clear</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-black text-white" onClick={() => setIsDialogOpen(true)}>🛒 Save Order</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Order Summary</DialogTitle>
              </DialogHeader>
              <p>Order#: {orderNumber}</p>
              <p>Date: {orderDate}</p>
              <p>Order Type: {orderType}</p>
              <table className="w-full text-left mt-2">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((item) => (
                    <tr key={item.item_name}>
                      <td>{item.item_name} ({item.size})</td>
                      <td>{item.quantity}</td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>Subtotal: ${subtotal.toFixed(2)}</p>
              <p>Tax (8%): ${tax.toFixed(2)}</p>
              {discount > 0 && <p>Discount: -${discount.toFixed(2)}</p>}
              <p className="font-bold text-lg">Total: ${total.toFixed(2)}</p>
              <DialogFooter>
                <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button className="bg-green-600 text-white">Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}