import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pme:install-dismissed-at";
const DISMISS_DAYS = 7;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

function recentlyDismissed() {
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    const ts = Number(v);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallAppPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (recentlyDismissed()) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    if (isIOS()) {
      const t = window.setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 2500);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBIP);
        window.clearTimeout(t);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* noop */ }
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    else dismiss();
    setDeferred(null);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm">
      <div className="glass-panel rounded-2xl border border-white/15 bg-navy/85 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pme-red/90 text-white">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Download the PME app</div>
            <p className="mt-0.5 text-xs text-white/75">
              {iosHint && !deferred
                ? "Tap the Share icon, then \"Add to Home Screen\" to install."
                : "Install Priority Mail Express for faster tracking and one-tap access."}
            </p>
            <div className="mt-3 flex items-center gap-2">
              {deferred ? (
                <Button size="sm" onClick={install} className="h-8 bg-pme-red hover:bg-pme-red/90 text-white">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Install app
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={dismiss} className="h-8 text-white/80 hover:bg-white/10 hover:text-white">
                Not now
              </Button>
            </div>
          </div>
          <button
            aria-label="Dismiss install prompt"
            onClick={dismiss}
            className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
