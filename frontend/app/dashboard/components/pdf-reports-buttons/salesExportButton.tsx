// salesExportButton.tsx
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportSalesPDF = (data: any) => {
  if (!data || !data.daily_sales_summary?.length) {
    alert("No sales data available for this month.");
    return;
  }

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
  const title = "Sales Report";
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(173, 216, 230);
  const titleWidth = doc.getTextWidth(title);
  const titleY = margin + 6;
  doc.text(title, pageWidth - titleWidth - margin, titleY);

  // Date under Sales Report
  const today = new Date().toISOString().split("T")[0];
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const dateY = titleY + 8;
  doc.text("DATE", pageWidth - 60, dateY);
  doc.setFont("helvetica", "bold");
  doc.text(today, pageWidth - 40, dateY);

  // Subheader: Month Label (moved lower to avoid overlap)
  const subHeaderY = margin + 14 + address.length * 6 + 12; // After address block with space
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Month of ${data.month} Sales`, margin, subHeaderY);

  // Table
  const formatAmount = (value: string) =>
    parseFloat(value).toLocaleString("en-PH", { minimumFractionDigits: 2 });

  const tableData = data.daily_sales_summary.map((entry: any) => [
    entry.date,
    formatAmount(entry.Talaingod),
    formatAmount(entry.Asuncion),
    formatAmount(entry.regular_sales),
    formatAmount(entry.total_dswd),
  ]);

  autoTable(doc, {
    startY: subHeaderY + 8,
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

  const table = (doc as any).lastAutoTable;
  const tableEndY = table?.finalY || 100;
  const colPositions = table?.table?.columns || [];

  const grandTotalX = colPositions[3]?.x ?? pageWidth - 100;
  const chargeX = colPositions[4]?.x ?? pageWidth - 50;
  const boxY = tableEndY + 10;
  const boxHeight = 16;
  const boxWidth = 85;

  const totalReg = formatAmount(data.monthly_summary.monthly_regular_sales);
  const totalCharge = formatAmount(data.monthly_summary.monthly_total_dswd);

  doc.setDrawColor(0);

  // Draw total boxes individually
  doc.rect(grandTotalX, boxY, boxWidth, boxHeight);
  doc.setFont("helvetica", "bold");
  doc.text("Total Reg Sales:", grandTotalX + 5, boxY + 6);
  doc.text(totalReg, grandTotalX + 5, boxY + 13);

  doc.rect(chargeX, boxY, boxWidth, boxHeight);
  doc.text("Total Charge:", chargeX + 5, boxY + 6);
  doc.text(totalCharge, chargeX + 5, boxY + 13);

  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, "_blank");
};
