import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import robotAnimation from "@/assets/animations/robot.json";

interface SplashScreenProps {
  visible: boolean;
}

const SplashScreen = ({ visible }: SplashScreenProps) => {
  const [mounted, setMounted] = useState(true);

  // Démonte le composant après la fin du fade-out (500ms) pour libérer le DOM
  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 500ms ease",
        pointerEvents: visible ? "auto" : "none",
      }}
      aria-hidden={!visible}
    >
      <div
        style={{
          animation: "robot-splash 1.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <Lottie
          animationData={robotAnimation}
          loop={true}
          style={{ width: 140, height: 140 }}
        />
      </div>

      <style>{`
        @keyframes robot-splash {
          0%   { transform: scale(0.05) translateY(40px); opacity: 0; filter: blur(8px); }
          60%  { opacity: 1; filter: blur(0px); }
          100% { transform: scale(1) translateY(0px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
