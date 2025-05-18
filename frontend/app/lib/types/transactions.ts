export interface TransactionItem {
    pos_item_id: number;
    product_id: number;
    full_product_name: string;
    quantity: number;
    price: number;
    total_price: number;
}

export interface Physician {
    prc_num: number;
    ptr_num: number;
    name: string;
}
export interface Prescription {
    date_issued: string;
    physician: Physician;
    prescription_details: string;
}
export interface PosTransaction {
    pos_id: number;
    sale_date: string;
    user_id: number | null;
    invoice: string;
    order_type: string;
    prescription_id: number | null;
    pos_items: TransactionItem[];
    total_amount: number;
}

export interface DswdDetails {
    dswd_order_id: number;
    gl_num: string;
    gl_date: string;
    claim_date: string;
    client_name: string;
}

export interface Customer {
    customer_id: number;
    name: string;
    id_card_number: string;
}

export interface Transaction {
    stock_transaction_id: number;
    invoice: string;
    transaction_date: string;
    transaction_type: string;
    reference_id: number;
    src_location: number | null;
    des_location: number | null;
    quantity_change: number;
    stock_item_id: number;
    expiry_date: string | null;
    src_location_name: string | null;
    pos?: PosTransaction;
    prescription?: Prescription;
    dswd_details?: DswdDetails;
    customer?: Customer;
}
