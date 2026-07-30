import React, { useState } from "react";
import { Transaction, PayrollEntry, Currency, GoalSeekResult } from "../types";
import { formatCurrency, convertToEUR } from "../utils/currency";
import { solveGoalSeek } from "../utils/excelFormulas";
import { X, Target, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

interface GoalSeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  payrolls: PayrollEntry[];
  initialCashEUR: number;
  currency: Currency;
}

export const GoalSeekModal: React.FC<GoalSeekModalProps> = ({
  isOpen,
  onClose,
  transactions,
  payrolls,
  initialCashEUR,
  currency,
}) => {
  const [targetWeek, setTargetWeek] = useState<number>(8);
  const [targetBalanceInput, setTargetBalanceInput] = useState<string>("30000");
  const [variableType, setVariableType] = useState<"accelerate_inflows" | "cut_outflows" | "both">(
    "both"
  );
  const [result, setResult] = useState<GoalSeekResult | null>(null);

  if (!isOpen) return null;

  const handleSolve = (e: React.FormEvent) => {
    e.preventDefault();

    const targetBalanceEUR = convertToEUR(parseFloat(targetBalanceInput) || 0, currency);

    // Compute weekly projections
    const paidInflows = transactions
      .filter((t) => t.type === "inflow" && t.status === "paye")
      .reduce((sum, t) => sum + t.amount, 0);

    const paidOutflows = transactions
      .filter((t) => t.type === "outflow" && t.status === "paye")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentCash = initialCashEUR + paidInflows - paidOutflows;

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

    const weeklyProjections = [];
    for (let w = 1; w <= 13; w++) {
      weeklyProjections.push({
        weekNumber: w,
        inflows: pendingInflows / 10,
        outflows: pendingOutflows / 10,
      });
    }

    const sol = solveGoalSeek(currentCash, weeklyProjections, {
      targetWeek,
      targetBalance: targetBalanceEUR,
      variableType,
    });

    setResult(sol);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-[#161b22]/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-[0_16px_48px_rgba(0,0,0,0.6)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Recherche d'Objectif Excel (Goal Seek)
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSolve} className="space-y-4 text-xs">
          {/* Target Week */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Semaine Cible (Horizon de prévision) :
            </label>
            <select
              value={targetWeek}
              onChange={(e) => setTargetWeek(Number(e.target.value))}
              className="w-full bg-[#0d1117] border border-slate-700/80 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono font-bold"
            >
              {Array.from({ length: 13 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Semaine {w}
                </option>
              ))}
            </select>
          </div>

          {/* Target Balance */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Solde de trésorerie minimal souhaité ({currency}) :
            </label>
            <input
              type="number"
              required
              value={targetBalanceInput}
              onChange={(e) => setTargetBalanceInput(e.target.value)}
              className="w-full bg-[#0d1117] border border-slate-700/80 rounded-xl p-2.5 text-slate-100 font-mono font-black text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Strategy Variable */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Levier d'action privilégié :
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-medium">
                <input
                  type="radio"
                  name="variable"
                  checked={variableType === "both"}
                  onChange={() => setVariableType("both")}
                  className="accent-emerald-500"
                />
                <span>Équilibré : Accélérer ventes (50%) + Réduire dépenses (50%)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-medium">
                <input
                  type="radio"
                  name="variable"
                  checked={variableType === "accelerate_inflows"}
                  onChange={() => setVariableType("accelerate_inflows")}
                  className="accent-emerald-500"
                />
                <span>Commercial : Accélérer les encaissements clients uniquement</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-medium">
                <input
                  type="radio"
                  name="variable"
                  checked={variableType === "cut_outflows"}
                  onChange={() => setVariableType("cut_outflows")}
                  className="accent-emerald-500"
                />
                <span>Économies : Rééchelonner ou couper les décaissements uniquement</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Résoudre l'Objectif (Calculer l'écart)
          </button>
        </form>

        {/* Results Output */}
        {result && (
          <div className="bg-[#0d1117]/90 border border-slate-700/80 rounded-xl p-4 text-xs space-y-3 mt-4">
            <h4 className="font-extrabold text-white border-b border-slate-700/80 pb-2">
              Résultats de la Recherche d'Objectif (Semaine {targetWeek})
            </h4>

            <div className="grid grid-cols-2 gap-2 text-slate-200 font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] font-sans font-bold">Solde Projeté Actuel :</span>
                <span className="font-black text-white">
                  {formatCurrency(result.currentProjectedBalance, currency)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans font-bold">Écart à Combler :</span>
                <span className="font-black text-rose-400">
                  {formatCurrency(result.gap, currency)}
                </span>
              </div>
            </div>

            {result.gap > 0 ? (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-slate-200 font-medium">
                  {result.requiredInflowBoostPercent > 0 && (
                    <div className="text-emerald-400 font-bold">
                      ➔ Augmentation des ventes requise : +{result.requiredInflowBoostPercent}%
                    </div>
                  )}
                  {result.requiredOutflowReductionPercent > 0 && (
                    <div className="text-rose-400 font-bold">
                      ➔ Baisse des dépenses requise : -{result.requiredOutflowReductionPercent}%
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-slate-200 text-[11px]">
                  <strong className="text-white">Recommandations :</strong>
                  {result.suggestedActions.map((act, i) => (
                    <div key={i} className="flex items-start gap-1.5 font-medium">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Objectif atteint sans modification !
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
