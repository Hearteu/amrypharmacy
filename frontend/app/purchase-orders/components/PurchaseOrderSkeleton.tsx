import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function PurchaseOrderSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/purchase-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Skeleton className="h-8 w-32 rounded" />
          <Skeleton className="h-6 w-20 rounded" />
        </div>
        <Skeleton className="h-8 w-24 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-40 rounded" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-60 rounded" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="items">
              <TabsList>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="items" className="pt-4 space-y-3">
                {/* Table rows skeleton */}
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded" />
                ))}
                <div className="flex justify-end mt-4">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-lg font-bold">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="notes" className="pt-4">
                <Skeleton className="h-20 w-full rounded" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60 mt-1" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
