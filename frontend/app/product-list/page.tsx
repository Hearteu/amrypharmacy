"use client"; // Ensure this is at the top to use hooks

import { useState, useEffect } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import AddProductForm from "@/components/forms/AddProductForm";

interface Products {
  product_id: number;
  full_product_name: string;
  category: string;
  price: string;
  net_content: string;
  unit: string;
}

export default function ProducList() {
  const [data, setData] = useState<Products[]>([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [open, setOpen] = useState(false);

  async function getData(): Promise<Products[]> {
    try {
      const prodRes = await fetch("http://127.0.0.1:8000/pharmacy/products/");

      if (!prodRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const prodData: Products[] = await prodRes.json();

      const productData: Products[] = prodData.map((product) => ({
        product_id: product.product_id,
        full_product_name: product.full_product_name,
        category: product.category,
        price: product.price,
        net_content: product.net_content,
        unit: product.unit,
      }));

      return productData;
    } catch (error) {
      console.error("Error fetching data", error);
      setError("Failed to load products");
      return [];
    } finally {
      setLoading(false);
    }
  }

  const refreshData = () => {
    console.log("Refreshing data...");
    getData().then((fetchedData) => {
      setData(fetchedData);
      setLoading(false);
    });
  };

  const tableColumns = columns(refreshData);

  useEffect(() => {
    refreshData(); // Fetch initial data
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <>
    <div className="w-full flex flex-row items-center justify-between pt-4 px-4">
      <h1 className="font-bold">Products List</h1>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Add User</Button>
              </DialogTrigger>
              <DialogContent className="w-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <AddProductForm
                  onSuccess={(data) => {
                    console.log("Columns", data);
                    setOpen(false);
                    refreshData();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <>
          
          <DataTable columns={tableColumns} data={data} />
        </>
      )}
    </>
  );
}
