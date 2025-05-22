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
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    const colGap = 10;
    const colWidth = (contentWidth - colGap) / 2;

    const formatCurrency = (num: number): string => {
      return num.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 128);
    doc.text("AMRY PHARMACY", margin, margin + 6);

    // Address
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const addressLines = [
      "Sally Bautista Bld., Purok 2 Nat'l Highway",
      "Brgy. Cambanogoy, Asuncion, DDN",
      "Phone: (099) 123-4567",
    ];
    addressLines.forEach((line, i) => {
      doc.text(line, margin, margin + 14 + i * 6);
    });

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(173, 216, 230);
    const title = "PURCHASE ORDER";
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, pageWidth - titleWidth - margin, margin + 6);

    // PO Info
    const labelX = pageWidth - 73;
    const valueX = pageWidth - 40;
    const topY = margin + 16;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text("ORDER DATE", labelX, topY);
    doc.text("PO #", labelX, topY + 5);
    doc.setFont("helvetica", "bold");
    doc.text(purchaseOrder.order_date, valueX, topY);
    doc.text(purchaseOrder.po_id, valueX, topY + 5);

    // VENDOR & SHIP TO (Side-by-side)
    const vendorX = margin;
    const shipToX = vendorX + colWidth + colGap;
    let vendorY = topY + 20;
    let shipToY = topY + 20;

    // Vendor
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 102, 204);
    doc.text("Vendor", vendorX, vendorY);

    vendorY += 8;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(purchaseOrder.supplier.name, vendorX, vendorY);

    const vendorLines: string[] = [
      `Contact: ${purchaseOrder.supplier.contact}`,
      `Address: ${purchaseOrder.supplier.address}`,
      `Phone: ${String(purchaseOrder.supplier.phone)}`,
      `Email: ${purchaseOrder.supplier.email}`,
    ];

    vendorLines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, colWidth);
      vendorY += 6;
      doc.setFont("helvetica", "normal");
      doc.text(wrapped, vendorX, vendorY);
      vendorY += (wrapped.length - 1) * 6;
    });

    // Ship To
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 102, 204);
    doc.text("Ship To", shipToX, shipToY);

    shipToY += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("AMRY - Asuncion Branch", shipToX, shipToY);

    const shipToLines: string[] = [
      "Brgy. Cambanogoy, Asuncion, DDN",
      `Expected Date: ${purchaseOrder.expected_date}`,
    ];

    shipToLines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, colWidth);
      shipToY += 6;
      doc.setFont("helvetica", "normal");
      doc.text(wrapped, shipToX, shipToY);
      shipToY += (wrapped.length - 1) * 6;
    });

    // NOTE (under Ship To only, yellow highlight)
    const noteLabel = "NOTE";
    const noteValue = purchaseOrder.notes || "N/A";
    const noteX = shipToX;
    const noteY = shipToY + 10;
    const wrappedNote = doc.splitTextToSize(noteValue, colWidth - 35);
    const noteHeight = wrappedNote.length * 6 + 4;

    doc.setFillColor(255, 255, 153); // Yellow
    doc.rect(noteX, noteY - 5, colWidth, noteHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(noteLabel, noteX, noteY);
    doc.text(wrappedNote, noteX + 35, noteY);

    let currentY = noteY + noteHeight + 5;

    // Table
    const tableData = purchaseOrder.lineItems.map((item) => [
      item.poi_id,
      item.description,
      item.ordered_qty,
      item.supplier_price.toFixed(2),
      (item.poi_total ?? 0).toFixed(2),
      item.received_qty || "",
      item.expired_qty || "",
      item.damaged_qty || "",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Item ID", "Description", "Qty", "Unit Price", "Total", "Received", "Expired", "Damaged"]],
      body: tableData,
      theme: "grid",
      margin: { left: margin, right: margin },
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

    const tableEndY = (doc as any).lastAutoTable.finalY || currentY + 50;
    currentY = tableEndY + 10;

    // Comments
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Comments or Special Instructions", margin, currentY);
    doc.rect(margin, currentY + 2, 100, 40);

    // Billing Summary
    const subtotal = purchaseOrder.lineItems.reduce((acc, item) => {
      return acc + (typeof item.poi_total === "number" ? item.poi_total : parseFloat(item.poi_total || "0"));
    }, 0);

    const billingX = margin + 120;
    const billingFields = [
      ["SUBTOTAL", `₱ ${formatCurrency(subtotal)}`],
      ["TAX", "₱ _____"],
      ["SHIPPING", "₱ _____"],
      ["OTHER", "₱ _____"],
      ["TOTAL", `₱ ${formatCurrency(subtotal)}`],
    ];

    billingFields.forEach(([label, value], index) => {
      const y = currentY + 8 + index * 8;
      doc.setFont("helvetica", index === 4 ? "bold" : "normal");
      if (index === 4) {
        doc.setFillColor(204, 229, 255);
        const boxWidth = pageWidth - billingX - margin;
        doc.rect(billingX - 5.5, y - 6, boxWidth + 10, 8, "F");
      }
      doc.text(label, billingX, y);
      doc.text(value, billingX + 30, y);
    });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <Button size="sm" onClick={exportPDF}>
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  );
};
