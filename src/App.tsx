import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Transaction, PayrollEntry, Currency, Scenario, TransactionStatus, BankConnection, BankFeedEntry, UserProfile } from "./types";
import { INITIAL_CASH_BALANCE_EUR, INITIAL_TRANSACTIONS, INITIAL_PAYROLL, INITIAL_BANK_CONNECTIONS, INITIAL_BANK_FEEDS, MOCK_USER_PROFILES } from "./data/mockData";
import { exportFullReportToCSV } from "./utils/exportCsv";
import { Header } from "./components/Header";
import { DashboardTab } from "./components/DashboardTab";
import { PlannerTab } from "./components/PlannerTab";
import { ForecastTab } from "./components/ForecastTab";
import { AlertsTab } from "./components/AlertsTab";
import { RelancesTab } from "./components/RelancesTab";
import { GuideTab } from "./components/GuideTab";
import { OpenBankingTab } from "./components/OpenBankingTab";
import { AddTransactionModal } from "./components/AddTransactionModal";
import { GoalSeekModal } from "./components/GoalSeekModal";
import { FacturXModal } from "./components/FacturXModal";
import { SheetsExportConfirmationModal } from "./components/WorkspaceModals";
import { generate13WeekForecast } from "./utils/excelFormulas";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [scenario, setScenario] = useState<Scenario>("nominal");

  // Multi-User / RBAC State
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USER_PROFILES[0]); // Dirigeant by default

  // Bank Connections & Feeds State
  const [bankConnections, setBankConnections] = useState<BankConnection[]>(() => {
    const saved = localStorage.getItem("tresorerie_bank_connections");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local bank connections:", e);
      }
    }
    return INITIAL_BANK_CONNECTIONS;
  });

  const [bankFeeds, setBankFeeds] = useState<BankFeedEntry[]>(() => {
    const saved = localStorage.getItem("tresorerie_bank_feeds");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local bank feeds:", e);
      }
    }
    return INITIAL_BANK_FEEDS;
  });

  // Load / Store Local Persistence
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("tresorerie_transactions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local transactions:", e);
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [payrolls, setPayrolls] = useState<PayrollEntry[]>(() => {
    const saved = localStorage.getItem("tresorerie_payrolls");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local payrolls:", e);
      }
    }
    return INITIAL_PAYROLL;
  });

  const [initialCashEUR, setInitialCashEUR] = useState<number>(INITIAL_CASH_BALANCE_EUR);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGoalSeekModalOpen, setIsGoalSeekModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [selectedRelanceTxId, setSelectedRelanceTxId] = useState<string | null>(null);
  const [selectedFacturXTransaction, setSelectedFacturXTransaction] = useState<Transaction | null>(null);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("tresorerie_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("tresorerie_payrolls", JSON.stringify(payrolls));
  }, [payrolls]);

  useEffect(() => {
    localStorage.setItem("tresorerie_bank_connections", JSON.stringify(bankConnections));
  }, [bankConnections]);

  useEffect(() => {
    localStorage.setItem("tresorerie_bank_feeds", JSON.stringify(bankFeeds));
  }, [bankFeeds]);

  // Reconciliation Handler
  const handleReconcileFeed = useCallback((feedId: string, matchedTxId: string) => {
    setBankFeeds((prev) =>
      prev.map((f) => (f.id === feedId ? { ...f, reconciled: true } : f))
    );
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === matchedTxId
          ? {
              ...t,
              status: "paye",
              reconciledBankFeedId: feedId,
              reconciledAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const handleSyncBankConnections = useCallback(() => {
    setBankConnections((prev) =>
      prev.map((c) => ({
        ...c,
        lastSynced: "Aujourd'hui, à l'instant",
        balance: c.balance + Math.floor(Math.random() * 500) - 200,
      }))
    );
  }, []);

  const handleAddBankConnection = useCallback((newConn: BankConnection) => {
    setBankConnections((prev) => [newConn, ...prev]);
  }, []);

  // Status Handlers
  const handleToggleTransactionStatus = useCallback((id: string, newStatus: TransactionStatus) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  }, []);

  const handleDeleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAddTransaction = useCallback((newTx: Omit<Transaction, "id">) => {
    const created: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [created, ...prev]);
  }, []);

  const handleTogglePayrollStatus = useCallback((id: string, newStatus: TransactionStatus) => {
    setPayrolls((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  }, []);

  const handleUpdateReminderSent = useCallback((transactionId: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              reminderSentCount: (t.reminderSentCount || 0) + 1,
              lastReminderDate: new Date().toISOString().split("T")[0],
            }
          : t
      )
    );
  }, []);

  const handleResetData = useCallback(() => {
    if (window.confirm("Voulez-vous vraiment réinitialiser toutes les données de démonstration ?")) {
      setTransactions(INITIAL_TRANSACTIONS);
      setPayrolls(INITIAL_PAYROLL);
      setBankConnections(INITIAL_BANK_CONNECTIONS);
      setBankFeeds(INITIAL_BANK_FEEDS);
      setInitialCashEUR(INITIAL_CASH_BALANCE_EUR);
      localStorage.removeItem("tresorerie_transactions");
      localStorage.removeItem("tresorerie_payrolls");
      localStorage.removeItem("tresorerie_bank_connections");
      localStorage.removeItem("tresorerie_bank_feeds");
    }
  }, []);

  const handleNavigateToRelanceWithTransaction = useCallback((t: Transaction) => {
    setSelectedRelanceTxId(t.id);
    setCurrentTab("relances");
  }, []);

  // Overdue stats memoized
  const overdueCount = useMemo(() => {
    return transactions.filter(
      (t) => t.type === "inflow" && t.status === "en_retard"
    ).length;
  }, [transactions]);

  const unreconciledBankFeedsCount = useMemo(() => {
    return bankFeeds.filter((f) => !f.reconciled).length;
  }, [bankFeeds]);

  const handleExportFullCSV = useCallback(() => {
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
    const overdueInflows = transactions
      .filter((t) => t.type === "inflow" && t.status === "en_retard")
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingOutflows =
      transactions
        .filter((t) => t.type === "outflow" && t.status !== "paye")
        .reduce((sum, t) => sum + t.amount, 0) +
      payrolls
        .filter((p) => p.status !== "paye")
        .reduce((sum, p) => sum + p.amount, 0);

    const metricsData = {
      currentCashEUR,
      pendingInflows,
      overdueInflows,
      pendingOutflows,
      netProjectedBalance: currentCashEUR + pendingInflows - pendingOutflows,
      liquidityRatio:
        pendingOutflows > 0
          ? Math.round(((currentCashEUR + pendingInflows) / pendingOutflows) * 100) / 100
          : 2.5,
      dsoDays: 30,
      dpoDays: 42,
      runwayDays: 42,
      overdueCount,
    };

    exportFullReportToCSV(transactions, payrolls, metricsData, currency);
  }, [transactions, payrolls, initialCashEUR, currency, overdueCount]);

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans antialiased flex flex-col selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currency={currency}
        setCurrency={setCurrency}
        scenario={scenario}
        setScenario={setScenario}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onResetData={handleResetData}
        onExportCSV={handleExportFullCSV}
        onExportSheets={() => setIsSheetsModalOpen(true)}
        overdueCount={overdueCount}
        runwayDays={42}
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        unreconciledCount={unreconciledBankFeedsCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === "dashboard" && (
          <DashboardTab
            transactions={transactions}
            payrolls={payrolls}
            initialCashEUR={initialCashEUR}
            currency={currency}
            scenario={scenario}
            onNavigateToTab={setCurrentTab}
          />
        )}

        {currentTab === "openbanking" && (
          <OpenBankingTab
            connections={bankConnections}
            bankFeeds={bankFeeds}
            transactions={transactions}
            currency={currency}
            currentUser={currentUser}
            onReconcileFeed={handleReconcileFeed}
            onSyncConnections={handleSyncBankConnections}
            onAddConnection={handleAddBankConnection}
          />
        )}

        {currentTab === "planner" && (
          <PlannerTab
            transactions={transactions}
            payrolls={payrolls}
            currency={currency}
            onToggleStatus={handleToggleTransactionStatus}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onTogglePayrollStatus={handleTogglePayrollStatus}
            onOpenFacturX={(t) => setSelectedFacturXTransaction(t)}
          />
        )}

        {currentTab === "forecast" && (
          <ForecastTab
            transactions={transactions}
            payrolls={payrolls}
            initialCashEUR={initialCashEUR}
            currency={currency}
            scenario={scenario}
            setScenario={setScenario}
            onOpenGoalSeekModal={() => setIsGoalSeekModalOpen(true)}
          />
        )}

        {currentTab === "alerts" && (
          <AlertsTab
            transactions={transactions}
            payrolls={payrolls}
            initialCashEUR={initialCashEUR}
            currency={currency}
            onNavigateToRelanceWithTransaction={handleNavigateToRelanceWithTransaction}
          />
        )}

        {currentTab === "relances" && (
          <RelancesTab
            transactions={transactions}
            selectedTransactionId={selectedRelanceTxId}
            currency={currency}
            onUpdateReminderSent={handleUpdateReminderSent}
          />
        )}

        {currentTab === "guide" && <GuideTab />}
      </main>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        currency={currency}
      />

      <GoalSeekModal
        isOpen={isGoalSeekModalOpen}
        onClose={() => setIsGoalSeekModalOpen(false)}
        transactions={transactions}
        payrolls={payrolls}
        initialCashEUR={initialCashEUR}
        currency={currency}
      />

      {selectedFacturXTransaction && (
        <FacturXModal
          transaction={selectedFacturXTransaction}
          currency={currency}
          onClose={() => setSelectedFacturXTransaction(null)}
        />
      )}

      {isSheetsModalOpen && (
        <SheetsExportConfirmationModal
          title="Plan de Trésorerie Prévisionnel 13 Semaines"
          weeklyForecast={generate13WeekForecast(transactions, payrolls, initialCashEUR, scenario)}
          onClose={() => setIsSheetsModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        Trésorerie Sous Contrôle — Open Banking Powens / Bridge • Factur-X / EN16931 • Multi-Rôles (Dirigeant, DAF, Comptable)
      </footer>
    </div>
  );
}

