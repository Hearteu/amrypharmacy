import { columns } from "./columns";
import { DataTable } from "./data-table";

interface MergedProductData {
  products_id: number;
  product_name: string; // Now includes brand, dosage strength, and form
  category_name: string;
  current_price: number;
  net_content: string;
  unit_of_measure: string;
}
interface ProductListProps {
  data: MergedProductData[];
  onSuccess: () => void;
  loading: boolean;
}

export default function ProductList({data, onSuccess, loading}: ProductListProps) {

  return (
    <div className="container mx-4">
      {loading ? (
        <p className="px-4">Loading...</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
