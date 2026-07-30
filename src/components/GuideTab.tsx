import React, { useState } from "react";
import { EDATE, WORKDAY, IFS } from "../utils/excelFormulas";
import {
  BookOpen,
  Calculator,
  Calendar,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Play,
  Check,
  Building,
  Store,
  Utensils,
  Rocket,
} from "lucide-react";

export const GuideTab: React.FC = () => {
  // Interactive Playground States
  const [edateDate, setEdateDate] = useState("2026-07-27");
  const [edateMonths, setEdateMonths] = useState(3);

  const [workdayDate, setWorkdayDate] = useState("2026-07-27");
  const [workdayDays, setWorkdayDays] = useState(30);

  const [ifsCash, setIfsCash] = useState(12000);

  const edateResult = EDATE(edateDate, edateMonths);
  const workdayResult = WORKDAY(workdayDate, workdayDays);
  const ifsResult = IFS<string>(
    ifsCash < 8000,
    "🔴 ZONE DE CRISE : Relances d'urgence requises !",
    ifsCash < 20000,
    "🟡 ZONE DE VIGILANCE : Surveiller les décaissements.",
    true,
    "🟢 ZONE DE SÉCURITÉ : Trésorerie confortable."
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">
              Mode d'Emploi Interactif & Formules Financial Excel
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Comprendre le fonctionnement des algorithmes EDATE, WORKDAY, IFS et GOAL SEEK utilisés dans l'application.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Formula Playgrounds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EDATE (MOIS.DECALER) */}
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/15 text-blue-400 rounded-lg">
                <Calendar className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-white">
                1. Formule EDATE (MOIS.DECALER)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 font-mono text-[10px] rounded-lg font-bold border border-blue-500/30">
              Projections Mensuelles
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Permet de calculer les échéances futures à +N mois (abonnements, loyers, mensualités d'emprunt).
          </p>

          <div className="bg-[#0d1117]/80 p-4 rounded-xl border border-slate-700/80 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Date Initiale :</label>
                <input
                  type="date"
                  value={edateDate}
                  onChange={(e) => setEdateDate(e.target.value)}
                  className="w-full bg-[#161b22] border border-slate-700/80 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">+ Nombre de Mois :</label>
                <input
                  type="number"
                  value={edateMonths}
                  onChange={(e) => setEdateMonths(Number(e.target.value))}
                  className="w-full bg-[#161b22] border border-slate-700/80 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-medium">=EDATE("{edateDate}", {edateMonths})</span>
              <span className="text-emerald-400 font-black text-sm bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                ➔ {edateResult}
              </span>
            </div>
          </div>
        </div>

        {/* WORKDAY (SERIE.JOUR.OUVRE) */}
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-500/15 text-purple-400 rounded-lg">
                <Calculator className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-white">
                2. Formule WORKDAY (SERIE.JOUR.OUVRE)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 font-mono text-[10px] rounded-lg font-bold border border-purple-500/30">
              Jours Ouvrés Hors Week-ends
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Calcule la date de paiement réelle après N jours ouvrés (du lundi au vendredi), sans compter les samedis et dimanches.
          </p>

          <div className="bg-[#0d1117]/80 p-4 rounded-xl border border-slate-700/80 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Date Facture :</label>
                <input
                  type="date"
                  value={workdayDate}
                  onChange={(e) => setWorkdayDate(e.target.value)}
                  className="w-full bg-[#161b22] border border-slate-700/80 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">+ Jours Ouvrés (30j) :</label>
                <input
                  type="number"
                  value={workdayDays}
                  onChange={(e) => setWorkdayDays(Number(e.target.value))}
                  className="w-full bg-[#161b22] border border-slate-700/80 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-medium">=WORKDAY("{workdayDate}", {workdayDays})</span>
              <span className="text-purple-300 font-black text-sm bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/40">
                ➔ {workdayResult}
              </span>
            </div>
          </div>
        </div>

        {/* IFS (SI.MULTIPLE) */}
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/15 text-amber-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-white">
                3. Formule IFS (SI.MULTIPLE)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[10px] rounded-lg font-bold border border-amber-500/30">
              Logique Anti-Crise
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Évalue dynamiquement les niveaux d'alerte de trésorerie selon des seuils financiers stricts.
          </p>

          <div className="bg-[#0d1117]/80 p-4 rounded-xl border border-slate-700/80 space-y-3">
            <div className="text-xs">
              <label className="block text-slate-300 font-bold mb-1">Tester un solde de trésorerie (€) :</label>
              <input
                type="number"
                step="1000"
                value={ifsCash}
                onChange={(e) => setIfsCash(Number(e.target.value))}
                className="w-full bg-[#161b22] border border-slate-700/80 rounded-lg p-2 text-white font-mono font-bold"
              />
            </div>

            <div className="pt-2 border-t border-slate-700/80 space-y-1 text-xs">
              <div className="text-slate-300 font-mono text-[11px]">
                =IFS(Solde &lt; 8000; "CRISE"; Solde &lt; 20000; "VIGILANCE"; VRAI; "SÉCURITÉ")
              </div>
              <div className="text-xs font-black mt-2 p-2.5 rounded-lg bg-[#161b22] border border-slate-700 text-white">
                {ifsResult}
              </div>
            </div>
          </div>
        </div>

        {/* GOAL SEEK */}
        <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg">
                <Play className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-white">
                4. GOAL SEEK (Recherche d'Objectif)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] rounded-lg font-bold border border-emerald-500/30">
              Solveur Numérique
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            L'algorithme Goal Seek calcule exactement le pourcentage d'accélération des encaissements ou de réduction des coûts requis pour atteindre un solde cible à la semaine N.
          </p>

          <div className="bg-[#0d1117]/80 p-3 rounded-xl border border-slate-700/80 text-xs text-slate-200 space-y-2 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Simule les scénarios à la Semaine 1 à 13</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Propose des actions d'urgence concrètes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Recommendations Section */}
      <div className="bg-[#161b22]/70 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.37)] space-y-4">
        <h3 className="text-base font-extrabold text-white">
          Recommandations d'Uilisation selon votre profil d'activité
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PME */}
          <div className="bg-[#0d1117]/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Building className="w-4 h-4" />
              PME / ETI
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Surveillez prioritairement le DPO pour préserver vos relations fournisseurs tout en optimisant vos jours de fonds de roulement (BFR).
            </p>
          </div>

          {/* Startups */}
          <div className="bg-[#0d1117]/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
              <Rocket className="w-4 h-4" />
              Startups & SaaS
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Gardez un œil constant sur les jours de Runway restants (&lt; 60 jours impose une levée ou une coupure nette de burn rate).
            </p>
          </div>

          {/* Commerçants */}
          <div className="bg-[#0d1117]/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Store className="w-4 h-4" />
              Commerçants
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Anticipez les pics de réapprovisionnement de stocks grâce au prévisionnel 13 semaines pour éviter les ruptures.
            </p>
          </div>

          {/* Restaurateurs */}
          <div className="bg-[#0d1117]/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <Utensils className="w-4 h-4" />
              Restaurateurs
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Suivez scrupuleusement le calendrier de paie (salaires des extras) et les prélèvements de charges sociales hebdomadaires.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
