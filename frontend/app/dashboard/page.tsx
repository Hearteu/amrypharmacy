import SalesSummary from "@/components/SalesSummary";
import { InventoryDashboard } from "./components/ExpiredItems";

export default function Dashboard() {
  return (
    <>
      <div className="p-4">
        <h1 className="text-3xl font-bold tracking-tight pb-2">Dashboard</h1>
        <SalesSummary />
        <div className="pb-4"></div>
        <InventoryDashboard />
      </div>
    </>
  );
}
