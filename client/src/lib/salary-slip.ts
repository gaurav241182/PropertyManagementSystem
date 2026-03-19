import jsPDF from "jspdf";

interface SalarySlipData {
  // Employee
  name: string;
  employeeId: string;
  role: string;
  staffJoinDate: string | null;
  // Salary period
  month: string;
  status: string;
  // Earnings
  staffBasicPay: number;
  staffHra: number;
  staffTransport: number;
  staffAllowance: number;
  bonus: number;
  netPayNum: number;
  // Deductions
  welfareContrib: number;
  instalmentDeduction: number;
  advanceNum: number;
  // Net payable
  pending: number;
  // Pro-rate
  proRateDays: number | null;
  totalDaysInMonth: number | null;
  // Reference
  id: number;
}

interface HotelInfo {
  name: string;
  city?: string;
  country?: string;
  ownerPhone?: string;
  taxId?: string;
  branchName?: string;
  branchAddress?: string;
}

function fmtMonth(monthStr: string): string {
  if (!monthStr) return monthStr;
  const [y, m] = monthStr.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-GB", { month: "long", year: "numeric" });
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function downloadSalarySlip(salary: SalarySlipData, hotel: HotelInfo, cs: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;
  const col2X = margin + contentW / 2 + 2;
  const col2W = contentW / 2 - 2;

  let y = margin;

  // ─── Colors ──────────────────────────────────────────────────────────────
  const primary: [number, number, number] = [30, 64, 120];
  const lightGray: [number, number, number] = [245, 246, 248];
  const midGray: [number, number, number] = [120, 120, 130];
  const darkText: [number, number, number] = [20, 20, 30];
  const green: [number, number, number] = [22, 130, 80];

  // ─── Header bar ──────────────────────────────────────────────────────────
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageW, 22, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(hotel.name.toUpperCase(), margin, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const hotelSubLine = [hotel.branchName, hotel.city, hotel.country].filter(Boolean).join(" • ");
  if (hotelSubLine) doc.text(hotelSubLine, margin, 15.5);
  if (hotel.ownerPhone) doc.text(`Ph: ${hotel.ownerPhone}`, margin, 19.5);

  // SALARY SLIP title on right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("SALARY SLIP", pageW - margin, 11, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(fmtMonth(salary.month), pageW - margin, 16.5, { align: "right" });

  if (hotel.taxId) {
    doc.text(`Tax ID: ${hotel.taxId}`, pageW - margin, 20.5, { align: "right" });
  }

  y = 26;

  // ─── Employee info card ───────────────────────────────────────────────────
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y, contentW, 26, 2, 2, "F");

  const infoFields: [string, string][] = [
    ["Employee Name", salary.name],
    ["Employee ID", salary.employeeId],
    ["Designation", salary.role],
    ["Join Date", fmtDate(salary.staffJoinDate)],
    ["Pay Period", fmtMonth(salary.month)],
    ["Payment Status", salary.status],
  ];

  const cellH = 5.5;
  const colHalf = contentW / 2;
  infoFields.forEach((field, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cellX = margin + col * colHalf + 4;
    const cellY = y + 4 + row * (cellH + 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...midGray);
    doc.text(field[0], cellX, cellY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...darkText);
    doc.text(field[1], cellX, cellY + 3.5);
  });

  y += 30;

  // ─── Earnings & Deductions section label ─────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...primary);
  doc.text("EARNINGS & DEDUCTIONS", margin, y + 4);

  doc.setDrawColor(...primary);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 6, margin + contentW, y + 6);
  y += 9;

  // ─── Column headers ───────────────────────────────────────────────────────
  doc.setFillColor(...primary);
  doc.rect(margin, y, contentW / 2 - 1, 7, "F");
  doc.rect(col2X - 2, y, contentW / 2 + 2, 7, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("EARNINGS", margin + 3, y + 4.8);
  doc.text("DEDUCTIONS", col2X, y + 4.8);
  y += 9;

  // ─── Build earnings & deductions rows ────────────────────────────────────
  const fullSalary = salary.staffBasicPay + salary.staffHra + salary.staffTransport + salary.staffAllowance;

  const proRateDays = salary.proRateDays ?? (() => {
    if (!salary.staffJoinDate || !salary.month) return null;
    const jd = new Date(salary.staffJoinDate + "T00:00:00");
    const [yr, mo] = salary.month.split("-").map(Number);
    if (jd.getFullYear() === yr && jd.getMonth() + 1 === mo) {
      const td = new Date(yr, mo, 0).getDate();
      const pd = td - jd.getDate() + 1;
      if (pd < td && (salary.netPayNum - salary.bonus) < fullSalary) return pd;
    }
    return null;
  })();
  const totalDays = salary.totalDaysInMonth ?? (() => {
    if (!proRateDays || !salary.month) return null;
    const [yr, mo] = salary.month.split("-").map(Number);
    return new Date(yr, mo, 0).getDate();
  })();
  const isProRated = proRateDays !== null && totalDays !== null;

  const earnings: [string, number][] = [
    ["Basic Pay", salary.staffBasicPay],
  ];
  if (salary.staffHra > 0) earnings.push(["HRA", salary.staffHra]);
  if (salary.staffTransport > 0) earnings.push(["Transport Allowance", salary.staffTransport]);
  if (salary.staffAllowance > 0) earnings.push(["Other Allowance", salary.staffAllowance]);
  if (salary.bonus > 0) earnings.push(["Bonus", salary.bonus]);

  const deductions: [string, number][] = [];
  if (salary.welfareContrib > 0) deductions.push(["Welfare Fund", salary.welfareContrib]);
  if (salary.instalmentDeduction > 0) deductions.push(["Advance EMI", salary.instalmentDeduction]);
  else if (salary.advanceNum > 0) deductions.push(["Advance Adjustment", salary.advanceNum]);
  const totalDeductions = salary.welfareContrib +
    (salary.instalmentDeduction > 0 ? salary.instalmentDeduction : salary.advanceNum);

  const maxRows = Math.max(earnings.length, deductions.length);
  const rowH = 6.5;

  for (let i = 0; i < maxRows; i++) {
    const rowY = y + i * rowH;
    const bg: [number, number, number] = i % 2 === 0 ? [255, 255, 255] : lightGray;
    doc.setFillColor(...bg);
    doc.rect(margin, rowY, contentW / 2 - 1, rowH, "F");
    doc.rect(col2X - 2, rowY, contentW / 2 + 2, rowH, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...darkText);

    if (earnings[i]) {
      doc.text(earnings[i][0], margin + 3, rowY + 4.3);
      doc.text(`${cs}${earnings[i][1].toLocaleString()}`, margin + contentW / 2 - 4, rowY + 4.3, { align: "right" });
    }
    if (deductions[i]) {
      doc.text(deductions[i][0], col2X, rowY + 4.3);
      doc.setTextColor(180, 30, 30);
      doc.text(`-${cs}${deductions[i][1].toLocaleString()}`, col2X + col2W - 2, rowY + 4.3, { align: "right" });
      doc.setTextColor(...darkText);
    }
  }

  y += maxRows * rowH;

  // ─── Totals row ──────────────────────────────────────────────────────────
  doc.setFillColor(220, 230, 245);
  doc.rect(margin, y, contentW / 2 - 1, 7.5, "F");
  doc.rect(col2X - 2, y, contentW / 2 + 2, 7.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...primary);
  doc.text("Total Earnings", margin + 3, y + 5);
  doc.text(`${cs}${salary.netPayNum.toLocaleString()}`, margin + contentW / 2 - 4, y + 5, { align: "right" });

  doc.text("Total Deductions", col2X, y + 5);
  doc.setTextColor(180, 30, 30);
  doc.text(`-${cs}${totalDeductions.toLocaleString()}`, col2X + col2W - 2, y + 5, { align: "right" });

  y += 10;

  // ─── Pro-rate note ────────────────────────────────────────────────────────
  if (isProRated) {
    doc.setFillColor(255, 244, 220);
    doc.roundedRect(margin, y, contentW, 11, 1.5, 1.5, "F");
    doc.setDrawColor(220, 150, 30);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, 11, 1.5, 1.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 90, 0);
    doc.text("PRO-RATED SALARY (Joining Month)", margin + 4, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(
      `${proRateDays} of ${totalDays} days worked  •  Full month salary: ${cs}${fullSalary.toLocaleString()}  •  Pro-rated gross: ${cs}${(salary.netPayNum - salary.bonus).toLocaleString()}`,
      margin + 4, y + 8.5
    );
    y += 14;
  }

  // ─── Net Pay box ─────────────────────────────────────────────────────────
  doc.setFillColor(...primary);
  doc.roundedRect(margin, y, contentW, 16, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(200, 215, 240);
  doc.text("NET PAY (TAKE HOME)", margin + 6, y + 7);

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${cs}${salary.pending.toLocaleString()}`, pageW - margin - 6, y + 10, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 200, 235);
  const deductSummary = totalDeductions > 0 ? `Total Earnings ${cs}${salary.netPayNum.toLocaleString()}  −  Deductions ${cs}${totalDeductions.toLocaleString()}` : `Total Earnings ${cs}${salary.netPayNum.toLocaleString()}`;
  doc.text(deductSummary, margin + 6, y + 13);

  y += 20;

  // ─── Footer ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...midGray);
  doc.setLineWidth(0.2);
  doc.line(margin, y, margin + contentW, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...midGray);
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`, margin, y);
  doc.text("This is a computer generated document and does not require a physical signature.", pageW / 2, y, { align: "center" });

  // Signature area
  y += 14;
  doc.setLineWidth(0.3);
  doc.setDrawColor(...midGray);
  doc.line(pageW - margin - 45, y, pageW - margin, y);
  doc.setFontSize(7.5);
  doc.setTextColor(...midGray);
  doc.text("Authorised Signatory", pageW - margin - 45, y + 4);

  // ─── Save ─────────────────────────────────────────────────────────────────
  const fileName = `SalarySlip_${salary.employeeId}_${salary.month}.pdf`;
  doc.save(fileName);
}
