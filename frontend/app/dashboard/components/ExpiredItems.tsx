"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  MoreHorizontal,
  Package,
  Search,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Expiration, StockItem } from "@/app/lib/types/inventory/products";
import { getExpirations, getLowStock } from "@/app/lib/services/inventory";
import Link from "next/link";
import DisposeExpiryDialog from "./DisposeExpiry";

export function InventoryDashboard() {
  // const [expiringItems, setExpiringItems] = useState<Products[]>([]);
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expirations, setExpirations] = useState<Expiration[]>([]);
  const [activeTab, setActiveTab] = useState("expiring");
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await getLowStock();
      setLowStockItems(data);
      const expirations = await getExpirations();
      setExpirations(expirations);
      setError(null);
      console.log("EXPIRATIONS API RESPONSE:", expirations);
    } catch (err) {
      console.error("Error fetching low stock items:", err);
      setError("Failed to load low stock items");
      setLowStockItems([]);
      setExpirations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Log the active tab whenever it changes
  useEffect(() => {
    console.log("Active tab changed:", activeTab);
  }, [activeTab]);

  // Filter expirations based on search query
  const filteredExpirations = expirations.filter((item) =>
    item.Stock_Item.Product.full_product_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredLowStockItems = lowStockItems.filter((item) =>
    item.product_details.full_product_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Expiring Items</AlertTitle>
          <AlertDescription>
            You have {expirations.length} items expiring that need attention.
            {error && <p className="text-sm mt-1 text-red-500">{error}</p>}
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            You have items below reorder level that need restocking.
          </AlertDescription>
        </Alert>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Management
              </CardTitle>
              <CardDescription>
                Review and manage inventory items requiring attention.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search items..."
                  className="pl-8 w-full md:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expiring" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="expiring">Expiring This Month</TabsTrigger>
              <TabsTrigger value="lowstock">Low Stock Items</TabsTrigger>
            </TabsList>

            {/* Expiring Items Tab */}
            <TabsContent value="expiring">
              {/* Show error message if there is one */}
              {/* {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )} */}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Item Name
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>

                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Location
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Expiry Date
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        Days Until Expiry
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6">
                          Loading expiry data...
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Loading expiry data...
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpirations.map((item) => (
                        <TableRow key={item.expiration_id}>
                          <TableCell className="font-medium">
                            EXP{item.expiration_id.toString().padStart(3, "0")}
                          </TableCell>
                          <TableCell>
                            {item.Stock_Item.Product.full_product_name}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {item.location}
                          </TableCell>
                          <TableCell>{item.expiry_date}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                item.days_until_expiry < 0
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {item.days_until_expiry < 0
                                ? "Expired"
                                : `${item.days_until_expiry} days`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DisposeExpiryDialog expiration={item} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Low Stock Items Tab */}
            <TabsContent value="lowstock">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Item Name
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Location
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No low stock items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLowStockItems.map((item) => (
                        <TableRow key={item.product_id}>
                          <TableCell>
                            {item.product_details.full_product_name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="destructive">{item.quantity}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {item.location_name}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Link
                                    href={`/purchase-orders/create`}
                                    className="w-full cursor-pointer"
                                  >
                                    Reorder
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
