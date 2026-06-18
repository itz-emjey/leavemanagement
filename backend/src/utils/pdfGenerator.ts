import PDFDocument from 'pdfkit';

interface ReportData {
  title: string;
  year: number;
  summary: {
    totalRequests: number;
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
    totalDays: number;
    approvalRate: number;
  };
  monthlyTrends: { month: string; approved: number; rejected: number }[];
  leaveTypeDistribution: { name: string; value: number; color: string }[];
  departmentComparison: { department: string; totalDays: number; employeeCount: number; avgDaysPerEmployee: string }[];
}

export function generateReportPDF(data: ReportData): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  doc.fontSize(22).text(data.title, { align: 'center' });
  doc.fontSize(12).text(`Year: ${data.year}`, { align: 'center' });
  doc.moveDown(1.5);

  // Summary Section
  doc.fontSize(16).text('Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11);
  const summary = data.summary;
  doc.text(`Total Requests: ${summary.totalRequests}`);
  doc.text(`Approved: ${summary.approvedRequests}`);
  doc.text(`Pending: ${summary.pendingRequests}`);
  doc.text(`Rejected: ${summary.rejectedRequests}`);
  doc.text(`Total Leave Days: ${summary.totalDays}`);
  doc.text(`Approval Rate: ${summary.approvalRate}%`);
  doc.moveDown(1);

  // Monthly Trends
  doc.fontSize(16).text('Monthly Trends', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 150;
  const col3 = 250;
  const col4 = 350;

  doc.text('Month', col1, tableTop);
  doc.text('Approved', col2, tableTop);
  doc.text('Rejected', col3, tableTop);
  doc.text('Total', col4, tableTop);
  doc.moveDown(0.3);

  let rowY = doc.y;
  for (const month of data.monthlyTrends) {
    doc.text(month.month, col1, rowY);
    doc.text(String(month.approved), col2, rowY);
    doc.text(String(month.rejected), col3, rowY);
    doc.text(String(month.approved + month.rejected), col4, rowY);
    rowY += 18;
    if (rowY > 700) { doc.addPage(); rowY = 50; }
  }
  doc.moveDown(1);

  // Leave Type Distribution
  if (doc.y > 600) doc.addPage();
  doc.fontSize(16).text('Leave Type Distribution', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  for (const lt of data.leaveTypeDistribution) {
    doc.text(`${lt.name}: ${lt.value} days`);
  }
  doc.moveDown(1);

  // Department Comparison
  if (doc.y > 600) doc.addPage();
  doc.fontSize(16).text('Department Comparison', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);

  const dCol1 = 50;
  const dCol2 = 180;
  const dCol3 = 280;
  const dCol4 = 380;

  doc.text('Department', dCol1, doc.y);
  doc.text('Total Days', dCol2, doc.y);
  doc.text('Employees', dCol3, doc.y);
  doc.text('Avg/Employee', dCol4, doc.y);
  doc.moveDown(0.3);

  rowY = doc.y;
  for (const dept of data.departmentComparison) {
    doc.text(dept.department, dCol1, rowY);
    doc.text(String(dept.totalDays), dCol2, rowY);
    doc.text(String(dept.employeeCount), dCol3, rowY);
    doc.text(dept.avgDaysPerEmployee, dCol4, rowY);
    rowY += 18;
    if (rowY > 700) { doc.addPage(); rowY = 50; }
  }

  doc.end();
  return doc;
}
