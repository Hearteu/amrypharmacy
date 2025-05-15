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

    // "AMRY PHARMACY" - Left (navy blue)
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 128);
    doc.text("AMRY PHARMACY", 14, 20);

    // Address
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const addressLines = [
      "Sally Bautista Bld., Purok 2 Nat'l Highway",
      "Brgy. Cambanogoy, Asuncion, DDN",
      "Phone: (099) 123-4567",
    ];
    addressLines.forEach((line, index) => {
      doc.text(line, 14, 28 + index * 6);
    });

    // "PURCHASE ORDER" - Right (pale blue)
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(173, 216, 230);
    const pageWidth = doc.internal.pageSize.getWidth();
    const text = "PURCHASE ORDER";
    const textWidth = doc.getTextWidth(text);
    doc.text(text, pageWidth - textWidth - 14, 20);

    // PO date and number
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const labelX = pageWidth - 73.5;
    const valueX = pageWidth - 40;
    const topY = 30;
    const lineSpacing = 5;
    doc.text("ORDER DATE", labelX, topY);
    doc.text("PO #", labelX, topY + lineSpacing);
    doc.setFont("helvetica", "bold");
    doc.text(`${purchaseOrder.order_date}`, valueX, topY);
    doc.text(`${purchaseOrder.po_id}`, valueX, topY + lineSpacing);

    // Vendor
    const vendorX = pageWidth - 196;
    let vendorY = 50;
    const valueOffset = 30;

    doc.setTextColor(0, 102, 204);
    doc.setFontSize(12);
    doc.text("Vendor", vendorX, vendorY);

    vendorY += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(`${purchaseOrder.supplier.name}`, vendorX, vendorY);


    vendorY += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Contact:", vendorX, vendorY);
    doc.setFont("helvetica", "bold");
    doc.text(`${purchaseOrder?.supplier?.contact}`, vendorX + valueOffset, vendorY);    

    vendorY += 6;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Address:", vendorX, vendorY);
    doc.setFont("helvetica", "bold");
    doc.text(`${purchaseOrder.supplier.address}`, vendorX + valueOffset, vendorY);

    vendorY += 6;
    doc.setFont("helvetica", "normal");
    doc.text("Phone:", vendorX, vendorY);
    doc.setFont("helvetica", "bold");
    doc.text(`${purchaseOrder.supplier.phone}`, vendorX + valueOffset, vendorY);

    vendorY += 6;
    doc.setFont("helvetica", "normal");
    doc.text("Email:", vendorX, vendorY);
    doc.setFont("helvetica", "bold");
    doc.text(`${purchaseOrder.supplier.email}`, vendorX + valueOffset, vendorY);

    // Ship To
    const shipToX = 120;
    let shipToY = 50;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 102, 204);
    doc.text("Ship To", shipToX, shipToY);

    shipToY += 8;
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("AMRY - Asuncion Branch", shipToX, shipToY);

    shipToY += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Brgy. Cambanogoy, Asuncion, DDN", shipToX, shipToY);

    shipToY += 6;
    doc.text("Expected Date:", shipToX, shipToY);
    doc.setFont("helvetica", "bold");
    doc.text(`${purchaseOrder.expected_date}`, shipToX + 30, shipToY);

    shipToY += 8;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NOTE", shipToX, shipToY);
    doc.text(`${purchaseOrder.notes || "N/A"}`, shipToX + 30, shipToY);

    // Table Data with 0 -> empty for certain columns
    const tableData = purchaseOrder.lineItems.map((item) => [
      item.poi_id,
      item.description,
      item.ordered_qty,
      item.supplier_price.toFixed(2),
      (item.poi_total ?? 0).toFixed(2),
      item.received_qty === 0 ? "" : item.received_qty,
      item.expired_qty === 0 ? "" : item.expired_qty,
      item.damaged_qty === 0 ? "" : item.damaged_qty,
    ]);

    autoTable(doc, {
      startY: shipToY + 10,
      head: [[
        "Item ID", "Description", "Qty", "Unit Price", "Total", "Received", "Expired", "Damaged"
      ]],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 10,
        textColor: 0,
      },
      headStyles: {
        fillColor: [0, 0, 128],
        textColor: 255,
        fontStyle: "bold",
      },
    });

    const tableEndY = (doc as any).lastAutoTable.finalY || 100;
    const spacing = 10;
    const currentY = tableEndY + spacing;

    const boxX = 14;
    const boxWidth = 100;
    const boxHeight = 40;

    const billingX = boxX + boxWidth + 20; // adjust space between box and billing
    const lineHeight = 8;

    // Draw Comments/Special Instructions box
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Comments or Special Instructions", boxX, currentY);
    doc.setDrawColor(0);
    doc.rect(boxX, currentY + 2, boxWidth, boxHeight);

    // Billing Summary
    const subtotal = purchaseOrder.lineItems.reduce((acc, item) => {
      return acc + (typeof item.poi_total === "number" ? item.poi_total : parseFloat(item.poi_total || "0"));
    }, 0);

    const billingFields = [
      ["SUBTOTAL", `₱ ${subtotal.toFixed(2)}`],
      ["TAX", "₱ _____"],
      ["SHIPPING", "₱ _____"],
      ["OTHER", "₱ _____"],
      ["TOTAL", `₱ ${subtotal.toFixed(2)}`],
    ];

    billingFields.forEach(([label, value], index) => {
      const y = currentY + 5 + index * lineHeight;
      doc.setFont("helvetica", index === billingFields.length - 1 ? "bold" : "normal");
      doc.setFontSize(11);
      if (index === billingFields.length - 1) {
        doc.setFillColor(204, 229, 255);
        doc.rect(billingX - 5.5, y - 6, 60, lineHeight, "F");
      }
      doc.text(label, billingX, y);
      doc.text(value, billingX + 30, y);
    });



    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, "_blank");
  };

  return (
    <Button size="sm" onClick={exportPDF}>
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  );
};
