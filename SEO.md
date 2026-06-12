# SEO — Daily Routines

Fiche de référence : tout ce qui a été mis en place, pourquoi, et quoi faire ensuite.

---

## 1. Structured Data (JSON-LD)

**Qu'est-ce que c'est ?**
Balises `<script type="application/ld+json">` dans le HTML. Données lisibles par Google pour enrichir les résultats (rich snippets). Format JSON avec un vocabulaire standardisé : schema.org.

**Ce qu'on a fait :**

### `index.html` — schéma global du site (server-rendered, visible sans JS)
1 bloc `@graph` avec 4 entités liées :

- **WebApplication** (`@id: /#webapp`) : type, description, features, prix gratuit, OS, `applicationCategory: "HealthAndFitnessApplication"`, `applicationSubCategory: "Productivity"`, `datePublished`/`dateModified`, lien vers `#org`
- **Organization** (`@id: /#org`) : logo avec `width: 512, height: 512` (requis pour Knowledge Graph)
- **WebSite** (`@id: /#website`) : baseline entity signal, lien vers `#org` via `publisher`
- **FAQPage** : 4 Q&A statiques (citables par ChatGPT/Perplexity sans exécuter le JS)

**Pourquoi `@graph` plutôt qu'un array ?** Un array = 4 entités indépendantes sans lien. `@graph` = un graphe : Google co-référence les entités via les `@id` → Knowledge Panel plus fiable, entity graph correct.

> Important : ces blocs sont dans `index.html` statique → Google les voit en wave 1, sans attendre le JS.

### `Actus.tsx` — schéma de la page changelog (JS-rendered via Helmet)
2 blocs :

- **CollectionPage** avec `mainEntity: ItemList` → 11 `ListItem` (une par entrée changelog)
- **BreadcrumbList** : Accueil > Nouveautés

Limitation : ces blocs sont JS-only → Google les voit après rendu. Les blocs statiques de `index.html` restent la priorité pour l'indexation.

### `<time dateTime>` — ISO 8601
Toutes les entrées `ACTUS` dans `Actus.tsx` ont un champ `isoDate` (ex: `"2026-06"`) bindé au `dateTime` attribute. Le champ `date` (ex: `"Juin 2026"`) reste pour l'affichage visuel.

**Validation :** https://validator.schema.org

---

## 2. Meta tags Open Graph & Twitter Card

**Qu'est-ce que c'est ?**
Balises `<meta property="og:...">` et `<meta name="twitter:...">` dans le `<head>`. Contrôlent l'aperçu quand quelqu'un partage ton lien sur réseaux sociaux (titre, description, image).

**Ce qu'on a fait (via react-helmet-async dans chaque page publique) :**

| Tag | Valeur |
|-----|--------|
| `og:title` | Titre de la page |
| `og:description` | Description courte |
| `og:image` | `https://daily-routines.fr/logo.png` |
| `og:type` | `website` |
| `og:url` | URL canonique de la page |
| `og:locale` | `fr_FR` |
| `twitter:card` | `summary_large_image` |
| `twitter:title` | Même que og:title |
| `twitter:description` | Même que og:description |
| `twitter:image` | Même que og:image |

**Pages concernées :** `Home.tsx`, `Actus.tsx`

---

## 3. Canonical Tags

**Qu'est-ce que c'est ?**
`<link rel="canonical" href="URL">` — dit à Google quelle est l'URL "officielle" d'une page. Évite le duplicate content si la même page est accessible via plusieurs URLs.

**Ce qu'on a fait :**
- `Home.tsx` → canonical `https://daily-routines.fr/`
- `Actus.tsx` → canonical `https://daily-routines.fr/actus`

---

## 4. Sitemap XML

**Fichier :** `public/sitemap.xml`

**Qu'est-ce que c'est ?**
Liste des URLs publiques du site. Google lit ça pour savoir quelles pages crawler en priorité.

**Contenu actuel :**
```xml
<url>
  <loc>https://daily-routines.fr/</loc>
  <lastmod>2026-06-12</lastmod>
</url>
<url>
  <loc>https://daily-routines.fr/actus</loc>
  <lastmod>2026-06-12</lastmod>
</url>
```

> `changefreq` et `priority` supprimés — Google les ignore de toute façon depuis des années.

**Référencé dans :** `robots.txt` via `Sitemap: https://daily-routines.fr/sitemap.xml`

**À faire :** Mettre à jour `lastmod` à chaque modification de contenu significative.

---

## 5. Robots.txt

**Fichier :** `public/robots.txt`

**Qu'est-ce que c'est ?**
Fichier lu par tous les robots avant de crawler. Indique ce qu'ils ont le droit de faire.

**État actuel :**
```
User-agent: *
Allow: /
Allow: /actus
Disallow: /dashboard
Disallow: /routines
Disallow: /routine/
Disallow: /timer/
Disallow: /calendar
Disallow: /tasks
Disallow: /folder/
Disallow: /stats
Disallow: /profile
Disallow: /admin/
Disallow: /reset-password
Disallow: /auth
Disallow: /forgot-password

Sitemap: https://daily-routines.fr/sitemap.xml
```

**Pourquoi Disallow les routes protégées ?** Le `noindex` des routes auth/dashboard est injecté par React (JS-only). Les crawlers non-JS (Bing, Yandex, IA crawlers) ne le voient jamais → crawlent et potentiellement indexent des pages vides. `Disallow` = protection niveau serveur, ne dépend pas du JS.

### Stratégie AI crawlers — décision prise : tout autoriser

**Choix :** autoriser tous les crawlers IA pour maximiser la citation dans ChatGPT, Claude, Google AIO, Perplexity.

**Compromis :** contenu peut servir à entraîner des modèles, mais visibilité dans les réponses IA > protection du contenu pour ce type de site.


**Alternative si changement d'avis :** bloquer training uniquement, autoriser browsing/citation :
```
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: *
Allow: /
```
→ `OAI-SearchBot` = citations ChatGPT (pas training). `GPTBot` = training uniquement.

---

## 6. Noindex sur pages sans valeur SEO

**Pages concernées :** `Auth.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `NotFound.tsx` + toutes les routes protégées via `ProtectedRoute.tsx`

**Pourquoi ?**
Ces pages n'ont aucun contenu utile pour Google :
- `/auth` → formulaire de login, contenu privé
- `/forgot-password`, `/reset-password` → flux auth, inutile dans l'index
- `404` → page d'erreur, ne doit pas remonter dans les résultats

Sans noindex, Google gaspille son crawl budget sur ces pages + peut les afficher dans les résultats.

**Ce qu'on a fait :**
```tsx
<Helmet>
  <meta name="robots" content="noindex, nofollow" />
</Helmet>
```
Ajouté dans chaque page concernée. `ProtectedRoute.tsx` le fait automatiquement pour toutes les pages derrière auth guard.

---

## 7. Canonical tags par page

**Qu'est-ce que c'est ?**
`<link rel="canonical" href="URL">` → dit à Google quelle est l'URL officielle. Évite le duplicate content si même page accessible via plusieurs URLs (ex: avec/sans trailing slash, avec paramètres...).

**Ce qu'on a fait — stratégie double couche :**
- `index.html` : canonical statique `https://daily-routines.fr/` (fallback visible sans JS, wave 1 Google)
- `Home.tsx` Helmet : canonical `https://daily-routines.fr/` (override JS, cohérent avec static)
- `Actus.tsx` Helmet : canonical `https://daily-routines.fr/actus` (surcharge le fallback de index.html pour cette route)

Pourquoi garder les deux ? `index.html` est servi pour toutes les routes côté serveur → sans canonical Helmet, toutes les pages auraient `/` comme canonical. Helmet JS overrides pour `/actus`. Cohérence garantie.

---

## 8. Security headers (Netlify)

**Fichier :** `public/_headers`

**Qu'est-ce que c'est ?**
Headers HTTP envoyés par le serveur avec chaque réponse. Le navigateur les lit et applique des protections.

**Ce qu'on a mis :**

| Header | Valeur | Protège contre |
|--------|--------|----------------|
| `X-Frame-Options` | `DENY` | Clickjacking — ton site ne peut pas être chargé dans un `<iframe>` malveillant |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing — le browser obéit au type déclaré, ne devine pas |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Quand un user clique un lien externe, seul l'origine (`daily-routines.fr`) est transmis, pas le chemin complet (`/dashboard/routines/...`) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Désactive accès caméra/micro/géoloc (inutiles pour l'app) |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS pour 2 ans. `includeSubDomains` couvre `www.` etc. `preload` = inclusion dans la HSTS preload list des navigateurs |

**Netlify :** lit `public/_headers` automatiquement au déploiement, aucune config UI nécessaire.

**CSP (Content-Security-Policy) — ajouté :**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cloud.umami.is; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cloud.umami.is; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```
`unsafe-inline` requis : Vite injecte des scripts inline + react-helmet-async écrit le JSON-LD inline. Une CSP nonce-based serait plus stricte mais nécessite SSR.

**X-Robots-Tag (serveur-side noindex) — ajouté :**
Routes protégées (`/dashboard/*`, `/admin/*`, `/stats/*`, `/routines/*`, `/profile/*`) ont maintenant un `X-Robots-Tag: noindex, nofollow` au niveau HTTP — indépendant du JS React.

**Cache headers — ajoutés :**
- `/assets/*` : `immutable` (1 an) — safe car noms hachés par Vite
- `/videos/*` : 1 jour
- `/*.png`, `/*.svg` : 1 semaine

---

## 9. Noindex sur routes protégées (ProtectedRoute)

**Fichier :** `src/application/routes/ProtectedRoute.tsx`

**Qu'est-ce que c'est ?**
`<meta name="robots" content="noindex, nofollow">` → dit à Google de ne pas indexer cette page.

**Pourquoi ?**
Toutes les routes protégées (`/dashboard`, `/routines`, etc.) redirigent vers `/` si non connecté. Sans noindex, Google pourrait crawler ces URLs et voir une page vide/redirect → gaspillage de crawl budget + pages inutiles dans l'index.

**Ce qu'on a fait :**
Ajout dans `ProtectedRoute.tsx` via Helmet :
```tsx
<Helmet>
  <meta name="robots" content="noindex, nofollow" />
</Helmet>
```
→ S'applique automatiquement à toutes les pages sous auth guard.

---

## 10. WCAG AA Contraste

**Qu'est-ce que c'est ?**
Standard accessibilité. Ratio minimum de contraste entre texte et fond :
- Texte normal : **4.5:1**
- Grand texte (≥18px bold ou ≥24px) : **3:1**

**Impact SEO indirect :** Google valorise l'accessibilité (Core Web Vitals, Lighthouse score).

**Fixes appliqués :**
- `Home.tsx` : nombreux `rgba(255,255,255,0.3)` → `0.75`, `0.35` → `0.55`, etc.
- `Actus.tsx` : `rgba(255,255,255,0.4)` → `0.65`, footer `0.3` → `0.75`
- Séparateur marquee : gris → `#fb923c` (couleur brand)
- Alts images : `"Daily Routines"` → `"Logo Daily Routines"`

**Outil de vérification :** Extension Chrome WCAG Color Contrast Checker

---

## 11. Hierarchy des titres

**Règle :** `h1` → `h2` → `h3`, jamais sauter un niveau.

**Fixes :**
- `Home.tsx` FAQ : titres questions passés en `h3` (sous `h2` "Questions fréquentes")
- `Actus.tsx` : changelog entries restent `h2` (liste plate, pas de sous-sections → correct)

---

## 12. Limites SPA (React)

**Important à comprendre :**
Daily Routines est une SPA (Single Page App). Tout le contenu est rendu par JavaScript côté client.

**Conséquence :** Google doit exécuter le JS pour voir le contenu → délai potentiel d'indexation de **quelques jours à quelques semaines** après déploiement.

**Ce qu'on ne peut pas changer sans SSR/SSG :**
- Contenu initial invisible avant exécution JS
- `<title>` et `<meta description>` injectés par react-helmet-async → Google les voit, mais après JS

**Mitigations appliquées :**
- Fallback `<title>` et `<meta description>` dans `index.html`
- JSON-LD `@graph` dans `index.html` → visible sans JS (wave 1)
- `<noscript>` dans `body` → contenu HTML statique complet (features, L'Éveil, FAQ) visible par GPTBot/ClaudeBot/Perplexity/Bing sans JS

**Prerendering (backlog) :** script Playwright postbuild générant vrais HTML statiques pour `/` et `/actus`. Plus complet que `<noscript>` mais nécessite gérer le `loading` state auth pendant le render headless.

---

## 13. llms.txt — Lisibilité pour les IA

**Fichier :** `public/llms.txt`

**Qu'est-ce que c'est ?**
Fichier texte standardisé lu par les crawlers IA (ChatGPT, Claude, Perplexity...) pour comprendre le site sans exécuter de JS. Équivalent d'un `robots.txt` mais pour les LLMs — donne du contexte structuré sur l'app.

**Contenu :**
- Description de l'app en langage naturel
- Fonctionnalité unique : L'Éveil (streak protection hebdomadaire)
- Stack technique
- Liste des pages publiques avec URLs
- Historique des mises à jour par mois

**Pourquoi ça compte :**
Les IA crawlent en deux modes : training (contenu brut) et citation (réponses aux questions). Un `llms.txt` bien écrit augmente les chances d'être cité correctement dans des réponses comme "quelle app pour les habitudes quotidiennes ?".

---

## 14. H1 orienté mots-clés + Social Proof

**Fichier :** `src/views/pages/Home.tsx`

**Ce qu'on a fait :**

### H1 keyword-rich
Texte descriptif sous le H1 principal mis à jour pour cibler les termes de recherche :
```
L'app PWA gratuite pour créer tes routines quotidiennes, suivre tes habitudes et maintenir ta série. Sur iPhone, Android et navigateur.
```
Mots-clés ciblés : "routines quotidiennes", "habitudes", "PWA", "gratuit", "iPhone", "Android".

### Social proof badges
3 badges factuellement exacts sous la description :
- ✓ Actif depuis janvier 2026
- ✓ Mis à jour en juin 2026
- ✓ 100% gratuit

Signal E-E-A-T (Experience + Trust) : Google et les LLMs valorisent les signaux de crédibilité sur la landing page.

---

## 15. manifest.json — Cohérence PWA

**Fichier :** `public/manifest.json`

**Fixes :**
- `theme_color` : `#f46734` → `#f97316` (aligné avec `index.html` et les couleurs brand)
- `description` : mise à jour pour correspondre à la meta description principale

**Pourquoi ça compte :** Le manifest est lu par Android/Chrome pour installer la PWA. Incohérence de couleur = barre système différente de l'app → mauvaise impression à l'install.

---

## 16. Redirect SPA — window.location vs Navigate

**Fichier :** `src/application/routes/ProtectedRoute.tsx`

**Fix :**
`window.location.href = "/"` → `<Navigate to="/" replace />`

**Pourquoi :** `window.location.href` déclenche un rechargement complet de la page (HTTP redirect). Dans une SPA React, ça réinitialise tout le state et casse le comportement attendu. `<Navigate replace>` fait une navigation client-side sans rechargement, sans créer d'entrée dans l'historique.

---

## 17. IndexNow (optionnel, backlog)

**Qu'est-ce que c'est ?**
Protocole pour notifier Bing, Yandex, Naver immédiatement quand une page change. Google a son propre système (Sitemaps + Search Console).

**À faire si voulu :**
1. Générer une clé sur https://www.indexnow.org
2. Déposer `<clé>.txt` dans `public/`
3. Appeler `https://api.indexnow.org/indexnow?url=<url>&key=<clé>` après chaque déploiement

---

## 18. Checklist déploiement SEO

À faire à chaque mise en prod avec changement de contenu :

- [ ] Mettre à jour `lastmod` dans `sitemap.xml`
- [ ] Vérifier canonical tag cohérent avec l'URL réelle
- [ ] Soumettre sitemap dans Google Search Console
- [ ] Tester JSON-LD sur https://validator.schema.org
- [ ] Vérifier og:image accessible publiquement

---

## 19. Outils de vérification

| Outil | Usage |
|-------|-------|
| Google Search Console | Indexation, erreurs crawl, performance search |
| https://validator.schema.org | Valider JSON-LD |
| PageSpeed Insights | Core Web Vitals, Lighthouse |
| Extension WCAG Chrome | Contraste en temps réel |
| https://www.opengraph.xyz | Aperçu partage réseaux sociaux |
