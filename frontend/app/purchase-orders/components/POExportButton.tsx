import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PurchaseOrder } from "@/app/lib/types/purchase-order";

type ExportProps = {
  purchaseOrder: PurchaseOrder;
};

export const ExportPOPDF = ({ purchaseOrder }: ExportProps) => {
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Purchase Order", 14, 20);

    doc.setFontSize(12);
    doc.text(`PO ID: ${purchaseOrder.po_id}`, 14, 30);
    doc.text(`Supplier: ${purchaseOrder.supplier.name}`, 14, 36);
    doc.text(`Email: ${purchaseOrder.supplier.email}`, 14, 42);
    doc.text(`Phone: ${purchaseOrder.supplier.phone}`, 14, 48);
    doc.text(`Address: ${purchaseOrder.supplier.address}`, 14, 54);
    doc.text(`Order Date: ${purchaseOrder.order_date}`, 14, 60);
    doc.text(`Expected Date: ${purchaseOrder.expected_date}`, 14, 66);
    doc.text(`Status: ${purchaseOrder.status}`, 14, 72);
    doc.text(`Notes: ${purchaseOrder.notes || "N/A"}`, 14, 78);

    // Table
    const tableData = purchaseOrder.lineItems.map((item) => [
      item.poi_id,
      item.description,
      item.ordered_qty,
      item.supplier_price.toFixed(2),
      item.poi_total.toFixed(2),
      item.received_qty,
      item.expired_qty,
      item.damaged_qty,
    ]);

    autoTable(doc, {
      startY: 85,
      head: [
        [
          "Item ID",
          "Description",
          "Qty",
          "Unit Price",
          "Total",
          "Received",
          "Expired",
          "Damaged",
        ],
      ],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 10 },
    });

    doc.save(`PurchaseOrder_${purchaseOrder.po_id}.pdf`);
  };

  return (
    <Button size="sm" onClick={exportPDF}>
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  );
};
