export interface PurchaseOrders {
    purchase_order_id: number;
    po_id: string;
    supplier: SupplierArray;
    order_date: string;
    status: string;
    status_id: number;
}

export interface SupplierArray {
    name: string;
}

export interface POStatus {
    purchase_order_status_id: number;
    purchase_order_status: string;
}