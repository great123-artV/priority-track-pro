import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const KEY = "pme_intro_shown";

export function IntroAnimation() {
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY)) {
      setStage(2);
      return;
    }
    setStage(1);
    const t = setTimeout(() => {
      setStage(2);
      sessionStorage.setItem(KEY, "1");
    }, 2200);
    return () => clearTimeout(t);
  }, []);

  if (stage === 2) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-mesh animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(10,15,35,0.55)_100%)]" />
      <div className="relative flex flex-col items-center gap-8 px-6 text-center">
        <div className="glass-panel rounded-2xl px-8 py-7 animate-in zoom-in-95 fade-in duration-700">
          <Logo className="h-16 w-auto md:h-20" />
        </div>
        <div className="h-1 w-56 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-brand" />
        </div>
      </div>
    </div>
  );
}
