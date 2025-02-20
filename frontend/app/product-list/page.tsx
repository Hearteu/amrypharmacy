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

  async function getData() {
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

      setData(productData);
    } catch (error) {
      console.error("Error fetching data", error);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getData();
  }, []);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p>{error}</p>;

  return(
  <>
    {loading ? (
      <p className="text-center text-gray-500">Loading...</p>
    ) : (
      <DataTable columns={columns} data={data} />
    )}
  </>
  )
}
