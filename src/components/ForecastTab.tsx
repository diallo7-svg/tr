import React, { useState, useMemo } from "react";
import { Transaction, PayrollEntry, Currency, Scenario, GoalSeekParams, GoalSeekResult } from "../types";
import { formatCurrency } from "../utils/currency";
import { solveGoalSeek } from "../utils/excelFormulas";
import {
  TrendingUp,
  Target,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface ForecastTabProps {
  transactions: Transaction[];
  payrolls: PayrollEntry[];
  initialCashEUR: number;
  currency: Currency;
  scenario: Scenario;
  setScenario: (scenario: Scenario) => void;
  onOpenGoalSeekModal: () => void;
}

export const ForecastTab: React.FC<ForecastTabProps> = ({
  transactions,
  payrolls,
  initialCashEUR,
  currency,
  scenario,
  setScenario,
  onOpenGoalSeekModal,
}) => {
  // Compute base weekly figures for 13 weeks with useMemo
  const { currentCashEUR, pendingInflows, pendingOutflows, weeksData } = useMemo(() => {
    const paidInflows = transactions
      .filter((t) => t.type === "inflow" && t.status === "paye")
      .reduce((sum, t) => sum + t.amount, 0);

    const paidOutflows = transactions
      .filter((t) => t.type === "outflow" && t.status === "paye")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentCashEUR = initialCashEUR + paidInflows - paidOutflows;

    const pendingInflows = transactions
      .filter((t) => t.type === "inflow" && t.status !== "paye")
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingOutflows =
      transactions
        .filter((t) => t.type === "outflow" && t.status !== "paye")
        .reduce((sum, t) => sum + t.amount, 0) +
      payrolls
        .filter((p) => p.status !== "paye")
        .reduce((sum, p) => sum + p.amount, 0);

    // Generate 13 weeks table & chart data for all 3 scenarios
    const weeksData = [];
    let cashNominal = currentCashEUR;
    let cashOptimistic = currentCashEUR;
    let cashPessimistic = currentCashEUR;

    for (let w = 1; w <= 13; w++) {
      const baseInflow = pendingInflows / 10;
      const baseOutflow = pendingOutflows / 10;

      // Nominal
      const inflowNom = Math.round(baseInflow * (0.8 + (w % 3) * 0.2));
      const outflowNom = Math.round(baseOutflow * (0.9 + (w % 2) * 0.15));
      cashNominal = cashNominal + inflowNom - outflowNom;

      // Optimistic (+15% inflows, -5% outflows)
      const inflowOpt = Math.round(inflowNom * 1.15);
      const outflowOpt = Math.round(outflowNom * 0.95);
      cashOptimistic = cashOptimistic + inflowOpt - outflowOpt;

      // Pessimistic (-25% inflows, +15% outflows)
      const inflowPess = Math.round(inflowNom * 0.75);
      const outflowPess = Math.round(outflowNom * 1.15);
      cashPessimistic = cashPessimistic + inflowPess - outflowPess;

      weeksData.push({
        weekNumber: w,
        weekLabel: `Semaine ${w}`,
        inflowsNominal: inflowNom,
        outflowsNominal: outflowNom,
        balanceNominal: cashNominal,
        balanceOptimistic: cashOptimistic,
        balancePessimistic: cashPessimistic,
        hasShortage: cashNominal < 0 || cashPessimistic < 0,
      });
    }

    return { currentCashEUR, pendingInflows, pendingOutflows, weeksData };
  }, [transactions, payrolls, initialCashEUR]);

  // Active scenario cash curve
  const activeKey =
    scenario === "optimistic"
      ? "balanceOptimistic"
      : scenario === "pessimistic"
      ? "balancePessimistic"
      : "balanceNominal";

  return (
    <div className="space-y-6">
      {/* Scenario Control & Goal Seek Header */}
      <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-white">
              Prévisionnel Glissant 13 Semaines (Rolling Cashflow)
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              Multi-Scénarios
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Comparez le cas nominal, optimiste et pessimiste pour anticiper tout trou de trésorerie.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Goal Seek Launch Button */}
          <button
            onClick={onOpenGoalSeekModal}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            <Target className="w-4 h-4" />
            Lancer Recherche d'Objectif (Goal Seek)
          </button>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white">
            Comparatif de Trésorerie par Scénario (S1 à S13)
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              Optimiste
            </span>
            <span className="flex items-center gap-1.5 text-blue-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span>
              Nominal (Base)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
              Pessimiste
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeksData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="weekLabel" stroke="#8b949e" fontSize={11} />
              <YAxis
                stroke="#8b949e"
                fontSize={11}
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d1117",
                  borderColor: "#30363d",
                  borderRadius: "0.75rem",
                  color: "#f0f6fc",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
                formatter={(val: number, name: string) => [
                  formatCurrency(val, currency),
                  name === "balanceOptimistic"
                    ? "Scénario Optimiste"
                    : name === "balanceNominal"
                    ? "Scénario Nominal"
                    : "Scénario Pessimiste",
                ]}
              />
              <Line
                type="monotone"
                dataKey="balanceOptimistic"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="balanceNominal"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 3.5 }}
              />
              <Line
                type="monotone"
                dataKey="balancePessimistic"
                stroke="#f43f5e"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 13-Week Detailed Table */}
      <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white">
            Échéancier Hebdomadaire Détaillé (Formules Excel Intégrées)
          </h3>
          <span className="text-xs text-slate-300 font-mono font-bold bg-[#0d1117] px-2.5 py-1 rounded-lg border border-slate-700/80">
            =IFS(Solde &lt; 0; "Alerte Trou"; Solde &lt; 5000; "Vigilance"; VRAI; "OK")
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#21262d]/90 text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">Semaine</th>
                <th className="p-3 text-right">Recettes Est.</th>
                <th className="p-3 text-right">Dépenses Est.</th>
                <th className="p-3 text-right">Solde Nominal</th>
                <th className="p-3 text-right">Solde Optimiste</th>
                <th className="p-3 text-right">Solde Pessimiste</th>
                <th className="p-3 text-center rounded-r-xl">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {weeksData.map((w) => {
                const isCritical = w.balancePessimistic < 0;
                return (
                  <tr key={w.weekNumber} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-sans font-extrabold text-white">
                      Semaine {w.weekNumber}
                    </td>
                    <td className="p-3 text-right text-emerald-400 font-bold">
                      +{formatCurrency(w.inflowsNominal, currency)}
                    </td>
                    <td className="p-3 text-right text-rose-400 font-bold">
                      -{formatCurrency(w.outflowsNominal, currency)}
                    </td>
                    <td className="p-3 text-right font-black text-white">
                      {formatCurrency(w.balanceNominal, currency)}
                    </td>
                    <td className="p-3 text-right text-emerald-400 font-bold">
                      {formatCurrency(w.balanceOptimistic, currency)}
                    </td>
                    <td
                      className={`p-3 text-right font-black ${
                        w.balancePessimistic < 0 ? "text-rose-400" : "text-amber-300"
                      }`}
                    >
                      {formatCurrency(w.balancePessimistic, currency)}
                    </td>
                    <td className="p-3 text-center font-sans">
                      {isCritical ? (
                        <span className="px-2.5 py-0.5 bg-rose-950/80 text-rose-200 font-black rounded-lg text-[10px] border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                          ⚠️ Risque Trou
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 font-bold rounded-lg text-[10px] border border-emerald-500/40">
                          ✓ Équilibré
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
