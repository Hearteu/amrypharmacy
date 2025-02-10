import { useEffect, useState } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";

interface Product {
  product_id: number;
  brand_id: number;
  category_id: number;
  product_name: string;
  current_price: number;
  dosage_strength: string;
  dosage_form: string;
  net_content: string;
  unit_of_measure: number;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

interface Category {
  category_id: number;
  category_name: string;
}

interface UnitofMeasure {
  unit_id: number;
  measurement: string;
}

interface MergedProductData {
  product_id: number;
  product_name: string;
  brand_name: string;
  category_name: string;
  current_price: number;
  dosage_strength: string;
  dosage_form: string;
  net_content: string;
  unit_of_measure: string;
}

export default function ProductList() {
  const [data, setData] = useState<MergedProductData[]>([]);
  const [loading, setLoading] = useState(true); // Loading state
  
  async function getData(): Promise<MergedProductData[]> {
    try {
      const [productRes, brandRes, categoryRes, measureRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/pharmacy/products/"),
        fetch("http://127.0.0.1:8000/pharmacy/brands/"),
        fetch("http://127.0.0.1:8000/pharmacy/product-categories/"),
        fetch("http://127.0.0.1:8000/pharmacy/unit-measures/"),
      ]);
  
      if (!productRes.ok || !brandRes.ok || !categoryRes.ok || !measureRes.ok) {
        throw new Error("Failed to fetch data");
      }
  
      const productData: Product[] = await productRes.json();
      const brandData: Brand[] = await brandRes.json();
      const categoryData: Category[] = await categoryRes.json();
      const measureData: UnitofMeasure[] = await measureRes.json();
  
      const mergedProductData: MergedProductData[] = productData.map((product) => {
        const measurement = measureData.find((m) => m.unit_id === product.unit_of_measure); // ✅ Fixed matching condition
  
        return {
          product_id: product.product_id,
          product_name: product.product_name,
          current_price: product.current_price,
          dosage_strength: product.dosage_strength,
          dosage_form: product.dosage_form,
          net_content: product.net_content,
          unit_of_measure: measurement ? measurement.measurement : "Unknown", // ✅ Correctly assigns measurement
        };
      });
  
      return mergedProductData;
    } catch (error) {
      console.error("Error Fetching Product Data", error);
      return [];
    }
  }


  useEffect(() => {
    const fetchData = async () => {
      const fetchedData = await getData();
      setData(fetchedData);
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-xl font-semibold px-4">Product List</h2>
      {loading ? <p className="px-4">Loading...</p> : <DataTable columns={columns} data={data} />}
    </div>
  );
}
