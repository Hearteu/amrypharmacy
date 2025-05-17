// app/dashboard/components/pdf-reports-buttons/salesExportButton.tsx

"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Fix TypeScript for autoTable plugin
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY?: number;
    };
  }
}

export const exportSalesSummaryPDF = async (sales: any[]) => {
  if (!sales || sales.length === 0) {
    alert("No sales data to export.");
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

  // Title and Date
  const pageWidth = doc.internal.pageSize.getWidth();
  const title = "Sales Report";
  const textWidth = doc.getTextWidth(title);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(173, 216, 230);
  doc.text(title, pageWidth - textWidth - 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("DATE", pageWidth - 40, 30);
  doc.setFont("helvetica", "bold");
  doc.text("2025-03-31", pageWidth - 40, 36); // You can replace with dynamic date if needed

  // Format table data
  const tableData = sales.map((item: any) => [
    item.date || "N/A",
    item.talaingod || "₱ 0.00",
    item.asuncion || "₱ 0.00",
    item.grand_total || "₱ 0.00",
    item.charge_sales || "₱ 0.00",
  ]);

  autoTable(doc, {
    startY: 60,
    head: [["Date", "Talaingod", "Asuncion", "Grand Total", "Charge Sales (DSWD)"]],
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

  // Totals (placeholder values)
  const summaryStartY = doc.lastAutoTable?.finalY ?? 100;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.rect(pageWidth - 90, summaryStartY + 10, 85, 20);
  doc.text("Total Reg Sales:", pageWidth - 85, summaryStartY + 17);
  doc.text("₱ 52,182.00", pageWidth - 40, summaryStartY + 17);
  doc.text("Total Charge:", pageWidth - 85, summaryStartY + 25);
  doc.text("₱ 90,341.00", pageWidth - 40, summaryStartY + 25);

  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, "_blank");
};
