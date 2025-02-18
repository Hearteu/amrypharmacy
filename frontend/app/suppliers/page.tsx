"use client";

import { useState } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";

interface Supplier{
    supplier_id: number;
    supplier_name: string;
    address: string;
    contact_no: number;
    email: string;
}

export default function SupplierList() {
//   const [loading, setLoading] = useState(true); 
  const [supplierData, setSupplierData] = useState<Supplier[]>([]);


  return (
    <>
      <div className="p-4">
        <div id="inventory" className="min-h-screen w-full pt-8 pr-4">
          <div className="flex flex-row justify-between">
            <h2 className="text-xl font-semibold p-4">Suppliers</h2>
          </div>
            <DataTable columns={columns} data={supplierData} />
        </div>
      </div>
    </>
  );
}
