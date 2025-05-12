export interface ExpiryDetail {
    expiry_date: string;
    quantity: number;
}

export interface Stock {
    location_id: number;
    location: string;
    quantity: number;
    total_quantity?: number;
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
}

// {
//     "stock_item_id": 1,
//     "product_id": 1,
//     "location_id": 1,
//     "location_name": "Asuncion - Physical",
//     "quantity": 2,
//     "product_details": {
//         "product_id": 1,
//         "full_product_name": "Paracetamol tablet 50mg",
//         "current_price": 20,
//         "category_id": 1,
//         "category_name": "Medicines- Branded",
//         "brand_id": 1,
//         "brand_name": "Biogesic"
//     }
// },