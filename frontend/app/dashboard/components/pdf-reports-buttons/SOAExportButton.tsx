// SOAExportButton.tsx
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportSOAPDF = (soaData: any[]) => {
  if (!soaData || soaData.length === 0) {
    alert("No statement of account data to export.");
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

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(173, 216, 230);
  const title = "Statement of Accounts";
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, pageWidth - titleWidth - 14, 20);

  // Date (aligned same as inventory)
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

  // Client Details (Bill to)
  let billY = 48;
  doc.setFontSize(12);
  doc.setTextColor(0, 102, 204);
  doc.setFont("helvetica", "bold");
  doc.text("Bill to", 14, billY);

  billY += 8;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("DSWD", 14, billY);

  const clientDetails = [
    "Contact: Leonora Alferez",
    "Address: Ramon Magsaysay Ave, D Suanzo St, Davao City",
    "Phone: 9226759292",
    "Email: dswd@gmail.com",
  ];

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  clientDetails.forEach((line, i) => {
    billY += 6;
    doc.text(line, 14, billY);
  });

  // Table Data
  const tableData = soaData.map((entry: any) => [
    entry.gl_date,
    entry.gl_no,
    entry.client_name,
    entry.patient_name,
    entry.date_received,
    entry.invoice,
    parseFloat(entry.amount).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
    }),
  ]);

  autoTable(doc, {
    startY: billY + 10,
    head: [[
      "GL Date",
      "GL No.",
      "Name of Client",
      "Name of Patient",
      "Date Received",
      "Invoice",
      "Amount",
    ]],
    body: tableData,
    theme: "grid",
    margin: { left: 14, right: 14 },
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

  const tableEndY = (doc as any).lastAutoTable.finalY || 140;

  const total = soaData.reduce(
    (acc, entry) => acc + parseFloat(entry.amount || "0"),
    0
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setFillColor(204, 229, 255);
  doc.rect(pageWidth - 70 - 14, tableEndY + 5, 70, 8, "F");
  doc.setTextColor(0, 0, 0);
  doc.text("Total Bill:", pageWidth - 70, tableEndY + 11);
  doc.text(
    total.toLocaleString("en-PH", { minimumFractionDigits: 2 }),
    pageWidth - 25,
    tableEndY + 11,
    { align: "right" }
  );

  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
};
