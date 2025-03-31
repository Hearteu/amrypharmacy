"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, FileText } from "lucide-react";

// Define TypeScript types for API response
interface TransactionItem {
  pos_item_id: number;
  product_id: number;
  full_product_name: string;
  quantity: number;
  price: number;
  total_price: number;
}

interface Transaction {
  pos_id: number;
  sale_date: string;
  user_id: number | null;
  invoice: string;
  total_amount: number;
  items: TransactionItem[];
}

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await axios.get<Transaction[]>(
          "http://127.0.0.1:8000/pharmacy/pos/"
        );
        setTransactions(response.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    }
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((transaction) => {
    return transaction.invoice.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>View and manage past transactions</CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Invoice..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.pos_id}>
                  <TableCell className="font-medium">
                    {transaction.invoice}
                  </TableCell>
                  <TableCell>{transaction.sale_date}</TableCell>
                  <TableCell className="text-right">
                    ₱{transaction.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Transaction Details</DialogTitle>
                          <DialogDescription>
                            Invoice: {transaction.invoice}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Date</p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.sale_date}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Total Amount
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ₱{transaction.total_amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Items</p>
                            <div className="border rounded-md p-2">
                              {transaction.items.map((item) => (
                                <p
                                  key={item.pos_item_id}
                                  className="text-sm text-muted-foreground"
                                >
                                  {item.full_product_name} - {item.quantity} x ₱
                                  {item.price.toFixed(2)} = ₱
                                  {item.total_price.toFixed(2)}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-4 text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
