import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [orderType, setOrderType] = useState("Regular");
  const [discountType, setDiscountType] = useState("None");
  const router = useRouter();

  const handleOrderTypeChange = (value: string) => {
    setOrderType(value);
    if (value === "DSWD") {
      setDiscountType("None");
      router.push("/pos/dswd");
    }
  };

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

  const subtotal = orderData.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isDiscountAllowed = orderType === "Regular";
  const discount = isDiscountAllowed && discountType === "PWD/Senior" ? subtotal * 0.2 : 0;
  const total = subtotal - discount;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <OrderTypeSelector value={orderType} onChange={handleOrderTypeChange} />
        {orderType === "DSWD" && <DSWDNote />}
        <OrderTable orderData={orderData} updateQuantity={updateQuantity} />
        {isDiscountAllowed && <DiscountSelector value={discountType} onChange={setDiscountType} router={router} />}
        <OrderTotal subtotal={subtotal} discount={discount} total={total} isDiscountAllowed={isDiscountAllowed} />
      </CardContent>
    </Card>
  );
};

const OrderTypeSelector = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div>
    <label className="text-sm font-medium">Select Order Type</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="mt-1 w-full">
        <SelectValue placeholder="Select Order Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Regular">Regular</SelectItem>
        <SelectItem value="DSWD">DSWD</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const DSWDNote = () => (
  <div className="p-3 bg-blue-100 border border-blue-400 rounded-lg text-blue-700">
    <p className="text-sm font-medium">DSWD Order</p>
    <p className="text-xs">This order is processed under the DSWD guarantee letter module.</p>
  </div>
);

const OrderTable = ({ orderData, updateQuantity }: { orderData: OrderItem[]; updateQuantity: (index: number, amount: number) => void }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Item Name</TableHead>
        <TableHead className="text-center">Quantity</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {orderData.length === 0 ? (
        <TableRow>
          <TableCell colSpan={2} className="text-center text-gray-500 py-4">
            No items added.
          </TableCell>
        </TableRow>
      ) : (
        orderData.map((order, index) => (
          <TableRow key={index}>
            <TableCell>{order.product_name}</TableCell>
            <TableCell className="flex justify-center items-center space-x-2">
              <Button size="sm" variant="outline" onClick={() => updateQuantity(index, -1)}>
                -
              </Button>
              <span>{order.quantity}</span>
              <Button size="sm" variant="outline" onClick={() => updateQuantity(index, 1)}>
                +
              </Button>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);

const DiscountSelector = ({ value, onChange, router }: { value: string; onChange: (value: string) => void; router: any }) => (
  <div>
    <label className="text-sm font-medium">Apply Discount</label>
    <Select value={value} onValueChange={(value) => {
      onChange(value);
      if (value === "PWD/Senior") {
        router.push("/pos/regular-discount");
      }
    }}>
      <SelectTrigger className="mt-1 w-full">
        <SelectValue placeholder="Select Discount" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="None">None</SelectItem>
        <SelectItem value="PWD/Senior">PWD/Senior</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const OrderTotal = ({ subtotal, discount, total, isDiscountAllowed }: { subtotal: number; discount: number; total: number; isDiscountAllowed: boolean }) => (
  <div className="p-3 bg-gray-100 rounded-lg">
    <p className="text-sm flex justify-between">
      <span>Subtotal:</span> <span>₱{subtotal.toFixed(2)}</span>
    </p>
    {isDiscountAllowed && (
      <p className="text-sm flex justify-between">
        <span>Discount:</span> <span>-₱{discount.toFixed(2)}</span>
      </p>
    )}
    <p className="text-lg font-bold flex justify-between">
      <span>Total:</span> <span>₱{total.toFixed(2)}</span>
    </p>
  </div>
);

export default OrderSummary;