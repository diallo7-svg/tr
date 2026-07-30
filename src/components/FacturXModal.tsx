import React, { useState } from "react";
import { Transaction, Currency, FacturXInvoice } from "../types";
import { formatCurrency } from "../utils/currency";
import { DriveUploadConfirmationModal, CalendarConfirmationModal } from "./WorkspaceModals";
import {
  FileText,
  Download,
  Code,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Building,
  User,
  Calendar as CalendarIcon,
  Layers,
  Copy,
  Check,
  HardDrive,
} from "lucide-react";

interface FacturXModalProps {
  transaction: Transaction;
  currency: Currency;
  onClose: () => void;
}

export const FacturXModal: React.FC<FacturXModalProps> = ({
  transaction,
  currency,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"pdf" | "xml">("pdf");
  const [copiedXml, setCopiedXml] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Calculate invoice amounts
  const totalInclVat = transaction.amount;
  const vatRate = 0.2; // 20% TVA
  const totalExclVat = Math.round((totalInclVat / (1 + vatRate)) * 100) / 100;
  const totalVat = Math.round((totalInclVat - totalExclVat) * 100) / 100;

  const invoiceNumber = transaction.invoiceNumber || `FA-2026-${transaction.id.replace(/\D/g, "").slice(0, 4) || "1082"}`;
  const issueDate = transaction.date;
  const dueDate = transaction.dueDate;

  // Generate Factur-X CII XML string compliant with EN16931 / BASIC Profile
  const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${invoiceNumber}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueDate.replace(/-/g, "")}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>1</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${transaction.description}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${totalExclVat.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">1.00</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>ENTREPRISE MODEL SAS</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">84920492800019</ram:ID>
        </ram:SpecifiedLegalOrganization>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${transaction.partner}</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${totalExclVat.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${totalExclVat.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${totalVat.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${totalInclVat.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${totalInclVat.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlPayload);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadXml = () => {
    const element = document.createElement("a");
    const file = new Blob([xmlPayload], { type: "text/xml" });
    element.href = URL.createObjectURL(file);
    element.download = `factur-x_${invoiceNumber}.xml`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121620] border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#161a24]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Facture Électronique Normée</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full">
                  Factur-X / EN16931
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Génération automatique hybride (PDF visuel + XML structuré conforme DGFIP)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* View Toggle */}
        <div className="px-6 py-3 bg-[#181c28] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-[#12151f] p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab("pdf")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "pdf"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              Aperçu PDF Normé
            </button>
            <button
              onClick={() => setActiveTab("xml")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "xml"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Code className="w-4 h-4" />
              Fichier Métadonnées XML (Factur-X)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowDriveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm border border-blue-500/40"
              title="Sauvegarder cette facture directement sur Google Drive"
            >
              <HardDrive className="w-3.5 h-3.5" />
              Drive
            </button>
            <button
              onClick={() => setShowCalendarModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-sm border border-purple-500/40"
              title="Ajouter un rappel d'échéance dans Google Calendar"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimer
            </button>
            <button
              onClick={handleDownloadXml}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-md hover:opacity-90"
            >
              <Download className="w-3.5 h-3.5" />
              XML Factur-X
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#0d0f17]">
          {activeTab === "pdf" ? (
            /* Visual Printable Invoice Preview */
            <div className="bg-white text-slate-900 rounded-xl p-8 shadow-2xl max-w-2xl mx-auto border border-slate-200 font-sans">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-950 uppercase tracking-wide">FACTURE</h2>
                  <p className="text-xs font-mono text-slate-600 mt-1">N° {invoiceNumber}</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-300">
                    Factur-X Basic Compliant
                  </span>
                </div>
                <div className="text-right">
                  <h3 className="font-extrabold text-sm text-slate-900">ENTREPRISE MODEL SAS</h3>
                  <p className="text-xs text-slate-600">12 Avenue de la Grande Armée, 75017 Paris</p>
                  <p className="text-xs font-mono text-slate-500">SIRET: 849 204 928 00019 • TVA: FR 48 849204928</p>
                </div>
              </div>

              {/* Client & Metadata */}
              <div className="grid grid-cols-2 gap-6 my-6 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Facturé à</span>
                  <h4 className="font-extrabold text-slate-900 text-sm mt-1">{transaction.partner}</h4>
                  <p className="text-slate-600">Client professionnel enregistré</p>
                  <p className="text-slate-500 font-mono mt-1">N° Client: CLT-{transaction.id}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date d'émission:</span>
                    <span className="font-bold font-mono">{issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date d'échéance:</span>
                    <span className="font-bold font-mono text-rose-700">{dueDate}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span className="text-slate-500">Mode de règlement:</span>
                    <span className="font-bold">Virement SEPA</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left border-collapse my-6 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-600">
                    <th className="py-2.5 px-3">Description du service / produit</th>
                    <th className="py-2.5 px-3 text-center">Qté</th>
                    <th className="py-2.5 px-3 text-right">Prix HT</th>
                    <th className="py-2.5 px-3 text-right">TVA</th>
                    <th className="py-2.5 px-3 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-900">{transaction.description}</td>
                    <td className="py-3 px-3 text-center font-mono">1</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(totalExclVat, currency)}</td>
                    <td className="py-3 px-3 text-right font-mono">20%</td>
                    <td className="py-3 px-3 text-right font-bold font-mono">{formatCurrency(totalExclVat, currency)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="flex justify-end border-t border-slate-200 pt-4">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total HT:</span>
                    <span className="font-mono font-bold">{formatCurrency(totalExclVat, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>TVA (20%):</span>
                    <span className="font-mono">{formatCurrency(totalVat, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-950 border-t border-slate-300 pt-2 bg-emerald-50 p-2 rounded-lg">
                    <span>Total TTC à Payer:</span>
                    <span className="text-emerald-800 font-mono">{formatCurrency(totalInclVat, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="mt-8 pt-6 border-t border-slate-200 text-[10px] text-slate-400 text-center space-y-1">
                <p>Facture transmise sous format électronique normé Factur-X / EN16931 conformément à la loi de finances.</p>
                <p className="font-mono">IBAN de règlement: FR76 3000 4028 1100 0123 4567 890 • BIC: BNPAFRPPXXX</p>
              </div>
            </div>
          ) : (
            /* XML Payload Code Viewer */
            <div className="relative bg-[#08090f] border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
              <button
                onClick={handleCopyXml}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-sans font-bold border border-slate-700"
              >
                {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedXml ? "Copié !" : "Copier le XML"}</span>
              </button>
              <pre>{xmlPayload}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Google Drive Upload Confirmation Modal */}
      {showDriveModal && (
        <DriveUploadConfirmationModal
          filename={`factur-x_${invoiceNumber}.txt`}
          invoiceContent={xmlPayload}
          onClose={() => setShowDriveModal(false)}
        />
      )}

      {/* Google Calendar Confirmation Modal */}
      {showCalendarModal && (
        <CalendarConfirmationModal
          summary={`Échéance Facture ${invoiceNumber} (${transaction.partner})`}
          description={`Montant : ${formatCurrency(transaction.amount, currency)}. Facture relative à : ${transaction.description}`}
          dueDate={dueDate}
          onClose={() => setShowCalendarModal(false)}
        />
      )}
    </div>
  );
};
