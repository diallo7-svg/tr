import React, { useState } from "react";
import { Mail, FileSpreadsheet, HardDrive, Calendar, AlertCircle, CheckCircle2, X, ExternalLink, RefreshCw, ShieldAlert } from "lucide-react";
import { sendEmailViaGmail, exportToGoogleSheets, uploadInvoiceToDrive, addDueDateToCalendar } from "../services/workspaceApi";
import { getAccessToken, googleSignIn } from "../services/googleAuth";

/**
 * 1. Gmail Send Confirmation Modal
 */
interface GmailModalProps {
  recipient: string;
  subject: string;
  bodyText: string;
  onClose: () => void;
  onSuccess?: (msgId: string) => void;
}

export const GmailConfirmationModal: React.FC<GmailModalProps> = ({
  recipient,
  subject,
  bodyText,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  const handleConfirmSend = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        await googleSignIn();
      }
      const res = await sendEmailViaGmail(recipient, subject, bodyText);
      setSentId(res.id);
      if (onSuccess) onSuccess(res.id);
    } catch (err: any) {
      setError(err.message || "Impossible d'envoyer l'e-mail via Gmail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Confirmation d'Envoi Gmail</h3>
              <p className="text-[11px] text-slate-400">Action sécurisée via l'API Gmail du compte connecté</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sentId ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-300">E-mail envoyé avec succès !</h4>
            <p className="text-xs text-slate-300">ID du message Gmail : <code className="font-mono text-emerald-400">{sentId}</code></p>
            <button
              onClick={onClose}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 font-medium">Destinataire :</span>
                <span className="font-bold text-emerald-300 font-mono">{recipient}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 font-medium">Objet :</span>
                <span className="font-bold text-white truncate max-w-[280px]">{subject}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block mb-1">Aperçu du corps :</span>
                <div className="p-2.5 bg-slate-900/90 rounded-lg text-slate-300 font-mono text-[11px] max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {bodyText}
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Attention :</strong> Cette opération va réellement envoyer cet e-mail à <strong>{recipient}</strong> via votre boîte de réception Gmail.
              </span>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Confirmer & Envoyer via Gmail
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * 2. Google Sheets Export Confirmation Modal
 */
interface SheetsModalProps {
  title: string;
  weeklyForecast: Array<{
    weekIndex: number;
    weekName: string;
    startDate: string;
    inflows: number;
    outflows: number;
    net: number;
    closingCash: number;
  }>;
  onClose: () => void;
}

export const SheetsExportConfirmationModal: React.FC<SheetsModalProps> = ({
  title,
  weeklyForecast,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetResult, setSheetResult] = useState<{ spreadsheetUrl: string } | null>(null);

  const handleConfirmExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        await googleSignIn();
      }
      const res = await exportToGoogleSheets(title, weeklyForecast);
      setSheetResult(res);
    } catch (err: any) {
      setError(err.message || "Impossible de créer la feuille Google Sheets.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Exporter vers Google Sheets</h3>
              <p className="text-[11px] text-slate-400">Création d'un tableur cloud prévisionnel 13 semaines</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sheetResult ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-5 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div>
              <h4 className="text-base font-extrabold text-emerald-300">Google Sheet créé avec succès !</h4>
              <p className="text-xs text-slate-300 mt-1">
                Le tableau prévisionnel à 13 semaines a été écrit sur votre compte Google Workspace.
              </p>
            </div>
            <a
              href={sheetResult.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            >
              <span>Ouvrir dans Google Sheets</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Nom du fichier :</span>
                <span className="font-bold text-white">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nombre de semaines :</span>
                <span className="font-bold text-emerald-400">{weeklyForecast.length} semaines</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Formatage :</span>
                <span className="text-slate-300">En-têtes professionnels & colonnes calculées</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Un nouveau fichier Google Sheet sera créé à la racine de votre Google Drive et contiendra l'intégralité du plan prévisionnel.
            </p>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmExport}
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Génération du Sheet...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    Créer le Google Sheet
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * 3. Google Drive Upload Confirmation Modal
 */
interface DriveModalProps {
  filename: string;
  invoiceContent: string;
  onClose: () => void;
}

export const DriveUploadConfirmationModal: React.FC<DriveModalProps> = ({
  filename,
  invoiceContent,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driveResult, setDriveResult] = useState<{ fileUrl: string } | null>(null);

  const handleConfirmUpload = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        await googleSignIn();
      }
      const res = await uploadInvoiceToDrive(filename, invoiceContent);
      setDriveResult(res);
    } catch (err: any) {
      setError(err.message || "Impossible d'archiver la facture sur Google Drive.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Archivage sur Google Drive</h3>
              <p className="text-[11px] text-slate-400">Archivage légal de la facture Factur-X / EN16931</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {driveResult ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-5 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div>
              <h4 className="text-base font-extrabold text-emerald-300">Facture archivée sur Google Drive !</h4>
              <p className="text-xs text-slate-300 mt-1">
                Le fichier <code className="text-emerald-400 font-mono">{filename}</code> a été sécurisé sur votre compte Google Drive.
              </p>
            </div>
            <a
              href={driveResult.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            >
              <span>Voir le fichier sur Google Drive</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Nom du fichier :</span>
                <span className="font-mono font-bold text-white">{filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Norme d'archivage :</span>
                <span className="font-bold text-emerald-400">Factur-X / EN16931 Structured XML + JSON</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Souhaitez-vous sauvegarder cette facture directement dans votre espace Google Drive personnel pour les besoins de contrôle fiscal et d'archivage comptable ?
            </p>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Envoi vers Drive...
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4" />
                    Sauvegarder sur Google Drive
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * 4. Google Calendar Event Confirmation Modal
 */
interface CalendarModalProps {
  summary: string;
  description: string;
  dueDate: string;
  onClose: () => void;
}

export const CalendarConfirmationModal: React.FC<CalendarModalProps> = ({
  summary,
  description,
  dueDate,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calResult, setCalResult] = useState<{ htmlLink: string } | null>(null);

  const handleConfirmCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        await googleSignIn();
      }
      const res = await addDueDateToCalendar(summary, description, dueDate);
      setCalResult(res);
    } catch (err: any) {
      setError(err.message || "Impossible de créer le rappel dans Google Calendar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-[#161b22] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Ajouter au Google Calendar</h3>
              <p className="text-[11px] text-slate-400">Rappel d'échéance critique de trésorerie</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {calResult ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-5 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div>
              <h4 className="text-base font-extrabold text-emerald-300">Événement ajouté à votre agenda !</h4>
              <p className="text-xs text-slate-300 mt-1">
                Le rappel pour la date du <strong className="text-white">{dueDate}</strong> a été synchronisé.
              </p>
            </div>
            <a
              href={calResult.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]"
            >
              <span>Voir dans Google Calendar</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Événement :</span>
                <span className="font-bold text-white">{summary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date d'échéance :</span>
                <span className="font-mono font-bold text-amber-400">{dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rappels automatiques :</span>
                <span className="text-emerald-400 font-medium">Notification Pop-up 24h & E-mail 48h avant</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Un événement sera créé dans votre Google Calendar principal afin de vous alerter avant l'échéance et éviter tout retard de paiement ou impayé.
            </p>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmCalendar}
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Créer l'Événement Agenda
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
