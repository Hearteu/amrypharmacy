"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import OrderSummary from "./order-summary";
import { columns } from "./columns";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

interface SalesOrder {
  order_id: number;
  customer_name: string;
  total_amount: number;
  order_status: string;
  order_date: string;
  product_name: string;
  form: string;
  size: string;
  stock_quantity: number;
  price: number;
}

// Sample Data
const sampleOrders: SalesOrder[] = [
  {
    order_id: 1,
    customer_name: "John Doe",
    total_amount: 150.5,
    order_status: "Completed",
    order_date: "2024-02-10",
    product_name: "Paracetamol",
    price: 50.5,
    form: "Tablet",
    size: "500mg",
    stock_quantity: 100,
  },
  {
    order_id: 2,
    customer_name: "Jane Smith",
    total_amount: 250.0,
    order_status: "Pending",
    order_date: "2024-02-09",
    product_name: "Amoxicillin",
    price: 125.0,
    form: "Capsule",
    size: "250mg",
    stock_quantity: 50,
  },
  {
    order_id: 3,
    customer_name: "Carlos Mendoza",
    total_amount: 180.75,
    order_status: "Shipped",
    order_date: "2024-02-08",
    product_name: "Cough Syrup",
    price: 60.25,
    form: "Liquid",
    size: "100ml",
    stock_quantity: 30,
  },
  {
    order_id: 4,
    customer_name: "Carlos Mendoza",
    total_amount: 180.75,
    order_status: "Shipped",
    order_date: "2024-02-08",
    product_name: "Cough Syrup",
    price: 60.25,
    form: "Liquid",
    size: "100ml",
    stock_quantity: 30,
  },
];

export default function SalesOrderPage() {
  const [orderData, setOrderData] = useState<SalesOrder[]>(sampleOrders); // Set initial data
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<SalesOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch("http://127.0.0.1:8000/pharmacy/sales-orders/");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data: SalesOrder[] = await response.json();
        setOrderData(data);
      } catch (error) {
        console.error("Error fetching sales orders:", error);
        // Keep sample data if API fails
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);


  const columnDefs = columns();

  return (
    <>
      {/* Breadcrumb Header */}
      <div className="p-4 fixed w-full bg-white shadow-md">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#sales">Sales Orders</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row min-h-screen pt-16 gap-4 p-4">
        {/* Sales Orders Table */}
        <div className="md:w-2/3 w-full bg-white shadow-md p-4 rounded-lg">
          {/* Header Section: Title + Add Button on Right */}
          <div className="flex justify-between items-center pb-4">
            <h2 className="text-xl font-semibold">Sales Orders</h2>
          </div>

          {/* Table Content */}
          {loading ? (
            <p>Loading...</p>
          ) : (
            <DataTable columns={columnDefs} data={orderData} onRowClick={setSelectedOrder} />
          )}
        </div>

        {/* Order Summary */}
        <div className="md:w-1/3 w-full bg-gray-100 shadow-md p-4 rounded-lg">
          <OrderSummary orderData={selectedOrders} />
        </div>
      </div>
    </>
  );
}
