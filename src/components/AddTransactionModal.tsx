import React, { useState } from "react";
import { Transaction, Currency, TransactionCategory, TransactionType } from "../types";
import { convertToEUR } from "../utils/currency";
import { WORKDAY, EDATE } from "../utils/excelFormulas";
import { X, Plus, Calendar, DollarSign } from "lucide-react";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
  currency: Currency;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  currency,
}) => {
  const [partner, setPartner] = useState("");
  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [type, setType] = useState<TransactionType>("inflow");
  const [category, setCategory] = useState<TransactionCategory>("Ventes & Clients");
  const [date, setDate] = useState("2026-07-27");
  const [termDays, setTermDays] = useState(30);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner || !amountInput) return;

    const numericAmount = parseFloat(amountInput) || 0;
    const amountEUR = convertToEUR(numericAmount, currency);

    // Compute due date using WORKDAY formula
    const dueDate = WORKDAY(date, termDays);

    onAddTransaction({
      partner,
      description: description || "Opération courante",
      amount: amountEUR,
      type,
      category,
      date,
      dueDate,
      status: "en_attente",
      invoiceNumber: invoiceNumber || `FA-${Math.floor(100 + Math.random() * 900)}`,
    });

    // Reset & close
    setPartner("");
    setDescription("");
    setAmountInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-[#161b22]/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-[0_16px_48px_rgba(0,0,0,0.6)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            Saisir une nouvelle opération
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#0d1117] border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType("inflow");
                setCategory("Ventes & Clients");
              }}
              className={`py-2 rounded-lg font-black transition-all ${
                type === "inflow"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              + Encaisser (Recette)
            </button>
            <button
              type="button"
              onClick={() => {
                setType("outflow");
                setCategory("Fournisseurs & Achats");
              }}
              className={`py-2 rounded-lg font-black transition-all ${
                type === "outflow"
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              - Décaisser (Dépense)
            </button>
          </div>

          {/* Partner & Invoice Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Partenaire (Client / Fournisseur) :
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Client SOTRA"
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                className="w-full bg-[#0d1117] border border-slate-700/80 rounded-xl p-2.5 text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                N° Facture / Référence :
              </label>
              <input
                type="text"
                placeholder="Ex: FA-2026-101"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-[#0d1117] border border-slate-700/80 rounded-xl p-2.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Montant ({currency}) :
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="Ex: 5000"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full bg-[#0d1117] border border-slate-700/80 rounded-xl p-2.5 text-slate-100 font-mono font-black focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Catégorie :</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full bg-[#0d1117] border border-slate-700/80 rounded-xl p-2.5 text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="Ventes & Clients">Ventes & Clients</option>
                <option value="Prestations de services">Prestations de services</option>
                <option value="Acomptes reçus">Acomptes reçus</option>
                <option value="Salaires & Paie">Salaires & Paie</option>
                <option value="Fournisseurs & Achats">Fournisseurs & Achats</option>
                <option value="TVA & Impôts">TVA & Impôts</option>
                <option value="Loyer & Charges fixes">Loyer & Charges fixes</option>
                <option value="Remboursement Emprunt">Remboursement Emprunt</option>
                <option value="Investissement / Autre">Investissement / Autre</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Description :</label>
            <input
              type="text"
              placeholder="Ex: Acompte sur marché matériel"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0d1117] border border-slate-700/80 rounded-xl p-2.5 text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Date & Terms */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Date d'émission :</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0d1117] border border-slate-700/80 rounded-xl p-2.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Délai de règlement (Jours ouvrés WORKDAY) :
              </label>
              <select
                value={termDays}
                onChange={(e) => setTermDays(Number(e.target.value))}
                className="w-full bg-[#0d1117] border border-slate-700/80 rounded-xl p-2.5 text-slate-100 font-semibold focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value={0}>Comptant (0 jour)</option>
                <option value={15}>15 jours ouvrés</option>
                <option value={30}>30 jours ouvrés (Standard)</option>
                <option value={45}>45 jours ouvrés</option>
                <option value={60}>60 jours ouvrés</option>
              </select>
            </div>
          </div>

          <div className="bg-[#0d1117]/80 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono flex items-center justify-between">
            <span>Échéance calculée (=WORKDAY) :</span>
            <span className="font-extrabold text-emerald-400">{WORKDAY(date, termDays)}</span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0d1117] hover:bg-slate-800 text-slate-300 font-bold rounded-xl border border-slate-700/80 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Enregistrer l'opération
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
