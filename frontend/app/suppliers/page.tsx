"use client";

import AddSupplierForm from "@/components/forms/AddSupplierForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { columns } from "./columns";
import { PlusCircle } from "lucide-react";
import { DataTableLoading } from "@/components/data-table/DataTableLoading";
import { DataTable } from "@/components/data-table/DataTable";

interface Suppliers {
  supplier_id: number;
  supplier_name: string;
  contact_person: string;
  contact: string;
  address: string;
  email: string;
  vat_num: string;
  status_id: number;
  status: string;
}

export default function SupplierList() {
  //   const [loading, setLoading] = useState(true);
  const [supplierData, setSupplierData] = useState<Suppliers[]>([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [open, setOpen] = useState(false);

  async function getData(): Promise<Suppliers[]> {
    try {
      const supRes = await fetch("http://127.0.0.1:8000/pharmacy/suppliers/");

      if (!supRes.ok) {
        throw new Error("Failed to fetch supplier data");
      }

      const supData: Suppliers[] = await supRes.json();

      const supplierData: Suppliers[] = supData.map((supplier) => ({
        supplier_id: supplier.supplier_id,
        supplier_name: supplier.supplier_name,
        contact_person: supplier.contact_person,
        contact: supplier.contact,
        address: supplier.address,
        email: supplier.email,
        vat_num: supplier.vat_num,
        status_id: supplier.status_id,
        status: supplier.status,
      }));

      return supplierData;
    } catch (error) {
      console.error("Error fetching supplier data", error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  const refreshData = () => {
    console.log("Refreshing Data");
    getData().then((fetchedData) => {
      setSupplierData(fetchedData);
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
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Supplier List
              </h1>
              <p className="text-muted-foreground">
                Keep track of your suppliers and manage their information
                efficiently.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>

                <AddSupplierForm
                  onSuccess={(data) => {
                    console.log("Columns", data);
                    setOpen(false);
                    refreshData();
                  }}
                ></AddSupplierForm>
              </DialogContent>
            </Dialog>
          </div>
          {loading ? (
            <DataTableLoading columnCount={tableColumns.length} rowCount={10} />
          ) : (
            <>
              <DataTable
                columns={tableColumns}
                data={supplierData}
                search="supplier_name"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
