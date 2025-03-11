"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderItem {
  id: string;
  item_name: string;
  size: string;
  price: number;
  quantity: number;
}

interface OrdersProps {
  orders: OrderItem[];
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function Orders({ orders, onIncrease, onDecrease, onRemove, onClear }: OrdersProps) {
  const router = useRouter();
  const [orderType, setOrderType] = React.useState<string | null>(null);
  const [discount, setDiscount] = React.useState<string | null>(null);

  const subtotal = orders.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

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
            onValueChange={(value) => {
              setDiscount(value);
              if (value === "senior") {
                router.push("/pos/regular-discount/");
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Discount" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="senior">PWD / Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>

      {/* Scrollable Order List */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="divide-y">
          {orders.length > 0 ? (
            orders.map((item) => (
              <div key={item.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{item.item_name} ({item.size})</p>
                  <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => onDecrease(item.id)}>
                    <Minus size={16} />
                  </Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button size="icon" variant="outline" onClick={() => onIncrease(item.id)}>
                    <Plus size={16} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onRemove(item.id)}>
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
        <p className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </p>
        <p className="flex justify-between">
          <span>Tax (8%)</span>
          <span>${tax.toFixed(2)}</span>
        </p>
        <p className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </p>

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={onClear}>Clear</Button>
          <Button className="bg-black text-white">🛒 Save Order</Button>
        </div>
      </div>
    </Card>
  );
}
