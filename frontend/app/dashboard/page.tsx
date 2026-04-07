import { InventoryDashboard } from "./components/ExpiredItems";
import Reports from "./components/Reports";
import { SalesChart } from "./components/SalesChart";

export default function Dashboard() {
  return (
    <>
      <div className="p-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Inventory overview and recent reports.
        </p>
        <div className="pb-4"></div>
        <div className="space-y-6">
          <SalesChart />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
             <div className="col-span-1">
               <InventoryDashboard />
             </div>
             <div className="col-span-1">
               <Reports />
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
