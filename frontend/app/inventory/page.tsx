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
import AddProductForm from "@/components/forms/newProductForm";
import { Dialog, DialogContent, DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Inventory {
  inventory_id: number;
  product_id: number;
  branch_id: number;
  reorder_threshold: number;
  physical_quantity: number;
  stockroom_quantity: number;
}

interface Product {
  product_id: number;
  brand_id: number;
  product_name: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

interface Branch {
  branch_id: number;
  branch_name: string;
}

interface MergedInventoryData {
  inventory_id: number;
  product_name_brand: string;
  reorder_threshold: number;
  physical_quantity: number;
  stockroom_quantity: number;
  branch_name: string;
}

export default function Inventory() {
  const [data, setData] = useState<MergedInventoryData[]>([]);
  const [loading, setLoading] = useState(true); // Loading state

  async function getData(): Promise<MergedInventoryData[]> {
    try {
      const [invRes, prodRes, brandRes, branchRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/pharmacy/inventories/"),
        fetch("http://127.0.0.1:8000/pharmacy/products/"),
        fetch("http://127.0.0.1:8000/pharmacy/brands/"),
        fetch("http://127.0.0.1:8000/pharmacy/branches/"),
      ]);

      if (!invRes.ok || !prodRes.ok || !branchRes.ok || !brandRes.ok) {
        throw new Error("Failed to fetch Inventory Data");
      }

      const invData: Inventory[] = await invRes.json();
      const prodData: Product[] = await prodRes.json();
      const brandData: Brand[] = await brandRes.json();
      const branchData: Branch[] = await branchRes.json();

      const mergedInventoryData: MergedInventoryData[] = invData.map(
        (inventory) => {
          const product = prodData.find(
            (prod) => prod.product_id === inventory.product_id
          );
          const brand = brandData.find(
            (brand) => brand.brand_id === product?.brand_id
          );
          const branch = branchData.find(
            (branch) => branch.branch_id === inventory.branch_id
          );

          return {
            inventory_id: inventory.inventory_id,
            product_name_brand:
              product && brand
                ? `${product.product_name} - ${brand.brand_name}`
                : "Unknown Product",
            reorder_threshold: inventory.reorder_threshold,
            physical_quantity: inventory.physical_quantity,
            stockroom_quantity: inventory.stockroom_quantity,
            branch_name: branch ? branch.branch_name : "Unknown Branch",
          };
        }
      );

      return mergedInventoryData;
    } catch (error) {
      console.log(error);
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
            <DataTable columns={columns} data={data} />
          )}
        </div>
      </div>
      <div id="product" className="min-h-screen bg-gray-100 pt-8 pr-4">
        <div className="flex flex-row justify-between">
          <h2 className="text-xl font-semibold p-4">Product List</h2>
    
              <AddProductForm></AddProductForm>
           
        </div>

        <ProductList></ProductList>
      </div>
    </>
  );
}
