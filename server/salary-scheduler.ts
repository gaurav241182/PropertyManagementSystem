import cron from "node-cron";
import { storage } from "./storage";
import { parseWelfareSettings, computeWelfare } from "./welfare-utils";

let schedulerTask: cron.ScheduledTask | null = null;

export async function runSalaryGenerationJob(
  month: string,
  jobType: "scheduled" | "manual",
  hotelId?: number | null,
  branchId?: number | null
) {
  const log = await storage.createSalarySchedulerLog({
    hotelId: hotelId ?? null,
    branchId: branchId ?? null,
    jobType,
    month,
    totalStaff: 0,
    generated: 0,
    skipped: 0,
    status: "running",
    details: null,
    errorMessage: null,
  });

  try {
    const allStaff = await storage.getStaff(hotelId, branchId);
    const activeStaff = allStaff.filter((s: any) => s.status === "active");
    const existingSalaries = await storage.getSalariesByMonth(month, hotelId, branchId);
    const allSettings = await storage.getSettings(hotelId);
    const ws = parseWelfareSettings(allSettings);

    const generatedList: { staffId: number; name: string; employeeId: string }[] = [];
    const skippedList: { staffId: number; name: string; employeeId: string; reason: string }[] = [];

    for (const emp of activeStaff) {
      const alreadyExists = existingSalaries.find((s: any) => s.staffId === emp.id);
      if (alreadyExists) {
        skippedList.push({
          staffId: emp.id,
          name: emp.name,
          employeeId: emp.employeeId || "",
          reason: "Already generated",
        });
        continue;
      }

      const totalSalary = Number(emp.salary) || 0;
      if (totalSalary <= 0) {
        skippedList.push({
          staffId: emp.id,
          name: emp.name,
          employeeId: emp.employeeId || "",
          reason: "No salary configured",
        });
        continue;
      }

      const basicPay = Number(emp.basicPay) || totalSalary;
      const bonusAmt = Number(emp.bonusAmount) || 0;
      const welfareAmount = computeWelfare(emp, month, ws);
      const [year, mon] = month.split("-").map(Number);
      const lastDay = new Date(year, mon, 0);
      const dueDateStr = lastDay.toISOString().split("T")[0];

      const activeAdvances = await storage.getActiveStaffAdvances(emp.id);
      let totalInstalmentDeduction = 0;
      let totalRemainingBalance = 0;
      for (const adv of activeAdvances) {
        const startMon = adv.instalmentStartMonth || "";
        const shouldDeduct = !startMon || month >= startMon;
        if (shouldDeduct) totalInstalmentDeduction += Number(adv.instalmentAmount) || 0;
        totalRemainingBalance += Number(adv.remainingBalance) || 0;
      }
      await storage.createSalary({
        staffId: emp.id,
        month,
        basicSalary: String(totalSalary),
        bonus: String(bonusAmt),
        deductions: "0",
        welfareContribution: String(welfareAmount),
        netPay: String(totalSalary + bonusAmt),
        advanceAmount: String(totalRemainingBalance),
        instalmentDeduction: String(totalInstalmentDeduction),
        dueDate: dueDateStr,
        status: "Pending",
        paidDate: null,
        hotelId: hotelId ?? null,
        branchId: branchId ?? null,
      });

      for (const adv of activeAdvances) {
        const startMon = adv.instalmentStartMonth || "";
        const shouldDeduct = !startMon || month >= startMon;
        if (!shouldDeduct) continue;
        const instalmentAmt = Number(adv.instalmentAmount) || 0;
        const newBalance = Math.max(0, Number(adv.remainingBalance) - instalmentAmt);
        const newRemaining = Math.max(0, Number(adv.remainingInstalments) - 1);
        await storage.updateStaffAdvance(adv.id, {
          remainingBalance: String(newBalance),
          remainingInstalments: newRemaining,
          status: newBalance <= 0 || newRemaining <= 0 ? "Completed" : "Active",
        });
      }

      generatedList.push({
        staffId: emp.id,
        name: emp.name,
        employeeId: emp.employeeId || "",
      });
    }

    const details = JSON.stringify({ generated: generatedList, skipped: skippedList });

    await storage.updateSalarySchedulerLog(log.id, {
      totalStaff: activeStaff.length,
      generated: generatedList.length,
      skipped: skippedList.length,
      status: "success",
      details,
    });

    return {
      success: true,
      totalStaff: activeStaff.length,
      generated: generatedList.length,
      skipped: skippedList.length,
      message: `Generated ${generatedList.length} salary records, skipped ${skippedList.length}.`,
    };
  } catch (err: any) {
    await storage.updateSalarySchedulerLog(log.id, {
      status: "failed",
      errorMessage: err.message || "Unknown error",
    });
    return { success: false, message: err.message || "Failed to generate salaries" };
  }
}

export async function startSalaryScheduler() {
  await refreshSalaryScheduler();
}

export async function refreshSalaryScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
  }

  try {
    const allSettings = await storage.getSettings();
    const settingsMap: Record<string, string> = {};
    allSettings.forEach((s) => { settingsMap[s.key] = s.value; });

    const enabled = settingsMap.salarySchedulerEnabled === "true";
    if (!enabled) {
      console.log("[Salary Scheduler] Scheduler is disabled.");
      return;
    }

    const day = Math.min(Math.max(parseInt(settingsMap.salarySchedulerDay || "1"), 1), 28);
    const cronExpression = `0 1 ${day} * *`;

    schedulerTask = cron.schedule(cronExpression, async () => {
      console.log("[Salary Scheduler] Running scheduled monthly salary generation...");
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const result = await runSalaryGenerationJob(month, "scheduled");
      console.log(`[Salary Scheduler] Job completed: ${result.message}`);
    });

    console.log(`[Salary Scheduler] Scheduler enabled. Runs on day ${day} of each month at 1:00 AM.`);
  } catch (err: any) {
    console.error("[Salary Scheduler] Failed to start scheduler:", err.message);
  }
}
