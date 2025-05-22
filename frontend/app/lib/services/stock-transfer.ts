import { StockTransfer } from "../types/stock-transfer";

export const getStockTransfer = async () => {

    const response = await fetch(
        "http://127.0.0.1:8000/pharmacy/stock-transfers/"
    );
    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }
    const data: StockTransfer[] = await response.json();

    return data;
};


export const getIncomingStockTransfer = async (src_location: string) => {
    const response = await fetch(
        `http://127.0.0.1:8000/pharmacy/stock-transfer-src/${src_location}/`
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


export const getOutgoingStockTransfer = async (des_location: string) => {
    const response = await fetch(
        `http://127.0.0.1:8000/pharmacy/stock-transfer-des/${des_location}/`
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

