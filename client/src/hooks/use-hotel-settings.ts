import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$",
  JPY: "¥", CNY: "¥", AED: "د.إ", SGD: "S$", MYR: "RM", THB: "฿",
  KRW: "₩", BRL: "R$", ZAR: "R", RUB: "₽", CHF: "CHF", SEK: "kr",
  NZD: "NZ$", HKD: "HK$", PHP: "₱", IDR: "Rp", MXN: "MX$",
};

export const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Sao_Paulo", label: "Brasilia (South America)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris / Berlin (CET)" },
  { value: "Europe/Moscow", label: "Moscow (MSK)" },
  { value: "Africa/Cairo", label: "Cairo (EET)" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Dhaka", label: "Dhaka (BST)" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Seoul", label: "Korea Standard Time (KST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST)" },
];

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode?.toUpperCase()] || currencyCode || "$";
}

export function useHotelSettings() {
  const { data: settingsData = {} } = useQuery<Record<string, string>>({ queryKey: ['/api/settings'] });

  const checkInTime = settingsData.checkInTime || "14:00";
  const checkOutTime = settingsData.checkOutTime || "11:00";

  const ageRuleAdult = parseInt(settingsData.ageRuleAdult || "13");
  const ageRuleChild = parseInt(settingsData.ageRuleChild || "3");
  const ageRuleInfant = parseInt(settingsData.ageRuleInfant || "2");

  const currency = settingsData.currency || "USD";
  const currencySymbol = getCurrencySymbol(currency);

  const timezone = settingsData.timezone || "UTC";

  const weekendDays: number[] = (() => {
    try {
      return JSON.parse(settingsData.weekendDays || "[0,6]");
    } catch {
      return [0, 6];
    }
  })();

  const isWeekendDay = (date: Date): boolean => {
    return weekendDays.includes(date.getDay());
  };

  const formatTime12h = (time24: string): string => {
    const [h, m] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const formatCurrency = useCallback((amount: number, decimals: number = 2): string => {
    return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }, [currencySymbol]);

  const formatDate = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  }, [timezone]);

  const formatDateTime = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }, [timezone]);

  const formatTime = useCallback((date: Date | string | null | undefined): string => {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return d.toLocaleTimeString();
    }
  }, [timezone]);

  return {
    checkInTime,
    checkOutTime,
    checkInTimeFormatted: formatTime12h(checkInTime),
    checkOutTimeFormatted: formatTime12h(checkOutTime),
    ageRuleAdult,
    ageRuleChild,
    ageRuleInfant,
    weekendDays,
    isWeekendDay,
    currency,
    currencySymbol,
    formatCurrency,
    timezone,
    formatDate,
    formatDateTime,
    formatTime,
  };
}
