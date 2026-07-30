import React, { useState, useMemo } from "react";
import { Transaction, Currency } from "../types";
import { formatCurrency } from "../utils/currency";
import { calculateDaysOverdue } from "../utils/excelFormulas";
import { GmailConfirmationModal } from "./WorkspaceModals";
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Mail,
  MessageSquare,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface RelancesTabProps {
  transactions: Transaction[];
  selectedTransactionId?: string | null;
  currency: Currency;
  onUpdateReminderSent: (transactionId: string) => void;
}

export const RelancesTab: React.FC<RelancesTabProps> = ({
  transactions,
  selectedTransactionId,
  currency,
  onUpdateReminderSent,
}) => {
  const overdueOrPendingInflows = useMemo(
    () => transactions.filter((t) => t.type === "inflow" && t.status !== "paye"),
    [transactions]
  );

  const [selectedTxId, setSelectedTxId] = useState<string>(
    selectedTransactionId || (overdueOrPendingInflows[0]?.id || "")
  );

  const [tone, setTone] = useState<string>("Courtois & Professionnel");
  const [companyName, setCompanyName] = useState<string>("Ma PME Pro");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showGmailModal, setShowGmailModal] = useState<boolean>(false);

  const currentTx = transactions.find((t) => t.id === selectedTxId) || overdueOrPendingInflows[0];

  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailBody, setEmailBody] = useState<string>("");

  const handleGenerateAI = async () => {
    if (!currentTx) return;

    setLoading(true);
    setCopied(false);

    try {
      const daysOverdue = calculateDaysOverdue(currentTx.dueDate);
      const formattedAmount = formatCurrency(currentTx.amount, currency);

      const res = await fetch("/api/gemini/relance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: currentTx.partner,
          invoiceNumber: currentTx.invoiceNumber || "FA-2026",
          amount: formattedAmount,
          currency,
          dueDate: currentTx.dueDate,
          daysOverdue,
          tone,
          companyName,
        }),
      });

      const data = await res.json();
      if (data.subject && data.body) {
        setEmailSubject(data.subject);
        setEmailBody(data.body);
        onUpdateReminderSent(currentTx.id);
      }
    } catch (err) {
      console.error("Failed to generate AI reminder:", err);
      // Fallback
      setEmailSubject(`[Relance] Facture ${currentTx.invoiceNumber || ""} - ${currentTx.partner}`);
      setEmailBody(
        `Bonjour ${currentTx.partner},\n\nNous vous contactons concernant la facture N° ${
          currentTx.invoiceNumber || "..."
        } d'un montant de ${formatCurrency(currentTx.amount, currency)} échue le ${
          currentTx.dueDate
        }.\n\nSauf erreur ou omission, nous n'avons pas encore enregistré votre règlement.\n\nMerci de procéder au virement sous 48h.\n\nCordialement,\nL'équipe comptabilité.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = `Objet: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleMailTo = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(
      emailBody
    )}`;
    window.open(mailtoUrl, "_blank");
  };

  const handleWhatsApp = () => {
    const waText = `*${emailSubject}*\n\n${emailBody}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Générateur d'E-mails de Relance Intelligent (IA)
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              Pack Relances Pro
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Rédigez en 1 clic des e-mails et messages WhatsApp sur-mesure pour accélérer vos encaissements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4">
          <h3 className="text-sm font-extrabold text-white border-b border-slate-800/80 pb-2">
            Configuration de la Relance
          </h3>

          {/* Select Invoice */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Sélectionner la créance client :
            </label>
            <select
              value={selectedTxId}
              onChange={(e) => setSelectedTxId(e.target.value)}
              className="w-full bg-[#0d1117] border border-slate-700/80 text-xs text-slate-100 font-semibold rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
            >
              {overdueOrPendingInflows.length === 0 ? (
                <option value="">Aucune créance disponible</option>
              ) : (
                overdueOrPendingInflows.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.partner} — {formatCurrency(t.amount, currency)} (
                    {t.status === "en_retard" ? "⚠️ En retard" : "À venir"})
                  </option>
                ))
              )}
            </select>
          </div>

          {currentTx && (
            <div className="bg-[#0d1117]/80 rounded-xl p-3 text-xs text-slate-200 space-y-1.5 border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">N° Facture :</span>
                <span className="font-mono font-bold text-white">{currentTx.invoiceNumber || "FA-2026"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Montant dû :</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {formatCurrency(currentTx.amount, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date d'échéance :</span>
                <span className="font-mono text-slate-200">{currentTx.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Retard :</span>
                <span className="font-black text-rose-400 font-mono">
                  +{calculateDaysOverdue(currentTx.dueDate)} jours
                </span>
              </div>
            </div>
          )}

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Ton du message :
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-[#0d1117] border border-slate-700/80 text-xs text-slate-100 font-semibold rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="Courtois & Professionnel">Niveau 1 : Courtois & Rappel amical</option>
              <option value="Ferme avec date butoir 48h">Niveau 2 : Ferme avec date limite 48h</option>
              <option value="Mise en demeure pré-contentieuse">
                Niveau 3 : Mise en demeure pré-contentieuse
              </option>
              <option value="Proposition de plan de paiement étalé">
                Négociation : Proposition de calendrier de paiement
              </option>
            </select>
          </div>

          {/* Company Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nom de votre entreprise :
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-[#0d1117] border border-slate-700/80 text-xs text-slate-100 font-semibold rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerateAI}
            disabled={loading || !currentTx}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Rédaction par Gemini IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Générer la Relance Optimisée IA
              </>
            )}
          </button>
        </div>

        {/* Right Column: Preview & Output */}
        <div className="lg:col-span-7 bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h3 className="text-sm font-extrabold text-white">
                Aperçu du Message de Relance
              </h3>
              {emailSubject && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1 bg-[#0d1117] hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold border border-slate-700/80 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copier
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {!emailSubject ? (
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-500" />
                <p className="text-xs">
                  Sélectionnez un client et cliquez sur <strong className="text-white">"Générer la Relance IA"</strong> pour
                  obtenir un e-mail sur-mesure.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Subject Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Objet du mail :
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-[#0d1117] border border-slate-700/80 text-xs text-white rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Body Textarea */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Corps du message :
                  </label>
                  <textarea
                    rows={10}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-[#0d1117] border border-slate-700/80 text-xs text-slate-100 rounded-xl p-3 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Dispatch Bar */}
          {emailSubject && (
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-300 font-medium">Envoyer directement via :</span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowGmailModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                >
                  <Mail className="w-4 h-4" />
                  Envoyer via Gmail API (1-clic)
                </button>

                <button
                  onClick={handleMailTo}
                  className="px-3 py-2 bg-[#0d1117] hover:bg-slate-800 text-slate-200 font-bold rounded-xl text-xs transition-colors border border-slate-700 flex items-center gap-1.5 shadow-sm"
                >
                  Client Mailto
                </button>

                <button
                  onClick={handleWhatsApp}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp Web
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gmail Confirmation Modal */}
      {showGmailModal && currentTx && (
        <GmailConfirmationModal
          recipient={currentTx.contactEmail || `compta@${currentTx.partner.toLowerCase().replace(/[^a-z0-random]/g, "") || "client"}.com`}
          subject={emailSubject}
          bodyText={emailBody}
          onClose={() => setShowGmailModal(false)}
          onSuccess={() => onUpdateReminderSent(currentTx.id)}
        />
      )}
    </div>
  );
};
