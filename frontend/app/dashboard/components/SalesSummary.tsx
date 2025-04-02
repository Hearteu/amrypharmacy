import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  Package,
  ShoppingCart,
} from "lucide-react";

const salesData = {
  totalSales: "$12,845.50",
  ordersCount: 156,
  averageOrderValue: "$82.34",
  topSellingItem: "Organic Milk",
  salesGrowth: "+12.5%",
  recentTransactions: [
    {
      id: "TRX001",
      date: "2025-04-01",
      customer: "John Smith",
      amount: "$145.20",
      items: 8,
      status: "Completed",
    },
    {
      id: "TRX002",
      date: "2025-04-01",
      customer: "Sarah Johnson",
      amount: "$78.50",
      items: 5,
      status: "Completed",
    },
    {
      id: "TRX003",
      date: "2025-03-31",
      customer: "Michael Brown",
      amount: "$210.75",
      items: 12,
      status: "Completed",
    },
    {
      id: "TRX004",
      date: "2025-03-31",
      customer: "Emily Davis",
      amount: "$56.25",
      items: 3,
      status: "Completed",
    },
    {
      id: "TRX005",
      date: "2025-03-30",
      customer: "Robert Wilson",
      amount: "$124.99",
      items: 7,
      status: "Completed",
    },
  ],
};

export default function SalesSummary() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Sales (This Month)
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{salesData.totalSales}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 flex items-center">
              <ArrowUp className="mr-1 h-3 w-3" />
              {salesData.salesGrowth}
            </span>{" "}
            from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orders</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{salesData.ordersCount}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 flex items-center">
              <ArrowUp className="mr-1 h-3 w-3" />
              8.2%
            </span>{" "}
            from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Order Value
          </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {salesData.averageOrderValue}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 flex items-center">
              <ArrowUp className="mr-1 h-3 w-3" />
              4.1%
            </span>{" "}
            from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Top Selling Item
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate">
            {salesData.topSellingItem}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="text-red-500 flex items-center">
              <ArrowDown className="mr-1 h-3 w-3" />
              2.5%
            </span>{" "}
            in sales volume
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
