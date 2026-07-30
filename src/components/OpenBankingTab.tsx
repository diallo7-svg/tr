import React, { useState } from "react";
import { BankConnection, BankFeedEntry, Transaction, Currency, UserProfile } from "../types";
import { formatCurrency } from "../utils/currency";
import {
  Building2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Link2,
  Zap,
  Sparkles,
  Lock,
  Plus,
  Search,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

interface OpenBankingTabProps {
  connections: BankConnection[];
  bankFeeds: BankFeedEntry[];
  transactions: Transaction[];
  currency: Currency;
  currentUser: UserProfile;
  onReconcileFeed: (feedId: string, matchedTxId: string) => void;
  onSyncConnections: () => void;
  onAddConnection: (newConn: BankConnection) => void;
}

export const OpenBankingTab: React.FC<OpenBankingTabProps> = ({
  connections,
  bankFeeds,
  transactions,
  currency,
  currentUser,
  onReconcileFeed,
  onSyncConnections,
  onAddConnection,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "reconciled">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBankProvider, setSelectedBankProvider] = useState<"Powens" | "Bridge" | "Plaid">("Powens");
  const [newBankName, setNewBankName] = useState("Société Générale - Compte Pro");
  const [newIban, setNewIban] = useState("FR76 3000 3000 1100 9999 8888 77");

  const canReconcile = currentUser.permissions.canReconcileBank;

  const handleSyncClick = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onSyncConnections();
      setIsSyncing(false);
    }, 1200);
  };

  const handleCreateBankConnection = (e: React.FormEvent) => {
    e.preventDefault();
    const created: BankConnection = {
      id: `bank-${Date.now()}`,
      bankName: newBankName,
      accountIban: newIban,
      balance: Math.floor(Math.random() * 15000) + 5000,
      currency: "EUR",
      lastSynced: "À l'instant",
      status: "connected",
      provider: selectedBankProvider,
      logoColor: selectedBankProvider === "Powens" ? "#00915a" : selectedBankProvider === "Bridge" ? "#6366f1" : "#10b981",
    };
    onAddConnection(created);
    setShowAddModal(false);
  };

  // Filtering Bank Feed Entries
  const filteredFeeds = bankFeeds.filter((feed) => {
    const conn = connections.find((c) => c.id === feed.connectionId);
    if (filterProvider !== "all" && conn?.provider !== filterProvider) return false;
    if (filterStatus === "pending" && feed.reconciled) return false;
    if (filterStatus === "reconciled" && !feed.reconciled) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        feed.label.toLowerCase().includes(term) ||
        feed.counterparty.toLowerCase().includes(term) ||
        feed.rawReference.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalBankBalance = connections.reduce((sum, c) => sum + c.balance, 0);
  const pendingReconciliationCount = bankFeeds.filter((f) => !f.reconciled).length;
  const autoMatchedCount = bankFeeds.filter((f) => !f.reconciled && f.matchedTransactionId).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#121620] border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Open Banking Direct API
              </span>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-bold rounded-full">
                Powens • Bridge • Plaid
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-2 tracking-tight">
              Rapprochement Bancaire & Synchronisation Flux Réels
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Rapprochez vos mouvements bancaires réels avec vos factures d’achat/vente en 1-clic grâce aux règles d’IA de concordance d’IBAN, références et montants.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Synchronisation..." : "Synchroniser les banques"}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Connecter une Banque (API)</span>
            </button>
          </div>
        </div>

        {/* Bank Connection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="bg-[#181d28] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/80 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md"
                    style={{ backgroundColor: conn.logoColor }}
                  >
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {conn.bankName}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">{conn.accountIban}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {conn.provider}
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between border-t border-slate-800/50 pt-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Solde Synchronisé</span>
                  <p className="text-lg font-black text-white">
                    {formatCurrency(conn.balance, currency)}
                  </p>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  {conn.lastSynced}
                </span>
              </div>
            </div>
          ))}

          {/* Consolidated Summary Tile */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-[#181d28] to-[#121620] border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Trésorerie Consolidée</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-full">
                  2 Banques API
                </span>
              </div>
              <p className="text-2xl font-black text-white mt-2">
                {formatCurrency(totalBankBalance, currency)}
              </p>
            </div>

            <div className="mt-3 text-xs text-slate-300 flex items-center gap-2 border-t border-emerald-500/20 pt-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>{pendingReconciliationCount} flux</strong> en attente de rapprochement ({autoMatchedCount} correspondances IA détectées).
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reconciliation Section */}
      <div className="bg-[#121620] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-400" />
              Flux Bancaires vs Échéancier
            </h3>
            <span className="px-2.5 py-0.5 text-xs font-black bg-slate-800 text-slate-300 rounded-full border border-slate-700">
              {filteredFeeds.length} opérations
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Chercher référence, libellé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#181d28] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-52"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-[#181d28] p-1 rounded-xl border border-slate-700/80 text-xs font-bold">
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterStatus === "pending"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                À rapprocher ({bankFeeds.filter((f) => !f.reconciled).length})
              </button>
              <button
                onClick={() => setFilterStatus("reconciled")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterStatus === "reconciled"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Rapprochés ({bankFeeds.filter((f) => f.reconciled).length})
              </button>
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterStatus === "all"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Tous
              </button>
            </div>
          </div>
        </div>

        {/* Table of Feeds */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#161a24]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#12151f] text-[11px] uppercase tracking-wider font-extrabold text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4">Date & Banque</th>
                <th className="py-3 px-4">Mouvement Bancaire</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4">Correspondance Échéancier (IA)</th>
                <th className="py-3 px-4 text-center">Score Confidence</th>
                <th className="py-3 px-4 text-right">Action Rapprochement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredFeeds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Aucun flux bancaire ne correspond aux critères de recherche actuels.
                  </td>
                </tr>
              ) : (
                filteredFeeds.map((feed) => {
                  const conn = connections.find((c) => c.id === feed.connectionId);
                  const matchedTx = transactions.find((t) => t.id === feed.matchedTransactionId);

                  return (
                    <tr
                      key={feed.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        feed.reconciled ? "opacity-60 bg-slate-900/40" : ""
                      }`}
                    >
                      {/* Date & Bank */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        <div className="font-bold text-white">{feed.date}</div>
                        <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {conn?.bankName || "Compte Pro"}
                        </div>
                      </td>

                      {/* Movement */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {feed.amount > 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span>{feed.label}</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 truncate max-w-xs mt-0.5">
                          {feed.rawReference}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-black text-sm whitespace-nowrap">
                        <span className={feed.amount > 0 ? "text-emerald-400" : "text-rose-400"}>
                          {feed.amount > 0 ? "+" : ""}
                          {formatCurrency(feed.amount, currency)}
                        </span>
                      </td>

                      {/* Match Suggestion */}
                      <td className="py-3.5 px-4">
                        {matchedTx ? (
                          <div className="bg-[#1c2230] border border-slate-700/80 rounded-lg p-2 max-w-xs">
                            <div className="flex items-center justify-between text-white font-bold text-xs">
                              <span className="truncate">{matchedTx.partner}</span>
                              <span className="text-emerald-400 ml-2 whitespace-nowrap font-mono">
                                {formatCurrency(matchedTx.amount, currency)}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                              <span>
                                {matchedTx.invoiceNumber || matchedTx.category} • Échéance {matchedTx.dueDate}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">
                            Aucune facture trouvée pour ce montant
                          </span>
                        )}
                      </td>

                      {/* Confidence Level */}
                      <td className="py-3.5 px-4 text-center">
                        {feed.matchConfidence ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                feed.matchConfidence >= 95
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {feed.matchConfidence}% Match
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[10px]">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {feed.reconciled ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Rapproché
                          </span>
                        ) : (
                          <button
                            disabled={!canReconcile || !matchedTx}
                            onClick={() => matchedTx && onReconcileFeed(feed.id, matchedTx.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-lg text-xs transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                              !canReconcile
                                ? "Seul le DAF ou Comptable peut valider le rapprochement"
                                : "Valider et passer la facture en état PAYÉ"
                            }
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Rapprocher en 1-clic</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Bank Connection */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-black text-white">Ajouter une Banque Open Banking</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBankConnection} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Fournisseur d'API Open Banking
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Powens", "Bridge", "Plaid"] as const).map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setSelectedBankProvider(provider)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        selectedBankProvider === provider
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-[#181d28] border-slate-700 text-slate-400"
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nom de la Banque / Compte
                </label>
                <input
                  type="text"
                  required
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181d28] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Numéro IBAN
                </label>
                <input
                  type="text"
                  required
                  value={newIban}
                  onChange={(e) => setNewIban(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181d28] border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Connexion sécurisée conforme à la directive DSP2 (SCA Strong Customer Authentication). Aucune donnée de connexion stockée.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-xl text-xs font-black hover:from-emerald-400 hover:to-teal-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  Connecter & Synchroniser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
