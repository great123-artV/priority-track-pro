import { useEffect, useState } from "react";
import { Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, changeLanguage, type LanguageCode } from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher({
  variant = "header",
}: {
  variant?: "header" | "compact" | "menu";
}) {
  const { i18n, t } = useTranslation();
  const [current, setCurrent] = useState<string>(i18n.resolvedLanguage || i18n.language || "en");

  useEffect(() => {
    const onChange = (lng: string) => setCurrent(lng);
    i18n.on("languageChanged", onChange);
    return () => {
      i18n.off("languageChanged", onChange);
    };
  }, [i18n]);

  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  const trigger =
    variant === "compact" ? (
      <button
        type="button"
        aria-label={t("nav.language")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-white/70 text-sm backdrop-blur transition hover:bg-white"
      >
        <span aria-hidden>{active.flag}</span>
      </button>
    ) : (
      <button
        type="button"
        aria-label={t("nav.language")}
        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-white/70 px-3 py-2 text-sm font-medium text-foreground backdrop-blur transition hover:bg-white"
      >
        <Globe className="h-4 w-4 opacity-70" />
        <span aria-hidden>{active.flag}</span>
        <span className="hidden sm:inline">{active.name}</span>
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70vh] w-56 overflow-y-auto">
        {LANGUAGES.map((l) => {
          const isActive = l.code === current;
          return (
            <DropdownMenuItem
              key={l.code}
              onSelect={() => {
                void changeLanguage(l.code as LanguageCode);
              }}
              className="flex cursor-pointer items-center gap-2"
            >
              <span className="text-base leading-none" aria-hidden>
                {l.flag}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{l.name}</span>
                <span className="block text-[11px] text-muted-foreground">{l.english}</span>
              </span>
              {isActive && <Check className="h-4 w-4 text-pme-red" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
