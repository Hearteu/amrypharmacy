"use client";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function InventoryDashboard() {
  const [expiringItems, setExpiringItems] = useState(initialExpiringItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isStockOutDialogOpen, setIsStockOutDialogOpen] = useState(false);

  // Filter items based on search query
  const filteredItems = expiringItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle stock out action
  const handleStockOut = () => {
    if (selectedItem) {
      setExpiringItems(
        expiringItems.filter((item) => item.id !== selectedItem.id)
      );
      setIsStockOutDialogOpen(false);
      setSelectedItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="destructive" className="">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Attention Required</AlertTitle>
        <AlertDescription>
          You have {expiringItems.length} items expiring this month that need
          attention.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items Expiring This Month
              </CardTitle>
              <CardDescription>
                Review and manage inventory items expiring soon.
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
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No items expiring this month.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
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
                              ? "warning"
                              : "outline"
                          }
                        >
                          {item.daysRemaining} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={
                            isStockOutDialogOpen && selectedItem?.id === item.id
                          }
                          onOpenChange={(open) => {
                            setIsStockOutDialogOpen(open);
                            if (!open) setSelectedItem(null);
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
                                  onClick={() => setSelectedItem(item)}
                                >
                                  Stock Out
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Print Label</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Stock Out Confirmation</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to stock out this item
                                before it expires?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">
                                    Item ID
                                  </p>
                                  <p className="text-sm">{selectedItem?.id}</p>
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
                                    Quantity
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
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsStockOutDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleStockOut}
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
        </CardContent>
      </Card>
    </div>
  );
}
