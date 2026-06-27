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

    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set");
      return {
        text: "I'm sorry, but my AI services are currently unavailable. Please contact support directly.",
        error: "Missing API Key",
      };
    }

    try {
      // 1. Fetch relevant Knowledge Base entries
      const { data: kb } = await supabaseAdmin
        .from("ai_knowledge_base")
        .select("title, content")
        .eq("is_active", true)
        .or(`language.eq.${language},language.eq.en`);

      // 2. Detect Tracking Number pattern
      const trackingMatch = message.match(/PME-AWB-\d{8}-\d{6}/i);
      let shipmentData = null;

      if (trackingMatch) {
        const trackingNumber = trackingMatch[0].toUpperCase();
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
            latest_movement: events && events.length > 0
              ? `${events[0].location || "In Transit"}: ${events[0].note || ""}`
              : "Registered",
            time_remaining: progress.countdownLabel,
          };
        }
      }

      const systemPrompt = `
You are "Priority AI", the professional virtual logistics assistant for Priority Mail Express (PME).
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "OpenAI API error");
      }

      const aiData = await response.json();
      const assistantMessage = aiData.choices[0].message.content;

      await supabaseAdmin.from("ai_interactions").insert({
        user_message: message,
        assistant_response_summary: assistantMessage.substring(0, 1000),
        detected_language: language,
        current_page: currentPage,
        was_tracking_request: !!trackingMatch,
        tracking_number_if_provided: trackingMatch ? trackingMatch[0].toUpperCase() : null,
      });

      return {
        text: assistantMessage,
        trackingFound: !!shipmentData,
        trackingNumber: shipmentData?.tracking_number,
      };
    } catch (error: any) {
      console.error("AI Error:", error);
      return {
        text: "I encountered an error while processing your request. Please try again or contact support.",
        error: error.message,
      };
    }
  });
