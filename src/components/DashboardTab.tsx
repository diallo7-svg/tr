import React, { useMemo, useCallback } from "react";
import { Transaction, PayrollEntry, Currency, Scenario } from "../types";
import { formatCurrency } from "../utils/currency";
import {
  exportDashboardToCSV,
  exportTransactionsToCSV,
  exportFullReportToCSV,
} from "../utils/exportCsv";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface DashboardTabProps {
  transactions: Transaction[];
  payrolls: PayrollEntry[];
  initialCashEUR: number;
  currency: Currency;
  scenario: Scenario;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  transactions,
  payrolls,
  initialCashEUR,
  currency,
  scenario,
  onNavigateToTab,
}) => {
  // Compute Financial Metrics with useMemo for high performance
  const {
    currentCashEUR,
    paidInflows,
    pendingInflows,
    overdueInflows,
    overdueCount,
    pendingOutflows,
    liquidityRatio,
    dso,
    dpo,
    runwayDays,
    runwayWeeks,
    chartData,
    metricsData,
  } = useMemo(() => {
    // Paid Inflows & Outflows
    const paidInflows = transactions
      .filter((t) => t.type === "inflow" && t.status === "paye")
      .reduce((sum, t) => sum + t.amount, 0);

    const paidOutflows = transactions
      .filter((t) => t.type === "outflow" && t.status === "paye")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentCashEUR = initialCashEUR + paidInflows - paidOutflows;

    // Pending and Overdue Inflows
    const pendingInflows = transactions
      .filter((t) => t.type === "inflow" && t.status !== "paye")
      .reduce((sum, t) => sum + t.amount, 0);

    const overdueInflows = transactions
      .filter((t) => t.type === "inflow" && t.status === "en_retard")
      .reduce((sum, t) => sum + t.amount, 0);

    const overdueCount = transactions.filter(
      (t) => t.type === "inflow" && t.status === "en_retard"
    ).length;

    // Pending Outflows + Payrolls
    const pendingOutflows =
      transactions
        .filter((t) => t.type === "outflow" && t.status !== "paye")
        .reduce((sum, t) => sum + t.amount, 0) +
      payrolls
        .filter((p) => p.status !== "paye")
        .reduce((sum, p) => sum + p.amount, 0);

    // Scenario Multipliers
    let scenarioInflowMult = 1.0;
    let scenarioOutflowMult = 1.0;

    if (scenario === "optimistic") {
      scenarioInflowMult = 1.15;
      scenarioOutflowMult = 0.95;
    } else if (scenario === "pessimistic") {
      scenarioInflowMult = 0.75;
      scenarioOutflowMult = 1.15;
    }

    // Liquidity Ratio
    const totalShortTermAssets = currentCashEUR + pendingInflows * scenarioInflowMult;
    const totalShortTermLiabilities = pendingOutflows * scenarioOutflowMult;
    const liquidityRatio =
      totalShortTermLiabilities > 0
        ? Math.round((totalShortTermAssets / totalShortTermLiabilities) * 100) / 100
        : 2.5;

    // DSO & DPO
    const totalInflowsAll = paidInflows + pendingInflows;
    const dso =
      totalInflowsAll > 0
        ? Math.min(120, Math.round(((pendingInflows + overdueInflows) / totalInflowsAll) * 60))
        : 30;

    const totalOutflowsAll = paidOutflows + pendingOutflows;
    const dpo =
      totalOutflowsAll > 0
        ? Math.min(90, Math.round((pendingOutflows / totalOutflowsAll) * 45))
        : 42;

    // Runway Calculation
    const avgWeeklyOutflow = pendingOutflows / 8 || 1500;
    const runwayWeeks = Math.max(
      0,
      Math.round((currentCashEUR / (avgWeeklyOutflow || 1)) * 10) / 10
    );
    const runwayDays = Math.round(runwayWeeks * 7);

    // 13-Week Chart Data
    const chartData = [];
    let runningCash = currentCashEUR;

    for (let w = 1; w <= 13; w++) {
      const baseInflowWeek = (pendingInflows / 10) * scenarioInflowMult;
      const baseOutflowWeek = (pendingOutflows / 10) * scenarioOutflowMult;

      const inflow = Math.max(0, Math.round(baseInflowWeek * (0.8 + (w % 3) * 0.2)));
      const outflow = Math.max(0, Math.round(baseOutflowWeek * (0.9 + (w % 2) * 0.15)));

      runningCash = runningCash + inflow - outflow;

      chartData.push({
        week: `S${w}`,
        solde: Math.round(runningCash),
        recettes: Math.round(inflow),
        depenses: Math.round(outflow),
      });
    }

    const metricsData = {
      currentCashEUR,
      pendingInflows,
      overdueInflows,
      pendingOutflows,
      netProjectedBalance: currentCashEUR + pendingInflows - pendingOutflows,
      liquidityRatio,
      dsoDays: dso,
      dpoDays: dpo,
      runwayDays,
      overdueCount,
    };

    return {
      currentCashEUR,
      paidInflows,
      pendingInflows,
      overdueInflows,
      overdueCount,
      pendingOutflows,
      liquidityRatio,
      dso,
      dpo,
      runwayDays,
      runwayWeeks,
      chartData,
      metricsData,
    };
  }, [transactions, payrolls, initialCashEUR, scenario]);

  const handleExportDashboardCSV = useCallback(() => {
    exportDashboardToCSV(metricsData, currency);
  }, [metricsData, currency]);

  const handleExportTransactionsCSV = useCallback(() => {
    exportTransactionsToCSV(transactions, currency);
  }, [transactions, currency]);

  const handleExportFullReportCSV = useCallback(() => {
    exportFullReportToCSV(transactions, payrolls, metricsData, currency);
  }, [transactions, payrolls, metricsData, currency]);

  return (
    <div className="space-y-6">
      {/* Top Export & Action Control Bar */}
      <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Exporter les Données Financières (Format CSV / Excel)
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Générez des rapports directement exploitables dans Microsoft Excel (séparateur point-virgule et encodage UTF-8).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportDashboardCSV}
            className="px-3 py-1.5 bg-[#0d1117] hover:bg-slate-800 text-slate-200 hover:text-white font-bold rounded-xl text-xs border border-slate-700/80 transition-all flex items-center gap-1.5 shadow-sm"
            title="Exporter les indicateurs clés du tableau de bord"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Synthèse CSV
          </button>
          <button
            onClick={handleExportTransactionsCSV}
            className="px-3 py-1.5 bg-[#0d1117] hover:bg-slate-800 text-slate-200 hover:text-white font-bold rounded-xl text-xs border border-slate-700/80 transition-all flex items-center gap-1.5 shadow-sm"
            title="Exporter la liste détaillée des opérations"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Opérations CSV
          </button>
          <button
            onClick={handleExportFullReportCSV}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            title="Générer le rapport complet avec indicateurs, opérations et paie"
          >
            <Download className="w-4 h-4" />
            Rapport Complet CSV
          </button>
        </div>
      </div>

      {/* Anti-Crisis Alert Banner if Overdue Invoices exist */}
      {overdueCount > 0 && (
        <div className="bg-rose-950/70 backdrop-blur-md border border-rose-500/60 rounded-2xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_30px_rgba(244,63,94,0.25)]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-6 h-6 animate-pulse text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Alerte Trésorerie : {overdueCount} facture(s) en retard &gt; 7 jours
              </h3>
              <p className="text-xs text-rose-200/90 mt-0.5">
                Total des créances impayées :{" "}
                <strong className="text-white font-mono font-bold text-sm bg-rose-900/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                  {formatCurrency(overdueInflows, currency)}
                </strong>
                . Agissez rapidement pour éviter un trou de trésorerie.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab("relances")}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Lancer les relances IA
            </button>
            <button
              onClick={() => onNavigateToTab("alerts")}
              className="px-3.5 py-2 bg-[#161b22] hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl border border-slate-700/80 transition-colors shadow-sm"
            >
              Voir le plan de crise
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde Actuel */}
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Solde de Trésorerie
            </span>
            <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight font-mono">
            {formatCurrency(currentCashEUR, currency)}
          </div>
          <div className="mt-2.5 flex items-center text-xs text-slate-300 gap-1.5">
            <span className="text-emerald-400 font-bold flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{formatCurrency(paidInflows, currency, true)}
            </span>
            <span>encaissements réalisés</span>
          </div>
        </div>

        {/* Runway Days */}
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Autonomie (Runway)
            </span>
            <div
              className={`p-2 rounded-xl border ${
                runwayDays < 30
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                  : runwayDays < 60
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{runwayDays} jours</span>
            <span className="text-xs text-slate-400 font-medium">({runwayWeeks} sem.)</span>
          </div>
          <div className="mt-2.5 flex items-center text-xs">
            {runwayDays < 30 ? (
              <span className="text-rose-300 font-bold flex items-center gap-1 bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-500/40">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Zone Critique (&lt;30j)
              </span>
            ) : runwayDays < 60 ? (
              <span className="text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-500/40">
                Zone de Vigilance
              </span>
            ) : (
              <span className="text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Niveaux de sécurité confortables
              </span>
            )}
          </div>
        </div>

        {/* Ratio de Liquidité */}
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ratio de Liquidité
            </span>
            <div className="p-2 bg-blue-500/15 text-blue-400 rounded-xl border border-blue-500/30">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{liquidityRatio}</span>
            <span className="text-xs text-slate-400 font-medium">(Cible &gt; 1.2)</span>
          </div>
          <div className="mt-2.5 text-xs">
            {liquidityRatio >= 1.2 ? (
              <span className="text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                Capacité d'honneur des dettes saine
              </span>
            ) : (
              <span className="text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/30">
                Attention : Actifs à court terme sous tension
              </span>
            )}
          </div>
        </div>

        {/* DSO & DPO */}
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Délais Règlements
            </span>
            <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <div className="text-xs text-slate-400 font-medium">DSO (Clients)</div>
              <div className="text-lg font-black text-white font-mono">{dso} jours</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">DPO (Fourn.)</div>
              <div className="text-lg font-black text-white font-mono">{dpo} jours</div>
            </div>
          </div>
          <div className="mt-2 text-[11px]">
            {dso > dpo ? (
              <span className="text-amber-300 font-semibold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30 inline-block">
                ⚠️ Clients payent plus tard que vous ne payez vos fournisseurs.
              </span>
            ) : (
              <span className="text-emerald-300 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 inline-block">
                ✓ Balance de trésorerie commerciale équilibrée.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rolling Cashflow 13-Week Trend */}
        <div className="lg:col-span-2 bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Prévisionnel de Trésorerie Glissant (13 Semaines)
              </h2>
              <p className="text-xs text-slate-400">
                Évolution estimée selon le scénario :{" "}
                <span className="text-emerald-400 font-extrabold capitalize">
                  {scenario}
                </span>
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab("forecast")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline self-start sm:self-auto flex items-center gap-1"
            >
              Simuler Goal Seek &rarr;
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="soldeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="week" stroke="#8b949e" fontSize={11} />
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
                  formatter={(val: number) => [formatCurrency(val, currency), "Solde"]}
                />
                <Area
                  type="monotone"
                  dataKey="solde"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#soldeGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Inflows vs Outflows Breakdown */}
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1">
              Encaissements vs Décaissements
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Comparatif hebdomadaire des entrées et sorties
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="week" stroke="#8b949e" fontSize={11} />
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
                      name === "recettes" ? "Recettes (+)" : "Dépenses (-)",
                    ]}
                  />
                  <Legend
                    formatter={(val) => (val === "recettes" ? "Entrées" : "Sorties")}
                  />
                  <Bar dataKey="recettes" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="depenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Total à encaisser (à venir) :</span>
            <span className="font-black text-emerald-400 font-mono text-sm">
              {formatCurrency(pendingInflows, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards & Pending Invoices Table */}
      <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">
              Prochaines Échéances Prioritaires
            </h2>
            <p className="text-xs text-slate-400">
              Opérations de paie et créances clients requérant votre attention
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab("planner")}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
          >
            Voir l'échéancier complet &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#21262d]/90 text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">Partenaire / Objet</th>
                <th className="p-3">Type & Catégorie</th>
                <th className="p-3">Échéance</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right rounded-r-xl">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-semibold text-white">
                    <div>{t.partner}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{t.description}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.type === "inflow"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {t.type === "inflow" ? "Recette" : "Dépense"} • {t.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-200 font-mono font-medium">{t.dueDate}</td>
                  <td className="p-3">
                    {t.status === "en_retard" ? (
                      <span className="px-2.5 py-0.5 bg-rose-950/80 text-rose-200 border border-rose-500/50 rounded-lg font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                        ⚠️ Retard &gt; 7j
                      </span>
                    ) : t.status === "paye" ? (
                      <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold">
                        ✓ Payé
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-500/40 rounded-lg font-bold">
                        À venir
                      </span>
                    )}
                  </td>
                  <td
                    className={`p-3 text-right font-black font-mono text-sm ${
                      t.type === "inflow" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {t.type === "inflow" ? "+" : "-"}
                    {formatCurrency(t.amount, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
