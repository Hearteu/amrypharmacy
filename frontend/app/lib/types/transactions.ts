export interface TransactionItem {
    pos_item_id: number;
    product_id: number;
    full_product_name: string;
    quantity: number;
    price: number;
    total_price: number;
}

export interface Transaction {
    pos_id: number;
    sale_date: string;
    user_id: number | null;
    invoice: string;
    total_amount: number;
    items: TransactionItem[];
}
