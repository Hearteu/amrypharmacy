"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PosInterface from "./components/POSInterface";
import { Transactions } from "../transactions/components/Transactions";

export default function Pharmacy() {
  const [activeTab, setActiveTab] = useState("pos");

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pharmacy POS System</h1>
        <p className="text-muted-foreground">
          Manage transactions and View history transaction
        </p>
      </div>
      <PosInterface />
    </div>
  );
}
