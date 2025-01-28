"use client";
import { Plus, Search, Pencil } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function InventoryPage() {

    const router = useRouter(); // Initialize router

    // Navigate to the Create Product page
    const handleAddNewItem = () => {
      router.push("/createProduct");
    };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Inventory</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <Button className="flex items-center gap-2 bg-blue-500 text-white" onClick={handleAddNewItem}>
            <Plus size={16} /> Add New Item
          </Button>
          <div className="flex items-center">

            <div className="ml-3">
              <p className="font-medium">Bryan Doe</p>
              <p className="text-sm text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>Item List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Generic Name</TableHead>
                <TableHead>Brand Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Dosage/Unit</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stockroom Quan</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Example Rows */}
              {[
                {
                  genericName: "Paracetamol",
                  brandName: "Biogesic",
                  code: "MED001",
                  dosage: "500mg/tab",
                  price: "₱1.50",
                  stock: 500,
                  category: "Medicines - Branded",
                  branch: "Asuncion",
                },
                {
                  genericName: "Ibuprofen",
                  brandName: "Medicol",
                  code: "MED002",
                  dosage: "400mg/tab",
                  price: "₱1.50",
                  stock: 300,
                  category: "Medicines - Branded",
                  branch: "Asuncion",
                },
              ].map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.genericName}</TableCell>
                  <TableCell>{item.brandName}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.dosage}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.branch}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Pencil className="w-4 h-4" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
