# 🎯 Daily Routine Tracker

Une application web moderne pour gérer vos routines quotidiennes et projets, construite avec React, TypeScript et Tailwind CSS.

## ✨ Fonctionnalités

### 📋 Routines Quotidiennes

- **Création de routines** avec titre, durée optionnelle et créneau horaire (Matin, Après-midi, Soir)
- **Timer intégré** avec vue plein écran et progression circulaire
- **Notifications push** pour rappeler vos routines (PWA)
- **Skip aujourd'hui** - Passez une routine sans casser votre streak
- **Réinitialisation automatique** chaque jour à minuit

### 📊 Suivi & Statistiques

- **Calendrier heatmap** visualise le pourcentage de complétion par date.
- **Historique détaillé** par routine (taux, streak actuel, streak max)
- **Dashboard global** avec KPIs clés (taux de complétion, série actuelle, record, deadlines à venir) et graphiques d'évolution
- **États de chargement** avec skeletons animés

### 📁 Gestion de Projets

- **Tableau Kanban** avec drag & drop (To-Do, En cours, Terminé)
- **Deadlines** avec intégration calendrier
- **Vue d'ensemble** des projets avec compteurs de tâches

### 👤 Profil & Authentification

- **Authentification sécurisée** (inscription, connexion, déconnexion)
- **Page profil** pour modifier ses informations
- **Gestion des notifications** push depuis le profil

### 🎨 Personnalisation

- **6 thèmes de couleur** : Orange, Bleu, Vert, Violet, Rose, Cyan
- **Mode sombre/clair**
- **Design responsive** (mobile, tablette, desktop)

### 🚀 Expérience Utilisateur

- **Onboarding interactif** pour les nouveaux utilisateurs
- **États vides** avec messages et illustrations
- **PWA installable** sur mobile et desktop
- **Notifications push** avec demande de permission et planification
- **Assistant IA de feedback** — Chatbot conversationnel pour recueillir les avis utilisateurs (intégré avec Netlify Forms)
- **Sélecteur de thème & mode sombre/clair**
- **Accessibilité basique** : attributs ARIA et composants compatibles (focus, labels)

## 💻 Installation

```bash
# Cloner le projet
git clone https://github.com/nin-faz/daily-routines.git

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## 🛠️ Technologies

- **React 18** — Framework UI
- **TypeScript** — Typage statique
- **Vite** — Build tool
- **Tailwind CSS** — Styling
- **shadcn/ui** & **Radix primitives** — Composants UI
- **Supabase** — Backend (Auth, Database, Functions)
- **Resend** — Envoi d'emails transactionnels (utilisé pour les emails)
- **@tanstack/react-query** — Fetching / caching
- **react-router-dom** — Navigation
- **recharts** — Graphiques
- **date-fns** — Gestion des dates
- **react-hook-form** — formulaires
- **lucide-react** — Icônes
- **PWA** — Installation mobile & notifications
- **sonner** — toasts / notifications UI
- **zod** — validation / schémas
- **Netlify Forms** — Collecte de feedbacks utilisateurs

Consultez `package.json` pour la liste complète des dépendances et versions.

## 🗄️ Supabase

### Commandes utiles

```bash
# Se connecter à Supabase
npx supabase login

# Générer les types TypeScript
npx supabase gen types typescript --project-id gaytlowwebmmycswnshu > src/integrations/supabase/types.ts

# Appliquer les migrations
npx supabase db push

# Réinitialiser la base locale
npx supabase db reset

# Démarrer Supabase localement
npx supabase start
```

## 📱 PWA

L'application est installable sur mobile et desktop :

- **Installation** : Ajoutez à l'écran d'accueil depuis le navigateur
- **Notifications push** : Recevez des rappels pour vos routines
- **Mode hors-ligne** : Accès aux données en cache

## 📂 Structure du projet

```
src/
├── components/                 # Composants réutilisables
│   ├── admin/                  # vues / outils admin
│   ├── layout/                 # Header, Navigation, ProtectedRoute, UserMenu
│   ├── project/                # Kanban, EditProjectDialog, DayDeadlinesList
│   ├── routine/                # RoutineCard, Timer, CreateRoutineDialog, DayRoutinesList
│   ├── shared/                 # EmptyState, OnboardingDialog, Loader
│   ├── stats/                  # CalendarHeatmap, WeeklyView, StatsSkeleton
│   ├── theme/                  # ThemeSelector, ThemeToggle
│   ├── ui/                     # primitives shadcn/ui et Radix wrappers
│   └── ...
├── pages/                      # Pages routées
│   ├── Auth.tsx                # Authentification (login / signup)
│   ├── Calendar.tsx            # Calendrier / heatmap
│   ├── Stats.tsx               # Dashboard statistiques
│   ├── Projects.tsx            # Gestion de projets
│   ├── Profile.tsx             # Réglages utilisateur
│   ├── TimerView.tsx           # Vue plein écran du timer
│   ├── Help.tsx                # Page d'aide / documentation
│   ├── NotFound.tsx            # 404
│   ├── admin/                  # pages admin (outils et vues réservées)
│   ├── password/               # pages liées aux password (mot de passe oublié et réinit)
│   └── routine/                # pages liées aux routines (list et détails)
├── integrations/
│   └── supabase/               # client Supabase, types et helpers
├── lib/                        # utilitaires (date.ts, notifications.ts, streak.ts, utils.ts)
├── hooks/                      # hooks personnalisés (useAuth, useRoutines, useStats...)
├── types/                      # types TypeScript (routine.ts, project.ts...)
├── supabase/                   # config, functions, migrations
│   ├── functions/              # serverless functions (ex: welcome-email)
│   └── migrations/             # SQL migrations
├── public/                     # static files (manifest, robots)
├── src/main.tsx                # point d'entrée
├── src/App.tsx                 # routeur / layout global
├── index.html
├── index.css / App.css         # styles globaux
└── ...
```
