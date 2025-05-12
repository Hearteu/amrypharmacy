export interface TransactionItem {
    pos_item_id: number;
    product_id: number;
    full_product_name: string;
    quantity: number;
    price: number;
    total_price: number;
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

export interface Transaction {
    stock_transaction_id: number;
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
}

// {
//     "stock_transaction_id": 43,
//     "transaction_date": "2025-03-23T10:26:30+00:00",
//     "transaction_type": "POS",
//     "reference_id": 12,
//     "src_location": 1,
//     "des_location": null,
//     "quantity_change": -2,
//     "stock_item_id": 1,
//     "expiry_date": null,
//     "src_location_name": "Asuncion - Physical",
//     "pos": {
//         "pos_id": 12,
//         "sale_date": "2025-03-23",
//         "user_id": null,
//         "invoice": "POS-2025-001",
//         "order_type": "DSWD",
//         "prescription_id": null,
//         "pos_items": [
//             {
//                 "pos_item_id": 19,
//                 "product_id": 1,
//                 "full_product_name": "Paracetamol tablet 50mg",
//                 "quantity": 2,
//                 "price": 20,
//                 "total_price": 40
//             },
//             {
//                 "pos_item_id": 20,
//                 "product_id": 19,
//                 "full_product_name": "Maternity Pads",
//                 "quantity": 1,
//                 "price": 17.2,
//                 "total_price": 17.2
//             }
//         ],
//         "total_amount": 57.2
//     }
// }
