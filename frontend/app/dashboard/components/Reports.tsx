"use client";

import { useEffect, useState } from "react";
import { exportInventoryPDF } from "@/app/dashboard/components/pdf-reports-buttons/inventoryExportButton";
import { exportSalesPDF } from "@/app/dashboard/components/pdf-reports-buttons/salesExportButton";
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
  const [inventoryData, setInventoryData] = useState([]);
  const [salesMonths, setSalesMonths] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/pharmacy/products/")
      .then((res) => setInventoryData(res.data))
      .catch((err) => console.error("Preload failed", err));

    axios
      .get("http://127.0.0.1:8000/pharmacy/receipts/")
      .then((res) => {
        const months = res.data.map((entry: any) => entry.month);
        setSalesMonths(months);
      })
      .catch((err) => console.error("Failed to fetch sales months", err));
  }, []);

  const handleInventoryReport = async () => {
    setLoading(true);
    try {
      await exportInventoryPDF(inventoryData);
    } catch (error) {
      console.error("PDF export failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalesReport = (month: string) => {
    setOpen(false); // Close dialog first

    setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/pharmacy/receipts/?month=${month}`
        );
        const reportData = res.data[0];
        exportSalesPDF(reportData); // ⚠️ Do NOT await this
      } catch (err) {
        console.error("Sales PDF failed", err);
      } finally {
        setLoading(false);
      }
    }, 100); // Allow dialog to close before triggering popup
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
          <Dialog open={open} onOpenChange={setOpen}>
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
              <div className="grid grid-cols-2 gap-3">
                {salesMonths.map((month) => (
                  <Button
                    key={month}
                    variant="outline"
                    onClick={() => handleSalesReport(month)}
                  >
                    {month}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Statement of Account
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleInventoryReport}
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

          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Expiring Items Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Low Stock Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
