"use client";

import { useState } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns"; // Import columns configuration
import AddProductForm from  "@/components/forms/NewProductForm"; // Import the Add Product Dialog
import ProductList from "@/components/product-table/page";

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([]);

  // Sample data for inventory
  const fetchProducts = async () => {
    // Example: Fetch data from an API endpoint
    const fetchedData = [
      { id: 1, product_name: "Laptop", category: "Electronics", price: 1000, unit: "pcs" },
      { id: 2, product_name: "Shirt", category: "Fashion", price: 20, unit: "pcs" },
    ];
    setProducts(fetchedData);
  };

  return (
    <>
    <div>
      <div className="w-full grid justify-items-end pt-4 pr-4">
        <AddProductForm />
      </div>
      <h2 className="text-xl font-semibold px-4">Inventory</h2>
      <DataTable columns={columns} data={products} />
    </div>
    <div className="">
      <ProductList></ProductList>
    </div>
    </>
  );
}
