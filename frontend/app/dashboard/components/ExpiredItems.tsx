"use client";

import type React from "react";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";

// Sample data for items expiring this month
const initialExpiringItems = [
  {
    id: "INV001",
    name: "Vitamin C Tablets",
    category: "Supplements",
    quantity: 25,
    location: "Shelf A2",
    expiryDate: "2025-04-15",
    daysRemaining: 14,
  },
  {
    id: "INV002",
    name: "Organic Milk",
    category: "Dairy",
    quantity: 12,
    location: "Fridge B1",
    expiryDate: "2025-04-20",
    daysRemaining: 19,
  },
  {
    id: "INV003",
    name: "Whole Wheat Bread",
    category: "Bakery",
    quantity: 8,
    location: "Shelf C3",
    expiryDate: "2025-04-10",
    daysRemaining: 9,
  },
  {
    id: "INV004",
    name: "Chicken Broth",
    category: "Canned Goods",
    quantity: 15,
    location: "Shelf D4",
    expiryDate: "2025-04-05",
    daysRemaining: 4,
  },
  {
    id: "INV005",
    name: "Greek Yogurt",
    category: "Dairy",
    quantity: 20,
    location: "Fridge B2",
    expiryDate: "2025-04-28",
    daysRemaining: 27,
  },
];

// Sample data for low stock items
const initialLowStockItems = [
  {
    id: "INV006",
    name: "Protein Powder",
    category: "Supplements",
    quantity: 3,
    reorderLevel: 10,
    location: "Shelf A3",
    supplier: "Health Essentials Inc.",
  },
  {
    id: "INV007",
    name: "Almond Milk",
    category: "Dairy Alternatives",
    quantity: 5,
    reorderLevel: 15,
    location: "Fridge B3",
    supplier: "Organic Farms Co.",
  },
  {
    id: "INV008",
    name: "Brown Rice",
    category: "Grains",
    quantity: 4,
    reorderLevel: 12,
    location: "Shelf E2",
    supplier: "Wholesome Foods Ltd.",
  },
  {
    id: "INV009",
    name: "Olive Oil",
    category: "Oils",
    quantity: 2,
    reorderLevel: 8,
    location: "Shelf F1",
    supplier: "Mediterranean Imports",
  },
];

export function InventoryDashboard() {
  const [expiringItems, setExpiringItems] = useState(initialExpiringItems);
  const [lowStockItems, setLowStockItems] = useState(initialLowStockItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [stockOutQuantity, setStockOutQuantity] = useState<number>(0);
  const [isStockOutDialogOpen, setIsStockOutDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("expiring");
  const [quantityError, setQuantityError] = useState("");

  // Filter items based on search query and active tab
  const filteredExpiringItems = expiringItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLowStockItems = lowStockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Set initial stock out quantity when an item is selected
  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setStockOutQuantity(item.quantity);
    setQuantityError("");
  };

  // Validate and update stock out quantity
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value);

    if (isNaN(value) || value < 0) {
      setQuantityError("Quantity must be a positive number");
      return;
    }

    if (selectedItem && value > selectedItem.quantity) {
      setQuantityError(
        `Cannot exceed current quantity (${selectedItem.quantity})`
      );
      return;
    }

    setStockOutQuantity(value);
    setQuantityError("");
  };

  // Handle stock out action
  const handleStockOut = () => {
    if (selectedItem && stockOutQuantity >= 0) {
      if (stockOutQuantity === selectedItem.quantity) {
        // Remove the item completely if all units are stocked out
        setExpiringItems(
          expiringItems.filter((item) => item.id !== selectedItem.id)
        );
      } else {
        // Update the quantity if only some units are stocked out
        setExpiringItems(
          expiringItems.map((item) => {
            if (item.id === selectedItem.id) {
              return { ...item, quantity: item.quantity - stockOutQuantity };
            }
            return item;
          })
        );
      }

      setIsStockOutDialogOpen(false);
      setSelectedItem(null);
      setStockOutQuantity(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Expiring Items</AlertTitle>
          <AlertDescription>
            You have {expiringItems.length} items expiring this month that need
            attention.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            You have {lowStockItems.length} items below reorder level that need
            restocking.
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
                      <TableHead className="hidden md:table-cell">
                        Category
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
                    {filteredExpiringItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No items expiring this month.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpiringItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.id}
                          </TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {item.category}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {item.location}
                          </TableCell>
                          <TableCell>{item.expiryDate}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                item.daysRemaining <= 7
                                  ? "destructive"
                                  : item.daysRemaining <= 14
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {item.daysRemaining} days
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog
                              open={
                                isStockOutDialogOpen &&
                                selectedItem?.id === item.id
                              }
                              onOpenChange={(open) => {
                                setIsStockOutDialogOpen(open);
                                if (!open) {
                                  setSelectedItem(null);
                                  setQuantityError("");
                                }
                              }}
                            >
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
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem
                                      onClick={() => handleSelectItem(item)}
                                    >
                                      Stock Out
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  <DropdownMenuItem>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Print Label
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Stock Out Confirmation
                                  </DialogTitle>
                                  <DialogDescription>
                                    Please confirm the quantity of items to
                                    stock out.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">
                                        Item ID
                                      </p>
                                      <p className="text-sm">
                                        {selectedItem?.id}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">
                                        Name
                                      </p>
                                      <p className="text-sm">
                                        {selectedItem?.name}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">
                                        Current Quantity
                                      </p>
                                      <p className="text-sm">
                                        {selectedItem?.quantity}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">
                                        Expiry Date
                                      </p>
                                      <p className="text-sm">
                                        {selectedItem?.expiryDate}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="stock-out-quantity">
                                      Quantity to Stock Out
                                    </Label>
                                    <Input
                                      id="stock-out-quantity"
                                      type="number"
                                      min="1"
                                      max={selectedItem?.quantity}
                                      value={stockOutQuantity}
                                      onChange={handleQuantityChange}
                                      className={
                                        quantityError ? "border-red-500" : ""
                                      }
                                    />
                                    {quantityError && (
                                      <p className="text-sm text-red-500">
                                        {quantityError}
                                      </p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                      {stockOutQuantity ===
                                      selectedItem?.quantity
                                        ? "This will remove the item completely from inventory."
                                        : `${
                                            selectedItem?.quantity -
                                            stockOutQuantity
                                          } units will remain in inventory.`}
                                    </p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      setIsStockOutDialogOpen(false)
                                    }
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={handleStockOut}
                                    disabled={
                                      !!quantityError || stockOutQuantity <= 0
                                    }
                                  >
                                    Confirm Stock Out
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
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
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Item Name
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Category
                      </TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-center">
                        Reorder Level
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Location
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Supplier
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLowStockItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No low stock items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLowStockItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.id}
                          </TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {item.category}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="destructive">{item.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.reorderLevel}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {item.location}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {item.supplier}
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
                                <DropdownMenuItem>Reorder</DropdownMenuItem>
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Contact Supplier
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
