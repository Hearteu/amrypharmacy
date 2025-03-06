"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import AddSupplierItemForm from "@/components/forms/AddSupplierItemForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AssignedItems {
  supplier_item_id: number;
  supplier_name: string;
  product_name: string;
  supplier_price: string;
}

export default function AssignedItemsPage({
  params,
}: {
  params: { supplier_id: string };
}) {
  const [supplierItemData, setSupplierItemData] = useState<AssignedItems[]>([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [open, setOpen] = useState(false);

  async function getData(): Promise<AssignedItems[]> {
    try {
      const supItemsRes = await fetch(
        `http://127.0.0.1:8000/pharmacy/supplier-items/${params.supplier_id}/`
      );

      if (!supItemsRes.ok) {
        throw new Error("Failed to fetch supplier items data");
      }

      const supItemsData: AssignedItems[] = await supItemsRes.json();

      const supplierItemData: AssignedItems[] = supItemsData.map((items) => ({
        supplier_item_id: items.supplier_item_id,
        supplier_name: items.supplier_name,
        product_name: items.product_name,
        supplier_price: items.supplier_price,
      }));

      return supplierItemData;
    } catch (error) {
      console.error("Error fetching supplier items data:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  const refreshData = () => {
    console.log("refreshing data");
    getData().then((fetchedData) => {
      setSupplierItemData(fetchedData);
      setLoading(false);
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const tableColumns = columns(refreshData);

  return (
    <>
      <div className="p-4">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href={"/suppliers/"}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Items Provided by Supplier:{" "}
                {supplierItemData[0]?.supplier_name || "Loading..."}
              </h1>
              <p className="text-muted-foreground">
                Assign items to this supplier and manage their product
                offerings.
              </p>
              </div>
              
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Assign an Item</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>

                <AddSupplierItemForm
                  supplier_id={parseInt(params.supplier_id)}
                  onSuccess={(data) => {
                    console.log("Columns", data);
                    setOpen(false);
                    refreshData();
                  }}
                ></AddSupplierItemForm>
              </DialogContent>
            </Dialog>
          </div>
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : (
            <>
              <DataTable columns={tableColumns} data={supplierItemData} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
