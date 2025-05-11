export interface Stock {
    location_id: number;
    location: string;
    quantity: number;
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