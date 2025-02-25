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
import { DataTable } from "./data-table";

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
  },[]);
    const tableColumns = columns(refreshData)
  

  return (
    <>
      <div className="p-4">
        <div id="" className="min-h-screen w-full pt-8 pr-4">
          <div className="flex flex-row justify-between">
            <h2 className="text-xl font-semibold p-4">Suppliers</h2>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Add Suppliers</Button>
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
          <DataTable columns={tableColumns} data={supplierData} />
        </div>
      </div>
    </>
  );
}