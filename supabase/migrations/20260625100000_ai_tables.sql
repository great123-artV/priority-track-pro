
-- ============ AI KNOWLEDGE BASE ============
CREATE TABLE public.ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_knowledge_base TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_knowledge_base TO authenticated;
GRANT ALL ON public.ai_knowledge_base TO service_role;

ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_base_public_read" ON public.ai_knowledge_base
  FOR SELECT USING (is_active = true);

CREATE POLICY "knowledge_base_staff_all" ON public.ai_knowledge_base
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER ai_knowledge_base_touch BEFORE UPDATE ON public.ai_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ AI INTERACTIONS ============
CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  user_message TEXT,
  assistant_response_summary TEXT,
  detected_language TEXT,
  current_page TEXT,
  intent TEXT,
  was_tracking_request BOOLEAN DEFAULT false,
  tracking_number_if_provided TEXT,
  was_resolved BOOLEAN,
  escalated_to_support BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.ai_interactions TO anon;
GRANT SELECT, INSERT ON public.ai_interactions TO authenticated;
GRANT ALL ON public.ai_interactions TO service_role;

ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interactions_insert_all" ON public.ai_interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "interactions_staff_read" ON public.ai_interactions
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- ============ SEED DATA ============
INSERT INTO public.ai_knowledge_base (title, category, content, language) VALUES
('Who is Priority Mail Express?', 'General', 'Priority Mail Express (PME) is a leading international courier and logistics company specializing in express delivery, secure shipment tracking, and QR-verified receipts. We provide door-to-door coverage across 200+ countries with regional sortation hubs.', 'en'),
('What services do you provide?', 'Services', 'We offer International Express Delivery (next-day, 2-day, and same-week options), Secure Shipment Tracking, QR Code Receipt Verification, Proof of Delivery (signature/photo/GPS), and 24/7 Multilingual Customer Support.', 'en'),
('How does shipment tracking work?', 'Tracking', 'Every shipment is assigned a unique tracking number (e.g., PME-AWB-20260622-000003). You can enter this number on our website or scan the QR code on your receipt to see live status updates, movement history, and estimated delivery times.', 'en'),
('How does QR code tracking work?', 'Tracking', 'Every PME receipt includes a unique QR code. When scanned with a smartphone camera, it takes you directly to the live tracking page for that specific shipment without needing to manually type the tracking number.', 'en'),
('How do receipts work?', 'Receipts', 'When you send a package, you receive an official PME receipt. This receipt contains your receipt number, tracking number, a 6-character verification code, and a QR code. You can use the verification code on our "Verify Receipt" page to confirm the receipt is authentic.', 'en'),
('How can I send a parcel?', 'Shipping', 'To send a parcel, visit any PME branch. Our staff will weigh your package, help you complete the shipping forms, and provide you with a receipt and tracking number. You can also contact us for corporate pickup services.', 'en'),
('What do delivery statuses mean?', 'Tracking', '• Shipment Registered: Your shipment is in our system.\n• Received at Origin: Your package is at the starting branch.\n• Processing/Sorting: Being sorted for transit.\n• Dispatched from Origin: On its way to the destination hub.\n• In Transit: Moving through our international network.\n• Arrived at Destination: Near the final delivery location.\n• Out for Delivery: With a delivery officer for final hand-off.\n• Delivered: Successfully received.', 'en'),
('How do I contact support?', 'Support', 'You can contact us via:\n• WhatsApp: https://wa.me/2340000000000\n• Email: support@prioritymailexpress.com\n• Phone: +234 000 000 0000\n• Live Support: Available through our website assistant during business hours.', 'en'),
('Prohibited Items', 'Shipping', 'For security and safety, we do not ship hazardous materials, explosives, flammable liquids, illegal substances, perishable items without special arrangement, or currency. Please contact your local branch for a full list of restricted items.', 'en');
