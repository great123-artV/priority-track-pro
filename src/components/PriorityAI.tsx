import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, Link } from "@tanstack/react-router";
import {
  MessageCircle,
  X,
  Send,
  Minus,
  Maximize2,
  ChevronRight,
  Headset,
  MessageSquare,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithAI } from "@/lib/ai.server";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  trackingFound?: boolean;
  trackingNumber?: string;
}

export function PriorityAI() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: messageText };
    setHistory((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithAI({
        data: {
          message: messageText,
          history: history.map((m) => ({ role: m.role, content: m.content })),
          language: i18n.language,
          currentPage: location.pathname,
        },
      });

      const assistantMsg: Message = {
        role: "assistant",
        content: response.text,
        trackingFound: response.trackingFound,
        trackingNumber: response.trackingNumber,
      };
      setHistory((prev) => [...prev, assistantMsg]);
    } catch (error) {
      setHistory((prev) => [...prev, { role: "assistant", content: t("ai.error") }]);
    } finally {
      setIsLoading(false);
    }
  };

  const QuickAction = ({ label, text }: { label: string; text: string }) => (
    <Button
      variant="outline"
      size="sm"
      className="h-auto px-3 py-1.5 text-xs text-left justify-start"
      onClick={() => handleSend(text)}
    >
      {label}
    </Button>
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-pme-red text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pme-red opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-pme-red"></span>
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl bg-card shadow-2xl border border-border transition-all duration-300",
        isMinimized
          ? "h-14 w-64"
          : "h-[600px] w-[400px] max-w-[calc(100vw-48px)] max-h-[calc(100vh-48px)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-navy p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pme-red text-white">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold leading-none">Jules AI</div>
            <div className="text-[10px] text-white/60">Virtual Logistics Assistant</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded-md p-1 hover:bg-white/10"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="rounded-md p-1 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Window */}
          <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
            <div className="space-y-4">
              {/* Initial Welcome */}
              <div className="flex flex-col gap-1 max-w-[85%]">
                <div className="rounded-2xl rounded-tl-none bg-muted p-3 text-sm">
                  <p className="font-bold mb-1">{t("ai.greeting")}</p>
                  <p className="mb-2">{t("ai.welcome")}</p>
                  <p className="mb-1">{t("ai.intro")}</p>
                  <p className="mb-1">{t("ai.canHelp")}</p>
                  <ul className="list-disc list-inside mb-2 opacity-90">
                    <li>{t("ai.helpItems.track")}</li>
                    <li>{t("ai.helpItems.process")}</li>
                    <li>{t("ai.helpItems.services")}</li>
                    <li>{t("ai.helpItems.questions")}</li>
                    <li>{t("ai.helpItems.support")}</li>
                  </ul>
                  <p>{t("ai.ask")}</p>
                </div>
              </div>

              {/* Message History */}
              {history.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col gap-1",
                    msg.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl p-3 text-sm max-w-[85%]",
                      msg.role === "user"
                        ? "rounded-tr-none bg-pme-red text-white"
                        : "rounded-tl-none bg-muted",
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.trackingFound && msg.trackingNumber && (
                      <Button asChild variant="secondary" size="sm" className="mt-3 w-full text-xs">
                        <Link to="/track/$tracking" params={{ tracking: msg.trackingNumber }}>
                          {t("ai.viewTracking")} <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-none bg-muted p-3 text-sm">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/30"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/30 [animation-delay:0.2s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/30 [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions (only show at start or after assistant) */}
            {(history.length === 0 || history[history.length - 1].role === "assistant") &&
              !isLoading && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <QuickAction label={t("ai.actions.track")} text="I want to track my shipment" />
                  <QuickAction
                    label={t("ai.actions.services")}
                    text="What services do you offer?"
                  />
                  <QuickAction label={t("ai.actions.times")} text="How long does delivery take?" />
                  <QuickAction
                    label={t("ai.actions.international")}
                    text="Do you ship internationally?"
                  />
                  <QuickAction
                    label={t("ai.actions.pricing")}
                    text="Where can I find pricing information?"
                  />
                  <QuickAction
                    label={t("ai.actions.branches")}
                    text="Where are your branches located?"
                  />
                  <QuickAction label={t("ai.actions.support")} text="I need to contact support" />
                  <QuickAction
                    label={t("ai.actions.faq")}
                    text="Show me frequently asked questions"
                  />
                </div>
              )}
          </ScrollArea>

          {/* Support Escalation (show when support is mentioned or at bottom of FAQ) */}
          {!isLoading &&
            history.some(
              (m) =>
                m.content.toLowerCase().includes("support") ||
                m.content.toLowerCase().includes("contact"),
            ) && (
              <div className="px-4 pb-2">
                <div className="rounded-xl border border-border bg-accent/5 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Connect with us
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] justify-start px-2"
                    >
                      <a
                        href="https://wa.me/2340000000000"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 h-3 w-3 text-green-500" /> WhatsApp
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] justify-start px-2"
                    >
                      <a href="mailto:support@prioritymailexpress.com">
                        <Mail className="mr-2 h-3 w-3 text-blue-500" /> Email
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] justify-start px-2"
                    >
                      <a href="tel:+2340000000000">
                        <Phone className="mr-2 h-3 w-3 text-pme-red" /> Phone
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] justify-start px-2 cursor-not-allowed opacity-50"
                    >
                      <Headset className="mr-2 h-3 w-3" /> Live Support
                    </Button>
                  </div>
                </div>
              </div>
            )}

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("ai.inputPlaceholder")}
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="bg-pme-red hover:bg-pme-red/90"
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
