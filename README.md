# Daily Routine Tracker

Une application web progressive (PWA) pour gérer vos routines quotidiennes, tâches et dossiers — construite avec React 18, TypeScript et Supabase.

---

## Fonctionnalités

### Routines

- Création avec titre, durée optionnelle et créneau horaire (Matin, Après-midi, Soir)
- Fréquence : quotidienne ou hebdomadaire (jours personnalisés)
- Timer plein écran avec progression circulaire
- Skip aujourd'hui sans casser le streak
- Réinitialisation automatique chaque jour à minuit
- Archivage de routines (consultation sans pollution de la vue principale)
- Vue "Toutes les routines" avec filtres

### Suivi & Statistiques

- Calendrier heatmap (% de complétion par date)
- Historique par routine (taux, streak actuel, streak max)
- Dashboard global : KPIs (taux de complétion, série, record, deadlines) et graphiques d'évolution
- Skeletons animés pendant le chargement

### Tâches & Dossiers

- Tableau Kanban avec drag & drop (To-Do, En cours, Terminé)
- Dossiers avec deadlines et intégration calendrier
- Vue d'ensemble des dossiers avec compteurs de tâches

### Authentification & Sécurité

- Inscription, connexion, déconnexion via Supabase Auth
- Mot de passe oublié et réinitialisation par email
- Route guards : `ProtectedRoute` (avec option `requireAdmin`), `GuestRoute`
- Validation des entrées avec Zod (routines, tâches, dossiers, auth)
- Secrets gérés exclusivement via variables d'environnement

### Notifications Push (PWA)

- Service Worker personnalisé (`public/sw.js`)
- Abonnement sauvegardé en base via Edge Function
- Envoi planifié de notifications via cron Supabase
- Synchronisation automatique à la reconnexion et au focus

### Administration

- Dashboard avec métriques globales
- Gestion des utilisateurs (consultation, suppression)
- Gestion des dossiers et tâches de tous les utilisateurs
- Barre de filtres dédiée (`AdminFilterBar`)

### Expérience Utilisateur

- Onboarding interactif pour les nouveaux utilisateurs
- Chatbot de feedback utilisateur (FeedbackChat + Netlify Forms)
- Bouton d'aide contextuelle
- 6 thèmes de couleur : Orange, Bleu, Vert, Violet, Rose, Cyan
- Mode sombre / clair
- Design responsive (mobile, tablette, desktop)
- États vides illustrés
- Toasts via Sonner

---

## Stack technique

| Catégorie     | Technologie                                 |
| ------------- | ------------------------------------------- |
| UI Framework  | React 18 + TypeScript                       |
| Build         | Vite 5 + SWC                                |
| Styling       | Tailwind CSS 3                              |
| Composants    | shadcn/ui + Radix UI primitives             |
| Backend       | Supabase (Auth, PostgreSQL, Edge Functions) |
| Data fetching | TanStack React Query v5                     |
| Routing       | React Router DOM v6                         |
| Formulaires   | react-hook-form + Zod                       |
| Graphiques    | Recharts                                    |
| Dates         | date-fns                                    |
| Icônes        | lucide-react                                |
| Toasts        | Sonner                                      |
| Emails        | Resend (via Edge Function)                  |
| PWA           | Service Worker custom + Web Push API        |
| Feedbacks     | Netlify Forms                               |

---

## Installation

```bash
# Cloner le projet
git clone https://github.com/nin-faz/daily-routines.git
cd daily-routines

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# → renseigner VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_VAPID_PUBLIC_KEY

# Lancer le serveur de développement
npm run dev
```

## Variables d'environnement

| Variable                 | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `VITE_SUPABASE_URL`      | URL du projet Supabase                         |
| `VITE_SUPABASE_ANON_KEY` | Clé publique Supabase (anon)                   |
| `VITE_VAPID_PUBLIC_KEY`  | Clé publique VAPID pour les notifications push |

> Les clés privées (VAPID privée, clé de service Supabase, Resend API key) sont configurées **uniquement** dans les secrets des Edge Functions Supabase — jamais dans le frontend.

---

## Supabase

### Commandes utiles

```bash
# Authentification CLI
npx supabase login

# Générer les types TypeScript depuis le schéma
npx supabase gen types typescript --project-id <project-id> > src/data/integrations/supabase/types.ts

# Appliquer les migrations
npx supabase db push

# Réinitialiser la base locale
npx supabase db reset

# Démarrer Supabase localement
npx supabase start
```

### Edge Functions

| Fonction                       | Rôle                                            |
| ------------------------------ | ----------------------------------------------- |
| `welcome-email`                | Email de bienvenue à l'inscription (via Resend) |
| `save-subscription`            | Sauvegarde l'abonnement push en base            |
| `send-scheduled-notifications` | Envoi planifié des notifications (cron)         |

### Migrations

```
supabase/migrations/
├── 01_profiles.sql              # Table profiles + RLS
├── 02_routines.sql              # Table routines + RLS
├── 03_folders.sql               # Table folders + RLS
├── 04_tasks.sql                 # Table tasks + RLS
├── 05_push_subscriptions.sql    # Table push_subscriptions
├── 06_cron_notifications.sql    # Config cron pg_cron
└── migration_routines.sql       # Migration fréquence hebdomadaire
```

---

## PWA

L'application est installable sur mobile et desktop :

- **Installation** : "Ajouter à l'écran d'accueil" depuis le navigateur
- **Notifications push** : Rappels planifiés pour vos routines
- **Mode hors-ligne** : Accès aux données en cache via Service Worker
- **Manifest** : `public/manifest.json` (icônes 192px et 512px)

---

## Structure du projet

L'architecture suit **Domain-Driven Design** avec séparation stricte des responsabilités :

```
src/
├── application/                  ← Orchestration app-specific
│   ├── context/                  ← Global state: Auth, User, Theme, Notifications
│   ├── hooks/                    ← React Query bridges: useRoutines, useFolders, useTasks, etc.
│   ├── services/                 ← statsService, notifications, userProfileService
│   ├── routes/                   ← Route guards: ProtectedRoute, GuestRoute
│   └── components/
│       └── layout/               ← App layout: Header, Navigation, NavLink, UserMenu
│
├── shared/                       ← 🔑 Réutilisable partout
│   ├── config/                   ← Static constants: folderOptions, themeColors
│   ├── lib/                      ← Generic utilities: date, days, utils, validationSchemas
│   ├── types/                    ← TypeScript types: routine, task, folder, theme, user
│   └── components/               ← Generic reusable components
│       ├── ui/                   ← shadcn/ui primitives + custom (Button, Card, Dialog, etc.)
│       ├── Loader.tsx            ← App-wide generic components
│       ├── EmptyState.tsx
│       ├── HelpButton.tsx
│       ├── FeedbackChat.tsx
│       └── OnboardingDialog.tsx
│
├── domain/                       ← Pure business logic (framework-agnostic)
│   ├── routineRules.ts           ← Logique métier des routines
│   ├── streak.ts                 ← Calcul des streaks
│   └── builders.ts               ← Constructeurs d'entités (Routine, Folder, Task)
│
├── data/                         ← Data access layer
│   ├── repositories/             ← DB abstraction: routines, folders, tasks, timer, admin, user
│   └── integrations/supabase/    ← Supabase SDK: client.ts, types.ts
│
├── views/                        ← React rendering layer
│   ├── pages/                    ← Route pages
│   │   ├── Auth.tsx              # Login / Signup
│   │   ├── Calendar.tsx          # Calendrier + heatmap
│   │   ├── Stats.tsx             # Dashboard statistiques
│   │   ├── Tasks.tsx             # Tâches et dossiers
│   │   ├── FolderDetails.tsx     # Kanban d'un dossier
│   │   ├── Profile.tsx           # Réglages utilisateur
│   │   ├── NotFound.tsx          # 404
│   │   ├── admin/                # AdminDashboard, AdminUsers, AdminFolders, AdminTasks
│   │   ├── password/             # ForgotPassword, ResetPassword
│   │   └── routine/              # Routines, RoutineDetails, RoutineArchived, AllRoutines, TimerView
│   └── components/               ← Feature-specific components
│       ├── admin/                # AdminFilterBar, AdminLayout
│       ├── calendar/             # CalendarHeatmap, WeeklyView, DayRoutinesList, DayDeadlinesList
│       ├── folder/               # FolderCard, CreateFolderDialog
│       ├── routine/              # RoutineCard, Timer, CreateRoutineDialog, RoutineSkeleton
│       ├── stats/                # StatsSkeleton
│       ├── task/                 # TaskCard, CreateTaskDialog, TaskSkeleton
│       └── theme/                # ThemeSelector, ThemeToggle
│
├── App.tsx                       # Providers + routing (lazy loading)
└── main.tsx                      # Point d'entrée

supabase/
├── functions/                    # Edge Functions
└── migrations/                   # Migrations SQL

public/
├── sw.js                         # Service Worker custom
├── manifest.json                 # PWA manifest
└── robots.txt
```

### Concept clé : Séparation des responsabilités

| Layer              | Contient                        | Dépend de                     |
| ------------------ | ------------------------------- | ----------------------------- |
| **`views/`**       | React rendu uniquement          | `application/`, `shared/`     |
| **`application/`** | Hooks, context, services app    | `domain/`, `data/`, `shared/` |
| **`domain/`**      | Logique pur (builders, calculs) | `shared/types`                |
| **`data/`**        | Accès aux sources de données    | `shared/types`                |
| **`shared/`**      | Réutilisable partout            | Rien (leaf layer)             |

**Flux de dépendances :**

```
views/ → application/ → domain/ + data/ → shared/
```

---

## Scripts disponibles

```bash
npm run dev        # Serveur de développement
npm run build      # Build de production
npm run build:dev  # Build en mode développement
npm run preview    # Prévisualiser le build
npm run lint       # Lint ESLint
```
