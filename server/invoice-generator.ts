import type { Booking, BookingCharge, RoomType, Room } from "@shared/schema";

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
