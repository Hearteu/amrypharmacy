import { useEffect, useState } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";

interface Product {
  products_id: number;
  brand_id: number;
  category_id: number;
  product_name: string;
  current_price: number;
  net_content: string;
}

interface Drug {
  drugs_id: number;
  products_id: number;
  measurement: number; // Links to `unit-measures`
  dosage_strength: string;
  dosage_form: string;
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
  products_id: number;
  product_name: string; // Now includes brand, dosage strength, and form
  category_name: string;
  current_price: number;
  net_content: string;
  unit_of_measure: string;
}
export default function ProductList() {
  const [data, setData] = useState<MergedProductData[]>([]);
  const [loading, setLoading] = useState(true); // Loading state

  async function getData(): Promise<MergedProductData[]> {
    try {
      const [productRes, brandRes, categoryRes, measureRes, drugsRes] =
        await Promise.all([
          fetch("http://127.0.0.1:8000/pharmacy/products/"),
          fetch("http://127.0.0.1:8000/pharmacy/brands/"),
          fetch("http://127.0.0.1:8000/pharmacy/product-categories/"),
          fetch("http://127.0.0.1:8000/pharmacy/unit-measures/"),
          fetch("http://127.0.0.1:8000/pharmacy/drugs/"), // ✅ Fetch drugs data
        ]);

      if (
        ![productRes, brandRes, categoryRes, measureRes, drugsRes].every(
          (res) => res.ok
        )
      ) {
        throw new Error("Failed to fetch data");
      }

      const productData: Product[] = await productRes.json();
      const brandData: Brand[] = await brandRes.json();
      const categoryData: Category[] = await categoryRes.json();
      const measureData: UnitofMeasure[] = await measureRes.json();
      const drugsData: Drug[] = await drugsRes.json(); // ✅ Parse drugs data

      // Merge products with other data
      const mergedProductData: MergedProductData[] = productData.map(
        (product) => {
          const brand = brandData.find((b) => b.brand_id === product.brand_id);
          const category = categoryData.find(
            (c) => c.category_id === product.category_id
          );
          const drug = drugsData.find(
            (d) => d.products_id === product.products_id
          );
          const measurement = measureData.find(
            (m) => m.unit_id === drug?.measurement
          );

          // ✅ Ensure dosage details are always defined
          const dosageDetails = drug
            ? `${drug.dosage_strength ?? "Unknown"} ${
                drug.dosage_form ?? "Unknown"
              }`
            : "";

          // ✅ Ensure unit of measure has a fallback value
          const unitMeasure = measurement ? measurement.measurement : "Unknown";

          // ✅ Check if the product is a medicine (brand_id === 1)
          let fullProductName = `${product.product_name} (${
            brand?.brand_name ?? "Unknown"
          })`;
          if (product.brand_id === 1 && drug) {
            fullProductName = `${product.product_name} ${dosageDetails} (${
              brand?.brand_name ?? "Unknown"
            })`;
          }

          return {
            products_id: product.products_id,
            product_name: fullProductName,
            category_name: category ? category.category_name : "Unknown",
            current_price: product.current_price,
            net_content: product.net_content,
            unit_of_measure: unitMeasure,
          };
        }
      );

      return mergedProductData;
    } catch (error) {
      console.error("Error fetching data:", error);
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
    <div className="container mx-4">
      {loading ? (
        <p className="px-4">Loading...</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
