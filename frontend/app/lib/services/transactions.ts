import { PosTransaction, Transaction } from "../types/transactions";

export const getTransactions = async (location_id: string) => {

    const response = await fetch(
        `http://127.0.0.1:8000/pharmacy/stock-transactions/?transaction_type=POS&branch=${location_id}`

    );

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }
    const data: Transaction[] = await response.json();
    // console.log("getTransaction data", data)


    return data;
};

export const getAllTransactions = async () => {

    const response = await fetch(
        `http://127.0.0.1:8000/pharmacy/stock-transactions/`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }
    const data: Transaction[] = await response.json();
    // console.log("getTransaction data", data)


    return data;
};

export const getTransaction = async (pos_id: string): Promise<PosTransaction> => {
    const response = await fetch(
        `http://127.0.0.1:8000/pharmacy/pos/${pos_id}/`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }

    const data: PosTransaction = await response.json();
    return data;
};


export const getTransactionsType = async (type: string, location_id: string) => {
    const response = await fetch(`http://127.0.0.1:8000/pharmacy/stock-transactions/?transaction_type=POS&branch=${location_id}&order_type=${type}`);

    // console.log("API Response Status:", response.status);

    if (!response.ok) {
        const errorText = await response.text();
        // console.error("API Error:", errorText);
        throw new Error(`Failed to fetch data: ${response.status} ${errorText}`);
    }

    const data: Transaction[] = await response.json();
    // console.log("API Data:", data);
    return data;

};