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
import {
  getTransactions,
  getTransactionsType,
} from "@/app/lib/services/transactions";
import { DataTableLoading } from "@/components/data-table/DataTableLoading";
import { DataTable } from "@/components/data-table/DataTable";
import { columns } from "./components/Columns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTableError } from "@/components/data-table/DataTableError";

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "all") {
        const transactions = await getTransactions();
        setTransactions(transactions);
      } else {
        const transactions = await getTransactionsType(activeTab);
        setTransactions(transactions);
        console.log("tyepe", transactions);
      }
    } catch (error) {
      setTransactions([]);
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
  }, [activeTab]);

  //   if (error) return <p>No data found {error}</p>;

  const tabOptions = [
    { value: "all", label: "All" },
    { value: "regular", label: "Regular" },
    { value: "dswd", label: "DSWD" },
    { value: "pwd", label: "PWD" },
    { value: "senior citizen", label: "Senior Citizen" },
  ] as const;

  return (
    <>
      <div className="p-4">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Transaction History
              </h1>
              <p className="text-muted-foreground">View past transactions</p>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              {tabOptions.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div>
              {loading ? (
                <DataTableLoading columnCount={tableColumns.length} />
              ) : error ? (
                <DataTableError message="No Transactions Found" />
              ) : (
                <DataTable
                  columns={tableColumns}
                  data={transactions}
                  search="invoice"
                />
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </>
  );
}
