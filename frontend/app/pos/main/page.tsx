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
  price: number;
}

export default function SalesOrderPage() {
  const [orderData, setOrderData] = useState<SalesOrder[]>([]);
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
        setOrderData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  // Function to handle adding a selected order to the order summary
  const handleAddOrder = () => {
    if (!selectedOrder) return;

    setSelectedOrders((prevOrders) => {
      const existingIndex = prevOrders.findIndex((order) => order.order_id === selectedOrder.order_id);
      if (existingIndex !== -1) {
        // If order exists, increase quantity
        const updatedOrders = [...prevOrders];
        updatedOrders[existingIndex] = {
          ...updatedOrders[existingIndex],
          quantity: (updatedOrders[existingIndex].quantity || 1) + 1,
        };
        return updatedOrders;
      } else {
        // Add new order with quantity 1
        return [...prevOrders, { ...selectedOrder, quantity: 1 }];
      }
    });
  };

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
            {/* Can only be clickable if there is a selected item */}
            <Button
              onClick={handleAddOrder}
              disabled={!selectedOrder}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md"
            >
              Add
            </Button>
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