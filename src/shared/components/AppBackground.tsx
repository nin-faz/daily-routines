const AppBackground = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
    {/* Noise/grain texture */}
    <div
      className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundSize: "200px 200px",
      }}
    />
    {/* Orb haut-droite */}
    <div
      className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.30] dark:opacity-[0.28]"
      style={{ background: "radial-gradient(hsl(var(--primary)), transparent 70%)" }}
    />
    {/* Orb bas-gauche */}
    <div
      className="absolute -bottom-40 -left-40 w-[450px] h-[450px] rounded-full blur-[100px] opacity-[0.22] dark:opacity-[0.20]"
      style={{ background: "radial-gradient(hsl(var(--primary)), transparent 70%)" }}
    />
    {/* Orb centre subtil */}
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-[0.10] dark:opacity-[0.10]"
      style={{ background: "radial-gradient(hsl(var(--secondary)), transparent 70%)" }}
    />
  </div>
);

export default AppBackground;
