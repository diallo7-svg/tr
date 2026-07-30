import { Transaction, GoalSeekParams, GoalSeekResult, PayrollEntry, Scenario } from "../types";

/**
 * Generate 13-Week Cashflow Forecast Data
 */
export function generate13WeekForecast(
  transactions: Transaction[],
  payrolls: PayrollEntry[],
  initialCashEUR: number,
  scenario: Scenario = "nominal"
) {
  const weeks = [];
  let currentCash = initialCashEUR;

  const multiplierInflows = scenario === "optimistic" ? 1.15 : scenario === "pessimistic" ? 0.75 : 1.0;
  const multiplierOutflows = scenario === "optimistic" ? 0.95 : scenario === "pessimistic" ? 1.15 : 1.0;

  const startDate = new Date("2026-07-27");

  for (let i = 1; i <= 13; i++) {
    const wStart = new Date(startDate);
    wStart.setDate(startDate.getDate() + (i - 1) * 7);
    const dateStr = wStart.toISOString().split("T")[0];

    // Base mock calculation for demonstration
    const baseInflow = (3500 + (i % 3) * 1200 + (i % 2) * 800) * multiplierInflows;
    const baseOutflow = (2800 + (i % 4) * 900 + (i === 1 || i === 5 || i === 9 ? 2500 : 0)) * multiplierOutflows;

    const net = baseInflow - baseOutflow;
    currentCash += net;

    weeks.push({
      weekIndex: i,
      weekName: `Semaine ${i}`,
      startDate: dateStr,
      inflows: Math.round(baseInflow),
      outflows: Math.round(baseOutflow),
      net: Math.round(net),
      closingCash: Math.round(currentCash),
    });
  }

  return weeks;
}

/**
 * Calculate runway in days based on burn rate
 */
export function calculateRunwayDays(currentCash: number, monthlyOutflows: number): number {
  if (monthlyOutflows <= 0) return 999;
  const dailyBurn = monthlyOutflows / 30;
  return Math.max(0, Math.round(currentCash / dailyBurn));
}

/**
 * EDATE (MOIS.DECALER)
 * Adds/subtracts months to a given YYYY-MM-DD date.
 */
export function EDATE(startDateStr: string, months: number): string {
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return startDateStr;
  
  const currentMonth = date.getMonth();
  date.setMonth(currentMonth + months);
  
  // Handle edge cases like Jan 31 + 1 month -> March 3 (adjust to Feb 28/29)
  if (date.getMonth() !== ((currentMonth + months) % 12 + 12) % 12) {
    date.setDate(0);
  }
  
  return date.toISOString().split("T")[0];
}

/**
 * WORKDAY (SERIE.JOUR.OUVRE)
 * Adds N working days (excluding Saturday & Sunday) to a start date.
 */
export function WORKDAY(startDateStr: string, days: number, holidays: string[] = []): string {
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return startDateStr;
  
  let added = 0;
  const step = days >= 0 ? 1 : -1;
  const absDays = Math.abs(days);

  while (added < absDays) {
    date.setDate(date.getDate() + step);
    const dayOfWeek = date.getDay();
    const dateFormatted = date.toISOString().split("T")[0];
    
    // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.includes(dateFormatted);
    
    if (!isWeekend && !isHoliday) {
      added++;
    }
  }

  return date.toISOString().split("T")[0];
}

/**
 * IFS (SI.MULTIPLE)
 * Evaluates pairs of [condition, value]. Returns the value for the first true condition.
 */
export function IFS<T>(...args: Array<boolean | T>): T | null {
  for (let i = 0; i < args.length; i += 2) {
    const condition = args[i] as boolean;
    const value = args[i + 1] as T;
    if (condition) {
      return value;
    }
  }
  return null;
}

/**
 * Calculate days overdue relative to current date (or reference date)
 */
export function calculateDaysOverdue(dueDateStr: string, refDateStr: string = "2026-07-27"): number {
  const due = new Date(dueDateStr);
  const ref = new Date(refDateStr);
  const diffTime = ref.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * GOAL SEEK SOLVER for 13-Week Cashflow
 * Finds required acceleration of sales or reduction of expenses to reach target cash balance
 */
export function solveGoalSeek(
  initialCash: number,
  weeklyProjections: { weekNumber: number; inflows: number; outflows: number }[],
  params: GoalSeekParams
): GoalSeekResult {
  const { targetWeek, targetBalance, variableType } = params;

  // Calculate projected balance at targetWeek without changes
  let currentCash = initialCash;
  for (let i = 0; i < targetWeek; i++) {
    const w = weeklyProjections[i];
    if (w) {
      currentCash += w.inflows - w.outflows;
    }
  }

  const gap = targetBalance - currentCash;

  if (gap <= 0) {
    return {
      currentProjectedBalance: currentCash,
      gap: 0,
      requiredInflowBoostPercent: 0,
      requiredOutflowReductionPercent: 0,
      suggestedActions: [
        `Votre solde projeté à la Semaine ${targetWeek} (${currentCash.toLocaleString("fr-FR")} €) dépasse déjà votre objectif (${targetBalance.toLocaleString("fr-FR")} €). Aucun ajustement d'urgence n'est requis.`
      ]
    };
  }

  // Goal seek calculation
  // Total cumulative inflows up to targetWeek
  let totalInflows = 0;
  let totalOutflows = 0;
  for (let i = 0; i < targetWeek; i++) {
    const w = weeklyProjections[i];
    if (w) {
      totalInflows += w.inflows;
      totalOutflows += w.outflows;
    }
  }

  let requiredInflowBoostPercent = 0;
  let requiredOutflowReductionPercent = 0;

  if (variableType === "accelerate_inflows") {
    requiredInflowBoostPercent = totalInflows > 0 ? (gap / totalInflows) * 100 : 0;
  } else if (variableType === "cut_outflows") {
    requiredOutflowReductionPercent = totalOutflows > 0 ? (gap / totalOutflows) * 100 : 0;
  } else {
    // Both: 50% gap from sales, 50% gap from costs
    requiredInflowBoostPercent = totalInflows > 0 ? ((gap * 0.5) / totalInflows) * 100 : 0;
    requiredOutflowReductionPercent = totalOutflows > 0 ? ((gap * 0.5) / totalOutflows) * 100 : 0;
  }

  const actions: string[] = [];
  if (gap > 0) {
    if (requiredInflowBoostPercent > 0) {
      actions.push(`Encourager les règlements comptants ou offrir un escompte de 2% pour accélérer +${Math.ceil(gap * (variableType === 'both' ? 0.5 : 1))} € de ventes.`);
    }
    if (requiredOutflowReductionPercent > 0) {
      actions.push(`Négocier un rééchelonnement de +${Math.ceil(gap * (variableType === 'both' ? 0.5 : 1))} € de factures fournisseurs sur 30 jours.`);
    }
    actions.push(`Mettre en place des relances automatisées quotidiennes sur les retards > 7 jours.`);
  }

  return {
    currentProjectedBalance: currentCash,
    gap,
    requiredInflowBoostPercent: Math.round(requiredInflowBoostPercent * 10) / 10,
    requiredOutflowReductionPercent: Math.round(requiredOutflowReductionPercent * 10) / 10,
    suggestedActions: actions
  };
}
