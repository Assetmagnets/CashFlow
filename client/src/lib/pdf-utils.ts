import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Expense } from '../types';

export const downloadExpensesPDF = (
  expenses: Expense[],
  title: string,
  subtitle?: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors based on the provided invoice design
  const primaryBlue = [127, 152, 178]; // Muted grayish-blue for headers
  const lightBlue = [230, 234, 240];   // Very light blue for alternate rows / total box
  const textColor = [60, 60, 60];      // Dark gray for text

  // 1. Top Right: Title and Date
  doc.setFontSize(22);
  doc.setTextColor(200, 210, 220); // Light blue-gray for the big title
  doc.setFont('helvetica', 'bold');
  const upperTitle = title.toUpperCase();
  const titleWidth = doc.getStringUnitWidth(upperTitle) * 22 / doc.internal.scaleFactor;
  doc.text(upperTitle, pageWidth - 14 - titleWidth, 22);

  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  const dateStr = `DATE: ${new Date().toLocaleDateString('en-IN')}`;
  const dateWidth = doc.getStringUnitWidth(dateStr) * 9 / doc.internal.scaleFactor;
  doc.text(dateStr, pageWidth - 14 - dateWidth, 30);
  
  // Draw a subtle line under the date
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(pageWidth - 14 - dateWidth - 5, 31, pageWidth - 14, 31);

  // 2. Top Left/Right: "From" / "To" equivalent sections (Report Details)
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('REPORT DETAILS', 14, 40);
  doc.text('PARAMETERS', pageWidth / 2, 40);

  doc.setDrawColor(220, 220, 220);
  doc.line(14, 42, (pageWidth / 2) - 10, 42);
  doc.line(pageWidth / 2, 42, pageWidth - 14, 42);

  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('NAME: ', 14, 48);
  doc.setFont('helvetica', 'normal');
  doc.text('CashFlow Web App', 26, 48);
  doc.setDrawColor(150, 150, 150);
  doc.line(26, 49, (pageWidth / 2) - 10, 49);

  doc.setFont('helvetica', 'bold');
  doc.text('INFO: ', pageWidth / 2, 48);
  doc.setFont('helvetica', 'normal');
  const subText = subtitle || 'Comprehensive Report';
  doc.text(subText, (pageWidth / 2) + 10, 48);
  doc.line((pageWidth / 2) + 10, 49, pageWidth - 14, 49);

  // Format currency helper to avoid unsupported unicode (₹) rendering as '1' or '?' in jsPDF standard fonts
  const formatCurrency = (val: number) => {
    const formattedNumber = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(val);
    return `Rs. ${formattedNumber}`;
  };

  // Format Date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Prepare table data
  const tableColumn = ['DATE', 'SITE', 'CATEGORY', 'DESCRIPTION', 'AMOUNT'];
  
  let totalAmount = 0;
  const tableRows = expenses.map(expense => {
    const amount = Number(expense.amount);
    totalAmount += amount;
    
    // Combine Vendor and Description for cleaner layout
    const desc = expense.vendorName 
      ? `${expense.vendorName}: ${expense.description || '-'}`
      : (expense.description || '-');

    return [
      formatDate(expense.expenseDate || expense.createdAt),
      expense.site ? expense.site.name : 'N/A',
      expense.category ? expense.category.name : 'Unknown',
      desc,
      formatCurrency(amount)
    ];
  });

  // Generate Table using the plugin attached to the prototype
  let finalY = 0;
  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 58,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 5.5,
      textColor: textColor,
      font: 'helvetica',
      lineColor: [210, 215, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: primaryBlue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 35 },
      2: { cellWidth: 32 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 32, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: lightBlue,
    },
    didDrawPage: function (data: any) {
      finalY = data.cursor.y;
    }
  });

  // 4. Footer: Total Due section
  const totalY = finalY + 12; // Extra padding above total
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  const totalLabel = 'TOTAL EXPENDITURE';
  const totalLabelWidth = doc.getStringUnitWidth(totalLabel) * 9 / doc.internal.scaleFactor;
  
  const totalValue = formatCurrency(totalAmount);
  
  // Draw the shaded box for the total value (made slightly wider for Rs.)
  doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
  doc.rect(pageWidth - 48, totalY - 6, 34, 10, 'F');
  
  // Text for the total label and value
  doc.text(totalLabel, pageWidth - 52 - totalLabelWidth, totalY);
  
  doc.setFontSize(10);
  const totalValueWidth = doc.getStringUnitWidth(totalValue) * 10 / doc.internal.scaleFactor;
  // Center the value inside the 34px box
  const valueX = (pageWidth - 48) + (34 / 2) - (totalValueWidth / 2);
  doc.text(totalValue, valueX, totalY + 0.5);

  // Inject print command into PDF so the print dialog opens automatically
  doc.autoPrint();

  // Open the PDF in a new window for preview and printing
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const newWindow = window.open(blobUrl, '_blank');
  
  if (!newWindow) {
    // Fallback if popup blocker is active
    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  }
};
