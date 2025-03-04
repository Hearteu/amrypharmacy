"use client";

import { useState } from "react";
import { StockTransferForm } from "./components/StockTransferForm";
import StockTransferTable from "./components/StockTransferTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

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
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Stock Transfers
            </h1>
            <p className="text-muted-foreground">
              Manage and track your stock transfers
            </p>
          </div>
          <Button asChild>
            <Link href="/stock-transfer/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Stock Transfer
            </Link>
          </Button>
        </div>

          <StockTransferTable/>
        </div>
      </div>
    </>
  );
}
