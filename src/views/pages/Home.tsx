import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Flame,
  Clock,
  BarChart2,
  Bell,
  FolderOpen,
  CheckSquare,
  Calendar,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/application/context/AuthContext";

/* ── Scroll-reveal hook ── */
const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
};

const Reveal = ({
  children,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}) => {
  const [ref, inView] = useInView();
  const transforms: Record<string, string> = {
    up: "translateY(60px)",
    left: "translateX(-60px)",
    right: "translateX(60px)",
    none: "none",
  };
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : transforms[direction],
        transition: `opacity 0.9s ease ${delay}ms, transform 0.9s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/* ── BOOM ── */
const BoomReveal = ({ children }: { children: React.ReactNode }) => {
  const [ref, inView] = useInView(0.3);
  return (
    <div ref={ref} className={inView ? "boom-fire" : "boom-hidden"}>
      {children}
    </div>
  );
};

/* ── Timer animé — 3 phases ── */
const TIMER_START = 180; // 3:00

const LiveTimer = () => {
  const [ref, inView] = useInView(0.2);
  const [seconds, setSeconds] = useState(TIMER_START);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;

    let p1: ReturnType<typeof setInterval>;
    let p2: ReturnType<typeof setInterval>;
    let p3: ReturnType<typeof setInterval>;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    // Phase 1 — rapide: 180→90 en ~1.2s (-3s/40ms)
    p1 = setInterval(() => setSeconds((s) => (s > 90 ? s - 3 : s)), 40);

    t1 = setTimeout(() => {
      clearInterval(p1);
      // Phase 2 — normal: 90→70 en ~12s (600ms/tick)
      p2 = setInterval(() => setSeconds((s) => (s > 70 ? s - 1 : s)), 600);

      t2 = setTimeout(() => {
        clearInterval(p2);
        // Phase 3 — accélère: 70→0 en ~5.6s (80ms/tick)
        p3 = setInterval(
          () =>
            setSeconds((s) => {
              if (s <= 0) {
                clearInterval(p3);
                return 0;
              }
              return s - 1;
            }),
          80,
        );
      }, 12000);
    }, 1200);

    return () => {
      clearInterval(p1);
      clearInterval(p2);
      clearInterval(p3);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const progress = Math.round(((TIMER_START - seconds) / TIMER_START) * 100);

  return (
    <div
      ref={ref}
      className="rounded-3xl flex items-center justify-center py-20 px-8"
      style={{
        background: "linear-gradient(135deg, #0a0a0a, #150a00)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="text-center w-full">
        <div
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "0.75rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "1.5rem",
          }}
        >
          Sport 💪 · En cours
        </div>
        <div
          style={{
            fontSize: "5.5rem",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            color: "white",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {mm}:{ss}
        </div>
        <div
          className="mt-6 mx-auto rounded-full overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.1)",
            width: "200px",
            height: "4px",
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #f97316, #fb923c)",
            }}
          />
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: "0.75rem",
            marginTop: "0.75rem",
          }}
        >
          30 min · {progress}% accompli
        </div>
      </div>
    </div>
  );
};

/* ── Marquee ── */
const MARQUEE_ITEMS = [
  { icon: <Flame className="h-4 w-4" />, text: "Streak quotidien" },
  { icon: <Clock className="h-4 w-4" />, text: "Timer intégré" },
  { icon: <BarChart2 className="h-4 w-4" />, text: "Stats détaillées" },
  { icon: <Bell className="h-4 w-4" />, text: "Notifications push" },
  { icon: <FolderOpen className="h-4 w-4" />, text: "Dossiers" },
  { icon: <CheckSquare className="h-4 w-4" />, text: "Tâches" },
  { icon: <Sparkles className="h-4 w-4" />, text: "Éveil hebdomadaire" },
  { icon: <Calendar className="h-4 w-4" />, text: "Calendrier" },
];

const Marquee = () => {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div
      style={{
        overflow: "hidden",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "1.5rem 0",
        background: "#050505",
      }}
    >
      <div
        className="marquee-track flex whitespace-nowrap"
        style={{ width: "max-content", gap: "0" }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="inline-flex items-center shrink-0"
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "1rem",
              fontWeight: 600,
              padding: "0 2.5rem",
            }}
          >
            <span
              style={{
                color: "#fb923c",
                marginRight: "0.65rem",
                display: "flex",
              }}
            >
              {item.icon}
            </span>
            {item.text}
            <span
              style={{
                color: "rgba(255,255,255,0.12)",
                marginLeft: "2.5rem",
                fontSize: "1.2rem",
              }}
            >
              ·
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ACTUS = [
  {
    date: "Mai 2026",
    tag: "Nouveauté",
    title: "L'Éveil 🪺 — une seconde chance pour ton streak",
    desc: "Une série cassée ne signifie plus tout perdre. Active l'Éveil une fois par semaine pour couvrir un jour manqué.",
  },
  {
    date: "Mai 2026",
    tag: "Amélioration",
    title: "Timer plein écran",
    desc: "Le timer passe en plein écran pour un vrai mode focus.",
  },
  {
    date: "Avr. 2026",
    tag: "Amélioration",
    title: "Notifications push repensées",
    desc: "Reçois des rappels au bon moment, complète une routine directement depuis la notification — sans ouvrir l'app.",
  },
  {
    date: "Mar. 2026",
    tag: "Nouveauté",
    title: "Jours de repos 😴",
    desc: "Journée chargée, imprévu, ou simple besoin de souffler — marque tes routines comme repos. Ton streak est préservé.",
  },
];

const NAV_LINKS = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Actus", href: "#actus" },
  { label: "FAQ", href: "#faq" },
];

const FAQ_ITEMS = [
  {
    q: "C'est une appli ou un site web ?",
    a: "Les deux. Daily Routines est une PWA (Progressive Web App) : elle s'installe sur ton téléphone comme une vraie appli, sans passer par l'App Store. Rapide, légère, toujours à jour.",
  },
  {
    q: "Mes données sont-elles privées ?",
    a: "Oui. Tes routines et statistiques sont stockées de manière sécurisée. Aucune donnée n'est revendue ou partagée. Tu peux supprimer ton compte à tout moment.",
  },
  {
    q: "C'est quoi l'Éveil 🪺 ?",
    a: "L'Éveil est une seconde chance hebdomadaire. Si tu rates un jour et que ta série se casse, tu peux activer l'Éveil pour couvrir ce jour manqué — une fois par semaine. Ton streak repart comme si de rien n'était.",
  },
  {
    q: "Les notifications push marchent sur iPhone ?",
    a: "Oui, depuis iOS 16.4. Il faut installer l'app via Safari (Partager → Sur l'écran d'accueil), puis accepter les notifications depuis l'app.",
  },
];

/* ══════════════════════════════════════════════════ */

const Home = () => {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <>
      <style>{`
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes glow-pulse{ 0%,100%{opacity:.2} 50%{opacity:.4} }
        @keyframes marquee   { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes boom {
          0%   { transform:scale(0.02) rotate(-4deg); opacity:0; filter:blur(40px); }
          50%  { transform:scale(1.18) rotate(1.5deg); opacity:1; filter:blur(0px); }
          65%  { transform:scale(0.93) rotate(-0.5deg); }
          80%  { transform:scale(1.06); }
          91%  { transform:scale(0.97); }
          100% { transform:scale(1) rotate(0deg); }
        }
        .phone-float   { animation: float 5s ease-in-out infinite; }
        .glow-animate  { animation: glow-pulse 4s ease-in-out infinite; }
        .marquee-track { animation: marquee 40s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        .boom-hidden   { opacity:0; }
        .boom-fire     { animation: boom 0.8s cubic-bezier(0.2,0.8,0.25,1) forwards; }
        .stat-card     { transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; cursor: default; }
        .stat-card:hover { transform: translateY(-4px) scale(1.03); border-color: rgba(249,115,22,0.45) !important; box-shadow: 0 12px 40px rgba(249,115,22,0.18); }
        .hero-section  { max-height: 130vh; }
        @media (min-width: 768px) { .hero-section { max-height: 200vh; } }
      `}</style>

      <div
        style={{ background: "#0a0a0a", color: "#fff", overflowX: "hidden" }}
      >
        {/* ══ NAVBAR desktop — pill centré ══ */}
        <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 justify-center px-4 pt-4">
          <div
            className="flex items-center gap-1 px-3 py-2.5"
            style={{
              backdropFilter: "blur(24px)",
              background: "rgba(18,18,18,0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "999px",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <a
              href="#"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5 font-bold tracking-tight text-white no-underline px-4 py-2"
              style={{ fontSize: "1.05rem", cursor: "pointer" }}
            >
              <img src="/logo.svg" alt="Daily Routines" className="h-8 w-8" />
              <span>Daily Routines</span>
            </a>
            <div
              style={{
                width: "1px",
                height: "22px",
                background: "rgba(255,255,255,0.12)",
                margin: "0 6px",
              }}
            />
            <nav className="flex items-center">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="hover:text-white transition-colors px-5 py-2.5 rounded-full hover:bg-white/5"
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    textDecoration: "none",
                    fontSize: "1rem",
                  }}
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div
              style={{
                width: "1px",
                height: "22px",
                background: "rgba(255,255,255,0.12)",
                margin: "0 6px",
              }}
            />
            <div className="flex items-center gap-2 pl-1">
              <Link to="/auth">
                <button
                  className="transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: "white",
                    color: "#0a0a0a",
                    fontWeight: 700,
                    padding: "0.6rem 1.5rem",
                    borderRadius: "999px",
                    fontSize: "0.95rem",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Se connecter
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* ══ NAVBAR mobile — barre simple ══ */}
        <header
          className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4"
          style={{ backdropFilter: "blur(20px)", background: "rgba(10,10,10,0.85)" }}
        >
          <a
            href="#"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 font-bold text-white no-underline"
            style={{ fontSize: "1.05rem" }}
          >
            <img src="/logo.svg" alt="Daily Routines" className="h-8 w-8" />
          </a>
          <button
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors outline-none"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
        </header>

        {/* ══ Menu mobile plein écran ══ */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-[60] flex flex-col"
            style={{ background: "#0a0a0a" }}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <img src="/logo.svg" alt="Daily Routines" className="h-8 w-8" />
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors outline-none"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fermer"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <nav className="flex flex-col gap-2 px-8 mt-8">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    textDecoration: "none",
                    fontSize: "2rem",
                    fontWeight: 800,
                    lineHeight: 1.3,
                    padding: "0.4rem 0",
                  }}
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="px-8 mt-10">
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  color: "#fb923c",
                  textDecoration: "none",
                  fontSize: "2rem",
                  fontWeight: 800,
                }}
              >
                Se connecter →
              </Link>
            </div>
          </div>
        )}

        {/* ══ HERO — vidéo pleine largeur, hauteur naturelle ══ */}
        <section
          className="hero-section relative overflow-hidden"
          style={{ paddingTop: "40px" }}
        >
          <video
            className="relative w-full block"
            style={{ opacity: 0.28 }}
            src="/videos/presentation.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          {/* Dégradé gauche seulement pour lisibilité du texte, droite transparente */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(10,10,10,0.92) 40%, rgba(10,10,10,0.3) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 60%, #0a0a0a 100%)",
            }}
          />

          <div
            className="absolute inset-0 z-10 flex items-center w-full"
            style={{ paddingTop: "80px" }}
          >
            <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-28">
              <div className="max-w-2xl">
                <div
                  className="inline-flex items-center gap-2 mb-6 md:mb-10"
                  style={{
                    background: "rgba(249,115,22,0.12)",
                    border: "1px solid rgba(249,115,22,0.25)",
                    borderRadius: "999px",
                    padding: "0.35rem 1rem",
                    color: "#fb923c",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  <Flame className="h-3 w-3" aria-hidden="true" />
                  Gratuit · Aucune carte requise
                </div>

                <h1
                  style={{
                    fontSize: "clamp(3.2rem, 8vw, 6rem)",
                    fontWeight: 900,
                    lineHeight: 0.97,
                    letterSpacing: "-0.04em",
                    marginBottom: "1.75rem",
                  }}
                >
                  La discipline
                  <br />
                  <span
                    style={{
                      background:
                        "linear-gradient(135deg, #fb923c 0%, #fde68a 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    n'attend pas.
                  </span>
                </h1>

                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "clamp(1rem, 2vw, 1.2rem)",
                    lineHeight: 1.75,
                    maxWidth: "480px",
                    marginBottom: "2.5rem",
                  }}
                >
                  Crée tes routines, construis ta série, mesure tes progrès.
                  <br />
                  Chaque habitude forge qui tu deviens.
                </p>

                <div className="flex items-center gap-5 flex-wrap">
                  <Link to="/auth">
                    <button
                      className="flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition-transform"
                      style={{
                        background: "linear-gradient(135deg, #f97316, #fb923c)",
                        color: "white",
                        fontWeight: 700,
                        padding: "1rem 2.2rem",
                        borderRadius: "0.875rem",
                        fontSize: "1.05rem",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 0 50px rgba(249,115,22,0.4)",
                      }}
                    >
                      Commencer gratuitement{" "}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </Link>
                  <a
                    href="#preview"
                    className="hover:text-white transition-colors"
                    style={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: "0.95rem",
                      textDecoration: "none",
                    }}
                  >
                    Voir l'app →
                  </a>
                </div>
                <a
                  href="#install"
                  className="inline-flex items-center gap-2 mt-5 hover:text-white transition-colors"
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "0.82rem",
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
                    paddingBottom: "2px",
                  }}
                >
                  📲 Télécharger l'app
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ══ STATEMENT — BOOM ══ */}
        <section
          className="py-24 md:min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
          style={{ background: "#000" }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(249,115,22,0.07) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
          <div className="text-center relative z-10 max-w-5xl mx-auto">
            <Reveal>
              <p
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  marginBottom: "2.5rem",
                }}
              >
                Ton record personnel
              </p>
            </Reveal>
            <BoomReveal>
              <div
                style={{
                  fontSize: "clamp(7rem, 22vw, 18rem)",
                  fontWeight: 900,
                  lineHeight: 0.85,
                  letterSpacing: "-0.05em",
                  background:
                    "linear-gradient(135deg, #f97316 0%, #fde68a 40%, #fb923c 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                47
              </div>
            </BoomReveal>
            <Reveal delay={400}>
              <div
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 3rem)",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.95)",
                  marginTop: "1.25rem",
                  letterSpacing: "-0.025em",
                }}
              >
                jours. Sans s'arrêter.
              </div>
            </Reveal>
            <Reveal delay={600}>
              <p
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
                  marginTop: "1.5rem",
                  maxWidth: "380px",
                  margin: "1.5rem auto 0",
                  lineHeight: 1.7,
                }}
              >
                Chaque routine complétée renforce ta série. Le prochain record
                t'appartient.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section id="features">
          {/* Streak — clair */}
          <div
            className="flex items-center px-5 md:px-16"
            style={{ background: "#f5f0eb" }}
          >
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center py-14 md:py-24">
              <Reveal direction="left">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8"
                  style={{ background: "rgba(194,65,12,0.1)" }}
                >
                  <Flame
                    className="h-7 w-7"
                    style={{ color: "#c2410c" }}
                    aria-hidden="true"
                  />
                </div>
                <h2
                  style={{
                    fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: "-0.03em",
                    marginBottom: "1.5rem",
                    color: "#0a0a0a",
                  }}
                >
                  Ta série.
                  <br />
                  Chaque jour
                  <br />
                  <span style={{ color: "#c2410c" }}>renforcée.</span>
                </h2>
                <p
                  style={{
                    fontSize: "1.1rem",
                    lineHeight: 1.8,
                    color: "rgba(10,10,10,0.65)",
                    maxWidth: "400px",
                  }}
                >
                  Un système de streak qui récompense ta régularité. Manque un
                  jour ? L'Éveil 🪺 te donne une seconde chance — une fois par
                  semaine.
                </p>
              </Reveal>
              <Reveal direction="right" delay={150}>
                <div
                  className="rounded-3xl flex items-center justify-center py-16 px-8"
                  style={{
                    background: "linear-gradient(135deg, #1a0a00, #0f0600)",
                    border: "1px solid rgba(249,115,22,0.15)",
                  }}
                >
                  <div className="text-center">
                    <div
                      style={{
                        fontSize: "7rem",
                        fontWeight: 900,
                        lineHeight: 1,
                        background: "linear-gradient(135deg, #fb923c, #fde68a)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      26
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Flame
                        className="h-5 w-5 text-orange-400"
                        aria-hidden="true"
                      />
                      <span
                        style={{
                          color: "rgba(255,255,255,0.8)",
                          fontSize: "1rem",
                        }}
                      >
                        jours de série
                      </span>
                    </div>
                    <div className="flex justify-center gap-2 mt-6">
                      {["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map(
                        (d, i) => (
                          <div
                            key={d}
                            className="flex flex-col items-center gap-1.5"
                          >
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background:
                                  i < 6 ? "hsl(142,50%,25%)" : "transparent",
                                border:
                                  i === 6
                                    ? "1.5px dashed rgba(255,255,255,0.3)"
                                    : i < 6
                                      ? "1px solid hsl(142,55%,38%)"
                                      : "1px solid rgba(255,255,255,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {i < 6 && (
                                <span
                                  style={{
                                    color: "#86efac",
                                    fontSize: "0.65rem",
                                  }}
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                color: "rgba(255,255,255,0.5)",
                                fontSize: "0.55rem",
                              }}
                            >
                              {d}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Timer — sombre */}
          <div
            className="flex items-center px-5 md:px-16"
            style={{ background: "#0d0d0d" }}
          >
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center py-14 md:py-24">
              <LiveTimer />
              <Reveal direction="right">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8"
                  style={{ background: "rgba(249,115,22,0.1)" }}
                >
                  <Clock
                    className="h-7 w-7 text-orange-400"
                    aria-hidden="true"
                  />
                </div>
                <h2
                  style={{
                    fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: "-0.03em",
                    marginBottom: "1.5rem",
                  }}
                >
                  Reste dans
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(135deg, #fb923c, #fde68a)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    le flow.
                  </span>
                </h2>
                <p
                  style={{
                    fontSize: "1.1rem",
                    lineHeight: 1.8,
                    color: "rgba(255,255,255,0.7)",
                    maxWidth: "400px",
                  }}
                >
                  Lance un minuteur directement depuis ta routine. Plein écran,
                  sans distraction. Le focus n'est plus une intention — c'est
                  une réalité.
                </p>
              </Reveal>
            </div>
          </div>

          {/* Stats — clair */}
          <div
            className="flex items-center px-5 md:px-16"
            style={{ background: "#f5f0eb" }}
          >
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center py-14 md:py-24">
              <Reveal direction="left">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8"
                  style={{ background: "rgba(194,65,12,0.1)" }}
                >
                  <BarChart2
                    className="h-7 w-7"
                    style={{ color: "#c2410c" }}
                    aria-hidden="true"
                  />
                </div>
                <h2
                  style={{
                    fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: "-0.03em",
                    marginBottom: "1.5rem",
                    color: "#0a0a0a",
                  }}
                >
                  Mesure ce que
                  <br />
                  tu construis
                  <br />
                  <span style={{ color: "#c2410c" }}>vraiment.</span>
                </h2>
                <p
                  style={{
                    fontSize: "1.1rem",
                    lineHeight: 1.8,
                    color: "rgba(10,10,10,0.65)",
                    maxWidth: "400px",
                  }}
                >
                  Taux de complétion, meilleures semaines, tendances — tes stats
                  ne mentent pas. La progression visible est le moteur le plus
                  puissant.
                </p>
              </Reveal>
              <Reveal direction="right" delay={150}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Cette semaine",
                      value: "85%",
                      sub: "taux de complétion",
                    },
                    {
                      label: "Streak record",
                      value: "47j",
                      sub: "sans interruption",
                    },
                    {
                      label: "Meilleure journée",
                      value: "7/7",
                      sub: "routines complétées",
                    },
                    {
                      label: "Ce mois",
                      value: "92%",
                      sub: "régularité globale",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="stat-card rounded-2xl p-5"
                      style={{
                        background: "linear-gradient(135deg, #1a0a00, #0f0600)",
                        border: "1px solid rgba(249,115,22,0.12)",
                      }}
                    >
                      <div
                        style={{
                          color: "rgba(255,255,255,0.55)",
                          fontSize: "0.7rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: 900,
                          color: "#fb923c",
                          lineHeight: 1,
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.6)",
                          fontSize: "0.75rem",
                          marginTop: "0.3rem",
                        }}
                      >
                        {s.sub}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>

          {/* Dossiers & Tâches — sombre */}
          <div
            className="flex items-center px-5 md:px-16"
            style={{ background: "#0d0d0d" }}
          >
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center py-14 md:py-24">
              <Reveal direction="left">
                <div className="flex gap-3 mb-8">
                  <div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl"
                    style={{ background: "rgba(249,115,22,0.1)" }}
                  >
                    <FolderOpen
                      className="h-6 w-6 text-orange-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl"
                    style={{ background: "rgba(249,115,22,0.1)" }}
                  >
                    <CheckSquare
                      className="h-6 w-6 text-orange-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <h2
                  style={{
                    fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: "-0.03em",
                    marginBottom: "1.5rem",
                  }}
                >
                  Organise.
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(135deg, #fb923c, #fde68a)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Avance.
                  </span>
                </h2>
                <p
                  style={{
                    fontSize: "1.1rem",
                    lineHeight: 1.8,
                    color: "rgba(255,255,255,0.7)",
                    maxWidth: "400px",
                  }}
                >
                  Crée des dossiers pour tes projets et objectifs — Mémoire,
                  Voyage, Travail. Décompose chaque projet en tâches à cocher,
                  avec ou sans deadline.
                </p>
              </Reveal>
              <Reveal direction="right" delay={150}>
                <div
                  className="rounded-3xl overflow-hidden"
                  style={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {/* Dossier ouvert — Lancement app */}
                  <div
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      padding: "1rem 1.5rem",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen
                        className="h-4 w-4 text-orange-400"
                        aria-hidden="true"
                      />
                      <span
                        style={{
                          color: "rgba(255,255,255,0.9)",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                        }}
                      >
                        🚀 Lancement side project
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "#fb923c",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                        }}
                      >
                        2/4
                      </span>
                    </div>
                    {[
                      { name: "Définir le MVP", done: true },
                      { name: "Créer la landing page", done: true },
                      {
                        name: "Configurer le domaine",
                        done: false,
                        deadline: "15 juin",
                      },
                      { name: "Partager sur les réseaux", done: false },
                    ].map((t) => (
                      <div
                        key={t.name}
                        className="flex items-center gap-2.5 py-1.5 pl-6"
                      >
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "4px",
                            background: t.done
                              ? "hsl(142,50%,25%)"
                              : "transparent",
                            border: t.done
                              ? "1px solid hsl(142,55%,40%)"
                              : "1px solid rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {t.done && (
                            <span
                              style={{ color: "#86efac", fontSize: "0.55rem" }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            color: t.done
                              ? "rgba(255,255,255,0.4)"
                              : "rgba(255,255,255,0.75)",
                            fontSize: "0.82rem",
                            textDecoration: t.done ? "line-through" : "none",
                            flex: 1,
                          }}
                        >
                          {t.name}
                        </span>
                        {"deadline" in t && (
                          <span
                            style={{
                              color: "#fb923c",
                              fontSize: "0.68rem",
                              fontWeight: 600,
                            }}
                          >
                            📅 {t.deadline}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Dossier fermé — Voyage */}
                  <div
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      padding: "1rem 1.5rem",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen
                        className="h-4 w-4"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                        aria-hidden="true"
                      />
                      <span
                        style={{
                          color: "rgba(255,255,255,0.7)",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                        }}
                      >
                        ✈️ Voyage Tokyo
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "rgba(255,255,255,0.4)",
                          fontSize: "0.7rem",
                        }}
                      >
                        0/3
                      </span>
                    </div>
                  </div>

                  {/* Inbox */}
                  <div style={{ padding: "1rem 1.5rem" }}>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "0.68rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        marginBottom: "0.6rem",
                      }}
                    >
                      Inbox
                    </div>
                    {[
                      { name: "Appeler le médecin", done: false },
                      { name: "Renouveler passeport", done: false },
                    ].map((t) => (
                      <div
                        key={t.name}
                        className="flex items-center gap-2.5 py-1.5"
                      >
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "4px",
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.2)",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            color: "rgba(255,255,255,0.75)",
                            fontSize: "0.82rem",
                          }}
                        >
                          {t.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ APP PREVIEW ══ */}
        <section
          id="preview"
          className="py-16 md:py-32 px-6 relative overflow-hidden"
          style={{ background: "#080808" }}
        >
          <div
            className="glow-animate absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse, rgba(249,115,22,0.15), transparent 65%)",
            }}
          />
          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <Reveal>
              <p
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                L'application
              </p>
              <h2
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  marginBottom: "3.5rem",
                }}
              >
                Simple. <span style={{ color: "#fb923c" }}>Puissant.</span>{" "}
                Quotidien.
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <div className="phone-float relative inline-block">
                <div
                  className="glow-animate absolute -inset-16 rounded-full blur-3xl"
                  style={{
                    background:
                      "radial-gradient(ellipse, rgba(249,115,22,0.35), transparent 65%)",
                  }}
                />
                <div
                  className="relative rounded-[2.8rem] overflow-hidden shadow-2xl mx-auto"
                  style={{
                    border: "3px solid rgba(255,255,255,0.08)",
                    maxWidth: "300px",
                  }}
                >
                  <img
                    src="/preview-dashboard.png"
                    alt="Aperçu Daily Routines — dashboard avec streak, routines du jour et progression"
                    className="w-full block"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ MARQUEE ══ */}
        <Marquee />

        {/* ══ ACTUS ══ */}
        <section
          id="actus"
          className="py-16 md:py-32 px-6 md:px-16"
          style={{ background: "#0d0d0d" }}
        >
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <p
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                Changelog
              </p>
              <h2
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.2rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  marginBottom: "4rem",
                }}
              >
                Dernières <span style={{ color: "#fb923c" }}>nouveautés</span>
              </h2>
            </Reveal>
            {ACTUS.map((a, i) => (
              <Reveal key={a.title} delay={i * 100}>
                <article
                  className="grid gap-8 pb-12"
                  style={{
                    gridTemplateColumns: "auto 1fr",
                    borderBottom:
                      i < ACTUS.length - 1
                        ? "1px solid rgba(255,255,255,0.07)"
                        : "none",
                    paddingTop: i > 0 ? "3rem" : 0,
                  }}
                >
                  <div style={{ paddingTop: "0.3rem" }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#f97316",
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: "0.8rem",
                        }}
                      >
                        {a.date}
                      </span>
                      <span
                        style={{
                          background: "rgba(249,115,22,0.12)",
                          color: "#fb923c",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.65rem",
                          borderRadius: "999px",
                        }}
                      >
                        {a.tag}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        marginBottom: "0.6rem",
                        color: "rgba(255,255,255,0.95)",
                      }}
                    >
                      {a.title}
                    </h3>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.65)",
                        fontSize: "0.9rem",
                        lineHeight: 1.7,
                      }}
                    >
                      {a.desc}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section
          id="faq"
          className="py-16 md:py-32 px-6 md:px-16"
          style={{ background: "#0a0a0a" }}
        >
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <p
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                FAQ
              </p>
              <h2
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.2rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  marginBottom: "4rem",
                }}
              >
                Questions <span style={{ color: "#fb923c" }}>fréquentes</span>
              </h2>
            </Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {FAQ_ITEMS.map((item, i) => (
                <Reveal key={item.q} delay={i * 80}>
                  <div
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                      padding: "1.75rem 0",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.95)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {item.q}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.95rem",
                        lineHeight: 1.75,
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      {item.a}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ INSTALL PWA ══ */}
        <section
          id="install"
          className="py-16 md:py-32 px-6 md:px-16"
          style={{
            background: "#050505",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <p
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                Installation
              </p>
              <h2
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.2rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  marginBottom: "1rem",
                }}
              >
                Sur ton téléphone
                <br />
                <span style={{ color: "#fb923c" }}>en 3 secondes.</span>
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "1rem",
                  marginBottom: "4rem",
                  maxWidth: "480px",
                }}
              >
                Pas d'App Store. Installe directement depuis ton navigateur.
              </p>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* iPhone */}
              <Reveal direction="left" delay={0}>
                <div
                  className="rounded-3xl p-8"
                  style={{
                    background: "linear-gradient(135deg, #0f0f0f, #1a1a1a)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      🍎
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        color: "rgba(255,255,255,0.95)",
                      }}
                    >
                      iPhone / iPad
                    </span>
                  </div>
                  {[
                    { step: "1", text: "Ouvre l'app dans Safari" },
                    { step: "2", text: "Appuie sur l'icône Partager ↑" },
                    { step: "3", text: "\"Sur l'écran d'accueil\"" },
                    { step: "4", text: "Confirme → c'est installé" },
                  ].map((s) => (
                    <div
                      key={s.step}
                      className="flex items-center gap-4 py-2.5"
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "rgba(249,115,22,0.12)",
                          border: "1px solid rgba(249,115,22,0.25)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            color: "#fb923c",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                          }}
                        >
                          {s.step}
                        </span>
                      </div>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.75)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {s.text}
                      </span>
                    </div>
                  ))}
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: "0.75rem",
                      marginTop: "1rem",
                    }}
                  >
                    Notifications push : iOS 16.4+ requis
                  </p>
                </div>
              </Reveal>
              {/* Android */}
              <Reveal direction="right" delay={150}>
                <div
                  className="rounded-3xl p-8"
                  style={{
                    background: "linear-gradient(135deg, #0f0f0f, #1a1a1a)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      🤖
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        color: "rgba(255,255,255,0.95)",
                      }}
                    >
                      Android / Samsung
                    </span>
                  </div>
                  {[
                    { step: "1", text: "Ouvre l'app dans Chrome" },
                    { step: "2", text: "Menu ⋮ en haut à droite" },
                    { step: "3", text: "\"Ajouter à l'écran d'accueil\"" },
                    { step: "4", text: "Confirme → c'est installé" },
                  ].map((s) => (
                    <div
                      key={s.step}
                      className="flex items-center gap-4 py-2.5"
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: "rgba(249,115,22,0.12)",
                          border: "1px solid rgba(249,115,22,0.25)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            color: "#fb923c",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                          }}
                        >
                          {s.step}
                        </span>
                      </div>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.75)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {s.text}
                      </span>
                    </div>
                  ))}
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: "0.75rem",
                      marginTop: "1rem",
                    }}
                  >
                    Chrome peut aussi proposer une bannière automatique
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ CTA FINAL ══ */}
        <section
          className="py-24 md:min-h-[75vh] flex flex-col items-center justify-center px-6 relative overflow-hidden"
          style={{ background: "#000" }}
        >
          <div
            className="glow-animate absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(249,115,22,0.09) 0%, transparent 60%)",
            }}
          />
          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <Reveal>
              <h2
                style={{
                  fontSize: "clamp(3.5rem, 12vw, 9rem)",
                  fontWeight: 900,
                  lineHeight: 0.92,
                  letterSpacing: "-0.04em",
                  marginBottom: "2.5rem",
                }}
              >
                Commence
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #f97316, #fde68a)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  aujourd'hui.
                </span>
              </h2>
            </Reveal>
            <Reveal delay={250}>
              <Link to="/auth">
                <button
                  className="hover:scale-[1.04] active:scale-[0.97] transition-transform"
                  style={{
                    background: "white",
                    color: "#0a0a0a",
                    fontWeight: 800,
                    padding: "1.1rem 3rem",
                    borderRadius: "999px",
                    fontSize: "1.1rem",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  C'est gratuit →
                </button>
              </Link>
            </Reveal>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
