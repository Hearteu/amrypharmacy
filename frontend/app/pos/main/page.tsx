"use client";

import { useState } from "react";
import { DataTable } from "./data-table";
import OrderSummary from "./order-summary";
import { columns } from "./columns";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Item data structure
interface Item {
  item_name: string;
  form: string;
  size: string;
  stock_quantity: number;
  price: number;
}

// **Static Sample Item Data**
const sampleItems: Item[] = [
  {
    item_name: "Paracetamol",
    form: "Tablet",
    size: "500mg",
    stock_quantity: 100,
    price: 50.5,
  },
  {
    item_name: "Amoxicillin",
    form: "Capsule",
    size: "250mg",
    stock_quantity: 50,
    price: 125.0,
  },
  {
    item_name: "Cough Syrup",
    form: "Liquid",
    size: "100ml",
    stock_quantity: 30,
    price: 60.25,
  },
  {
    item_name: "Vitamin C",
    form: "Tablet",
    size: "1000mg",
    stock_quantity: 200,
    price: 80.0,
  },
];

export default function SalesOrderPage() {
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);

  const handleAddToOrder = (item: any) => {
    setSelectedItems((prev) => {
      const existingItem = prev.find((i) => i.item_name === item.item_name);
      if (existingItem) {
        return prev.map((i) =>
          i.item_name === item.item_name
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  return (
    <>
      <DataTable columns={columns} data={sampleItems} onAdd={handleAddToOrder} />
      <OrderSummary orderData={selectedItems} />
    </>
  );
}