import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const getAISettings = createServerFn("GET", async () => {
  console.log("Fetching AI settings...");
  const { data, error } = await supabase
    .from("ai_settings")
    .select("key, value")
    .eq("key", "support_channels")
    .single();

  if (error) {
    console.error("Error fetching AI settings:", error);
    return {
      whatsapp: "https://wa.me/2340000000000",
      email: "support@prioritymailexpress.com",
      phone: "+234 000 000 0000",
      live_support_url: "#",
      live_support_label: "Live Support Coming Soon",
    };
  }

  return data.value as {
    whatsapp: string;
    email: string;
    phone: string;
    live_support_url: string;
    live_support_label: string;
  };
});

export const chatWithAI = createServerFn(
  "POST",
  async (payload: {
    messages: { role: "user" | "assistant" | "system"; content: string }[];
    currentPage: string;
    language: string;
  }) => {
  console.log("chatWithAI called with:", payload);
    const { messages, currentPage, language } = payload;
    const userMessage = messages[messages.length - 1].content;

    // 1. Check for tracking number in user message
    // Support both standard PME-AWB-YYYYMMDD-NNNNNN and demo formats
    const trackingMatch = userMessage.match(/PME-AWB-[A-Z0-9-]+/i);
    let trackingData = null;
    if (trackingMatch) {
      const trackingNumber = trackingMatch[0].toUpperCase();
      const { data } = await supabase
        .from("shipments")
        .select(
          `
        current_status,
        sender_city,
        sender_country,
        receiver_city,
        receiver_country,
        expected_arrival_date,
        departure_date,
        current_location,
        updated_at
      `,
        )
        .eq("tracking_number", trackingNumber)
        .single();

      if (data) {
        trackingData = {
          tracking_number: trackingNumber,
          ...data,
        };
      }
    }

    // 2. Fetch Knowledge Base relevant to the user message
    // In a real scenario, we might use vector search, but here we'll do a simple keyword match
    // or just fetch the most common ones.
    const { data: kbData } = await supabase
      .from("ai_knowledge_base")
      .select("question, answer")
      .eq("is_active", true)
      .limit(10);

    const kbContext =
      kbData?.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n") || "";

    // 3. Prepare System Prompt
    const systemPrompt = `
You are Priority AI, the professional virtual logistics assistant for Priority Mail Express.
Your goal is to be helpful, professional, friendly, and reliable.
You represent an international logistics company.

COMPANY INFO:
Priority Mail Express provides international express delivery, secure tracking, and QR-verified receipts.
We have major hubs in New York, London, Dubai, and Lagos.

CONTEXT:
- Current Page: ${currentPage}
- User Language: ${language}
- Today's Date: ${new Date().toISOString()}

KNOWLEDGE BASE:
${kbContext}

${
  trackingData
    ? `TRACKING INFO FOUND:
${JSON.stringify(trackingData, null, 2)}
When providing tracking info, summarize: Status, Origin, Destination, Estimated Delivery, Latest Movement, and Health (based on dates).`
    : ""
}

GUIDELINES:
- Automatically communicate in the user's language (${language}).
- Never invent shipment updates or guess tracking info.
- If you don't know an answer, politely direct them to support.
- Do not expose internal database details or admin-only info.
- Do not confirm delivery without system records.
- Be concise but helpful.
- If user asks "Where is my shipment?", ask for the tracking number if not provided.
- If tracking info is provided, include a reference to "View Full Tracking Details".
`;

    // 4. Call AI Provider (Mocking OpenAI for now, as I don't have an API key)
    // In a real app, you'd use: const response = await openai.chat.completions.create({...})

    const mockResponse = await getMockAIResponse(
      userMessage,
      trackingData,
      kbData,
      language,
      currentPage,
    );

    // 5. Log interaction (wrapped in try-catch to avoid crashing if table doesn't exist)
    try {
      await supabase.from("ai_interactions").insert({
        user_message: userMessage,
        assistant_response_summary: mockResponse.substring(0, 255),
        detected_language: language,
        current_page: currentPage,
        intent: trackingMatch ? "tracking" : "general_inquiry",
        was_tracking_request: !!trackingMatch,
        tracking_number_if_provided: trackingMatch ? trackingMatch[0] : null,
        was_resolved: true,
      });
    } catch (e) {
      console.error("Failed to log AI interaction:", e);
    }

    return { content: mockResponse };
  },
);

async function getMockAIResponse(
  message: string,
  trackingData: any,
  kbData: any[] | null,
  language: string,
  currentPage: string,
) {
  const msg = message.toLowerCase();

  // In a real implementation, the LLM would respond in the requested language.
  // For the mock, we'll provide some basic translated responses or a disclaimer.
  const isEn = language.startsWith("en");
  const isFr = language.startsWith("fr");
  const isEs = language.startsWith("es");

  if (trackingData) {
    if (isFr) {
      return `J'ai trouvé votre envoi ${trackingData.tracking_number}.
- **Statut:** ${trackingData.current_status.replace(/_/g, " ")}
- **Origine:** ${trackingData.sender_city}, ${trackingData.sender_country}
- **Destination:** ${trackingData.receiver_city}, ${trackingData.receiver_country}
- **Livraison prévue:** ${trackingData.expected_arrival_date || "À déterminer"}
- **Dernier mouvement:** ${trackingData.current_location || "En traitement"}

Vous pouvez cliquer sur le bouton ci-dessous pour voir tous les détails du suivi.`;
    }
    return `I found your shipment ${trackingData.tracking_number}.
- **Status:** ${trackingData.current_status.replace(/_/g, " ")}
- **Origin:** ${trackingData.sender_city}, ${trackingData.sender_country}
- **Destination:** ${trackingData.receiver_city}, ${trackingData.receiver_country}
- **Expected Delivery:** ${trackingData.expected_arrival_date || "TBD"}
- **Latest Movement:** ${trackingData.current_location || "Processing"}

You can click the button below to view the full tracking details on our map.`;
  }

  if (msg.includes("track") || msg.includes("suivi") || msg.includes("rastrear")) {
    if (isFr) return "Je peux vous aider à suivre votre colis. Veuillez fournir votre numéro de suivi.";
    if (isEs) return "Puedo ayudarle a rastrear su envío. Por favor, proporcione su número de seguimiento.";
    return "I can certainly help you track your shipment. Please provide your tracking number (it looks like PME-AWB-YYYYMMDD-NNNNNN).";
  }

  // Simple keyword matching for mock
  if (kbData) {
    for (const item of kbData) {
      if (msg.includes(item.question.toLowerCase())) {
        return item.answer;
      }
    }
  }

  if (currentPage.includes("/track")) {
    return isFr
      ? "Vous êtes sur notre page de suivi. Vous pouvez entrer votre numéro de suivi ici ou me le donner directement pour que je puisse vérifier l'état de votre envoi."
      : "You're on our Tracking page. You can enter your tracking number here or provide it to me directly so I can check your shipment status.";
  }

  if (currentPage.includes("/staff") || currentPage.includes("/shipments/new")) {
    return "It looks like you're creating a new shipment. Make sure to fill in all required fields, including sender and receiver details, package weight, and contents. Let me know if you need help with any specific section.";
  }

  if (currentPage.includes("/contact")) {
    return "You're on our Contact page. If you'd like to speak with a human, I can provide our WhatsApp, email, or phone details right here. Would you like me to show them?";
  }

  if (isFr) return "Bonjour ! Je suis Priority AI. Je suis là pour vous aider avec vos besoins logistiques. Vous pouvez m'interroger sur le suivi, nos services ou comment contacter l'assistance. Comment puis-je vous aider aujourd'hui ?";
  if (isEs) return "¡Hola! Soy Priority AI. Estoy aquí para ayudarle con sus necesidades logísticas. Puede preguntarme sobre el seguimiento, nuestros servicios o cómo ponerse en contacto con el servicio de asistencia. ¿Cómo puedo ayudarle hoy?";

  return "Hello! I'm Priority AI. I'm here to help you with your logistics needs. You can ask me about tracking, our services, or how to contact support. How may I assist you today?";
}
