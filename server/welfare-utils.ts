export interface WelfareSettings {
  enabled: boolean;
  contributionType: "Fixed" | "Percentage";
  firstYearAmount: number;
  afterFirstYearAmount: number;
}

export function parseWelfareSettings(settingsArray: { key: string; value: string }[]): WelfareSettings {
  const map: Record<string, string> = {};
  settingsArray.forEach((s) => { map[s.key] = s.value; });
  try {
    const parsed = JSON.parse(map.welfareSettings || "{}");
    return {
      enabled: parsed?.enabled ?? false,
      contributionType: parsed?.contributionType ?? "Fixed",
      firstYearAmount: Number(parsed?.firstYearAmount) || 0,
      afterFirstYearAmount: Number(parsed?.afterFirstYearAmount) || 0,
    };
  } catch {
    return { enabled: false, contributionType: "Fixed", firstYearAmount: 0, afterFirstYearAmount: 0 };
  }
}

export function computeWelfare(
  emp: { welfareEnabled?: boolean | null; basicPay?: string | null; salary?: string | null; joinDate?: string | null },
  salaryMonth: string,
  ws: WelfareSettings
): number {
  if (!ws.enabled || !emp.welfareEnabled) return 0;
  const basicPay = Number(emp.basicPay) || Number(emp.salary) || 0;

  const joinDate = emp.joinDate ? new Date(emp.joinDate) : null;
  let tenureMonths = Infinity;
  if (joinDate && !isNaN(joinDate.getTime())) {
    const [yr, mo] = salaryMonth.split("-").map(Number);
    const salaryDate = new Date(yr, mo - 1, 1);
    tenureMonths =
      (salaryDate.getFullYear() - joinDate.getFullYear()) * 12 +
      (salaryDate.getMonth() - joinDate.getMonth());
  }

  const rate = tenureMonths < 12 ? ws.firstYearAmount : ws.afterFirstYearAmount;

  if (ws.contributionType === "Percentage") {
    return Math.round(basicPay * rate / 100);
  }
  return Math.round(Number(rate));
}
