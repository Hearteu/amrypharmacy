import axios from "axios";
import { API_URL } from "../api-config";
import { Brand } from "../types/inventory/brand";
import { Category } from "../types/inventory/category";
import { ProductDetails } from "../types/inventory/product-details";
import { Expiration, Products, StockItem } from "../types/inventory/products";
import { Unit } from "../types/inventory/unit";

export async function getProductsData(): Promise<Products[]> {
    const prodRes = await fetch(`${API_URL}/products/`);

    if (!prodRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const prodData: Products[] = await prodRes.json();

    return prodData;
}

export async function getProductData({ product_id }: { product_id: number }): Promise<ProductDetails> {
    const prodRes = await axios.get<ProductDetails>(
        `${API_URL}/products/${product_id}/`
    );

    const product = Array.isArray(prodRes.data)
        ? prodRes.data[0]
        : prodRes.data;

    return product;
}

export const getBrand = async () => {
    const brandRes = await fetch(`${API_URL}/brands/`);

    if (!brandRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const brandData: Brand[] = await brandRes.json();

    return brandData;

};

export const getCategory = async () => {

    const catRes = await fetch(
        `${API_URL}/product-categories/`
    );
    if (!catRes.ok) {
        throw new Error("Failed to fetch data");
    }
    const catData: Category[] = await catRes.json();

    return catData;
};

export const getUnit = async () => {
    const unitRes = await fetch(`${API_URL}/unit/`);
    if (!unitRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const unitData: Unit[] = await unitRes.json();
    return unitData

};

export const getLowStock = async () => {
    const lowRes = await fetch(`${API_URL}/stock-items/?threshold=10`);
    if (!lowRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const lowData: StockItem[] = await lowRes.json();
    return lowData

};

export const getExpirations = async () => {
    const expRes = await fetch(`${API_URL}/expirations/`);
    if (!expRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const expData: Expiration[] = await expRes.json();
    console.log("EXPIRATIONS API RESPONSE:", expData);
    return expData;
}