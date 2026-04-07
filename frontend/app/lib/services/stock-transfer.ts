import { API_URL } from "../api-config";
import { StockTransfer } from "../types/stock-transfer";

export const getStockTransfer = async () => {

    const response = await fetch(
        `${API_URL}/stock-transfers/`
    );
    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }
    const data: StockTransfer[] = await response.json();

    return data;
};


export const getIncomingStockTransfer = async (des_location: string) => {
    const response = await fetch(
        `${API_URL}/stock-transfers/?des_location=${des_location}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }

    const data: StockTransfer[] = await response.json();

    // Group by status
    const grouped = data.reduce((acc, transfer) => {
        const statusKey = transfer.status.toLowerCase().replace(/\s+/g, '_'); // normalize
        if (!acc[statusKey]) acc[statusKey] = [];
        acc[statusKey].push(transfer);
        return acc;
    }, {} as Record<string, StockTransfer[]>);

    return grouped;
};


export const getOutgoingStockTransfer = async (src_location: string) => {
    const response = await fetch(
        `${API_URL}/stock-transfers/?src_location=${src_location}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }

    const data: StockTransfer[] = await response.json();

    // Group by status
    const grouped = data.reduce((acc, transfer) => {
        const statusKey = transfer.status.toLowerCase().replace(/\s+/g, '_'); // normalize
        if (!acc[statusKey]) acc[statusKey] = [];
        acc[statusKey].push(transfer);
        return acc;
    }, {} as Record<string, StockTransfer[]>);

    return grouped;
};

