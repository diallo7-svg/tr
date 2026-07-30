import React, { useMemo } from "react";
import { Transaction, PayrollEntry, Currency } from "../types";
import { formatCurrency } from "../utils/currency";
import { calculateDaysOverdue } from "../utils/excelFormulas";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  AlertCircle,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";

interface AlertsTabProps {
  transactions: Transaction[];
  payrolls: PayrollEntry[];
  initialCashEUR: number;
  currency: Currency;
  onNavigateToRelanceWithTransaction: (transaction: Transaction) => void;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  transactions,
  payrolls,
  initialCashEUR,
  currency,
  onNavigateToRelanceWithTransaction,
}) => {
  // Compute metrics with useMemo for performance
  const {
    currentCashEUR,
    overdueTransactions,
    totalOverdueAmountEUR,
    safetyThresholdEUR,
    gaugePercent,
    gaugeZone,
    runwayDays,
  } = useMemo(() => {
    const paidInflows = transactions
      .filter((t) => t.type === "inflow" && t.status === "paye")
      .reduce((sum, t) => sum + t.amount, 0);

    const paidOutflows = transactions
      .filter((t) => t.type === "outflow" && t.status === "paye")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentCashEUR = initialCashEUR + paidInflows - paidOutflows;

    const overdueTransactions = transactions.filter(
      (t) => t.type === "inflow" && t.status === "en_retard"
    );

    const totalOverdueAmountEUR = overdueTransactions.reduce((s, t) => s + t.amount, 0);

    const safetyThresholdEUR = 20000;
    const criticalThresholdEUR = 8000;

    const gaugePercent = Math.min(
      100,
      Math.max(0, Math.round((currentCashEUR / (safetyThresholdEUR * 2)) * 100))
    );

    let gaugeZone: "crise" | "vigilance" | "securite" = "securite";
    if (currentCashEUR < criticalThresholdEUR) {
      gaugeZone = "crise";
    } else if (currentCashEUR < safetyThresholdEUR) {
      gaugeZone = "vigilance";
    }

    const pendingOutflows =
      transactions
        .filter((t) => t.type === "outflow" && t.status !== "paye")
        .reduce((sum, t) => sum + t.amount, 0) +
      payrolls
        .filter((p) => p.status !== "paye")
        .reduce((sum, p) => sum + p.amount, 0);

    const avgWeeklyOutflow = pendingOutflows / 8 || 1500;
    const runwayDays = Math.round((currentCashEUR / avgWeeklyOutflow) * 7);

    return {
      currentCashEUR,
      overdueTransactions,
      totalOverdueAmountEUR,
      safetyThresholdEUR,
      gaugePercent,
      gaugeZone,
      runwayDays,
    };
  }, [transactions, payrolls, initialCashEUR]);

  return (
    <div className="space-y-6">
      {/* Gauge & Emergency Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jauge de Trésorerie */}
        <div className="lg:col-span-2 bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    Jauge de Sécurité de Trésorerie
                  </h2>
                  <p className="text-xs text-slate-300">
                    Niveau de réserve disponible par rapport au seuil de sécurité
                  </p>
                </div>
              </div>

              <span
                className={`px-3.5 py-1 text-xs font-black rounded-full border shadow-md ${
                  gaugeZone === "crise"
                    ? "bg-rose-950/80 text-rose-200 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                    : gaugeZone === "vigilance"
                    ? "bg-amber-950/80 text-amber-200 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-emerald-950/80 text-emerald-200 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                }`}
              >
                {gaugeZone === "crise"
                  ? "ZONE DE CRISE (Alerte)"
                  : gaugeZone === "vigilance"
                  ? "ZONE DE VIGILANCE"
                  : "ZONE DE SÉCURITÉ"}
              </span>
            </div>

            {/* Visual Bar Gauge */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                <span>0 € (Rupture)</span>
                <span>Seuil Alerte (8k €)</span>
                <span>Seuil Sécurité (20k €)</span>
                <span>40k €+</span>
              </div>

              <div className="h-6 w-full bg-[#0d1117] rounded-full p-1 border border-slate-700/80 relative overflow-hidden flex shadow-inner">
                {/* Visual Segments */}
                <div
                  className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  style={{ width: `${gaugePercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs mt-2.5">
                <span className="text-slate-300 font-medium">
                  Solde actuel :{" "}
                  <strong className="text-white text-sm font-mono font-black bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    {formatCurrency(currentCashEUR, currency)}
                  </strong>
                </span>
                <span className="text-slate-300 font-medium">
                  Besoin mensuel estimé : ~{formatCurrency(safetyThresholdEUR, currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#0d1117]/80 p-3.5 rounded-xl border border-slate-800 shadow-sm">
              <div className="text-slate-400 font-medium">Jours d'autonomie (Runway)</div>
              <div className="text-lg font-black text-white mt-0.5 font-mono">{runwayDays} jours</div>
            </div>
            <div className="bg-[#0d1117]/80 p-3.5 rounded-xl border border-slate-800 shadow-sm">
              <div className="text-slate-400 font-medium">Créances en retard &gt; 7j</div>
              <div className="text-lg font-black text-rose-400 mt-0.5 font-mono">
                {formatCurrency(totalOverdueAmountEUR, currency)}
              </div>
            </div>
            <div className="bg-[#0d1117]/80 p-3.5 rounded-xl border border-slate-800 shadow-sm">
              <div className="text-slate-400 font-medium">Factures à relancer</div>
              <div className="text-lg font-black text-amber-300 mt-0.5 font-mono">
                {overdueTransactions.length} dossier(s)
              </div>
            </div>
          </div>
        </div>

        {/* Action Plan Summary */}
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Plan d'Action Anti-Crise
            </h3>

            <ul className="space-y-3 text-xs text-slate-200">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Étape 1 :</strong> Relancer sous 24h les {overdueTransactions.length} clients
                  en retard de plus de 7 jours (E-mail / WhatsApp).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Étape 2 :</strong> Proposer un escompte de 2% pour paiement sous 48h aux
                  gros comptes.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Étape 3 :</strong> Solliciter un report d'échéance de 15 jours auprès des
                  fournisseurs non critiques.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="text-[11px] text-emerald-300/90 italic font-medium bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20">
              💡 Astuce DAF : Activer l'automatisation des relances pour un gain moyen de 8 jours de
              DSO.
            </div>
          </div>
        </div>
      </div>

      {/* Retards > 7 jours Table */}
      <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              Créances Clients en Retard &gt; 7 jours (Priorité Relance)
            </h3>
            <p className="text-xs text-slate-300">
              Liste ciblée des factures impayées dégradant directement votre trésorerie
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#21262d]/90 text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">Client & Facture</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Date Échéance</th>
                <th className="p-3">Jours de Retard</th>
                <th className="p-3">Relances Déjà Envoyées</th>
                <th className="p-3 text-right">Montant Dû</th>
                <th className="p-3 text-right rounded-r-xl">Action Immédiate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {overdueTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-emerald-400 font-bold text-sm">
                    ✓ Bravo ! Aucune créance client n'est actuellement en retard &gt; 7 jours.
                  </td>
                </tr>
              ) : (
                overdueTransactions.map((t) => {
                  const daysOverdue = calculateDaysOverdue(t.dueDate);
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-semibold text-white">
                        <div>{t.partner}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          N° {t.invoiceNumber || "FA-N/A"} • {t.description}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2.5 py-0.5 bg-slate-800/90 text-slate-200 rounded-lg font-semibold border border-slate-700">
                          {t.category}
                        </span>
                      </td>

                      <td className="p-3 font-mono font-medium text-slate-200">{t.dueDate}</td>

                      <td className="p-3">
                        <span className="px-2.5 py-0.5 bg-rose-950/80 text-rose-200 font-black border border-rose-500/60 rounded-lg shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                          +{daysOverdue} jours
                        </span>
                      </td>

                      <td className="p-3 text-slate-300">
                        {t.reminderSentCount || 0} relance(s)
                        {t.lastReminderDate && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Dernière : {t.lastReminderDate}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right font-black font-mono text-emerald-400 text-sm">
                        +{formatCurrency(t.amount, currency)}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => onNavigateToRelanceWithTransaction(t)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_18px_rgba(16,185,129,0.5)] ml-auto"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Générer Relance IA
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
