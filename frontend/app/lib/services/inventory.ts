import axios from "axios";
import { ProductDetails } from "../types/inventory/product-details";
import { Expiration, Products, StockItem } from "../types/inventory/products";
import { Brand } from "../types/inventory/brand";
import { Category } from "../types/inventory/category";
import { Unit } from "../types/inventory/unit";

export async function getProductsData(): Promise<Products[]> {
    const prodRes = await fetch("http://127.0.0.1:8000/pharmacy/products/");

    if (!prodRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const prodData: Products[] = await prodRes.json();

    return prodData;
}

export async function getProductData({ product_id }: { product_id: number }): Promise<ProductDetails> {
    const prodRes = await axios.get<ProductDetails>(
        `http://127.0.0.1:8000/pharmacy/products/${product_id}/`
    );

    const product = Array.isArray(prodRes.data)
        ? prodRes.data[0]
        : prodRes.data;

    return product;
}

export const getBrand = async () => {
    const brandRes = await fetch("http://127.0.0.1:8000/pharmacy/brands/");

    if (!brandRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const brandData: Brand[] = await brandRes.json();

    return brandData;

};

export const getCategory = async () => {

    const catRes = await fetch(
        "http://127.0.0.1:8000/pharmacy/product-categories/"
    );
    if (!catRes.ok) {
        throw new Error("Failed to fetch data");
    }
    const catData: Category[] = await catRes.json();

    return catData;
};

export const getUnit = async () => {
    const unitRes = await fetch("http://127.0.0.1:8000/pharmacy/unit/");
    if (!unitRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const unitData: Unit[] = await unitRes.json();
    return unitData

};

export const getLowStock = async () => {
    const lowRes = await fetch("http://127.0.0.1:8000/pharmacy/stock-items/?threshold=10");
    if (!lowRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const lowData: StockItem[] = await lowRes.json();
    return lowData

};

export const getExpirations = async () => {
    const expRes = await fetch("http://127.0.0.1:8000/pharmacy/expirations/");
    if (!expRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const expData: Expiration[] = await expRes.json();
    console.log("EXPIRATIONS API RESPONSE:", expData);
    return expData;
}