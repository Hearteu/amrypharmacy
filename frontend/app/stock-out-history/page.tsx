"use client";

import { useEffect, useState } from "react";
import { getAllTransactions } from "../lib/services/transactions";
import { Transaction } from "../lib/types/transactions";
import { DataTableLoading } from "@/components/data-table/DataTableLoading";
import { columns } from "./components/Columns";
import { DataTable } from "@/components/data-table/DataTable";

export default function StockOutHistory() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  const refreshData = async () => {
    console.log("Refreshing data...");
    setLoading(true);
    try {
      const data = await getAllTransactions();
      setData(data);
    } catch {
      console.error("Error fetching data", error);
      setError("Failed to load products");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const tableColumns = columns(refreshData);

  return (
    <div className="p-4">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Stock Transaction History
            </h1>
            <p className="text-muted-foreground">
              Track and review all stock movements, including transfers,
              additions, and deductions across locations.
            </p>
          </div>
        </div>
        {loading ? (
          <DataTableLoading columnCount={tableColumns.length} rowCount={10} />
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
  );
}
