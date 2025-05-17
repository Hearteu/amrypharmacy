"use client";

import { useEffect, useState } from "react";
import { exportInventoryPDF } from "@/app/dashboard/components/pdf-reports-buttons/inventoryExportButton";
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
  Loader,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);

  // ✅ Preload inventory data on mount
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/pharmacy/products/")
      .then((res) => setInventoryData(res.data))
      .catch((err) => console.error("Preload failed", err));
  }, []);

  // ✅ Handles export using preloaded data
  const handleInventoryReport = async () => {
    setLoading(true);
    try {
      await exportInventoryPDF(inventoryData); // Pass preloaded data
    } catch (error) {
      console.error("PDF export failed", error);
    } finally {
      setLoading(false);
    }
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
          <Button variant="outline" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Sales Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Statement of Account
          </Button>

          {/* ✅ Updated Inventory Report Button */}
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleInventoryReport}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                Inventory Report
              </>
            )}
          </Button>

          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Expiring Items Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Low Stock Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
