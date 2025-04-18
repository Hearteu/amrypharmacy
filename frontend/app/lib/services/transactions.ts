import { Transaction } from "../types/transactions";

export const getTransactions = async (location_id?: string) => {

    const response = await fetch(
        "http://127.0.0.1:8000/pharmacy/pos/"
    );

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }
    const data: Transaction[] = await response.json();

    return data;
};

export const getTransaction = async (pos_id: string): Promise<Transaction> => {
    const response = await fetch(
        `http://127.0.0.1:8000/pharmacy/pos/${pos_id}/`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }

    const data: Transaction = await response.json(); // ✅ not an array
    return data;
};


export const getTransactionsType = async (type: string, location_id?: string) => {
    const response = await fetch(
        `http://127.0.0.1:8000/pharmacy/pos/?order_type=${type}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }
    const data: Transaction[] = await response.json();
    console.log("types", data)
    return data;
}
