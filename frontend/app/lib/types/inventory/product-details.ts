export interface ProductDetails {
    product_id: number;
    brand_id: number;
    category_id: number;
    product_name: string;
    current_price: number;
    net_content: string;
    unit_id: number;
    dosage_strength?: string;
    dosage_form?: string;
}