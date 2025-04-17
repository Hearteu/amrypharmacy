"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Transaction } from "@/app/lib/types/transactions";
import { getTransactions } from "@/app/lib/services/transactions";
import { DataTableLoading } from "@/components/data-table/DataTableLoading";
import { DataTable } from "@/components/data-table/DataTable";
import { columns } from "./components/Columns";

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState("regular");
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const transactions = await getTransactions();
      setTransactions(transactions);
    } catch (error) {
      setError("Failed to load");
      console.error("Error fetching data", error);

      console.log(error);
      setTransactions([]);
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
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>View and manage past transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          {loading ? (
            <DataTableLoading columnCount={tableColumns.length} />
          ) : (
            <>
              <DataTable
                columns={tableColumns}
                data={transactions}
                search="invoice"
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
