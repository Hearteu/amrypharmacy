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

export interface PurchaseOrderItem {
    purchase_order_item_id: number;
    poi_id: string;
    description: string;
    ordered_qty: number;
    supplier_price: number;
    poi_total: number;
    purchase_order_item_status: number;
    po_item_status: string;
    received_qty: number;
    expired_qty: number;
    damaged_qty: number;
}

export interface Supplier {
    name: string;
    contact: string;
    email: string;
    phone: string;
    address: string;
}

export interface PurchaseOrder {
    purchase_order_id: number;
    po_id: string;
    supplier: Supplier;
    order_date: string;
    expected_date: string;
    po_total: number;
    status: string;
    notes: string;
    lineItems: PurchaseOrderItem[];
}