import React, { useState, useMemo, useCallback } from "react";
import { Transaction, PayrollEntry, Currency, TransactionStatus, TransactionType } from "../types";
import { formatCurrency } from "../utils/currency";
import { EDATE, WORKDAY, calculateDaysOverdue } from "../utils/excelFormulas";
import { exportTransactionsToCSV } from "../utils/exportCsv";
import {
  Calendar,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Share2,
  Download,
  Plus,
  Users,
  Building,
  Sparkles,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

interface PlannerTabProps {
  transactions: Transaction[];
  payrolls: PayrollEntry[];
  currency: Currency;
  onToggleStatus: (id: string, newStatus: TransactionStatus) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
  onTogglePayrollStatus: (id: string, newStatus: TransactionStatus) => void;
  onOpenFacturX?: (transaction: Transaction) => void;
}

export const PlannerTab: React.FC<PlannerTabProps> = ({
  transactions,
  payrolls,
  currency,
  onToggleStatus,
  onDeleteTransaction,
  onOpenAddModal,
  onTogglePayrollStatus,
  onOpenFacturX,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"echeancier" | "paie">("echeancier");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TransactionStatus>("all");

  // Filter Transactions with useMemo for high performance
  const filteredTransactions = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return transactions.filter((t) => {
      const matchesSearch =
        !searchLower ||
        t.partner.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(searchLower));
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, searchTerm, typeFilter, statusFilter]);

  // Export to Google Calendar
  const handleExportGoogleCalendar = (title: string, dateStr: string, details: string) => {
    const dateFormatted = dateStr.replace(/-/g, "");
    const startTime = `${dateFormatted}T090000Z`;
    const endTime = `${dateFormatted}T100000Z`;
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${startTime}/${endTime}&details=${encodeURIComponent(details)}&sf=true&output=xml`;
    window.open(googleUrl, "_blank");
  };

  // Download ICS File
  const handleDownloadICS = (title: string, dateStr: string, details: string) => {
    const dateFormatted = dateStr.replace(/-/g, "");
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TresorerieSousControle//FR
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${details}
DTSTART:${dateFormatted}T090000Z
DTEND:${dateFormatted}T100000Z
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `echeance-${dateStr}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div className="flex items-center gap-2 bg-[#0d1117] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab("echeancier")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
              activeSubTab === "echeancier"
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Échéancier Paiements & Recettes
          </button>
          <button
            onClick={() => setActiveSubTab("paie")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
              activeSubTab === "paie"
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Calendrier de Paie & URSSAF
          </button>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Ajouter une échéance
        </button>
      </div>

      {activeSubTab === "echeancier" ? (
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4">
          {/* Filters & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par client, fournisseur, N° facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0d1117] border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-[#0d1117] border border-slate-700/80 text-xs text-slate-200 font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tous types</option>
                <option value="inflow">Recettes uniquement</option>
                <option value="outflow">Dépenses uniquement</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#0d1117] border border-slate-700/80 text-xs text-slate-200 font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tous statuts</option>
                <option value="en_retard">⚠️ En retard &gt; 7j</option>
                <option value="en_attente">À venir</option>
                <option value="paye">✓ Déjà payé</option>
              </select>

              <button
                onClick={() => exportTransactionsToCSV(filteredTransactions, currency)}
                className="bg-[#0d1117] hover:bg-slate-800 border border-emerald-500/40 text-xs text-emerald-400 font-bold rounded-xl px-3 py-2 transition-all flex items-center gap-1.5 shadow-sm"
                title="Exporter les opérations filtrées au format CSV pour Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter CSV</span>
              </button>
            </div>
          </div>

          {/* Excel Formula Formula Helper Box */}
          <div className="bg-[#0d1117]/80 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-extrabold rounded-lg border border-emerald-500/30">
                Formule =WORKDAY(DateInitiale, 30)
              </span>
              <span className="font-medium">
                Dates d'échéance ajustées automatiquement hors week-ends et jours fériés.
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              {filteredTransactions.length} résultat(s)
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-[#21262d]/90 text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Partenaire / Ref</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Échéance</th>
                  <th className="p-3">Retard</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Montant</th>
                  <th className="p-3 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-medium">
                      Aucune opération ne correspond à vos filtres.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => {
                    const daysOverdue = calculateDaysOverdue(t.dueDate);
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-semibold text-white">
                          <div className="font-bold">{t.partner}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                            {t.invoiceNumber && <span>N° {t.invoiceNumber} • </span>}
                            <span>{t.description}</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              t.type === "inflow"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {t.category}
                          </span>
                        </td>

                        <td className="p-3 font-mono font-medium text-slate-200">
                          {t.dueDate}
                        </td>

                        <td className="p-3">
                          {daysOverdue > 0 && t.status !== "paye" ? (
                            <span className="text-rose-400 font-black font-mono">
                              +{daysOverdue} j.
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        <td className="p-3">
                          {t.status === "en_retard" ? (
                            <span className="px-2.5 py-0.5 bg-rose-950/80 text-rose-200 font-bold border border-rose-500/50 rounded-lg shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                              En retard
                            </span>
                          ) : t.status === "paye" ? (
                            <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold">
                              Payé
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-500/40 rounded-lg font-bold">
                              En attente
                            </span>
                          )}
                        </td>

                        <td
                          className={`p-3 text-right font-black text-sm font-mono ${
                            t.type === "inflow" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {t.type === "inflow" ? "+" : "-"}
                          {formatCurrency(t.amount, currency)}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Status Button */}
                            <button
                              onClick={() =>
                                onToggleStatus(
                                  t.id,
                                  t.status === "paye" ? "en_attente" : "paye"
                                )
                              }
                              title={
                                t.status === "paye"
                                  ? "Marquer comme non payé"
                                  : "Marquer comme réglé"
                              }
                              className={`p-1.5 rounded-xl border transition-colors ${
                                t.status === "paye"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                  : "bg-[#0d1117] text-slate-300 border-slate-700/80 hover:text-emerald-400"
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>

                            {/* Factur-X / PDF Invoice Button */}
                            {onOpenFacturX && (
                              <button
                                onClick={() => onOpenFacturX(t)}
                                title="Générer / Voir Facture PDF & Factur-X"
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/30 transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}

                            {/* Export to Google Calendar */}
                            <button
                              onClick={() =>
                                handleExportGoogleCalendar(
                                  `Échéance: ${t.partner} (${formatCurrency(t.amount, currency)})`,
                                  t.dueDate,
                                  `Règlement ${t.type === "inflow" ? "à recevoir" : "à payer"}: ${t.description}`
                                )
                              }
                              title="Ajouter à Google Calendar"
                              className="p-1.5 text-slate-300 hover:text-blue-400 bg-[#0d1117] rounded-xl border border-slate-700/80 transition-colors"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            {/* Download ICS */}
                            <button
                              onClick={() =>
                                handleDownloadICS(
                                  `Paiement ${t.partner}`,
                                  t.dueDate,
                                  `Montant: ${formatCurrency(t.amount, currency)}`
                                )
                              }
                              title="Télécharger fichier .ICS"
                              className="p-1.5 text-slate-300 hover:text-indigo-400 bg-[#0d1117] rounded-xl border border-slate-700/80 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => onDeleteTransaction(t.id)}
                              title="Supprimer cette ligne"
                              className="p-1.5 text-slate-400 hover:text-rose-400 bg-[#0d1117] rounded-xl border border-slate-700/80 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Calendrier de Paie & Charges Sociales */
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-white">
                Calendrier des Salaires & Charges URSSAF / CNSS
              </h2>
              <p className="text-xs text-slate-300">
                Anticipation des échéances de paie pour éviter les pénalités de retard
              </p>
            </div>
            <div className="px-3 py-1 bg-[#0d1117] text-xs text-emerald-400 rounded-xl border border-slate-700/80 font-mono font-bold">
              Formule =EDATE(DateDebut, 1)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-[#21262d]/90 text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Poste de Paie</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Date d'Échéance</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Montant</th>
                  <th className="p-3 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-bold text-white">
                      {p.employeeNameOrGroup}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 bg-blue-500/15 text-blue-300 text-[10px] rounded-lg font-bold border border-blue-500/30">
                        {p.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-200">
                      {p.dueDate}
                    </td>
                    <td className="p-3">
                      {p.status === "paye" ? (
                        <span className="px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold">
                          ✓ Réglé
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-500/40 rounded-lg font-bold">
                          À payer
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-black font-mono text-rose-400 text-sm">
                      -{formatCurrency(p.amount, currency)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() =>
                          onTogglePayrollStatus(
                            p.id,
                            p.status === "paye" ? "en_attente" : "paye"
                          )
                        }
                        className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                          p.status === "paye"
                            ? "bg-[#0d1117] text-slate-300 border border-slate-700/80"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        }`}
                      >
                        {p.status === "paye" ? "Annuler" : "Valider le virement"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
