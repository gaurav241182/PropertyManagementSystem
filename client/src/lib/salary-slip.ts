import jsPDF from "jspdf";

interface SalarySlipData {
  name: string;
  employeeId: string;
  role: string;
  staffJoinDate: string | null;
  month: string;
  status: string;
  staffBasicPay: number;
  staffHra: number;
  staffTransport: number;
  staffAllowance: number;
  bonus: number;
  netPayNum: number;
  welfareContrib: number;
  instalmentDeduction: number;
  advanceNum: number;
  pending: number;
  proRateDays: number | null;
  totalDaysInMonth: number | null;
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

// jsPDF's built-in fonts (Helvetica) only support Latin-1 charset.
// Currency symbols like ₹ € ¥ etc. are not in Latin-1 and render as garbage.
// We map them to safe ASCII alternatives.
const SAFE_SYMBOLS: Record<string, string> = {
  "₹": "Rs.", "€": "EUR ", "£": "GBP ", "¥": "JPY ", "₩": "KRW ",
  "₱": "PHP ", "₽": "RUB ", "฿": "THB ", "₫": "VND ", "₪": "ILS ",
  "Rp": "IDR ", "RM": "MYR ", "د.إ": "AED ",
};
function safeCurrency(cs: string): string {
  if (SAFE_SYMBOLS[cs]) return SAFE_SYMBOLS[cs];
  // Check if any char is outside Latin-1 range
  for (let i = 0; i < cs.length; i++) {
    if (cs.charCodeAt(i) > 255) return cs.slice(0, i) || "";
  }
  return cs;
}

function fmt(n: number, sc: string): string {
  return `${sc}${n.toLocaleString("en-IN")}`;
}

function fmtMonth(monthStr: string): string {
  if (!monthStr) return monthStr;
  const [y, m] = monthStr.split("-");
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleString("en-GB", { month: "long", year: "numeric" });
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function downloadSalarySlip(salary: SalarySlipData, hotel: HotelInfo, cs: string) {
  const sc = safeCurrency(cs);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ─── Page dimensions ──────────────────────────────────────────────────────
  const pageW = 210;
  const ML = 14;          // left margin
  const MR = 14;          // right margin
  const CW = pageW - ML - MR;  // 182mm content width

  // Column split: 50/50 with a 2mm gap
  const GAP = 4;
  const COL = (CW - GAP) / 2;  // ~89mm each
  const L_LABEL = ML + 3;
  const L_AMT = ML + COL - 2;                // right-align earnings amount here
  const R_LABEL = ML + COL + GAP + 1;
  const R_AMT = ML + CW - 2;                  // right-align deductions amount here

  // ─── Colors ──────────────────────────────────────────────────────────────
  const C_PRIMARY: [number, number, number] = [30, 64, 120];
  const C_LIGHT: [number, number, number] = [245, 246, 248];
  const C_MID: [number, number, number] = [120, 120, 130];
  const C_DARK: [number, number, number] = [20, 20, 30];
  const C_RED: [number, number, number] = [170, 30, 30];

  let y = 0;

  // ─── Header bar ──────────────────────────────────────────────────────────
  doc.setFillColor(...C_PRIMARY);
  doc.rect(0, 0, pageW, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(hotel.name.toUpperCase(), ML, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const sub = [hotel.branchName, hotel.city, hotel.country].filter(Boolean).join("  |  ");
  if (sub) doc.text(sub, ML, 16);
  if (hotel.ownerPhone) doc.text(`Ph: ${hotel.ownerPhone}`, ML, 21);

  // Right side
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("SALARY SLIP", pageW - MR, 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(fmtMonth(salary.month), pageW - MR, 16, { align: "right" });
  if (hotel.taxId) doc.text(`Tax ID: ${hotel.taxId}`, pageW - MR, 21, { align: "right" });

  y = 28;

  // ─── Employee info card ───────────────────────────────────────────────────
  doc.setFillColor(...C_LIGHT);
  doc.roundedRect(ML, y, CW, 28, 2, 2, "F");

  const fields: [string, string][] = [
    ["Employee Name", salary.name],
    ["Employee ID", salary.employeeId],
    ["Designation", salary.role],
    ["Join Date", fmtDate(salary.staffJoinDate)],
    ["Pay Period", fmtMonth(salary.month)],
    ["Payment Status", salary.status],
  ];

  const halfCW = CW / 2;
  fields.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = ML + col * halfCW + 5;
    const fy = y + 5 + row * 8.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C_MID);
    doc.text(label, fx, fy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...C_DARK);
    doc.text(value, fx, fy + 3.8);
  });

  y += 32;

  // ─── Section heading ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C_PRIMARY);
  doc.text("EARNINGS & DEDUCTIONS", ML, y + 4);
  doc.setDrawColor(...C_PRIMARY);
  doc.setLineWidth(0.4);
  doc.line(ML, y + 6, ML + CW, y + 6);
  y += 10;

  // ─── Column headers ───────────────────────────────────────────────────────
  const headerH = 7;
  doc.setFillColor(...C_PRIMARY);
  doc.rect(ML, y, COL, headerH, "F");
  doc.rect(ML + COL + GAP, y, COL, headerH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("EARNINGS", L_LABEL, y + 4.8);
  doc.text("DEDUCTIONS", R_LABEL, y + 4.8);
  y += headerH;

  // ─── Rows ─────────────────────────────────────────────────────────────────
  const fullSalary = salary.staffBasicPay + salary.staffHra + salary.staffTransport + salary.staffAllowance;

  // Pro-rate detection (with fallback from join date)
  let proRateDays = salary.proRateDays;
  let totalDays = salary.totalDaysInMonth;
  if (!proRateDays && salary.staffJoinDate && salary.month) {
    const jd = new Date(salary.staffJoinDate + "T00:00:00");
    const [yr, mo] = salary.month.split("-").map(Number);
    if (jd.getFullYear() === yr && jd.getMonth() + 1 === mo) {
      const td = new Date(yr, mo, 0).getDate();
      const pd = td - jd.getDate() + 1;
      if (pd < td && (salary.netPayNum - salary.bonus) < fullSalary) {
        proRateDays = pd;
        totalDays = td;
      }
    }
  }
  const isProRated = !!(proRateDays && totalDays);

  const earnings: [string, number][] = [["Basic Pay", salary.staffBasicPay]];
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
  const rowH = 7;

  for (let i = 0; i < maxRows; i++) {
    const ry = y + i * rowH;
    const bg: [number, number, number] = i % 2 === 0 ? [255, 255, 255] : C_LIGHT;

    doc.setFillColor(...bg);
    doc.rect(ML, ry, COL, rowH, "F");
    doc.rect(ML + COL + GAP, ry, COL, rowH, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C_DARK);

    if (earnings[i]) {
      doc.text(earnings[i][0], L_LABEL, ry + rowH * 0.65);
      doc.text(fmt(earnings[i][1], sc), L_AMT, ry + rowH * 0.65, { align: "right" });
    }
    if (deductions[i]) {
      doc.text(deductions[i][0], R_LABEL, ry + rowH * 0.65);
      doc.setTextColor(...C_RED);
      doc.text(`-${fmt(deductions[i][1], sc)}`, R_AMT, ry + rowH * 0.65, { align: "right" });
      doc.setTextColor(...C_DARK);
    }
  }

  y += maxRows * rowH;

  // ─── Totals row ──────────────────────────────────────────────────────────
  const totH = 8;
  doc.setFillColor(210, 222, 245);
  doc.rect(ML, y, COL, totH, "F");
  doc.rect(ML + COL + GAP, y, COL, totH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C_PRIMARY);
  doc.text("Total Earnings", L_LABEL, y + totH * 0.65);
  doc.text(fmt(salary.netPayNum, sc), L_AMT, y + totH * 0.65, { align: "right" });

  doc.text("Total Deductions", R_LABEL, y + totH * 0.65);
  doc.setTextColor(...C_RED);
  doc.text(`-${fmt(totalDeductions, sc)}`, R_AMT, y + totH * 0.65, { align: "right" });

  y += totH + 5;

  // ─── Pro-rate note ────────────────────────────────────────────────────────
  if (isProRated && proRateDays && totalDays) {
    doc.setFillColor(255, 244, 210);
    doc.roundedRect(ML, y, CW, 13, 1.5, 1.5, "F");
    doc.setDrawColor(200, 140, 20);
    doc.setLineWidth(0.25);
    doc.roundedRect(ML, y, CW, 13, 1.5, 1.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(130, 80, 0);
    doc.text("PRO-RATED SALARY (Joining Month)", ML + 4, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${proRateDays} of ${totalDays} days worked   |   Full month: ${fmt(fullSalary, sc)}   |   Pro-rated gross: ${fmt(salary.netPayNum - salary.bonus, sc)}`,
      ML + 4, y + 10
    );
    y += 17;
  }

  // ─── Net Pay box ─────────────────────────────────────────────────────────
  const npH = 18;
  doc.setFillColor(...C_PRIMARY);
  doc.roundedRect(ML, y, CW, npH, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(185, 205, 235);
  doc.text("NET PAY (TAKE HOME)", ML + 6, y + 7);

  // Net pay amount — right-aligned within the box with safe margin
  const netPayStr = fmt(salary.pending, sc);
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(netPayStr, ML + CW - 6, y + 12, { align: "right" });

  // Summary line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(165, 190, 225);
  const summaryLine = totalDeductions > 0
    ? `Earnings ${fmt(salary.netPayNum, sc)}  -  Deductions ${fmt(totalDeductions, sc)}`
    : `Total Earnings ${fmt(salary.netPayNum, sc)}`;
  doc.text(summaryLine, ML + 6, y + 14);

  y += npH + 6;

  // ─── Footer ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...C_MID);
  doc.setLineWidth(0.2);
  doc.line(ML, y, ML + CW, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C_MID);
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`, ML, y);
  doc.text("This is a computer-generated document and does not require a physical signature.", pageW / 2, y, { align: "center" });

  y += 14;
  doc.setLineWidth(0.3);
  doc.setDrawColor(...C_MID);
  doc.line(ML + CW - 50, y, ML + CW, y);
  doc.setFontSize(7.5);
  doc.text("Authorised Signatory", ML + CW - 50, y + 4);

  doc.save(`SalarySlip_${salary.employeeId}_${salary.month}.pdf`);
}
