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