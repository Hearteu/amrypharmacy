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