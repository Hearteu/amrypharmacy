"use client";

import StockTransferTable from "./components/StockTransferTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { IncomingTransfersList } from "./components/IncomingTransfers";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OutgoingTransfersList } from "./components/OutgoingTransfers";
import { useEffect, useState } from "react";
import { StockTransfer } from "../lib/types/stock-transfer";
import {
  getIncomingStockTransfer,
  getOutgoingStockTransfer,
} from "../lib/services/stock-transfer";
import { Session } from "../lib/types/session";
import { getSession } from "next-auth/react";

export default function StockTransferList() {
  const [incomingGrouped, setIncomingGrouped] = useState<
    Record<string, StockTransfer[]>
  >({});
  const [outgoingGrouped, setOutgoingGrouped] = useState<
    Record<string, StockTransfer[]>
  >({});
  const [activeIncomingTab, setActiveIncomingTab] = useState("intransit");
  const [activeOutgoingTab, setActiveOutgoingTab] = useState("intransit");
  const [session, updateSession] = useState<Session | null>(null);
  const fetchSession = async () => {
    const _session: Session | null = await getSession();
    updateSession(_session);
  };

  const load = async (location: string) => {
    const outgoing = await getOutgoingStockTransfer(location);
    const incoming = await getIncomingStockTransfer(location);
    setIncomingGrouped(incoming);
    setOutgoingGrouped(outgoing);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    const location = session?.user?.location_id?.toString();
    if (location) {
      load(location);
    }
  }, [session]);

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
            {session?.user?.role_name === "admin" && (
              <Button asChild>
                <Link href="/stock-transfer/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Stock Transfer
                </Link>
              </Button>
            )}
          </div>
          {session?.user?.role_name === "admin" && <StockTransferTable />}
          {session?.user?.role_name === "pharmacist" && (
            <div className=" space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Incoming Stock Transfers for {session?.user?.location}{" "}
                    Branch
                  </CardTitle>
                  <CardDescription>
                    Review and process stock transfers sent to your branch
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Tabs
                    value={activeIncomingTab}
                    onValueChange={setActiveIncomingTab}
                  >
                    <TabsList className="mb-4">
                      <TabsTrigger value="intransit">In Transit</TabsTrigger>
                      <TabsTrigger value="delayed">Delayed</TabsTrigger>
                      <TabsTrigger value="received">Received</TabsTrigger>
                      <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    </TabsList>
                    {activeIncomingTab === "intransit" && (
                      <IncomingTransfersList
                        data={incomingGrouped["intransit"] || []}
                      />
                    )}
                    {activeIncomingTab === "delayed" && (
                      <IncomingTransfersList
                        data={incomingGrouped["delayed"] || []}
                      />
                    )}
                    {activeIncomingTab === "received" && (
                      <IncomingTransfersList
                        data={incomingGrouped["received"] || []}
                      />
                    )}
                    {activeIncomingTab === "cancelled" && (
                      <IncomingTransfersList
                        data={incomingGrouped["cancelled"] || []}
                      />
                    )}
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Outgoing Stock Transfers for {session?.user?.location}{" "}
                    Branch
                  </CardTitle>
                  <CardDescription>
                    Track transfer requests you&apos;ve sent to other locations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={activeOutgoingTab}
                    onValueChange={setActiveOutgoingTab}
                  >
                    <TabsList className="mb-4">
                      <TabsTrigger value="intransit">In Transit</TabsTrigger>
                      <TabsTrigger value="delayed">Delayed</TabsTrigger>
                      <TabsTrigger value="received">Received</TabsTrigger>
                      <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    </TabsList>
                    {activeOutgoingTab === "intransit" && (
                      <OutgoingTransfersList
                        data={outgoingGrouped["intransit"] || []}
                      />
                    )}
                    {activeOutgoingTab === "delayed" && (
                      <OutgoingTransfersList
                        data={outgoingGrouped["delayed"] || []}
                      />
                    )}
                    {activeOutgoingTab === "received" && (
                      <OutgoingTransfersList
                        data={outgoingGrouped["received"] || []}
                      />
                    )}
                    {activeOutgoingTab === "cancelled" && (
                      <OutgoingTransfersList
                        data={outgoingGrouped["cancelled"] || []}
                      />
                    )}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
