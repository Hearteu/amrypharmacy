import { Brand } from "../types/inventory/brand";

export const getBrand = async () => {
    const brandRes = await fetch("http://127.0.0.1:8000/pharmacy/brands/");

    if (!brandRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const brandData: Brand[] = await brandRes.json();

    return brandData;

};