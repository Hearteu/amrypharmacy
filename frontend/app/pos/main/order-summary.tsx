import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

interface OrderSummaryProps {
  orderData: OrderItem[];
  setOrderData: (data: OrderItem[]) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ orderData, setOrderData }) => {
  const updateQuantity = (index: number, amount: number) => {
    setOrderData((prevOrders) => {
      const updatedOrders = [...prevOrders];
      updatedOrders[index] = {
        ...updatedOrders[index],
        quantity: Math.max(1, updatedOrders[index].quantity + amount),
      };
      return updatedOrders;
    });
  };

  const deleteOrder = (index: number) => {
    setOrderData((prevOrders) => prevOrders.filter((_, i) => i !== index));
  };

  const subtotal = orderData.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <Card className="shadow-md h-[500px] flex flex-col">
      <CardContent>
        <h2 className="text-lg font-bold mb-2">Current Order</h2>
        <Table>
          <TableBody>
            {orderData.map((order, index) => (
              <TableRow key={index}>
                <TableCell>{order.product_name}</TableCell>
                <TableCell>₱{order.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Button onClick={() => updateQuantity(index, -1)}>-</Button>
                  <span>{order.quantity}</span>
                  <Button onClick={() => updateQuantity(index, 1)}>+</Button>
                </TableCell>
                <TableCell>
                  <Button onClick={() => deleteOrder(index)}>
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₱{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (8%):</span>
          <span>₱{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>₱{total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
