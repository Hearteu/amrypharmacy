"use client";

import { exportInventoryPDF } from "@/app/dashboard/components/pdf-reports-buttons/inventory";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  Download,
  FileText,
  Package,
  Printer,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Reports() {
  const handlePrintReport = (reportType: string) => {
    console.log(`Printing ${reportType} report...`);
    // In a real application, this would trigger a report generation
    alert(`Printing ${reportType} report...`);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>
          Generate and print inventory and sales reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => handlePrintReport("Sales")}
          >
            <Printer className="h-4 w-4" />
            Sales Report
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => handlePrintReport("Statement of Account")}
          >
            <FileText className="h-4 w-4" />
            Statement of Account
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => exportInventoryPDF()}
          >
            <Package className="h-4 w-4" />
            Inventory Report
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => handlePrintReport("Expiring Items")}
          >
            <Calendar className="h-4 w-4" />
            Expiring Items Report
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => handlePrintReport("Low Stock")}
          >
            <AlertCircle className="h-4 w-4" />
            Low Stock Report
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem>Export as Excel</DropdownMenuItem>
              <DropdownMenuItem>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
