# Trésorerie Sous Contrôle - React & Tailwind Template

Un tableau de bord moderne et performant pour la gestion et la prévision de trésorerie (13 semaines, runway, DSO/DPO, multi-devises, simulation de scénarios et relances).

## 🚀 Caractéristiques

- **Interface React 19 & Tailwind CSS v4** : UI moderne, fluide et responsive.
- **Prévisions sur 13 Semaines** : Calculs automatiques des flux entrants/sortants et solde clôture.
- **Gestion des Scénarios** : Nominal, optimiste, pessimiste.
- **Analytique & Graphiques Interactifs** : Visualisations riches via Recharts.
- **100% Prêt pour Vercel / Netlify / Cloudflare Pages** : Déploiement frontend statique instantané via `npm run build`.

## 📦 Installation & Démarrage rapide

### 1. Cloner ou télécharger le template
```bash
git clone <URL_DU_REPO>
cd tresorerie-sous-controle
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer en mode développement
```bash
npm run dev
```
Ouvrez votre navigateur sur `http://localhost:3000`.

### 4. Compiler pour la production
```bash
npm run build
```
Les fichiers statiques optimisés seront générés dans le dossier `dist/`.

## 🚀 Déploiement sur Vercel

Le projet contient un fichier `vercel.json` préconfiguré :
1. Connectez votre dépôt GitHub / GitLab à [Vercel](https://vercel.com).
2. Sélectionnez le projet.
3. Vercel détectera automatiquement la configuration Vite (`npm run build` et dossier de sortie `dist`).
4. Cliquez sur **Deploy**.

## 🛠️ Stack Technique

- **Frontend** : React 19, TypeScript, Tailwind CSS v4
- **Icônes & Animations** : Lucide React, Motion
- **Graphiques** : Recharts
- **Build Tool** : Vite 6

## 📄 Licence

Licence Commerciale de Template - Utilisable pour vos projets personnels ou clients B2B.
