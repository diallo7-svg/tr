import { Transaction, PayrollEntry, Currency } from "../types";
import { calculateDaysOverdue } from "./excelFormulas";

/**
 * Clean string for CSV cell (escapes double quotes)
 */
function escapeCSV(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '""';
  const val = String(str).replace(/"/g, '""');
  return `"${val}"`;
}

/**
 * Downloads a string as a CSV file in browser with UTF-8 BOM for Excel compatibility
 */
export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export all Transactions to CSV for Excel
 */
export function exportTransactionsToCSV(transactions: Transaction[], currency: Currency = "EUR") {
  const headers = [
    "ID",
    "Partenaire",
    "N° Facture",
    "Type",
    "Catégorie",
    "Description",
    `Montant (${currency})`,
    "Date d'émission",
    "Date d'échéance",
    "Retard (Jours)",
    "Statut",
    "Relances Envoyées",
    "Dernière Relance"
  ];

  const rows = transactions.map((t) => {
    const typeLabel = t.type === "inflow" ? "Recette (Encaissement)" : "Dépense (Décaissement)";
    const overdueDays = calculateDaysOverdue(t.dueDate);
    const statusLabel =
      t.status === "paye"
        ? "Payé / Réglé"
        : t.status === "en_retard"
        ? "En retard"
        : "En attente";

    return [
      escapeCSV(t.id),
      escapeCSV(t.partner),
      escapeCSV(t.invoiceNumber || ""),
      escapeCSV(typeLabel),
      escapeCSV(t.category),
      escapeCSV(t.description),
      escapeCSV(t.amount.toFixed(2)),
      escapeCSV(t.date),
      escapeCSV(t.dueDate),
      escapeCSV(overdueDays),
      escapeCSV(statusLabel),
      escapeCSV(t.reminderSentCount || 0),
      escapeCSV(t.lastReminderDate || "")
    ].join(";");
  });

  const content = [headers.join(";"), ...rows].join("\r\n");
  const filename = `tresorerie_transactions_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCSV(filename, content);
}

/**
 * Export Dashboard Metrics & KPI Summary to CSV
 */
export function exportDashboardToCSV(
  metrics: {
    currentCashEUR: number;
    pendingInflows: number;
    overdueInflows: number;
    pendingOutflows: number;
    netProjectedBalance: number;
    liquidityRatio: number;
    dsoDays: number;
    dpoDays: number;
    runwayDays: number;
    overdueCount: number;
  },
  currency: Currency = "EUR"
) {
  const dateStr = new Date().toLocaleDateString("fr-FR");

  const lines = [
    `"RAPPORT SYNTHÈSE DE TRÉSORERIE DU ${dateStr}"`,
    `"Généré via Trésorerie Sous Contrôle (Pack Anti-Crise)"`,
    "",
    `"MÉTRIQUE";"VALEUR";"UNITÉ / COMMENTAIRE"`,
    `"Solde de Trésorerie Actuel";"${metrics.currentCashEUR.toFixed(2)}";"${currency}"`,
    `"Total Créances à Encaisser";"${metrics.pendingInflows.toFixed(2)}";"${currency}"`,
    `"Dont Créances en Retard";"${metrics.overdueInflows.toFixed(2)}";"${currency} (${metrics.overdueCount} factures)"`,
    `"Total Dépenses & Paie en Attente";"${metrics.pendingOutflows.toFixed(2)}";"${currency}"`,
    `"Solde Net Projeté (Fin d'échéancier)";"${metrics.netProjectedBalance.toFixed(2)}";"${currency}"`,
    `"Ratio de Liquidité Immédiate";"${metrics.liquidityRatio}";"Capacité de couverture court terme"`,
    `"DSO (Délai Moyen Encaiss. Clients)";"${metrics.dsoDays}";"Jours"`,
    `"DPO (Délai Moyen Paiement Fournisseurs)";"${metrics.dpoDays}";"Jours"`,
    `"Runway Restant (Autonomie Trésorerie)";"${metrics.runwayDays}";"Jours avant besoin de refinancement"`
  ];

  const content = lines.join("\r\n");
  const filename = `tresorerie_tableau_de_bord_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCSV(filename, content);
}

/**
 * Export Complete Treasury Report (KPIs + Transactions + Payroll) to CSV
 */
export function exportFullReportToCSV(
  transactions: Transaction[],
  payrolls: PayrollEntry[],
  metrics: {
    currentCashEUR: number;
    pendingInflows: number;
    overdueInflows: number;
    pendingOutflows: number;
    netProjectedBalance: number;
    liquidityRatio: number;
    dsoDays: number;
    dpoDays: number;
    runwayDays: number;
    overdueCount: number;
  },
  currency: Currency = "EUR"
) {
  const dateStr = new Date().toLocaleDateString("fr-FR");

  const lines: string[] = [
    `"RAPPORT COMPLET ET ANALYSE EXCEL DE TRÉSORERIE"`,
    `"Date d'exportation : ${dateStr}"`,
    `"Devise d'affichage : ${currency}"`,
    "",
    `"=== SECTION 1 : SYNTHÈSE DES INDICATEURS CLÉS (DASHBOARD) ==="`,
    `"MÉTRIQUE";"VALEUR";"COMMENTAIRE"`,
    `"Solde de Trésorerie Actuel";"${metrics.currentCashEUR.toFixed(2)} ${currency}";"Solde disponible en banque"`,
    `"Total Recettes à venir (Inflows)";"${metrics.pendingInflows.toFixed(2)} ${currency}";"Créances clients non réglées"`,
    `"Dont Créances en Retard (> 0j)";"${metrics.overdueInflows.toFixed(2)} ${currency}";"${metrics.overdueCount} créance(s) impactant le DSO"`,
    `"Total Dépenses & Salaires à payer (Outflows)";"${metrics.pendingOutflows.toFixed(2)} ${currency}";"Factures + charges sociales + paie"`,
    `"Solde Net Projeté après échéances";"${metrics.netProjectedBalance.toFixed(2)} ${currency}";"Solde estimé post-règlements"`,
    `"Ratio de Couverture Liquidités";"${metrics.liquidityRatio}";"Seuil de sécurité > 1.2"`,
    `"DSO (Délai Client)";"${metrics.dsoDays} jours";"Target < 45 jours"`,
    `"DPO (Délai Fournisseur)";"${metrics.dpoDays} jours";"Target 30-60 jours"`,
    `"Runway Restant";"${metrics.runwayDays} jours";"Jours de réserve sans nouvelles recettes"`,
    "",
    `"=== SECTION 2 : ÉCHÉANCIER DES OPÉRATIONS & FACTURES ==="`,
    [
      "ID",
      "Partenaire",
      "N° Facture",
      "Type",
      "Catégorie",
      "Description",
      `Montant (${currency})`,
      "Date Émission",
      "Date Échéance (WORKDAY)",
      "Retard (Jours)",
      "Statut",
      "Relances Envoyées"
    ].map((h) => escapeCSV(h)).join(";")
  ];

  transactions.forEach((t) => {
    const typeLabel = t.type === "inflow" ? "Recette" : "Dépense";
    const overdueDays = calculateDaysOverdue(t.dueDate);
    const statusLabel =
      t.status === "paye" ? "Payé" : t.status === "en_retard" ? "En retard" : "En attente";

    lines.push(
      [
        escapeCSV(t.id),
        escapeCSV(t.partner),
        escapeCSV(t.invoiceNumber || ""),
        escapeCSV(typeLabel),
        escapeCSV(t.category),
        escapeCSV(t.description),
        escapeCSV(t.amount.toFixed(2)),
        escapeCSV(t.date),
        escapeCSV(t.dueDate),
        escapeCSV(overdueDays),
        escapeCSV(statusLabel),
        escapeCSV(t.reminderSentCount || 0)
      ].join(";")
    );
  });

  lines.push("");
  lines.push(`"=== SECTION 3 : CALENDRIER DE PAIE ET CHARGES SOCIALES ==="`);
  lines.push(
    ["ID", "Poste de Paie", "Type", "Date d'Échéance (EDATE)", "Montant", "Statut"]
      .map((h) => escapeCSV(h))
      .join(";")
  );

  payrolls.forEach((p) => {
    lines.push(
      [
        escapeCSV(p.id),
        escapeCSV(p.employeeNameOrGroup),
        escapeCSV(p.type),
        escapeCSV(p.dueDate),
        escapeCSV(p.amount.toFixed(2)),
        escapeCSV(p.status === "paye" ? "Payé / Effectué" : "À payer")
      ].join(";")
    );
  });

  const content = lines.join("\r\n");
  const filename = `rapport_tresorerie_complet_${new Date().toISOString().split("T")[0]}.csv`;
  downloadCSV(filename, content);
}
