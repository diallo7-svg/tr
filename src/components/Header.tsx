import React from "react";
import { Currency, Scenario, UserProfile } from "../types";
import { MOCK_USER_PROFILES } from "../data/mockData";
import { CURRENCY_SYMBOLS } from "../utils/currency";
import { GoogleWorkspaceBar } from "./GoogleWorkspaceBar";
import { DollarSign, ShieldAlert, PlusCircle, RefreshCw, Sparkles, TrendingUp, Calendar, AlertTriangle, BookOpen, Download, Building2, Shield, FileSpreadsheet } from "lucide-react";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  scenario: Scenario;
  setScenario: (scenario: Scenario) => void;
  onOpenAddModal: () => void;
  onResetData: () => void;
  onExportCSV: () => void;
  onExportSheets?: () => void;
  overdueCount: number;
  runwayDays: number;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  unreconciledCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currency,
  setCurrency,
  scenario,
  setScenario,
  onOpenAddModal,
  onResetData,
  onExportCSV,
  onExportSheets,
  overdueCount,
  runwayDays,
  currentUser,
  onSelectUser,
  unreconciledCount = 0,
}) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "openbanking", label: "Rapprochement Bancaire API", icon: Building2, badge: unreconciledCount > 0 ? unreconciledCount : undefined },
    { id: "planner", label: "Planificateur & Paie", icon: Calendar },
    { id: "forecast", label: "Prévisionnel 13 Semaines", icon: DollarSign },
    {
      id: "alerts",
      label: "Alertes & Crise",
      icon: AlertTriangle,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    { id: "relances", label: "Relances & IA", icon: Sparkles },
    { id: "guide", label: "Mode d'emploi", icon: BookOpen },
  ];

  return (
    <header className="bg-[#0a0b10]/85 backdrop-blur-xl text-white border-b border-slate-800/80 sticky top-0 z-30 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                Trésorerie Sous Contrôle
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                Anti-Crise Pro
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Anticipation des trous de trésorerie • Open Banking • Factur-X • Multi-Rôles
            </p>
          </div>
        </div>

        {/* Action Controls & Top Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Google Workspace Auth Bar */}
          <GoogleWorkspaceBar />

          {/* User Role Switcher Dropdown */}
          <div className="flex items-center bg-[#161b22]/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-inner">
            <span className="text-[10px] uppercase font-black text-slate-400 px-2 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              Rôle:
            </span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const found = MOCK_USER_PROFILES.find((u) => u.id === e.target.value);
                if (found) onSelectUser(found);
              }}
              className="bg-[#181d28] text-emerald-300 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {MOCK_USER_PROFILES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center bg-[#161b22]/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-inner">
            <button
              onClick={() => setScenario("nominal")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                scenario === "nominal"
                  ? "bg-slate-700/90 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                  : "text-slate-400 hover:text-slate-100"
              }`}
              title="Scénario Nominal (Base)"
            >
              Base
            </button>
            <button
              onClick={() => setScenario("optimistic")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                scenario === "optimistic"
                  ? "bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "text-slate-400 hover:text-slate-100"
              }`}
              title="Scénario Optimiste (+15% recettes)"
            >
              Optimiste
            </button>
            <button
              onClick={() => setScenario("pessimistic")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                scenario === "pessimistic"
                  ? "bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                  : "text-slate-400 hover:text-slate-100"
              }`}
              title="Scénario Pessimiste (-25% recettes, +15j retards)"
            >
              Pessimiste
            </button>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center bg-[#161b22]/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-inner">
            {(["EUR", "FCFA", "USD"] as Currency[]).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                  currency === c
                    ? "bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {c === "FCFA" ? "FCFA" : CURRENCY_SYMBOLS[c]}
              </button>
            ))}
          </div>

          {/* Add Transaction Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Saisir une opération</span>
          </button>

          {/* Export Google Sheets Button */}
          {onExportSheets && (
            <button
              onClick={onExportSheets}
              title="Exporter le tableau prévisionnel à 13 semaines vers Google Sheets"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 font-extrabold rounded-xl text-xs border border-emerald-500/40 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Google Sheets</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={onExportCSV}
            title="Exporter tout le rapport de trésorerie au format CSV pour Excel"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] hover:bg-slate-800 text-slate-300 hover:text-slate-100 font-bold rounded-xl text-xs border border-slate-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={onResetData}
            title="Réinitialiser les données de démonstration"
            className="p-1.5 text-slate-300 hover:text-white bg-[#161b22] hover:bg-slate-700/80 rounded-xl border border-slate-700/80 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-1 border-t border-slate-800/80">
        <nav className="flex space-x-1.5 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#161b22] text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold"
                    : "text-slate-300 hover:text-white hover:bg-[#161b22]/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.2 text-[10px] font-black bg-rose-500 text-slate-950 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

