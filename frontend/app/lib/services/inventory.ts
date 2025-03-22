import axios from "axios";
import { ProductDetails } from "../types/inventory/product-details";
import { Products } from "../types/inventory/products";

export async function getProductsData(): Promise<Products[]> {
    const prodRes = await fetch("http://127.0.0.1:8000/pharmacy/products/");

    if (!prodRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const prodData: Products[] = await prodRes.json();

    const productData: Products[] = prodData.map((product) => ({
        product_id: product.product_id,
        full_product_name: product.full_product_name,
        category: product.category,
        price: product.price,
        net_content: product.net_content,
        unit: product.unit,
    }));

    return productData;
}

export async function getProductData({ product_id }: { product_id: number }): Promise<ProductDetails> {
    const prodRes = await axios.get<ProductDetails>(
        `http://127.0.0.1:8000/pharmacy/products/${product_id}/`
    );
    const product = Array.isArray(prodRes.data)
        ? prodRes.data[0] // If it's an array, get the first item
        : prodRes.data; // Otherwise, use it directly

    return product; // ✅ Return the product details directly

}
