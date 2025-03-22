import { Category } from "../types/inventory/category";

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