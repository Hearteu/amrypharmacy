"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PosInterface from "./components/POSInterface";
import { Transactions } from "./components/Transactions";

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

      <Tabs
        defaultValue="pos"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pos">POS</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="pos" className="border rounded-md mt-6">
          <PosInterface />
        </TabsContent>
        <TabsContent
          value="transactions"
          className="border rounded-md mt-6 p-4"
        >
          <Transactions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
