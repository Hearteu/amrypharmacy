"use client";

import { useState, useEffect } from "react";
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
import { Session } from "@/app/lib/types/session";
import { getSession } from "next-auth/react";

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const [session, updateSession] = useState<Session | null>(null);
  const fetchSession = async () => {
    const _session: Session | null = await getSession();
    updateSession(_session);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const location_id = session?.user?.location_id?.toString() || "";
  console.log("location ni transaction", location_id);

  const refreshData = async () => {
    setLoading(true);
    setError(null);

    // Check if location_id is available
    if (!location_id) {
      console.error("Missing location_id in transactions page");
      setError("Location ID is missing. Please log in again.");
      setTransactions([]);
      setLoading(false);
      return; // Early return from the function
    }

    try {
      if (activeTab === "all") {
        const transactions = await getTransactions(location_id);
        setTransactions(transactions);
      } else {
        const transactions = await getTransactionsType(activeTab, location_id);
        setTransactions(transactions);
        console.log("type", transactions);
      }
    } catch (error) {
      setTransactions([]);
      setError("Failed to load");
      console.error("Error fetching data", error);
      console.log(error);
      console.log("type", activeTab);
    } finally {
      setLoading(false);
    }
  };

  const tableColumns = columns(refreshData);

  useEffect(() => {
    if (session?.user?.location_id) {
      refreshData();
    }
  }, [activeTab, session]);

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
