'use client';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Type definitions to satisfy TypeScript checking
interface ExportDataRow {
  [key: string]: any;
}

// 1. Excel export utility
export function exportToExcel(data: ExportDataRow[], fileName: string = 'KSW_Report') {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Logs');

    // Generate buffer and trigger browser download
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (err) {
    console.error('Failed to export Excel document:', err);
  }
}

// 2. PDF export utility
export function exportToPDF(
  headers: string[],
  rows: any[][],
  title: string = 'KSW Pathshala Report',
  fileName: string = 'KSW_PDF_Report'
) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const timestamp = new Date().toLocaleString();

    // 1. PDF Document Header Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229); // Indigo theme color
    doc.text('KSW PATHSHALA FOUNDATION', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate muted color
    doc.setFont('helvetica', 'normal');
    doc.text('Alternative Education NGO for Underprivileged Children', 14, 23);
    doc.text(`Generated on: ${timestamp}`, 14, 27);

    // Decorative separator line
    doc.setDrawColor(229, 231, 235);
    doc.line(14, 30, 196, 30);

    // 2. Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Foreground color
    doc.text(title, 14, 38);

    // 3. Render Autotable
    (doc as any).autoTable({
      startY: 42,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // Indigo
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: 30,
      },
      alternateRowStyles: {
        fillColor: [243, 244, 246], // light gray backgrounds
      },
      margin: { top: 40, left: 14, right: 14 },
    });

    // 4. Save file download
    doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error('Failed to generate PDF document:', err);
  }
}
