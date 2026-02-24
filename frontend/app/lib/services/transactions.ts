import { API_URL } from "../api-config";
import { PosTransaction, Transaction } from "../types/transactions";

export const getTransactions = async (location_id: string) => {

    const response = await fetch(
        `${API_URL}/stock-transactions/?transaction_type=POS&branch=${location_id}`

    );

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }
    const data: Transaction[] = await response.json();


    return data;
};

export const getAllTransactions = async () => {

    const response = await fetch(
        `${API_URL}/stock-transactions/`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }
    const data: Transaction[] = await response.json();


    return data;
};

export const getTransaction = async (pos_id: string): Promise<PosTransaction> => {
    const response = await fetch(
        `${API_URL}/pos/${pos_id}/`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }

    const data: PosTransaction = await response.json();
    return data;
};


export const getTransactionsType = async (type: string, location_id: string) => {
    const response = await fetch(`${API_URL}/stock-transactions/?transaction_type=POS&branch=${location_id}&order_type=${type}`);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch data: ${response.status} ${errorText}`);
    }

    const data: Transaction[] = await response.json();
    return data;

};