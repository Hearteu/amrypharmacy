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
} from "recharts";

export function SalesChart() {
  const [data, setData] = useState<{ date: string; sales: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await fetch(`${API_URL}/pos/`);
        if (!response.ok) throw new Error("Failed to load POS data");
        
        const posData = await response.json();
        
        // Group by sale_date
        const salesByDate: Record<string, number> = {};
        
        posData.forEach((pos: any) => {
          if (!pos.sale_date) return;
          // Extract just the date part (YYYY-MM-DD or MM/DD/YYYY) depending on string format
          const date = new Date(pos.sale_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          
          if (!salesByDate[date]) salesByDate[date] = 0;
          salesByDate[date] += pos.total_amount || 0;
        });

        // Convert to array
        const chartData = Object.keys(salesByDate).map(date => ({
          date,
          sales: salesByDate[date]
        }));

        setData(chartData.slice(-7)); // Show last 7 active days roughly
      } catch (err) {
        console.error("Error formatting sales data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Sales Trend</CardTitle>
        <CardDescription>
          Daily revenue overview based on recent POS transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Loading chart data...
            </div>
          ) : data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No sales data available to chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(val) => `₱${val}`}
                  width={60}
                />
                <Tooltip 
                  formatter={(value: number) => [`₱${value.toFixed(2)}`, "Sales"]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
