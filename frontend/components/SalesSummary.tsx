import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CalendarDays, ChartNoAxesCombined, Package, PhilippinePeso } from "lucide-react";


export default function SalesSummary() {
  return (
    <>
      <Card className="my-2">
        <CardHeader>
          <CardTitle>Sales Summary</CardTitle>
        </CardHeader>
        <div className="flex flex-row justify-between">
          <CardContent className="flex flex-row items-center ">
            <ChartNoAxesCombined className="h-8 w-8 m-2 justify-center" />
            <div className="flex flex-col">
            <p>1234</p>
            <p className="text-xs">Today&apos;s Sales</p>
            </div>
          </CardContent>
          <CardContent className="flex flex-row items-center">
            <CalendarDays className="h-8 w-8 m-2" />
            <div className="flex flex-col">
            <p>1234</p>
            <p className="text-xs">Monthly Total Sales</p>
            </div>
          </CardContent>
          <CardContent className="flex flex-row items-center">
            <PhilippinePeso className="h-8 w-8 m-2" />
            <div className="flex flex-col">
            <p>1234</p>
            <p className="text-xs"> Net Income</p>
            </div>
          </CardContent>
          <CardContent className="flex flex-row items-center">
            <Package className="h-8 w-8 m-2" />
            <div className="flex flex-col">
            <p>1234</p>
            <p className="text-xs">Net Income</p>
            </div>
          </CardContent>
        </div>
      </Card>
    </>
  );
}
