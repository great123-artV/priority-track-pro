import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, Link } from "@tanstack/react-router";
import {
  MessageSquare,
  X,
  Send,
  Minus,
  ExternalLink,
  Phone,
  Mail,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Clock,
  Globe,
  HelpCircle,
  ChevronRight,
  User,
  Bot,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatWithAI, getAISettings } from "@/lib/ai/fns";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  isAction?: boolean;
}

export function PriorityAI() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supportSettings, setSupportSettings] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getAISettings();
      setSupportSettings(settings);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (messages.length === 0) {
      setMessages([{ role: "assistant", content: t("ai.welcome") }]);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithAI({
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        currentPage: location.pathname,
        language: i18n.language,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: response.content }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I'm having trouble connecting right now. Please try again or contact support.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      key: "track",
      label: t("ai.actions.track"),
      icon: Package,
      text: "I want to track my shipment",
    },
    {
      key: "howWorks",
      label: t("ai.actions.howWorks"),
      icon: Search,
      text: "How does shipping work?",
    },
    {
      key: "verify",
      label: t("ai.actions.verify"),
      icon: ShieldCheck,
      text: "How do I verify a receipt?",
    },
    {
      key: "times",
      label: t("ai.actions.times"),
      icon: Clock,
      text: "What are your delivery times?",
    },
    {
      key: "intl",
      label: t("ai.actions.intl"),
      icon: Globe,
      text: "Tell me about international shipping",
    },
    {
      key: "support",
      label: t("ai.actions.support"),
      icon: MessageCircle,
      text: "I need to contact support",
    },
    {
      key: "faq",
      label: t("ai.actions.faq"),
      icon: HelpCircle,
      text: "What are the most frequently asked questions?",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
      {isOpen && !isMinimized && (
        <div className="w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-card border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-navy p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-pme-red flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm leading-none">{t("ai.name")}</div>
                <div className="text-[10px] text-white/70 mt-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Online • Logistics Expert
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10"
                onClick={() => setIsMinimized(true)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 overflow-y-auto" viewportRef={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center",
                      msg.role === "user" ? "bg-muted" : "bg-pme-red/10 text-pme-red",
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl p-3 text-sm whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-pme-red text-pme-red-foreground rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none",
                    )}
                  >
                    {msg.content}

                    {/* Render buttons if tracking info or support info is detected in mock */}
                    {msg.role === "assistant" && msg.content.includes("PME-AWB-") && (
                      <div className="mt-3">
                        <Button asChild size="sm" className="w-full bg-pme-red text-white">
                          <Link
                            to="/track/$tracking"
                            params={{
                              tracking: msg.content.match(/PME-AWB-\d{8}-\d{6}/)?.[0] || "",
                            }}
                          >
                            {t("ai.actions.viewFullDetails")}
                          </Link>
                        </Button>
                      </div>
                    )}

                    {msg.role === "assistant" &&
                      msg.content.includes("contact support") &&
                      supportSettings && (
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2 text-xs"
                            asChild
                          >
                            <a
                              href={supportSettings.whatsapp}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MessageCircle className="h-3 w-3 text-green-500" />{" "}
                              {t("ai.support.whatsapp")}
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2 text-xs"
                            asChild
                          >
                            <a href={`mailto:${supportSettings.email}`}>
                              <Mail className="h-3 w-3 text-blue-500" /> {t("ai.support.email")}
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2 text-xs"
                            asChild
                          >
                            <a href={`tel:${supportSettings.phone}`}>
                              <Phone className="h-3 w-3 text-slate-500" /> {t("ai.support.phone")}
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2 text-xs"
                            disabled
                          >
                            <ExternalLink className="h-3 w-3" />{" "}
                            {supportSettings.live_support_label}
                          </Button>
                        </div>
                      )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-pme-red/10 text-pme-red flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-none p-3 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions (only show at start or when relevant) */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 pb-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Quick Suggestions
              </div>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => handleSend(action.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-full text-[11px] font-medium hover:border-pme-red hover:text-pme-red transition-colors"
                  >
                    <action.icon className="h-3 w-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-background">
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
                className="flex-1 bg-muted border-none rounded-xl h-10"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-xl bg-pme-red hover:bg-pme-red/90 shrink-0"
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="mt-2 text-[9px] text-center text-muted-foreground">
              Powered by Priority Assistant • Responses may be automated.
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <Button
        onClick={isOpen ? () => setIsMinimized(!isMinimized) : handleOpen}
        className={cn(
          "h-14 w-14 rounded-full shadow-elevated transition-all duration-300 pointer-events-auto",
          isOpen && !isMinimized
            ? "bg-white text-navy hover:bg-white/90 rotate-90"
            : "bg-pme-red text-white hover:bg-pme-red/90",
        )}
      >
        {isOpen && !isMinimized ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
    </div>
  );
}
