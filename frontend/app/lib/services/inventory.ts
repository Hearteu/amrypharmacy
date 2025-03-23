import axios from "axios";
import { ProductDetails } from "../types/inventory/product-details";
import { Products } from "../types/inventory/products";

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