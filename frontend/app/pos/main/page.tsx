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
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleAddToOrder = () => {
    if (selectedItem) {
      setSelectedItems((prev) => [...prev, selectedItem]);
      setSelectedItem(null);
    }
  };

  const columnDefs = columns();

  return (
    <>
      {/* Breadcrumb Header */}
      <div className="p-4 fixed w-full bg-white shadow-md">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#items">Items</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row min-h-screen pt-16 gap-4 p-4">
        {/* Items Table (Now using Card) */}
        <Card className="md:w-2/3 w-full shadow-lg rounded-lg flex flex-col">
          <CardHeader className="flex justify-between items-center">
            {/* Title on the left */}
            <CardTitle className="text-lg font-semibold">Available Items</CardTitle>

            {/* Button on the right */}
            <Button
              className={`px-4 py-2 text-white rounded ${
                selectedItem ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300 cursor-not-allowed"
              }`}
              disabled={!selectedItem}
              onClick={handleAddToOrder}
            >
              Add to Order
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto">
            <DataTable columns={columnDefs} data={sampleItems} onRowClick={setSelectedItem} />
          </CardContent>
        </Card>

        {/* Order Summary (Now using Card) */}
        <Card className="md:w-1/3 w-full bg-gray-100 shadow-lg rounded-lg flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <OrderSummary orderData={selectedItems} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
