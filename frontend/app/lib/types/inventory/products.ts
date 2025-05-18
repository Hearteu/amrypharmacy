export interface ExpiryDetail {
    expiry_date: string;
    quantity: number;
}

export interface Stock {
    location_id: number;
    location: string;
    quantity: number;
    total_quantity: number;
    expiry_details?: ExpiryDetail[];
}
export interface Products {
    product_id: number;
    full_product_name: string;
    category: string;
    price: string;
    net_content: string;
    unit: string;
    location_id: number;
    quantity: number;
    stock_per_location: Stock[];
}

export interface ProductDetails {
    product_id: number;
    full_product_name: string;
    current_price: number;
    category_id: number;
    category_name: string;
    brand_id: number;
    brand_name: string;
}
export interface StockItem {
    stock_item_id: number;
    product_id: number;
    location_id: number;
    location_name: string;
    quantity: number;
    product_details: ProductDetails;
    Product: ProductRaw;
}

export interface ProductRaw {
    product_id: number;
    full_product_name: string;
    category_id: number;
    current_price: number;
    net_content: string;
    brand_id: number;
    unit_id: number;
}

export interface Expiration {
    expiration_id: number;
    expiry_date: string;
    days_until_expiry: number;
    quantity: number;
    location_id: number;
    location: string;
    Stock_Item: StockItem;
}
// {
//     "expiration_id": 1,
//     "expiry_date": "2025-05-02",
//     "days_until_expiry": -17,
//     "quantity": 5,
//     "location_id": 3,
//     "location": "Asuncion - Stockroom",
//     "Stock_Item": {
//         "stock_item_id": 5,
//         "quantity": 38,
//         "Product": {
//             "product_id": 1,
//             "full_product_name": "Paracetamol",
//             "category_id": 1,
//             "current_price": 20,
//             "net_content": "500 mg",
//             "brand_id": 1,
//             "unit_id": 5
//         }
//     }
// }