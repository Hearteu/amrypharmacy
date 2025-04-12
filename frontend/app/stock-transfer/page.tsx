"use client";

import StockTransferTable from "./components/StockTransferTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { IncomingTransfersList } from "./components/IncomingTransfers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OutgoingTransfersList } from "./components/OutgoingTransfers";

export default function StockTransferList() {
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

          <StockTransferTable />
        </div>
      </div>

      <p>Meant for pharmacist view</p>
      {/* pharamict view */}
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Incoming Stock Transfers</CardTitle>
            <CardDescription>
              Review and process stock transfers sent to your branch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in_transit">In Transit</TabsTrigger>
                <TabsTrigger value="received">Received</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="pending">
                <IncomingTransfersList status="pending" />
              </TabsContent>
              <TabsContent value="in_transit">
                <IncomingTransfersList status="in_transit" />
              </TabsContent>
              <TabsContent value="received">
                <IncomingTransfersList status="received" />
              </TabsContent>
              <TabsContent value="completed">
                <IncomingTransfersList status="completed" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outgoing Transfer Requests</CardTitle>
            <CardDescription>
              Track transfer requests you&apos;ve sent to other locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="draft">
              <TabsList className="mb-4">
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="ordered">Ordered</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="draft">
                <OutgoingTransfersList status="draft" />
              </TabsContent>
              <TabsContent value="ordered">
                <OutgoingTransfersList status="ordered" />
              </TabsContent>
              <TabsContent value="in_progress">
                <OutgoingTransfersList status="in_progress" />
              </TabsContent>
              <TabsContent value="completed">
                <OutgoingTransfersList status="completed" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
