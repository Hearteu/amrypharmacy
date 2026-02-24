import { API_URL } from "../api-config";
import { POStatus, PurchaseOrders } from "../types/purchase-order";

export const getPO = async () => {

    const response = await fetch(
        `${API_URL}/purchase-orders/`
    );
    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }
    const data: PurchaseOrders[] = await response.json();

    return data;
};

export const getPOStatus = async () => {

    const response = await fetch(
        `${API_URL}/purchase-order-status/`
    );
    if (!response.ok) {
        throw new Error("Failed to fetch status data");
    }
    const data: POStatus[] = await response.json();

    return data;
};