import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialization of GoogleGenAI
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Trésorerie Sous Contrôle" });
});

// Generate automated payment reminder email (Relance Client)
app.post("/api/gemini/relance", async (req, res) => {
  try {
    const { clientName, invoiceNumber, amount, currency, dueDate, daysOverdue, tone, companyName } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // Fallback response if no key provided
      return res.json({
        success: true,
        subject: `[Rappel] Facture ${invoiceNumber || "N°..."} - ${clientName || "Client"}`,
        body: `Bonjour ${clientName || ""},\n\nSauf erreur ou omission de notre part, la facture N° ${invoiceNumber || "..."} d'un montant de ${amount || 0} ${currency || "€"}, échue depuis le ${dueDate || "ce jour"} (${daysOverdue || 0} jours de retard), demeure impayée dans nos livres.\n\nNous vous prions de bien vouloir procéder à son règlement par virement dans les plus brefs délais.\n\nCordialement,\nL'équipe comptabilité - ${companyName || "Notre Entreprise"}`,
      });
    }

    const prompt = `Génère un e-mail professionnel et très convaincant de relance d'impayé en français pour une entreprise / PME.

Détails de la facture :
- Nom du client : ${clientName}
- Numéro de facture : ${invoiceNumber}
- Montant dû : ${amount} ${currency}
- Date d'échéance : ${dueDate}
- Retard : ${daysOverdue} jours
- Ton souhaité : ${tone || "Ferme mais courtois"} (Options : Courtois, Niveaux 2 - Ferme, Mise en demeure, Négociation plan d'échéancier)
- Nom de notre entreprise : ${companyName || "Notre Entreprise"}

Réponds STRICTEMENT au format JSON avec les clés suivantes :
{
  "subject": "Objet de l'e-mail",
  "body": "Corps complet du message avec formules de politesse adaptées"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error("Error in /api/gemini/relance:", error);
    return res.status(500).json({ error: error.message || "Erreur lors de la génération de la relance" });
  }
});

// AI Cashflow Audit & Advice
app.post("/api/gemini/audit", async (req, res) => {
  try {
    const { currentCash, runwayDays, dso, dpo, overdueAmount, scenario, currency } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        success: true,
        auditSummary: "Analyse automatisée de la trésorerie : Vigilance requise sur le poste clients.",
        recommendations: [
          "Accélérer les relances sur les créances de plus de 7 jours.",
          "Négocier un allongement de délai fournisseur de 15 jours sur les achats non critiques.",
          "Sécuriser une ligne de crédit à court terme ou un découvert autorisé."
        ],
        urgency: runwayDays < 30 ? "CRITIQUE" : runwayDays < 60 ? "MODEREE" : "FAIBLE"
      });
    }

    const prompt = `Agis en tant qu'expert-comptable et DAF (Directeur Financier) virtuel d'urgence pour PME/Startup.
Analyse les données financières suivantes et donne un audit financier concis, réaliste et directement actionnable.

Données :
- Solde de trésorerie actuel : ${currentCash} ${currency}
- Runway (Jours d'autonomie restants) : ${runwayDays} jours
- DSO (Delai moyen paiement clients) : ${dso} jours
- DPO (Delai moyen paiement fournisseurs) : ${dpo} jours
- Total factures en retard (>7j) : ${overdueAmount} ${currency}
- Scénario sélectionné : ${scenario}

Réponds STRICTEMENT sous forme de JSON :
{
  "urgency": "CRITIQUE" | "MODEREE" | "EXCELLENTE",
  "auditSummary": "Une synthèse de 2 phrases sur l'état de la trésorerie et les trous à anticiper.",
  "recommendations": ["Action 1 immédiate", "Action 2 sous 7 jours", "Action 3 à moyen terme"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error("Error in /api/gemini/audit:", error);
    return res.status(500).json({ error: error.message || "Erreur lors de l'audit de trésorerie" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
