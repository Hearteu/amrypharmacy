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

  // Subheader: Month Label (below address)
  const subHeaderY = margin + 14 + address.length * 6 + 12;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Month of ${data.month} Sales`, margin, subHeaderY);

  // Format values
  const formatAmount = (value: string) =>
    parseFloat(value).toLocaleString("en-PH", { minimumFractionDigits: 2 });

  // Table Data
  const tableData = data.daily_sales_summary.map((entry: any) => [
    entry.date,
    formatAmount(entry.Talaingod),
    formatAmount(entry.Asuncion),
    formatAmount(entry.regular_sales),
    formatAmount(entry.total_dswd),
  ]);

  // Sales Table
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

  // Final Totals
  const table = (doc as any).lastAutoTable;
  const tableEndY = table?.finalY || 100;

  const totalReg = formatAmount(data.monthly_summary.monthly_regular_sales);
  const totalCharge = formatAmount(data.monthly_summary.monthly_total_dswd);

  autoTable(doc, {
    startY: tableEndY + 10,
    head: [["TOTAL", "reg sales: ",totalReg, "charges: ", totalCharge]],
    body: [],
    theme: "plain",
    styles: {
      fontSize: 11,
      fontStyle: "bold",
      halign: "right",
      fillColor: [204, 229, 255], // light blue
    },
    headStyles: {
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 50 },
      1: { halign: "right", cellWidth: 40 },
      2: { halign: "right", cellWidth: 40 },
    },
  });

  // Export to new tab
  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, "_blank");
};
