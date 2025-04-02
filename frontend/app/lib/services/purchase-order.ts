import { POStatus, PurchaseOrders } from "../types/purchase-order";

export const getPO = async () => {

    const response = await fetch(
        "http://127.0.0.1:8000/pharmacy/purchase-orders/"
    );
    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }
    const data: PurchaseOrders[] = await response.json();

    return data;
};

export const getPOStatus = async () => {

    const response = await fetch(
        "http://127.0.0.1:8000/pharmacy/purchase-order-status/"
    );
    if (!response.ok) {
        throw new Error("Failed to fetch status data");
    }
    const data: POStatus[] = await response.json();

    return data;
};