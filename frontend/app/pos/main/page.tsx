"use client";

import { useState, useEffect } from "react";
import { DataTable } from "./data-table";
import { Orders } from "./orders";
import { columns } from "./columns";
import { Skeleton } from "@/components/ui/skeleton";

// Item data structure
interface Item {
  item_name: string;
  form: string;
  size: string;
  stock_quantity: number;
  price: number;
}

interface OrderItem extends Item {
  quantity: number;
}

export default function SalesOrderPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setIsLoading(true);
    // Simulated sample data (Replace with backend call when needed)
    setTimeout(() => {
      setItems([
        { item_name: "Cola", form: "Bottle", size: "500ml", stock_quantity: 20, price: 15 },
        { item_name: "Juice", form: "Can", size: "330ml", stock_quantity: 15, price: 12 },
        { item_name: "Water", form: "Bottle", size: "1L", stock_quantity: 30, price: 10 },
        { item_name: "Sprite", form: "Bottle", size: "1L", stock_quantity: 30, price: 10 },
      ]);
      setIsLoading(false);
    }, 1000);
    
    /*
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/items"); // Adjust API endpoint accordingly
        if (!response.ok) throw new Error("Failed to fetch items");
        const data: Item[] = await response.json();
        setItems(data);
      } catch (err) {
        setError("Error fetching items. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
    */
  }, []);

  //handle add orders based on selected items
  const handleAddToOrder = (item: Item) => {
    setSelectedItems((prev) => {
      const existingItem = prev.find((i) => i.item_name === item.item_name);
      if (existingItem) {
        return prev.map((i) =>
          i.item_name === item.item_name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  //handle quantity increase on the orders 
  const handleIncrease = (item_name: string) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.item_name === item_name ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  //handle quantity decrease on the orders
  const handleDecrease = (item_name: string) => {
    setSelectedItems((prev) =>
      prev
        .map((item) =>
          item.item_name === item_name ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  //handle order removal 
  const handleRemove = (item_name: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.item_name !== item_name));
  };

  //clears all orders
  const handleClear = () => {
    setSelectedItems([]);
  };

  return (
    <div className="flex gap-4 p-4">
      <div className="flex-1">
        {isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-md" />
        ) : (
          <DataTable columns={columns} data={items} onAdd={handleAddToOrder} isLoading={isLoading} error={error} />
        )}
      </div>
      <div className="w-96">
        <Orders
          orders={selectedItems}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          onRemove={handleRemove}
          onClear={handleClear}
        />
      </div>
    </div>
  );
}