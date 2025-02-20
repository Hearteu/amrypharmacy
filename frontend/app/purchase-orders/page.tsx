"use client";

import { useState } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";

interface PurchaseOrder{
    purchase_order_id: number;
    supplier_name: string;
    date: number;
}

export default function PurchaseOrderList() {
//   const [loading, setLoading] = useState(true); 
  const [poData, setPoData] = useState<PurchaseOrder[]>([]);


  return (
    <>
      <div className="p-4">
        <div id="inventory" className="min-h-screen w-full pt-8 pr-4">
          <div className="flex flex-row justify-between">
            <h2 className="text-xl font-semibold p-4">Purchase Order History</h2>
          </div>
            <DataTable columns={columns} data={poData} />
        </div>
      </div>
    </>
  );
}
