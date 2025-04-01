import { InventoryDashboard } from "./components/ExpiredItems";
import RecentsSales from "./components/RecentSales";
import Reports from "./components/Reports";
import SalesSummary from "./components/SalesSummary";

export default function Dashboard() {
  return (
    <>
      <div className="p-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="pb-4"></div>
        <div className="space-y-6">
          <SalesSummary />
          <RecentsSales />
          <InventoryDashboard />
          <Reports />
        </div>
      </div>
    </>
  );
}
