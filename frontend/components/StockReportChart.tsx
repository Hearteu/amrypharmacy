"use client";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";


const chartData = [
  { month: "January", stockIn: 186, stockOut: 80 },
  { month: "February", stockIn: 305, stockOut: 200 },
  { month: "March", stockIn: 237, stockOut: 120 },
  { month: "April", stockIn: 73, stockOut: 190 },
  { month: "May", stockIn: 209, stockOut: 130 },
  { month: "June", stockIn: 214, stockOut: 140 },
  
];

const chartConfig = {
  stockIn: {
    label: "Stock In",
    color: "#04B4FC",

  },
  stockOut: {
    label: "Stock Out",
    color: "#8EDEFF",

  },
} satisfies ChartConfig;

export default function StockReportChart(){
    return(
        <Card className="w-full">
        <CardHeader>
          <CardTitle>Stock Report</CardTitle>
          <CardDescription>January - June 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} style={{ width: "100%", height: "300px" }}>
            <BarChart 
              accessibilityLayer 
              data={chartData}
              barSize={100}
              >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="stockIn"
                stackId="a"
                fill="var(--color-stockIn)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="stockOut"
                stackId="a"
                fill="var(--color-stockOut)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Showing total visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
    )
}