"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns"; // Import columns configuration
import ProductList from "@/components/product-table/page";
import { Slash } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import AddProductForm from "@/components/forms/AddProductForm";
import { Dialog, DialogContent, DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Product {
  products_id: number; // ✅ Fixed naming
  brand_id: number;
  category_id: number;
  product_name: string;
  current_price: number;
  net_content: string;
}

interface Drug {
  drugs_id: number;
  products_id: number; // ✅ Fixed naming
  measurement: number; // Links to `unit-measures`
  dosage_strength: string;
  dosage_form: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

interface Branch {
  branch_id: number;
  branch_name: string;
}

interface Inventory {
  inventory_id: number;
  products_id: number; // ✅ Fixed naming
  branch_id: number | null;
  reorder_threshold: number | null; // ✅ Changed to number
  physical_quantity: number; // ✅ Changed to number
  stockroom_quantity: number; // ✅ Changed to number
}

interface MergedInventoryData {
  inventory_id: number;
  product_name: string; // Includes brand, dosage strength, and form
  reorder_threshold: number | null;
  physical_quantity: number;
  stockroom_quantity: number;
  branch_name: string;
}

export default function Inventory() {
  const [data, setData] = useState<MergedInventoryData[]>([]);
  const [loading, setLoading] = useState(true); // Loading state

  async function getData(): Promise<MergedInventoryData[]> {
    try {
      const [productRes, brandRes, drugsRes, invRes, branchRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/pharmacy/products/"),
        fetch("http://127.0.0.1:8000/pharmacy/brands/"),
        fetch("http://127.0.0.1:8000/pharmacy/drugs/"),
        fetch("http://127.0.0.1:8000/pharmacy/inventories/"),
        fetch("http://127.0.0.1:8000/pharmacy/branches/"),
      ]);

      if (![productRes, brandRes, drugsRes, invRes, branchRes].every(res => res.ok)) {
        throw new Error("Failed to fetch data");
      }

      const productData: Product[] = await productRes.json();
      const brandData: Brand[] = await brandRes.json();
      const drugsData: Drug[] = await drugsRes.json();
      const invData: Inventory[] = await invRes.json();
      const branchData: Branch[] = await branchRes.json();

      // ✅ Ensure correct mapping between inventory and products
      const mergedInventoryData: MergedInventoryData[] = invData
      .map((inventory) => {
        // Fix product lookup
        const product = productData.find((p) => p.products_id === inventory.products_id);
        if (!product) return null; // Skip if product is missing
    
        const brand = brandData.find((b) => b.brand_id === product.brand_id);
        const drug = drugsData.find((d) => d.products_id === product.products_id);
        const branch = branchData.find((b) => b.branch_id === inventory.branch_id);
    
        // Fix product name formatting
        let fullProductName = `${product.product_name} (${brand?.brand_name ?? "Unknown"})`;
        if (drug) {
          fullProductName = `${product.product_name} ${drug.dosage_strength} ${drug.dosage_form} (${brand?.brand_name ?? "Unknown"})`;
        }
    
        return {
          inventory_id: inventory.inventory_id,
          product_name: fullProductName,
          reorder_threshold: Number(inventory.reorder_threshold) || 0,
          physical_quantity: Number(inventory.physical_quantity) || 0,
          stockroom_quantity: Number(inventory.stockroom_quantity) || 0,
          branch_name: branch?.branch_name ?? "Unassigned Branch",
        };
      })
      .filter((item): item is MergedInventoryData => item !== null); // Remove null values
        console.log(mergedInventoryData)
      return mergedInventoryData;
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  }


  const refreshData = () => {
    console.log("Refreshing data");
    getData().then((fetchedData) => {
      setData(fetchedData);
      setLoading(false);
    });
  };

  const tableColumns = columns(refreshData);

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <>
      <div className="p-4 fixed">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#inventory">Inventory</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="#product">Product List</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="pt-4">
        <div id="inventory" className="min-h-screen w-full pt-8 pr-4">
          <div className="flex flex-row justify-between">
            <h2 className="text-xl font-semibold p-4">Inventory</h2>
          </div>

          {loading ? (
            <p className="px-4">Loading...</p>
          ) : (
            <DataTable columns={tableColumns} data={data} />
          )}
        </div>
      </div>
      <div id="product" className="min-h-screen bg-gray-100 pt-8 pr-4">
        <div className="flex flex-row justify-between">
          <h2 className="text-xl font-semibold p-4">Product List</h2>

          <AddProductForm onSuccess={(data) => {}}/>
        </div>

          <ProductList></ProductList>
      </div>
    </>
  );
}
