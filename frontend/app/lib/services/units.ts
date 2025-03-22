import { Unit } from "../types/inventory/unit";

export const getUnit = async () => {
    const unitRes = await fetch("http://127.0.0.1:8000/pharmacy/unit/");
    if (!unitRes.ok) {
        throw new Error("Failed to fetch data");
    }

    const unitData: Unit[] = await unitRes.json();
    return unitData

};