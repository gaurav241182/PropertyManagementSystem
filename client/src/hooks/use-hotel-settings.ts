import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AUD: "A$", CAD: "C$",
  JPY: "¥", CNY: "¥", AED: "د.إ", SGD: "S$", MYR: "RM", THB: "฿",
  KRW: "₩", BRL: "R$", ZAR: "R", RUB: "₽", CHF: "CHF", SEK: "kr",
  NZD: "NZ$", HKD: "HK$", PHP: "₱", IDR: "Rp", MXN: "MX$",
};

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
  };
}
