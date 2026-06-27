import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeShipmentProgress, STATUS_LABELS } from "./pme";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatInput {
  message: string;
  history: ChatMessage[];
  language: string;
  currentPage: string;
}

export const chatWithAI = createServerFn({ method: "POST" })
  .validator((d: ChatInput) => d)
  .handler(async ({ data: { message, history, language, currentPage } }) => {
    const apiKey = process.env.OPENAI_API_KEY;

    try {
      // 1. Fetch relevant Knowledge Base entries
      let kb = null;
      try {
        const { data } = await supabaseAdmin
          .from("ai_knowledge_base")
          .select("title, content")
          .eq("is_active", true)
          .or(`language.eq.${language},language.eq.en`);
        kb = data;
      } catch (e) {
        console.warn("Failed to fetch KB from Supabase:", e);
      }

      // 2. Detect Tracking Number pattern
      const trackingMatch = message.match(/PME-AWB-\d{8}-\d{6}/i);
      let shipmentData = null;

      if (trackingMatch) {
        const trackingNumber = trackingMatch[0].toUpperCase();
        try {
          const { data: shipment } = await supabaseAdmin
            .from("shipments")
            .select("*")
            .eq("tracking_number", trackingNumber)
            .maybeSingle();

          if (shipment) {
            const [{ data: events }, { data: delivery }] = await Promise.all([
              supabaseAdmin
                .from("shipment_events")
                .select("*")
                .eq("shipment_id", shipment.id)
                .order("event_at", { ascending: false }),
              supabaseAdmin
                .from("delivery_confirmations")
                .select("*")
                .eq("shipment_id", shipment.id)
                .maybeSingle(),
            ]);

            const progress = computeShipmentProgress({
              departure_date: shipment.departure_date,
              expected_arrival_date: shipment.expected_arrival_date,
              current_status: shipment.current_status,
              delivered_at: delivery?.delivered_at,
            });

            shipmentData = {
              tracking_number: shipment.tracking_number,
              current_status: STATUS_LABELS[shipment.current_status] || shipment.current_status,
              origin: `${shipment.sender_city || ""}, ${shipment.sender_country || ""}`,
              destination: `${shipment.destination_city || ""}, ${shipment.destination_country || ""}`,
              expected_delivery: shipment.expected_arrival_date,
              delivery_health: progress.healthLabel,
              latest_movement:
                events && events.length > 0
                  ? `${events[0].location || "In Transit"}: ${events[0].note || ""}`
                  : "Registered",
              time_remaining: progress.countdownLabel,
            };
          }
        } catch (e) {
          console.warn("Failed to fetch shipment from Supabase:", e);
        }
      }

      const systemPrompt = `
You are "Jules AI", the professional virtual logistics assistant for Priority Mail Express (PME).
Your personality: Professional, Friendly, Patient, Helpful, Reliable, Fast, Knowledgeable.
You represent an international logistics company.

KNOWLEDGE BASE:
${kb?.map((item) => `### ${item.title}\n${item.content}`).join("\n\n")}

CURRENT CONTEXT:
- Language: ${language}
- Current Page: ${currentPage}
${shipmentData ? `- Active Shipment Information: ${JSON.stringify(shipmentData)}` : ""}

GUIDELINES:
- Automatically communicate in the language: ${language}.
- If you don't know the answer, politely direct the customer to support.
- NEVER invent shipment updates or guess tracking info.
- If the user asks "Where is my shipment?" and hasn't provided a tracking number, ask for it.
- If a tracking number is provided and found, summarize the status clearly based on the "Active Shipment Information" provided above.
- Never reveal full names, exact addresses, or phone numbers of senders/receivers.
- If the shipment is found, mention at the end of your summary that they can click the "View Full Tracking Details" button.
- Keep responses concise but helpful.

SUPPORT CHANNELS:
- WhatsApp: https://wa.me/2340000000000
- Email: support@prioritymailexpress.com
- Phone: +234 000 000 0000
- Live Support: Live Support Coming Soon
`;

      let assistantMessage = "";

      // 1. Try OpenAI if API Key is present
      if (apiKey) {
        try {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                { role: "system", content: systemPrompt },
                ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: message },
              ],
              temperature: 0.7,
            }),
          });

          if (response.ok) {
            const aiData = await response.json();
            assistantMessage = aiData.choices[0].message.content;
          } else {
            const errorData = await response.json();
            console.warn(
              "OpenAI API error, falling back to Pollinations:",
              errorData.error?.message,
            );
          }
        } catch (e) {
          console.warn("OpenAI fetch failed, falling back to Pollinations:", e);
        }
      }

      // 2. Try Pollinations AI (Free) if OpenAI wasn't used or failed
      if (!assistantMessage) {
        try {
          const response = await fetch("https://text.pollinations.ai/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: [
                { role: "system", content: systemPrompt },
                ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: message },
              ],
              model: "openai",
            }),
          });

          if (response.ok) {
            assistantMessage = await response.text();
          } else {
            console.warn("Pollinations AI error, using rule-based fallback.");
          }
        } catch (e) {
          console.warn("Pollinations AI failed, using rule-based fallback:", e);
        }
      }

      // 3. Last Resort: Rule-based fallback
      if (!assistantMessage) {
        if (shipmentData) {
          assistantMessage =
            `I found shipment ${shipmentData.tracking_number}. It is currently "${shipmentData.current_status}".\n\n` +
            `Origin: ${shipmentData.origin}\n` +
            `Destination: ${shipmentData.destination}\n` +
            `Expected Delivery: ${shipmentData.expected_delivery || "TBD"}\n` +
            `Latest Movement: ${shipmentData.latest_movement}\n` +
            `Status: ${shipmentData.delivery_health} (${shipmentData.time_remaining})`;
        } else {
          // Keyword matching against Knowledge Base
          const lowerMsg = message.toLowerCase();
          const relevantKb = kb?.find(
            (item) =>
              item.title
                .toLowerCase()
                .split(" ")
                .some((word) => word.length > 3 && lowerMsg.includes(word)) ||
              item.content
                .toLowerCase()
                .split(" ")
                .some((word) => word.length > 4 && lowerMsg.includes(word)),
          );

          if (relevantKb) {
            assistantMessage = relevantKb.content;
          } else if (
            lowerMsg.includes("track") ||
            lowerMsg.includes("where") ||
            lowerMsg.includes("status")
          ) {
            assistantMessage =
              "To track your shipment, please provide your tracking number (e.g., PME-AWB-20260622-000003).";
          } else if (
            lowerMsg.includes("price") ||
            lowerMsg.includes("cost") ||
            lowerMsg.includes("how much")
          ) {
            assistantMessage =
              "Pricing depends on destination, weight, and service type. Please visit our pricing page or contact support for a quote.";
          } else {
            assistantMessage =
              "I am Jules AI, your virtual logistics assistant. I can help you track shipments, explain our services, or connect you with support. How can I help you today?";
          }
        }
      }

      try {
        await supabaseAdmin.from("ai_interactions").insert({
          user_message: message,
          assistant_response_summary: assistantMessage.substring(0, 1000),
          detected_language: language,
          current_page: currentPage,
          was_tracking_request: !!trackingMatch,
          tracking_number_if_provided: trackingMatch ? trackingMatch[0].toUpperCase() : null,
        });
      } catch (e) {
        console.warn("Failed to log interaction to Supabase:", e);
      }

      return {
        text: assistantMessage,
        trackingFound: !!shipmentData,
        trackingNumber: shipmentData?.tracking_number,
      };
    } catch (error: unknown) {
      console.error("AI Error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        text: "I encountered an error while processing your request. Please try again or contact support.",
        error: errorMessage,
      };
    }
  });
