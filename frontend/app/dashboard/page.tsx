import BestSellingTable from "@/components/table/BestSellingTable";
import LowStockTable from "@/components/table/LowStockTable";
import SalesSummary from "@/components/SalesSummary";
import StockReportChart from "@/components/StockReportChart";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  return (
    <>
      <div className="my-2 mx-4 text-4xl">Dashboard</div>
      <Separator />
      <SalesSummary />
      <Separator className="my-4" />
      <StockReportChart />
      <Separator />
      <BestSellingTable />
      <Separator />
      <LowStockTable />
    </>
  );
}
