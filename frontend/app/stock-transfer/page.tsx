"use client";

import { useState } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";

interface StockTransfer{
    stock_transfer_id: number;
    source: string;
    destination: string;
    date: Date;
}

export default function StockTransferList() {
//   const [loading, setLoading] = useState(true); 
  const [stockTransferData, setStockTransferData] = useState<StockTransfer[]>([]);


  return (
    <>
      <div className="p-4">
        <div id="inventory" className="min-h-screen w-full pt-8 pr-4">
          <div className="flex flex-row justify-between">
            <h2 className="text-xl font-semibold p-4">Stock Transfer History</h2>
          </div>
            <DataTable columns={columns} data={stockTransferData} />
        </div>
      </div>
    </>
  );
}
