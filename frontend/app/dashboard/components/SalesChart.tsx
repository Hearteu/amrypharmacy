"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/app/lib/api-config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp, ShoppingBag, Users, Calendar } from "lucide-react";

const COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6"];

export function SalesChart() {
  const [activeTab, setActiveTab] = useState<"trend" | "products" | "customers">("trend");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_URL}/analytics/`);
        if (!response.ok) throw new Error("Failed to load analytics");
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl">Business Analytics</CardTitle>
          <CardDescription>
            {activeTab === "trend" && "Daily revenue performance"}
            {activeTab === "products" && "Top selling medicines and supplies"}
            {activeTab === "customers" && "Order volume by category"}
          </CardDescription>
        </div>
        <div className="flex bg-muted p-1 rounded-lg gap-1">
          <Button 
            variant={activeTab === "trend" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-8 gap-1.5"
            onClick={() => setActiveTab("trend")}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Trend</span>
          </Button>
          <Button 
            variant={activeTab === "products" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-8 gap-1.5"
            onClick={() => setActiveTab("products")}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Products</span>
          </Button>
          <Button 
            variant={activeTab === "customers" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-8 gap-1.5"
            onClick={() => setActiveTab("customers")}
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Customers</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Analysing sales data...</p>
            </div>
          ) : !data ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No analytics data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "trend" ? (
                <LineChart data={data.daily_sales}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `₱${val}`}
                  />
                  <Tooltip 
                    formatter={(val: number) => [`₱${val.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : activeTab === "products" ? (
                <BarChart data={data.top_products} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="product__product_name" 
                    type="category" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 500 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="total_qty" name="Units Sold" radius={[0, 4, 4, 0]}>
                    {data.top_products.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={data.customer_types}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="count"
                    nameKey="order_type"
                  >
                    {data.customer_types.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
        {!loading && data && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-dashed">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Revenue</p>
              <p className="text-lg font-bold">₱{data.summary.revenue?.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Orders</p>
              <p className="text-lg font-bold">{data.summary.orders}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Top Product</p>
              <p className="text-lg font-bold truncate px-2">{data.top_products[0]?.product__product_name || "N/A"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
