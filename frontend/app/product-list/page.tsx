"use client"; // Ensure this is at the top to use hooks

import { useState, useEffect } from "react";
import { DataTable } from "../../components/data-table/DataTable";
import { columns } from "./components/Columns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Products } from "../lib/types/inventory/products";
import { getProductsData } from "@/app/lib/services/inventory";
import AddProductForm from "./components/AddProductForm";

export default function ProducList() {
  const [data, setData] = useState<Products[]>([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [open, setOpen] = useState(false);

  const refreshData = async () => {
    console.log("Refreshing data...");
    setLoading(true);
    try {
      const productsData = await getProductsData();
      setData(productsData);
      console.log(productsData);
    } catch {
      console.error("Error fetching data", error);
      setError("Failed to load products");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const tableColumns = columns(refreshData);

  useEffect(() => {
    refreshData();
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <>
      <div className="p-4">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Product List
              </h1>
              <p className="text-muted-foreground">
                View, manage, edit, and delete products in your inventory.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
              </DialogTrigger>
              <DialogContent className="w-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to add a new product to the
                    inventory.
                  </DialogDescription>
                </DialogHeader>
                <AddProductForm
                  onSuccess={() => {
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
              <DataTable
                columns={tableColumns}
                data={data}
                search="full_product_name"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
