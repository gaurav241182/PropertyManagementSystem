import { useQuery } from "@tanstack/react-query";

export function useHotelSettings() {
  const { data: settingsData = {} } = useQuery<Record<string, string>>({ queryKey: ['/api/settings'] });

  const checkInTime = settingsData.checkInTime || "14:00";
  const checkOutTime = settingsData.checkOutTime || "11:00";

  const ageRuleAdult = parseInt(settingsData.ageRuleAdult || "13");
  const ageRuleChild = parseInt(settingsData.ageRuleChild || "3");
  const ageRuleInfant = parseInt(settingsData.ageRuleInfant || "2");

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
  };
}
