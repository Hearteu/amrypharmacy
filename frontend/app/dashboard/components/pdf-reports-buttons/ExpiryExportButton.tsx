// ExpiryExportButton.tsx
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportExpiryPDF = async (items: any[]) => {
  if (!items || items.length === 0) {
    alert("No expiration data to export.");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 128);
  doc.setFont("helvetica", "bold");
  doc.text("AMRY PHARMACY", 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  const address = [
    "Sally Bautista Bld., Purok 2 Nat'l Highway",
    "Brgy. Cambanogoy, Asuncion, DDN",
    "Phone: (099) 123-4567",
  ];
  address.forEach((line, i) => doc.text(line, 14, 28 + i * 6));

  // Title and Date
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(173, 216, 230);
  const rightTitle = "Expiring Items Report";
  const textWidth = doc.getTextWidth(rightTitle);
  doc.text(rightTitle, pageWidth - textWidth - 14, 20);

  const today = new Date().toLocaleDateString("en-CA"); 
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const labelX = pageWidth - 60;
  const valueX = pageWidth - 40;
  const topY = 30;
  doc.text("DATE", labelX, topY);
  doc.setFont("helvetica", "bold");
  doc.text(today, valueX, topY);

  // Table
  const tableData = items.map((item) => [
    item.Stock_Item.Product.full_product_name,
    item.Stock_Item.Product.net_content,
    item.Stock_Item.Product.current_price.toFixed(2),
    item.quantity,
    item.location,
    item.expiry_date,
    item.days_until_expiry.toString(),
  ]);

  autoTable(doc, {
    startY: 60,
    head: [[
      "Product Name",
      "Net Content",
      "Price",
      "Qty",
      "Location",
      "Expiry Date",
      "Days Left"
    ]],
    body: tableData,
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

  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, "_blank");
};
