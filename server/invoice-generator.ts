import type { Booking, BookingCharge, RoomType, Room } from "@shared/schema";
import PDFDocument from "pdfkit";

interface InvoiceSettings {
  taxableItems: { room: boolean; food: boolean; facility: boolean; other: boolean };
  taxRates: { room: number; food: number; facility: number; other: number };
}

interface InvoiceData {
  booking: Booking;
  charges: BookingCharge[];
  roomType: RoomType | undefined;
  room: Room | undefined;
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  hotelEmail: string;
  hotelGst: string;
  currency: string;
  currencySymbol: string;
  invoiceSettings: InvoiceSettings;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", AUD: "A$", CAD: "C$",
  CHF: "CHF", CNY: "¥", KRW: "₩", SGD: "S$", HKD: "HK$", NZD: "NZ$",
  SEK: "kr", NOK: "kr", DKK: "kr", ZAR: "R", BRL: "R$", MXN: "Mex$",
  AED: "د.إ", SAR: "﷼", THB: "฿", MYR: "RM", PHP: "₱", IDR: "Rp", VND: "₫",
};

function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}

function getTaxRate(category: string, invoiceSettings: InvoiceSettings): number {
  if (category === "Room") return invoiceSettings.taxRates.room;
  if (category === "Food") return invoiceSettings.taxRates.food;
  if (category === "Facility") return invoiceSettings.taxRates.facility;
  if (category === "Other") return invoiceSettings.taxRates.other;
  return 0;
}

function isCategoryTaxable(category: string, invoiceSettings: InvoiceSettings): boolean {
  if (category === "Room") return invoiceSettings.taxableItems.room;
  if (category === "Food") return invoiceSettings.taxableItems.food;
  if (category === "Facility") return invoiceSettings.taxableItems.facility;
  if (category === "Other") return invoiceSettings.taxableItems.other;
  return false;
}

export function hasAnyTaxableItems(charges: BookingCharge[], invoiceSettings: InvoiceSettings): boolean {
  const roomChargeTaxable = invoiceSettings.taxableItems.room && invoiceSettings.taxRates.room > 0;
  const hasChargesTaxable = charges.some(c => isCategoryTaxable(c.category, invoiceSettings) && getTaxRate(c.category, invoiceSettings) > 0);
  return roomChargeTaxable || hasChargesTaxable;
}

function computeInvoiceData(data: InvoiceData) {
  const { booking, charges, roomType, room, hotelName, hotelAddress, hotelPhone, hotelEmail, hotelGst, currency, invoiceSettings } = data;
  const cs = getCurrencySymbol(currency);
  const invoiceNo = (booking.bookingId || "").replace("BK", "INV");
  const nights = booking.nights || Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 3600 * 24));
  const invoiceDate = booking.checkedOutAt ? new Date(booking.checkedOutAt).toLocaleDateString(undefined, { dateStyle: "long" }) : new Date().toLocaleDateString(undefined, { dateStyle: "long" });
  const roomTypeName = roomType?.name || "";
  const roomNumber = room?.roomNumber || "";

  const roomAmount = parseFloat(booking.totalAmount || "0");
  const chargeRows = [
    { desc: `Room Charges - ${roomTypeName} (${nights} Night${nights !== 1 ? "s" : ""})`, amount: roomAmount, category: "Room" },
    ...charges.map(c => ({ desc: `${c.category}: ${c.description}`, amount: parseFloat(c.amount || "0"), category: c.category }))
  ];
  const subtotal = chargeRows.reduce((s, r) => s + r.amount, 0);

  const taxBreakdown: { label: string; rate: number; amount: number; taxable: boolean }[] = [];
  const roomTaxRate = getTaxRate("Room", invoiceSettings);
  const isRoomTaxable = invoiceSettings.taxableItems.room && roomTaxRate > 0;
  if (isRoomTaxable) {
    taxBreakdown.push({ label: "Room Tax", rate: roomTaxRate, amount: roomAmount * roomTaxRate / 100, taxable: true });
  }
  const categoryTotals: Record<string, number> = {};
  for (const c of charges) {
    categoryTotals[c.category] = (categoryTotals[c.category] || 0) + parseFloat(c.amount || "0");
  }
  for (const [cat, total] of Object.entries(categoryTotals)) {
    const rate = getTaxRate(cat, invoiceSettings);
    const taxable = isCategoryTaxable(cat, invoiceSettings) && rate > 0;
    if (taxable) {
      taxBreakdown.push({ label: `${cat} Tax`, rate, amount: total * rate / 100, taxable: true });
    }
  }

  const taxRows = taxBreakdown.filter(t => t.taxable);
  const totalTax = taxRows.reduce((s, t) => s + t.amount, 0);
  const advanceAmount = parseFloat(booking.advanceAmount || "0");
  const grandTotal = subtotal + totalTax;
  const due = grandTotal - advanceAmount;

  return { cs, invoiceNo, nights, invoiceDate, roomTypeName, roomNumber, roomAmount, chargeRows, subtotal, taxRows, totalTax, advanceAmount, grandTotal, due, hotelName, hotelAddress, hotelPhone, hotelEmail, hotelGst, booking };
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const d = computeInvoiceData(data);
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margins: { top: 40, bottom: 40, left: 50, right: 50 } });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageW = doc.page.width - 100;
      const green = "#1a5632";
      const grey = "#555555";
      const lightGrey = "#888888";

      doc.fontSize(20).fillColor(green).font("Helvetica-Bold").text(d.hotelName, 50, 40, { width: pageW * 0.6 });
      let headerY = doc.y;
      if (d.hotelAddress) { doc.fontSize(9).fillColor(grey).font("Helvetica").text(d.hotelAddress); headerY = doc.y; }
      if (d.hotelPhone) { doc.fontSize(9).text(`Tel: ${d.hotelPhone}`); headerY = doc.y; }
      if (d.hotelEmail) { doc.fontSize(9).text(d.hotelEmail); headerY = doc.y; }
      if (d.hotelGst) { doc.fontSize(9).text(`GSTIN: ${d.hotelGst}`); headerY = doc.y; }

      const rightX = 50 + pageW * 0.6 + 10;
      doc.fontSize(22).fillColor(green).font("Helvetica-Bold").text("INVOICE", rightX, 40, { width: pageW * 0.4 - 10, align: "right" });
      doc.fontSize(10).fillColor(grey).font("Helvetica").text(d.invoiceNo, rightX, doc.y + 2, { width: pageW * 0.4 - 10, align: "right" });
      doc.fontSize(9).text(`Date: ${d.invoiceDate}`, rightX, doc.y + 2, { width: pageW * 0.4 - 10, align: "right" });

      const lineY = Math.max(headerY, doc.y) + 10;
      doc.moveTo(50, lineY).lineTo(50 + pageW, lineY).strokeColor(green).lineWidth(2).stroke();

      let y = lineY + 16;
      const boxW = (pageW - 20) / 2;

      doc.save();
      doc.roundedRect(50, y, boxW, 80, 4).fillAndStroke("#f8faf9", "#e5e7eb");
      doc.restore();
      doc.fontSize(8).fillColor(lightGrey).font("Helvetica-Bold").text("BILL TO", 64, y + 10);
      doc.fontSize(10).fillColor("#1a1a1a").font("Helvetica-Bold").text(`${d.booking.guestName} ${d.booking.guestLastName || ""}`, 64, y + 24);
      doc.font("Helvetica").fontSize(9).fillColor(grey);
      if (d.booking.guestEmail) doc.text(d.booking.guestEmail, 64, y + 38);
      if (d.booking.guestPhone) doc.text(d.booking.guestPhone, 64, y + 50);

      const box2X = 50 + boxW + 20;
      doc.save();
      doc.roundedRect(box2X, y, boxW, 80, 4).fillAndStroke("#f8faf9", "#e5e7eb");
      doc.restore();
      doc.fontSize(8).fillColor(lightGrey).font("Helvetica-Bold").text("STAY DETAILS", box2X + 14, y + 10);
      doc.fontSize(9).fillColor("#1a1a1a").font("Helvetica");
      doc.text(`Room: ${d.roomNumber} - ${d.roomTypeName}`, box2X + 14, y + 24);
      doc.text(`Check-in: ${d.booking.checkIn}`, box2X + 14, y + 36);
      doc.text(`Check-out: ${d.booking.checkOut}`, box2X + 14, y + 48);
      doc.text(`Duration: ${d.nights} Night${d.nights !== 1 ? "s" : ""}`, box2X + 14, y + 60);

      y += 100;

      const colWidths = [35, pageW - 135, 100];
      const colX = [50, 85, 50 + pageW - 100];

      doc.save();
      doc.rect(50, y, pageW, 22).fill(green);
      doc.restore();
      doc.fontSize(8).fillColor("#ffffff").font("Helvetica-Bold");
      doc.text("#", colX[0] + 8, y + 7);
      doc.text("DESCRIPTION", colX[1] + 8, y + 7);
      doc.text(`AMOUNT (${d.cs})`, colX[2], y + 7, { width: colWidths[2], align: "right" });
      y += 22;

      doc.font("Helvetica").fontSize(9).fillColor("#1a1a1a");
      d.chargeRows.forEach((row, i) => {
        if (i % 2 === 1) {
          doc.save();
          doc.rect(50, y, pageW, 20).fill("#f9f9f9");
          doc.restore();
          doc.fillColor("#1a1a1a");
        }
        doc.text(`${i + 1}`, colX[0] + 8, y + 5);
        doc.text(row.desc, colX[1] + 8, y + 5, { width: colWidths[1] - 16 });
        doc.text(row.amount.toFixed(2), colX[2], y + 5, { width: colWidths[2], align: "right" });
        y += 20;
      });

      doc.moveTo(50, y).lineTo(50 + pageW, y).strokeColor("#eeeeee").lineWidth(0.5).stroke();
      y += 8;

      const totalsX = 50 + pageW - 240;
      const totalsW = 240;

      doc.moveTo(totalsX, y).lineTo(totalsX + totalsW, y).strokeColor("#dddddd").lineWidth(0.5).stroke();
      y += 6;
      doc.fontSize(9).fillColor(grey).font("Helvetica");
      doc.text("Subtotal", totalsX, y);
      doc.text(`${d.cs} ${d.subtotal.toFixed(2)}`, totalsX, y, { width: totalsW, align: "right" });
      y += 16;

      d.taxRows.forEach(t => {
        doc.fontSize(8).fillColor(lightGrey);
        doc.text(`${t.label} @ ${t.rate}%`, totalsX + 10, y);
        doc.text(`${d.cs} ${t.amount.toFixed(2)}`, totalsX, y, { width: totalsW, align: "right" });
        y += 14;
      });

      doc.fontSize(9).fillColor(grey);
      doc.text("Total Tax", totalsX, y);
      doc.text(`${d.cs} ${d.totalTax.toFixed(2)}`, totalsX, y, { width: totalsW, align: "right" });
      y += 16;

      if (d.advanceAmount > 0) {
        doc.text("Advance Paid", totalsX, y);
        doc.text(`- ${d.cs} ${d.advanceAmount.toFixed(2)}`, totalsX, y, { width: totalsW, align: "right" });
        y += 16;
      }

      doc.moveTo(totalsX, y).lineTo(totalsX + totalsW, y).strokeColor(green).lineWidth(1.5).stroke();
      y += 8;
      doc.fontSize(14).fillColor(green).font("Helvetica-Bold");
      doc.text("Total Due", totalsX, y);
      doc.text(`${d.cs} ${d.due.toFixed(2)}`, totalsX, y, { width: totalsW, align: "right" });
      y += 20;

      if (d.booking.paymentMethod) {
        doc.fontSize(8).fillColor(lightGrey).font("Helvetica");
        doc.text(`Payment Method: ${d.booking.paymentMethod}`, totalsX, y);
        y += 16;
      }

      y += 30;
      doc.moveTo(50 + pageW - 180, y).lineTo(50 + pageW, y).strokeColor("#cccccc").lineWidth(0.5).stroke();
      doc.fontSize(9).fillColor(lightGrey).font("Helvetica").text("Authorized Signature", 50 + pageW - 180, y + 4);

      y += 30;
      doc.moveTo(50, y).lineTo(50 + pageW, y).strokeColor("#dddddd").lineWidth(0.5).stroke();
      y += 10;
      doc.fontSize(9).fillColor(lightGrey).text("Thank you for staying with us.");
      doc.fontSize(8).text("This is a computer-generated invoice. No signature is required.", 50, doc.y + 3);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const { booking, charges, roomType, room, hotelName, hotelAddress, hotelPhone, hotelEmail, hotelGst, currency, invoiceSettings } = data;
  const cs = getCurrencySymbol(currency);
  const invoiceNo = (booking.bookingId || "").replace("BK", "INV");
  const nights = booking.nights || Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 3600 * 24));
  const invoiceDate = booking.checkedOutAt ? new Date(booking.checkedOutAt).toLocaleDateString(undefined, { dateStyle: "long" }) : new Date().toLocaleDateString(undefined, { dateStyle: "long" });
  const roomTypeName = roomType?.name || "";
  const roomNumber = room?.roomNumber || "";

  const roomAmount = parseFloat(booking.totalAmount || "0");
  const chargeRows = [
    { desc: `Room Charges — ${roomTypeName} (${nights} Night${nights !== 1 ? "s" : ""})`, amount: roomAmount, category: "Room" },
    ...charges.map(c => ({ desc: `${c.category}: ${c.description}`, amount: parseFloat(c.amount || "0"), category: c.category }))
  ];
  const subtotal = chargeRows.reduce((s, r) => s + r.amount, 0);

  const taxBreakdown: { label: string; rate: number; amount: number; taxable: boolean }[] = [];
  const roomTaxRate = getTaxRate("Room", invoiceSettings);
  const isRoomTaxable = invoiceSettings.taxableItems.room && roomTaxRate > 0;
  if (isRoomTaxable) {
    taxBreakdown.push({ label: "Room Tax", rate: roomTaxRate, amount: roomAmount * roomTaxRate / 100, taxable: true });
  }
  const categoryTotals: Record<string, number> = {};
  for (const c of charges) {
    categoryTotals[c.category] = (categoryTotals[c.category] || 0) + parseFloat(c.amount || "0");
  }
  for (const [cat, total] of Object.entries(categoryTotals)) {
    const rate = getTaxRate(cat, invoiceSettings);
    const taxable = isCategoryTaxable(cat, invoiceSettings) && rate > 0;
    if (taxable) {
      taxBreakdown.push({ label: `${cat} Tax`, rate, amount: total * rate / 100, taxable: true });
    }
  }

  const totalTax = taxBreakdown.filter(t => t.taxable).reduce((s, t) => s + t.amount, 0);
  const advanceAmount = parseFloat(booking.advanceAmount || "0");
  const grandTotal = subtotal + totalTax;
  const due = grandTotal - advanceAmount;

  const taxRows = taxBreakdown.filter(t => t.taxable);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${invoiceNo}</title>
<style>
  @page { size: A4; margin: 15mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.5; }
  .invoice { max-width: 800px; margin: 0 auto; padding: 30px 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a5632; padding-bottom: 20px; margin-bottom: 24px; }
  .hotel-info h1 { font-size: 24px; color: #1a5632; margin-bottom: 2px; }
  .hotel-info p { font-size: 11px; color: #666; }
  .invoice-title { text-align: right; }
  .invoice-title h2 { font-size: 28px; font-weight: 700; color: #1a5632; letter-spacing: 2px; text-transform: uppercase; }
  .invoice-title p { font-size: 12px; color: #555; margin-top: 2px; }
  .meta-section { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .meta-box { background: #f8faf9; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 18px; width: 48%; }
  .meta-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 6px; }
  .meta-box p { font-size: 12px; margin-bottom: 1px; }
  .meta-box .val { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead th { background: #1a5632; color: #fff; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: left; }
  thead th:last-child { text-align: right; }
  tbody td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 12px; }
  tbody td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  tbody tr:nth-child(even) { background: #fafafa; }
  .totals { width: 320px; margin-left: auto; margin-bottom: 24px; }
  .totals .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
  .totals .row.sub { border-top: 1px solid #ddd; padding-top: 8px; margin-top: 4px; }
  .totals .row.grand { border-top: 2px solid #1a5632; padding-top: 10px; margin-top: 8px; font-size: 16px; font-weight: 700; color: #1a5632; }
  .totals .row .label { color: #555; }
  .totals .row.tax { font-size: 11px; color: #777; padding-left: 10px; }
  .footer { border-top: 1px solid #ddd; padding-top: 16px; margin-top: 30px; display: flex; justify-content: space-between; }
  .footer-left { font-size: 11px; color: #888; max-width: 55%; }
  .footer-right { text-align: right; font-size: 11px; color: #888; }
  .stamp { margin-top: 40px; text-align: right; }
  .stamp p { font-size: 11px; color: #999; border-top: 1px solid #ccc; display: inline-block; padding-top: 4px; min-width: 180px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="invoice">
  <div class="header">
    <div class="hotel-info">
      <h1>${hotelName}</h1>
      ${hotelAddress ? `<p>${hotelAddress}</p>` : ""}
      ${hotelPhone ? `<p>Tel: ${hotelPhone}</p>` : ""}
      ${hotelEmail ? `<p>${hotelEmail}</p>` : ""}
      ${hotelGst ? `<p>GSTIN: ${hotelGst}</p>` : ""}
    </div>
    <div class="invoice-title">
      <h2>Invoice</h2>
      <p><strong>${invoiceNo}</strong></p>
      <p>Date: ${invoiceDate}</p>
    </div>
  </div>

  <div class="meta-section">
    <div class="meta-box">
      <h4>Bill To</h4>
      <p class="val">${booking.guestName} ${booking.guestLastName || ""}</p>
      ${booking.guestEmail ? `<p>${booking.guestEmail}</p>` : ""}
      ${booking.guestPhone ? `<p>${booking.guestPhone}</p>` : ""}
    </div>
    <div class="meta-box">
      <h4>Stay Details</h4>
      <p>Room: <span class="val">${roomNumber}</span> — ${roomTypeName}</p>
      <p>Check-in: <span class="val">${booking.checkIn}</span></p>
      <p>Check-out: <span class="val">${booking.checkOut}</span></p>
      <p>Duration: <span class="val">${nights} Night${nights !== 1 ? "s" : ""}</span></p>
      <p>Booking ID: <span class="val">${booking.bookingId}</span></p>
    </div>
  </div>

  <table>
    <thead><tr><th>#</th><th>Description</th><th>Amount (${cs})</th></tr></thead>
    <tbody>
      ${chargeRows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.desc}</td><td>${r.amount.toFixed(2)}</td></tr>`).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="row sub"><span class="label">Subtotal</span><span>${cs} ${subtotal.toFixed(2)}</span></div>
    ${taxRows.map(t => `<div class="row tax"><span class="label">${t.label} @ ${t.rate}%</span><span>${cs} ${t.amount.toFixed(2)}</span></div>`).join("")}
    <div class="row"><span class="label">Total Tax</span><span>${cs} ${totalTax.toFixed(2)}</span></div>
    ${advanceAmount > 0 ? `<div class="row"><span class="label">Advance Paid</span><span>- ${cs} ${advanceAmount.toFixed(2)}</span></div>` : ""}
    <div class="row grand"><span>Total Due</span><span>${cs} ${due.toFixed(2)}</span></div>
    ${booking.paymentMethod ? `<div class="row" style="font-size:11px;color:#888;"><span class="label">Payment Method</span><span>${booking.paymentMethod}</span></div>` : ""}
  </div>

  <div class="stamp">
    <p>Authorized Signature</p>
  </div>

  <div class="footer">
    <div class="footer-left">
      <p>Thank you for staying with us.</p>
      <p style="margin-top:4px;">This is a computer-generated invoice. No signature is required.</p>
    </div>
    <div class="footer-right">
      <p>${hotelName}</p>
      ${hotelPhone ? `<p>${hotelPhone}</p>` : ""}
    </div>
  </div>
</div>
</body></html>`;
}
