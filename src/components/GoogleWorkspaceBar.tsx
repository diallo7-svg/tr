import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { initAuth, googleSignIn, logoutGoogle } from "../services/googleAuth";
import { Mail, FileSpreadsheet, HardDrive, Calendar, CheckCircle2, ShieldCheck, LogOut, RefreshCw } from "lucide-react";

interface GoogleWorkspaceBarProps {
  onAuthChange?: (isAuth: boolean, user: User | null) => void;
}

export const GoogleWorkspaceBar: React.FC<GoogleWorkspaceBarProps> = ({ onAuthChange }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setLoading(false);
        if (onAuthChange) onAuthChange(true, currentUser);
      },
      () => {
        setUser(null);
        setLoading(false);
        if (onAuthChange) onAuthChange(false, null);
      }
    );
    return () => unsubscribe();
  }, [onAuthChange]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        if (onAuthChange) onAuthChange(true, res.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de connexion Google Workspace.");
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    if (onAuthChange) onAuthChange(false, null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-[#161b22] border border-slate-800 rounded-xl text-xs text-slate-400">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        <span>Initialisation Google Workspace...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <div className="flex items-center gap-2 bg-[#161b22]/90 border border-emerald-500/40 p-1.5 rounded-xl shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          {/* User Photo / Initials */}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "Google User"}
              className="w-6 h-6 rounded-full border border-emerald-400"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-slate-950 font-black text-[10px] flex items-center justify-center">
              {user.email?.charAt(0).toUpperCase() || "G"}
            </div>
          )}

          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-white flex items-center gap-1">
              {user.displayName || user.email?.split("@")[0]}
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            </span>
            <span className="text-[9px] text-emerald-300 font-medium">Google Workspace Actif</span>
          </div>

          {/* Active Workspace Services Icons */}
          <div className="hidden sm:flex items-center gap-1 ml-1 px-2 border-l border-slate-800 text-slate-400">
            <span title="Gmail API Actif" className="p-1 text-emerald-400 hover:text-emerald-300">
              <Mail className="w-3.5 h-3.5" />
            </span>
            <span title="Google Sheets API Actif" className="p-1 text-emerald-400 hover:text-emerald-300">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </span>
            <span title="Google Drive API Actif" className="p-1 text-emerald-400 hover:text-emerald-300">
              <HardDrive className="w-3.5 h-3.5" />
            </span>
            <span title="Google Calendar API Actif" className="p-1 text-emerald-400 hover:text-emerald-300">
              <Calendar className="w-3.5 h-3.5" />
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Se déconnecter de Google Workspace"
            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {errorMsg && (
            <span className="text-[10px] text-rose-400 font-medium truncate max-w-[150px]">
              {errorMsg}
            </span>
          )}
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all border border-slate-300 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{signingIn ? "Connexion..." : "Connexion Google Workspace"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
