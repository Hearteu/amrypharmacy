"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportInventoryPDF = async (products: any[]) => {
  if (!products || products.length === 0) {
    alert("No inventory data to export.");
    return;
  }

  const doc = new jsPDF();

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

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(173, 216, 230);
  const rightTitle = "Inventory Report";
  const pageWidth = doc.internal.pageSize.getWidth();
  const textWidth = doc.getTextWidth(rightTitle);
  doc.text(rightTitle, pageWidth - textWidth - 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const today = new Date().toISOString().split("T")[0];
  doc.text("DATE", pageWidth - 40, 30);
  doc.setFont("helvetica", "bold");
  doc.text(today, pageWidth - 40, 36);

  // Table
  const tableData = products.map((product: any) => [
    product.full_product_name,
    product.category,
    product.price,
    product.net_content,
    product.unit,
    product.stock_per_location?.find((loc: any) => loc.location_id === 2)?.total_quantity || 0,
    product.stock_per_location?.find((loc: any) => loc.location_id === 3)?.total_quantity || 0,
    product.stock_per_location?.find((loc: any) => loc.location_id === 1)?.total_quantity || 0,
  ]);

  autoTable(doc, {
    startY: 60,
    head: [[
      "Product Name", "Category", "Price", "Net Content", "Unit",
      "Talaingod", "Asuncion - Stockroom", "Asuncion - Physical"
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
