"use client";

import { useEffect, useState } from "react";
import { exportInventoryPDF } from "@/app/dashboard/components/pdf-reports-buttons/inventoryExportButton";
import { exportSalesPDF } from "@/app/dashboard/components/pdf-reports-buttons/salesExportButton";
import { exportSOAPDF } from "@/app/dashboard/components/pdf-reports-buttons/SOAExportButton";
import { exportExpiryPDF } from "@/app/dashboard/components/pdf-reports-buttons/ExpiryExportButton";
import { exportLowStockPDF } from "@/app/dashboard/components/pdf-reports-buttons/lowStockExportButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  FileText,
  Package,
  Loader,
  Printer,
} from "lucide-react";
import axios from "axios";

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [salesMonths, setSalesMonths] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dummyYears = ["2021", "2022", "2023", "2024", "2025"];
  const [selectedYear, setSelectedYear] = useState<string>("2025"); // default selected

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/pharmacy/receipts/")
      .then((res) => {
        const months = res.data.map((entry: any) => entry.month);
        setSalesMonths(months);
      })
      .catch((err) => console.error("Failed to fetch sales months", err));
  }, []);

  const generateAndExport = async (url: string, exportFunc: Function) => {
    setLoading(true);
    try {
      const res = await axios.get(url);
      exportFunc(res.data);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSalesReport = (month: string) => {
    setDialogOpen(false);
    setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/pharmacy/receipts/?month=${month}`
        );
        const reportData = res.data[0];
        exportSalesPDF(reportData);
      } catch (err) {
        console.error("Sales PDF failed", err);
      } finally {
        setLoading(false);
      }
    }, 100);
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Sales Report
              </Button>
            </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Month for Sales Report</DialogTitle>
                </DialogHeader>

                {/* Add this year selector block */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Select Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {dummyYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month buttons stay the same */}
                <div className="grid grid-cols-2 gap-3">
                  {salesMonths.map((month) => (
                    <Button
                      key={month}
                      variant="outline"
                      onClick={() => handleSalesReport(month)}
                    >
                      {month} {selectedYear}
                    </Button>
                  ))}
                </div>
              </DialogContent>

          </Dialog>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => generateAndExport("http://127.0.0.1:8000/pharmacy/statement-of-accounts/", exportSOAPDF)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" /> Statement of Account
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => generateAndExport("http://127.0.0.1:8000/pharmacy/products/", exportInventoryPDF)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Package className="h-4 w-4" /> Inventory Report
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => generateAndExport("http://127.0.0.1:8000/pharmacy/expirations/", exportExpiryPDF)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" /> Expiring Items Report
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => generateAndExport("http://127.0.0.1:8000/pharmacy/stock-items/?threshold=10", exportLowStockPDF)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" /> Low Stock Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
