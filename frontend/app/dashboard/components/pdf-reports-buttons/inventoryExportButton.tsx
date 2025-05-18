"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportInventoryPDF = async (products: any[]) => {
  if (!products || products.length === 0) {
    alert("No inventory data to export.");
    console.log("❌ No inventory data found.");
    return;
  }

  console.log("✅ exportInventoryPDF started...");
  console.log("📦 Raw Products:", products);

  const doc = new jsPDF();
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 128);
  doc.text("AMRY PHARMACY", margin, margin + 6);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const address = [
    "Sally Bautista Bld., Purok 2 Nat'l Highway",
    "Brgy. Cambanogoy, Asuncion, DDN",
    "Phone: (099) 123-4567",
  ];
  address.forEach((line, i) => doc.text(line, margin, margin + 14 + i * 6));

  // Title
  const title = "Inventory Report";
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(173, 216, 230);
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, pageWidth - titleWidth - margin, margin + 6);

  // Date
  const today = new Date().toISOString().split("T")[0];
  const labelX = pageWidth - 60;
  const valueX = pageWidth - 40;
  const topY = margin + 28;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text("DATE", labelX, topY);
  doc.setFont("helvetica", "bold");
  doc.text(today, valueX, topY);

  // Helper
  const getStockQty = (product: any, locationId: number) => {
    const match = product.stock_per_location.find(
      (loc: any) => loc.location_id === locationId
    );
    console.log(`Location ${locationId} for product ${product.full_product_name}:`, match);
    return match?.total_quantity ?? 0;
  };

  const tableData = products.map((product: any) => {
    const row = [
      product.full_product_name,
      product.category,
      product.price?.toFixed(2) ?? "0.00",
      product.net_content,
      product.unit,
      getStockQty(product, 2), // Talaingod
      getStockQty(product, 3), // Asuncion - Stockroom
      getStockQty(product, 1), // Asuncion - Physical
    ];
    console.log("Row:", row);
    return row;
  });

  autoTable(doc, {
    startY: topY + 12,
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
  console.log("📄 PDF Blob URL:", blobUrl);

  // FIX: Trigger download instead of window.open
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `Inventory_Report_${today}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log("✅ exportInventoryPDF completed.");
};

// inventory
