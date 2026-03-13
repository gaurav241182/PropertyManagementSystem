import cron from "node-cron";
import { storage } from "./storage";
import { getResendClient } from "./resend";
import { generateInvoicePDF, hasAnyTaxableItems } from "./invoice-generator";
import type { Booking, BookingCharge, RoomType, Room } from "@shared/schema";

const MAX_EMAIL_SIZE_BYTES = 3.5 * 1024 * 1024;

let schedulerTask: cron.ScheduledTask | null = null;

interface InvoiceSettings {
  taxableItems: { room: boolean; food: boolean; facility: boolean; other: boolean };
  taxRates: { room: number; food: number; facility: number; other: number };
}

async function getHotelSettings(): Promise<{
  hotelName: string; hotelAddress: string; hotelPhone: string; hotelEmail: string; hotelGst: string;
  currency: string; invoiceSettings: InvoiceSettings; taxReportingEmails: string[]; schedulerEnabled: boolean; schedulerDay: number;
}> {
  const allSettings = await storage.getSettings();
  const settingsMap: Record<string, string> = {};
  allSettings.forEach(s => { settingsMap[s.key] = s.value; });

  let invoiceSettings: InvoiceSettings;
  try {
    const parsed = JSON.parse(settingsMap.invoiceSettings || '{}');
    invoiceSettings = {
      taxableItems: {
        room: parsed?.taxableItems?.room ?? true,
        food: parsed?.taxableItems?.food ?? true,
        facility: parsed?.taxableItems?.facility ?? true,
        other: parsed?.taxableItems?.other ?? false,
      },
      taxRates: {
        room: parsed?.taxRates?.room ?? 12,
        food: parsed?.taxRates?.food ?? 5,
        facility: parsed?.taxRates?.facility ?? 18,
        other: parsed?.taxRates?.other ?? 0,
      },
    };
  } catch {
    invoiceSettings = {
      taxableItems: { room: true, food: true, facility: true, other: false },
      taxRates: { room: 12, food: 5, facility: 18, other: 0 },
    };
  }

  let taxReportingEmails: string[] = [];
  try {
    taxReportingEmails = JSON.parse(settingsMap.taxReportingEmails || '[]');
  } catch {
    taxReportingEmails = [];
  }

  return {
    hotelName: settingsMap.hotelName || "Hotel",
    hotelAddress: settingsMap.hotelAddress || "",
    hotelPhone: settingsMap.hotelPhone || "",
    hotelEmail: settingsMap.hotelEmail || "",
    hotelGst: settingsMap.gstNumber || "",
    currency: settingsMap.currency || "USD",
    invoiceSettings,
    taxReportingEmails,
    schedulerEnabled: settingsMap.taxSchedulerEnabled === "true",
    schedulerDay: parseInt(settingsMap.taxSchedulerDay || "1") || 1,
  };
}

function getCurrencySymbol(code: string): string {
  const map: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", AUD: "A$", CAD: "C$",
    CHF: "CHF", CNY: "¥", KRW: "₩", SGD: "S$", AED: "د.إ", SAR: "﷼",
    THB: "฿", MYR: "RM", PHP: "₱", IDR: "Rp", BRL: "R$", MXN: "Mex$",
  };
  return map[code] || code;
}

export async function runTaxInvoiceJob(startDate: string, endDate: string, jobType: "manual" | "scheduled"): Promise<{ logId: number; success: boolean; message: string }> {
  const logRecord = await storage.createInvoiceSchedulerLog({
    jobType,
    startDate,
    endDate,
    totalInvoices: 0,
    emailsSent: 0,
    status: "running",
    errorMessage: null,
  });

  try {
    const hotelSettings = await getHotelSettings();
    const { taxReportingEmails, invoiceSettings } = hotelSettings;

    if (taxReportingEmails.length === 0) {
      await storage.updateInvoiceSchedulerLog(logRecord.id, {
        status: "failed",
        errorMessage: "No recipient email addresses configured in tax reporting settings.",
      });
      return { logId: logRecord.id, success: false, message: "No recipient emails configured." };
    }

    const checkedOutBookings = await storage.getCheckedOutBookingsInRange(startDate, endDate);
    const allCharges = await storage.getAllBookingCharges();
    const allRoomTypes = await storage.getRoomTypes();
    const allRooms = await storage.getRooms();
    const cs = getCurrencySymbol(hotelSettings.currency);

    const chargesByBooking: Record<string, BookingCharge[]> = {};
    for (const charge of allCharges) {
      if (!chargesByBooking[charge.bookingId]) chargesByBooking[charge.bookingId] = [];
      chargesByBooking[charge.bookingId].push(charge);
    }

    const taxableInvoices: { booking: Booking; html: string }[] = [];

    for (const booking of checkedOutBookings) {
      const charges = chargesByBooking[booking.bookingId] || [];
      const roomType = allRoomTypes.find(rt => rt.id === booking.roomTypeId);
      const room = allRooms.find(r => r.id === booking.roomId);

      if (!hasAnyTaxableItems(charges, invoiceSettings)) continue;

      const pdfBuffer = await generateInvoicePDF({
        booking,
        charges,
        roomType,
        room,
        hotelName: hotelSettings.hotelName,
        hotelAddress: hotelSettings.hotelAddress,
        hotelPhone: hotelSettings.hotelPhone,
        hotelEmail: hotelSettings.hotelEmail,
        hotelGst: hotelSettings.hotelGst,
        currency: hotelSettings.currency,
        currencySymbol: cs,
        invoiceSettings,
      });

      taxableInvoices.push({ booking, pdfBuffer });
    }

    if (taxableInvoices.length === 0) {
      await storage.updateInvoiceSchedulerLog(logRecord.id, {
        totalInvoices: 0,
        emailsSent: 0,
        status: "success",
        errorMessage: "No taxable invoices found for the selected period.",
      });
      return { logId: logRecord.id, success: true, message: "No taxable invoices found." };
    }

    const batches = splitIntoBatches(taxableInvoices);

    let emailsSent = 0;
    const errors: string[] = [];

    let resendClient: any;
    let fromEmail: string;
    try {
      const resend = await getResendClient();
      resendClient = resend.client;
      fromEmail = resend.fromEmail;
    } catch (err: any) {
      await storage.updateInvoiceSchedulerLog(logRecord.id, {
        totalInvoices: taxableInvoices.length,
        emailsSent: 0,
        status: "failed",
        errorMessage: `Resend not configured: ${err.message}`,
      });
      return { logId: logRecord.id, success: false, message: `Resend not configured: ${err.message}` };
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const dateLabel = batches.length > 1
        ? ` (Part ${i + 1}/${batches.length})`
        : "";

      const attachments = batch.map(inv => ({
        filename: `${(inv.booking.bookingId || "").replace("BK", "INV")}.pdf`,
        content: inv.pdfBuffer.toString('base64'),
        contentType: 'application/pdf',
      }));

      const subject = `Tax Invoices: ${startDate} to ${endDate}${dateLabel} — ${hotelSettings.hotelName}`;
      const bodyHtml = `
        <h2>Tax Invoice Report${dateLabel}</h2>
        <p><strong>Hotel:</strong> ${hotelSettings.hotelName}</p>
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        <p><strong>Invoices Attached:</strong> ${batch.length}</p>
        <p>Please find the attached tax invoices for your records.</p>
        <hr/>
        <p style="color:#888;font-size:12px;">This is an automated email from the hotel management system.</p>
      `;

      try {
        console.log(`[Tax Scheduler] Sending email batch ${i + 1}/${batches.length} from="${fromEmail}" to=${JSON.stringify(taxReportingEmails)} attachments=${batch.length}`);
        const sendResult = await resendClient.emails.send({
          from: fromEmail,
          to: taxReportingEmails,
          subject,
          html: bodyHtml,
          attachments,
        });
        console.log(`[Tax Scheduler] Resend API response:`, JSON.stringify(sendResult));
        if (sendResult?.error) {
          errors.push(`Email ${i + 1} failed: ${sendResult.error.message || JSON.stringify(sendResult.error)}`);
        } else {
          emailsSent++;
        }
      } catch (err: any) {
        console.error(`[Tax Scheduler] Email ${i + 1} exception:`, err);
        errors.push(`Email ${i + 1} failed: ${err.message}`);
      }
    }

    const finalStatus = errors.length === 0 && emailsSent > 0 ? "success" : (emailsSent > 0 ? "partial" : "failed");
    console.log(`[Tax Scheduler] Final: status=${finalStatus}, emailsSent=${emailsSent}, errors=${JSON.stringify(errors)}`);
    await storage.updateInvoiceSchedulerLog(logRecord.id, {
      totalInvoices: taxableInvoices.length,
      emailsSent,
      status: finalStatus,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
    });

    return {
      logId: logRecord.id,
      success: finalStatus !== "failed",
      message: `Processed ${taxableInvoices.length} invoices, sent ${emailsSent} email(s).${errors.length > 0 ? " Errors: " + errors.join("; ") : ""}`,
    };
  } catch (err: any) {
    await storage.updateInvoiceSchedulerLog(logRecord.id, {
      status: "failed",
      errorMessage: err.message || "Unknown error",
    });
    return { logId: logRecord.id, success: false, message: err.message || "Unknown error" };
  }
}

function splitIntoBatches(invoices: { booking: Booking; pdfBuffer: Buffer }[]): { booking: Booking; pdfBuffer: Buffer }[][] {
  const batches: { booking: Booking; pdfBuffer: Buffer }[][] = [];
  let currentBatch: { booking: Booking; pdfBuffer: Buffer }[] = [];
  let currentSize = 0;

  for (const inv of invoices) {
    const base64Size = Math.ceil(inv.pdfBuffer.length * 4 / 3);

    if (currentBatch.length > 0 && currentSize + base64Size > MAX_EMAIL_SIZE_BYTES) {
      batches.push(currentBatch);
      currentBatch = [];
      currentSize = 0;
    }
    currentBatch.push(inv);
    currentSize += base64Size;
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }
  return batches;
}

export async function startScheduler() {
  await refreshScheduler();
}

export async function refreshScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
  }

  try {
    const hotelSettings = await getHotelSettings();
    if (!hotelSettings.schedulerEnabled) {
      console.log("[Tax Scheduler] Scheduler is disabled.");
      return;
    }

    const day = Math.min(Math.max(hotelSettings.schedulerDay, 1), 28);
    const cronExpression = `0 2 ${day} * *`;

    schedulerTask = cron.schedule(cronExpression, async () => {
      console.log("[Tax Scheduler] Running scheduled monthly tax invoice job...");
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrev = new Date(now.getFullYear(), now.getMonth(), 0);
      const startDate = prevMonth.toISOString().split("T")[0];
      const endDate = lastDayPrev.toISOString().split("T")[0];
      const result = await runTaxInvoiceJob(startDate, endDate, "scheduled");
      console.log(`[Tax Scheduler] Job completed: ${result.message}`);
    });

    console.log(`[Tax Scheduler] Scheduler enabled. Runs on day ${day} of each month at 2:00 AM.`);
  } catch (err: any) {
    console.error("[Tax Scheduler] Failed to start scheduler:", err.message);
  }
}
