// lowStockExportButton.tsx
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportLowStockPDF = (stockItems: any[]) => {
  if (!stockItems || stockItems.length === 0) {
    alert("No low stock data to export.");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 128);
  doc.text("AMRY PHARMACY", margin, 20);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const address = [
    "Sally Bautista Bld., Purok 2 Nat'l Highway",
    "Brgy. Cambanogoy, Asuncion, DDN",
    "Phone: (099) 123-4567",
  ];
  address.forEach((line, i) => doc.text(line, margin, 28 + i * 6));

  // Title
  const title = "Low Stock Report";
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(173, 216, 230);
  const textWidth = doc.getTextWidth(title);
  doc.text(title, pageWidth - textWidth - margin, 20);

  // Date
  const today = new Date().toISOString().split("T")[0];
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const labelX = pageWidth - 60;
  const valueX = pageWidth - 40;
  const topY = 30;
  doc.text("DATE", labelX, topY);
  doc.setFont("helvetica", "bold");
  doc.text(today, valueX, topY);

  // 🔤 Sort by full_product_name
  const sortedItems = [...stockItems].sort((a, b) =>
    a.product_details.full_product_name.localeCompare(b.product_details.full_product_name)
  );

  // Table Data
  const tableData = sortedItems.map((item: any) => [
    item.product_details.full_product_name,
    item.product_details.brand_name,
    item.product_details.category_name,
    item.product_details.current_price.toFixed(2),
    item.location_name,
    item.quantity,
  ]);

  autoTable(doc, {
    startY: 60,
    head: [[
      "Product Name",
      "Brand",
      "Category",
      "Price",
      "Location",
      "Qty"
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
