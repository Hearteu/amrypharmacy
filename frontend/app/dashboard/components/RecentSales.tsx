import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export default function RecentsSales() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Recent Sales Transactions
        </CardTitle>
        <CardDescription>
          View your most recent sales transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.id}
                  </TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.customer}</TableCell>
                  <TableCell className="text-center">
                    {transaction.items}
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.amount}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 hover:bg-green-50"
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">View All Transactions</Button>
      </CardFooter>
    </Card>
  );
}
