-- ============ AI SETTINGS ============
CREATE TABLE public.ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_settings TO anon, authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_settings_public_read" ON public.ai_settings FOR SELECT USING (true);
CREATE POLICY "ai_settings_staff_all" ON public.ai_settings FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER ai_settings_touch BEFORE UPDATE ON public.ai_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ AI KNOWLEDGE BASE ============
CREATE TABLE public.ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_knowledge_base TO anon, authenticated;
GRANT ALL ON public.ai_knowledge_base TO service_role;
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_kb_public_read" ON public.ai_knowledge_base FOR SELECT USING (is_active = true);
CREATE POLICY "ai_kb_staff_all" ON public.ai_knowledge_base FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER ai_kb_touch BEFORE UPDATE ON public.ai_knowledge_base FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ AI INTERACTIONS ============
CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_message TEXT,
  assistant_response_summary TEXT,
  detected_language TEXT,
  current_page TEXT,
  intent TEXT,
  was_tracking_request BOOLEAN DEFAULT false,
  tracking_number_if_provided TEXT,
  was_resolved BOOLEAN DEFAULT true,
  escalated_to_support BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.ai_interactions TO anon, authenticated;
GRANT SELECT ON public.ai_interactions TO authenticated;
GRANT ALL ON public.ai_interactions TO service_role;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_interactions_insert_all" ON public.ai_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "ai_interactions_staff_read" ON public.ai_interactions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- ============ INITIAL DATA ============
INSERT INTO public.ai_settings (key, value, description) VALUES
  ('support_channels', '{
    "whatsapp": "https://wa.me/2340000000000",
    "email": "support@prioritymailexpress.com",
    "phone": "+234 000 000 0000",
    "live_support_url": "#",
    "live_support_label": "Live Support Coming Soon"
  }', 'Contact details for support escalation');

INSERT INTO public.ai_knowledge_base (question, answer, category) VALUES
  ('How do I send a package?', 'To send a package, visit any of our branches or contact us for a pickup. You will need to provide the sender and receiver details, package contents, and choose a delivery service.', 'Shipping'),
  ('How long does international delivery take?', 'International express delivery typically takes 1-3 business days for major cities and 3-7 business days for other locations worldwide.', 'Services'),
  ('What do I need before shipping?', 'You need the receiver''s full name, phone number, and address. You should also have a clear description of the contents and their value for customs.', 'Shipping'),
  ('How do I track my shipment?', 'You can track your shipment by entering your PME tracking number on our website''s Tracking page or by scanning the QR code on your receipt.', 'Tracking'),
  ('What happens if my shipment is delayed?', 'If a shipment is delayed, our system will update the status to "Delayed". You can contact our support team for more specific information regarding the cause of the delay.', 'Support'),
  ('Can I insure my shipment?', 'Yes, we offer insurance for shipments. You can request insurance during the shipment registration process.', 'Services'),
  ('What payment methods are accepted?', 'We accept various payment methods including credit/debit cards, bank transfers, and cash at our branch locations.', 'Billing'),
  ('Can someone else collect my shipment?', 'Yes, but they must provide a valid ID and the tracking number or receipt. In some cases, an authorization letter from the receiver may be required.', 'Delivery'),
  ('How does QR code tracking work?', 'Every PME receipt has a unique QR code. When scanned with a smartphone, it takes you directly to the live tracking page for that specific shipment.', 'Technology'),
  ('How do I verify my receipt?', 'Go to our Verify Receipt page and enter the receipt number and the 6-character verification code found on your physical receipt.', 'Security'),
  ('What items are prohibited?', 'Prohibited items include explosives, flammable materials, illegal drugs, perishable goods (without special arrangement), and items prohibited by the destination country''s laws.', 'Shipping'),
  ('What countries do you deliver to?', 'We deliver to over 200 countries and territories worldwide. Our network covers almost every major city globally.', 'Services'),
  ('Where are your branches?', 'We have major hubs in New York, London, Dubai, and Lagos, with partner branches in most countries we serve.', 'Locations'),
  ('What does "In Transit" mean?', 'In Transit means your shipment is currently moving through our network between sortation centers or hubs.', 'Status'),
  ('What does "Out for Delivery" mean?', 'Out for Delivery means your shipment has reached the final destination branch and is with a delivery officer for final delivery to the receiver.', 'Status'),
  ('How do I contact support?', 'You can contact us via WhatsApp, email, or phone. Details are available on our Contact page and through the Priority AI assistant.', 'Support');
