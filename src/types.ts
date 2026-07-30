export type Currency = "EUR" | "FCFA" | "USD";

export type Scenario = "nominal" | "optimistic" | "pessimistic";

export type TransactionType = "inflow" | "outflow";

export type TransactionCategory =
  | "Ventes & Clients"
  | "Prestations de services"
  | "Acomptes reçus"
  | "Salaires & Paie"
  | "Fournisseurs & Achats"
  | "TVA & Impôts"
  | "Loyer & Charges fixes"
  | "Remboursement Emprunt"
  | "Investissement / Autre";

export type TransactionStatus = "paye" | "en_attente" | "en_retard";

export interface Transaction {
  id: string;
  description: string;
  partner: string; // Nom du client ou fournisseur
  amount: number; // Montant en EUR (base)
  type: TransactionType;
  category: TransactionCategory;
  date: string; // Date d'émission/création (YYYY-MM-DD)
  dueDate: string; // Date d'échéance (YYYY-MM-DD)
  status: TransactionStatus;
  isPayroll?: boolean;
  invoiceNumber?: string;
  paymentMethod?: string;
  notes?: string;
  reminderSentCount?: number;
  lastReminderDate?: string;
  reconciledBankFeedId?: string;
  reconciledAt?: string;
}

export interface PayrollEntry {
  id: string;
  employeeNameOrGroup: string;
  type: "Salaire Net" | "Charges Sociales (URSSAF / CNSS)" | "Prime / Bonus";
  amount: number; // EUR
  dueDate: string;
  status: TransactionStatus;
}

export interface GoalSeekParams {
  targetWeek: number; // Semaine 1 à 13
  targetBalance: number; // Solde minimum souhaité
  variableType: "accelerate_inflows" | "cut_outflows" | "both";
}

export interface GoalSeekResult {
  currentProjectedBalance: number;
  gap: number; // Différence
  requiredInflowBoostPercent: number;
  requiredOutflowReductionPercent: number;
  suggestedActions: string[];
}

export type UserRole = "dirigeant" | "daf" | "comptable";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
  title: string;
  permissions: {
    canApprovePayroll: boolean;
    canReconcileBank: boolean;
    canResetData: boolean;
    canExportReports: boolean;
    canManageSettings: boolean;
  };
}

export interface BankConnection {
  id: string;
  bankName: string;
  accountIban: string;
  balance: number;
  currency: Currency;
  lastSynced: string;
  status: "connected" | "syncing" | "error" | "disconnected";
  provider: "Powens" | "Bridge" | "Plaid";
  logoColor: string;
}

export interface BankFeedEntry {
  id: string;
  connectionId: string;
  date: string;
  label: string;
  amount: number; // >0 inflow, <0 outflow
  counterparty: string;
  rawReference: string;
  matchedTransactionId?: string;
  matchConfidence?: number; // 0-100
  reconciled: boolean;
}

export interface FacturXLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // e.g. 20
  totalExclVat: number;
}

export interface FacturXInvoice {
  id: string;
  transactionId?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  sellerName: string;
  sellerAddress: string;
  sellerVat: string;
  sellerSiret: string;
  buyerName: string;
  buyerAddress: string;
  buyerVat: string;
  buyerSiret: string;
  currency: Currency;
  items: FacturXLineItem[];
  totalExclVat: number;
  totalVat: number;
  totalInclVat: number;
  facturXProfile: "BASIC" | "COMFORT" | "EXTENDED";
  xmlPayload: string;
}

