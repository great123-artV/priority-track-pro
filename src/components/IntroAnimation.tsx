import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const KEY = "pme_intro_shown";

export function IntroAnimation() {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY)) {
      setStage(3);
      return;
    }
    setStage(1);
    const t1 = setTimeout(() => setStage(2), 1400);
    const t2 = setTimeout(() => {
      setStage(3);
      sessionStorage.setItem(KEY, "1");
    }, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (stage === 3) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-hero text-white animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-6 text-center px-6">
        <Logo className="h-20 w-20 animate-in zoom-in-50 duration-700" />
        {stage >= 1 && (
          <div className="text-display text-3xl md:text-5xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
            PRIORITY MAIL EXPRESS
          </div>
        )}
        {stage >= 2 && (
          <div className="text-pme-red text-sm md:text-base tracking-[0.3em] uppercase animate-in fade-in slide-in-from-bottom-2 duration-700">
            International Special Delivery
          </div>
        )}
        <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-pme-red" />
        </div>
      </div>
    </div>
  );
}
