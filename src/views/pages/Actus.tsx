import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { usePageTitle } from "@/application/hooks/usePageTitle";

const ACTUS = [
  {
    id: "landing-page",
    date: "Juin 2026",
    isoDate: "2026-06",
    tag: "Nouveauté",
    title: "Page d'accueil publique",
    desc: "Daily Routines dispose désormais d'une landing page publique. Présentation des fonctionnalités, timer animé, FAQ et guide d'installation PWA — tout ce qu'il faut pour découvrir l'app avant de s'inscrire.",
    keywords: ["landing page", "présentation", "PWA"],
  },
  {
    id: "eveil",
    date: "Mai 2026",
    isoDate: "2026-05",
    tag: "Nouveauté",
    title: "L'Éveil 🪺 — une seconde chance pour ton streak",
    desc: "Rater un jour ne signifie plus tout perdre. L'Éveil est une protection de streak consommable, rechargeable chaque semaine (lundi). Active-le pour couvrir un jour manqué — rétroactivement ou préventivement. Ton streak repart comme si de rien n'était.",
    keywords: ["streak", "éveil", "habitudes", "motivation"],
  },
  {
    id: "timer-plein-ecran",
    date: "Mai 2026",
    isoDate: "2026-05",
    tag: "Amélioration",
    title: "Timer plein écran",
    desc: "Le minuteur de routine passe désormais en mode plein écran. Affichage immersif, progression circulaire, zéro distraction. Le focus n'est plus une intention — c'est une réalité.",
    keywords: ["timer", "minuteur", "focus", "plein écran"],
  },
  {
    id: "notifications-push",
    date: "Avr. 2026",
    isoDate: "2026-04",
    tag: "Amélioration",
    title: "Notifications push repensées",
    desc: "Les rappels sont plus intelligents. Tu peux désormais compléter une routine directement depuis la notification push, sans ouvrir l'app. Les notifications s'adaptent à tes créneaux horaires (Matin, Après-midi, Soir) et incluent les deadlines de tes dossiers.",
    keywords: ["notifications push", "rappels", "PWA", "routine"],
  },
  {
    id: "resume-hebdomadaire",
    date: "Avr. 2026",
    isoDate: "2026-04",
    tag: "Nouveauté",
    title: "Résumé hebdomadaire",
    desc: "Chaque dimanche soir, reçois un résumé de ta semaine par notification push. Taux de complétion, streak actuel, meilleures journées — un bilan clair pour repartir motivé le lundi.",
    keywords: ["résumé", "semaine", "statistiques", "habitudes"],
  },
  {
    id: "jours-de-repos",
    date: "Mar. 2026",
    isoDate: "2026-03",
    tag: "Nouveauté",
    title: "Jours de repos 😴",
    desc: "Journée chargée, imprévu, ou simple besoin de souffler — tu peux désormais marquer tes routines comme \"jour de repos\". Ton streak est préservé. L'app ne t'accuse pas, elle t'accompagne.",
    keywords: ["jour de repos", "streak", "flexibilité", "routine quotidienne"],
  },
  {
    id: "record-streak",
    date: "Mar. 2026",
    isoDate: "2026-03",
    tag: "Nouveauté",
    title: "Bannière record personnel 🏆",
    desc: "Quand tu bats ton record de streak all-time, une bannière animée s'affiche. Un moment de célébration mérité — parce que la constance mérite d'être reconnue.",
    keywords: ["record", "streak", "motivation", "habitudes"],
  },
  {
    id: "routines-archivees",
    date: "Fév. 2026",
    isoDate: "2026-02",
    tag: "Nouveauté",
    title: "Archivage de routines",
    desc: "Archive les routines que tu ne pratiques plus sans les supprimer. Elles disparaissent de ta vue principale mais restent consultables. Parfait pour les routines saisonnières ou temporairement mises en pause.",
    keywords: ["archivage", "routines", "organisation"],
  },
  {
    id: "routines-hebdomadaires",
    date: "Fév. 2026",
    isoDate: "2026-02",
    tag: "Nouveauté",
    title: "Routines hebdomadaires",
    desc: "Crée des routines qui n'apparaissent que certains jours de la semaine. Course le lundi, yoga le mercredi et vendredi — l'app s'adapte à ton planning, pas l'inverse.",
    keywords: ["routine hebdomadaire", "planning", "habitudes", "organisation"],
  },
  {
    id: "dossiers-taches",
    date: "Jan. 2026",
    isoDate: "2026-01",
    tag: "Nouveauté",
    title: "Dossiers & Tâches",
    desc: "Organise tes projets et objectifs en dossiers. Décompose chaque projet en tâches à cocher, avec ou sans deadline. Calendrier intégré pour visualiser les échéances. Un vrai gestionnaire de projets léger, dans la même app.",
    keywords: ["dossiers", "tâches", "projets", "organisation", "deadline"],
  },
  {
    id: "notifications-push-v1",
    date: "Jan. 2026",
    isoDate: "2026-01",
    tag: "Nouveauté",
    title: "Notifications push (PWA)",
    desc: "L'app envoie des rappels push directement sur ton téléphone, même fermée. Compatible iOS 16.4+ (Safari) et Android (Chrome). Installe l'app sur ton écran d'accueil pour en profiter.",
    keywords: ["notifications push", "PWA", "rappels", "iPhone", "Android"],
  },
];

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  Nouveauté: { bg: "rgba(249,115,22,0.12)", color: "#fb923c" },
  Amélioration: { bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
};

const Actus = () => {
  usePageTitle("Nouveautés");
  return (
    <>
      <Helmet>
        <title>Nouveautés — Daily Routines</title>
        <meta
          name="description"
          content="Toutes les mises à jour de Daily Routines — nouvelles fonctionnalités, améliorations : Éveil streak, timer plein écran, notifications push, jours de repos et plus."
        />
        <link rel="canonical" href="https://daily-routines.fr/actus" />
        <meta property="og:title" content="Nouveautés — Daily Routines" />
        <meta
          property="og:description"
          content="Toutes les mises à jour de Daily Routines — nouvelles fonctionnalités, améliorations : Éveil streak, timer plein écran, notifications push, jours de repos et plus."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://daily-routines.fr/actus" />
        <meta
          property="og:image"
          content="https://daily-routines.fr/logo.png"
        />
        <meta property="og:locale" content="fr_FR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Nouveautés — Daily Routines" />
        <meta
          name="twitter:description"
          content="Toutes les mises à jour de Daily Routines — Éveil streak, timer plein écran, notifications push, jours de repos et plus."
        />
        <meta
          name="twitter:image"
          content="https://daily-routines.fr/logo.png"
        />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": "https://daily-routines.fr/actus#collectionpage",
              "name": "Nouveautés — Daily Routines",
              "description": "Toutes les mises à jour de Daily Routines — nouvelles fonctionnalités, améliorations : Éveil streak, timer plein écran, notifications push, jours de repos et plus.",
              "url": "https://daily-routines.fr/actus",
              "inLanguage": "fr",
              "isPartOf": { "@id": "https://daily-routines.fr/#webapp" },
              "mainEntity": {
                "@type": "ItemList",
                "@id": "https://daily-routines.fr/actus#itemlist",
                "itemListElement": ACTUS.map((a, i) => ({
                  "@type": "ListItem",
                  "position": i + 1,
                  "name": a.title,
                  "description": a.desc,
                  "url": `https://daily-routines.fr/actus#${a.id}`
                }))
              }
            },
            {
              "@type": "BreadcrumbList",
              "@id": "https://daily-routines.fr/actus#breadcrumb",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://daily-routines.fr/" },
                { "@type": "ListItem", "position": 2, "name": "Nouveautés", "item": "https://daily-routines.fr/actus" }
              ]
            }
          ]
        })}</script>
      </Helmet>
      <style>{`
        body { background: #0a0a0a; }
        .actu-card { transition: border-color 0.2s ease; }
        .actu-card:hover { border-color: rgba(249,115,22,0.2) !important; }
      `}</style>

      <div style={{ background: "#0a0a0a", color: "#fff", minHeight: "100vh" }}>
        {/* ══ HEADER ══ */}
        <header
          className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
          style={{
            backdropFilter: "blur(20px)",
            background: "rgba(10,10,10,0.85)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 hover:text-white transition-colors"
            style={{
              color: "rgba(255,255,255,0.55)",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour
          </Link>
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo Daily Routines" className="h-7 w-7" />
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
              Daily Routines
            </span>
          </div>
          <Link
            to="/auth"
            style={{
              background: "white",
              color: "#0a0a0a",
              fontWeight: 700,
              padding: "0.45rem 1.1rem",
              borderRadius: "999px",
              fontSize: "0.85rem",
              textDecoration: "none",
            }}
          >
            Se connecter
          </Link>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          {/* ══ HERO ══ */}
          <div className="mb-16 md:mb-24">
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              Changelog
            </p>
            <h1
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                fontWeight: 900,
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                marginBottom: "1.25rem",
              }}
            >
              Dernières{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #fb923c, #fde68a)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                nouveautés
              </span>
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "1.05rem",
                lineHeight: 1.7,
                maxWidth: "480px",
              }}
            >
              Toutes les mises à jour de Daily Routines — nouvelles
              fonctionnalités, améliorations et corrections.
            </p>
          </div>

          {/* ══ LISTE ══ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "1.5rem",
              overflow: "hidden",
            }}
          >
            {ACTUS.map((a, i) => (
              <article
                key={a.id}
                id={a.id}
                className="actu-card"
                style={{
                  background: "#0d0d0d",
                  padding: "2rem",
                  borderBottom:
                    i < ACTUS.length - 1
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",
                  border: "1px solid transparent",
                  borderRadius:
                    i === 0
                      ? "1.5rem 1.5rem 0 0"
                      : i === ACTUS.length - 1
                        ? "0 0 1.5rem 1.5rem"
                        : "0",
                }}
              >
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <time
                    dateTime={a.isoDate}
                    style={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {a.date}
                  </time>
                  <span
                    style={{
                      background: TAG_COLORS[a.tag]?.bg,
                      color: TAG_COLORS[a.tag]?.color,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.65rem",
                      borderRadius: "999px",
                    }}
                  >
                    {a.tag}
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    marginBottom: "0.75rem",
                    color: "rgba(255,255,255,0.95)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {a.title}
                </h2>
                <p
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.92rem",
                    lineHeight: 1.75,
                  }}
                >
                  {a.desc}
                </p>
              </article>
            ))}
          </div>

          {/* ══ CTA ══ */}
          <div className="mt-16 text-center">
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
              }}
            >
              Toutes ces fonctionnalités sont disponibles gratuitement.
            </p>
            <Link
              to="/auth"
              style={{
                background: "linear-gradient(135deg, #f97316, #fb923c)",
                color: "white",
                fontWeight: 700,
                padding: "0.9rem 2.2rem",
                borderRadius: "0.875rem",
                fontSize: "1rem",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Commencer gratuitement →
            </Link>
          </div>
        </main>

        {/* ══ FOOTER ══ */}
        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "2rem 1.5rem",
            textAlign: "center",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem" }}>
            © {new Date().getFullYear()} Daily Routines ·{" "}
            <a
              href="https://daily-routines.fr"
              style={{
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
              }}
            >
              daily-routines.fr
            </a>
          </p>
        </footer>
      </div>
    </>
  );
};

export default Actus;
