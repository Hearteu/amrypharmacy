import { Products } from "../types/inventory/products";

export async function getProductData(): Promise<Products[]> {
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