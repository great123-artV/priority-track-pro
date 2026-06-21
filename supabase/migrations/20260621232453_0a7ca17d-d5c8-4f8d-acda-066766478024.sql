
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('super_admin','branch_manager','operations_officer','dispatcher','driver','customer_support');
CREATE TYPE public.shipment_status AS ENUM (
  'shipment_registered','received_at_origin','processing_sorting','dispatched_origin',
  'in_transit','arrived_destination','out_for_delivery','delivered','delayed','cancelled'
);
CREATE TYPE public.payment_status AS ENUM ('pending','paid','partial','refunded');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  branch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- Auto-create profile + grant super_admin to first user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.email);
  SELECT count(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'operations_officer');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ BRANCHES ============
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  manager_name TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.branches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branches_public_read" ON public.branches FOR SELECT USING (true);
CREATE POLICY "branches_staff_write" ON public.branches FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER branches_touch BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  country TEXT,
  city TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_staff_all" ON public.customers FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER customers_touch BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SEQUENCES for AWB/Receipt numbers ============
CREATE SEQUENCE public.awb_seq START 1;
CREATE SEQUENCE public.receipt_seq START 1;

CREATE OR REPLACE FUNCTION public.next_awb()
RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'PME-AWB-' || to_char(now(),'YYYYMMDD') || '-' || lpad(nextval('public.awb_seq')::text, 6, '0')
$$;
CREATE OR REPLACE FUNCTION public.next_receipt()
RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'PME-RCP-' || to_char(now(),'YYYYMMDD') || '-' || lpad(nextval('public.receipt_seq')::text, 6, '0')
$$;

-- ============ SHIPMENTS ============
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT NOT NULL UNIQUE,
  receipt_number TEXT NOT NULL UNIQUE,

  -- Sender
  sender_name TEXT NOT NULL,
  sender_phone TEXT,
  sender_email TEXT,
  sender_country TEXT,
  sender_city TEXT,
  sender_address TEXT,

  -- Receiver
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT,
  receiver_email TEXT,
  receiver_country TEXT,
  receiver_city TEXT,
  receiver_address TEXT,

  -- Package
  package_description TEXT,
  package_contents TEXT,
  quantity INT NOT NULL DEFAULT 1,
  weight_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_type TEXT NOT NULL DEFAULT 'Express',
  declared_value NUMERIC(12,2) DEFAULT 0,
  insurance_required BOOLEAN NOT NULL DEFAULT false,
  special_handling_note TEXT,

  origin_branch_id UUID REFERENCES public.branches(id),
  destination_branch_id UUID REFERENCES public.branches(id),
  destination_country TEXT,
  destination_city TEXT,

  departure_date DATE,
  expected_arrival_date DATE,

  -- Payment
  registration_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  custom_clearance_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  insurance_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  handling_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',

  current_status public.shipment_status NOT NULL DEFAULT 'shipment_registered',
  current_location TEXT,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shipments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipments_public_read" ON public.shipments FOR SELECT USING (true);
CREATE POLICY "shipments_staff_write" ON public.shipments FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER shipments_touch BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX shipments_tracking_idx ON public.shipments(tracking_number);
CREATE INDEX shipments_receipt_idx ON public.shipments(receipt_number);
CREATE INDEX shipments_status_idx ON public.shipments(current_status);
CREATE INDEX shipments_created_at_idx ON public.shipments(created_at DESC);

-- Auto-fill tracking + receipt numbers
CREATE OR REPLACE FUNCTION public.shipments_set_numbers()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tracking_number IS NULL OR NEW.tracking_number = '' THEN
    NEW.tracking_number := public.next_awb();
  END IF;
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := public.next_receipt();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER shipments_set_numbers_trg BEFORE INSERT ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.shipments_set_numbers();

-- ============ SHIPMENT EVENTS ============
CREATE TABLE public.shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status public.shipment_status NOT NULL,
  location TEXT,
  branch_id UUID REFERENCES public.branches(id),
  note TEXT,
  updated_by_name TEXT,
  updated_by UUID REFERENCES auth.users(id),
  event_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shipment_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipment_events TO authenticated;
GRANT ALL ON public.shipment_events TO service_role;
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read" ON public.shipment_events FOR SELECT USING (true);
CREATE POLICY "events_staff_write" ON public.shipment_events FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX events_shipment_idx ON public.shipment_events(shipment_id, event_at DESC);

-- Auto-bump shipment current_status when a new event is inserted
CREATE OR REPLACE FUNCTION public.bump_shipment_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.shipments
    SET current_status = NEW.status,
        current_location = COALESCE(NEW.location, current_location),
        updated_at = now()
  WHERE id = NEW.shipment_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER events_bump_status AFTER INSERT ON public.shipment_events
FOR EACH ROW EXECUTE FUNCTION public.bump_shipment_status();

-- Create initial "shipment_registered" event automatically
CREATE OR REPLACE FUNCTION public.shipments_initial_event()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.shipment_events (shipment_id, status, location, branch_id, note, updated_by, updated_by_name)
  VALUES (NEW.id, 'shipment_registered',
    COALESCE((SELECT city || ', ' || country FROM public.branches WHERE id = NEW.origin_branch_id), NEW.sender_city),
    NEW.origin_branch_id,
    'Shipment registered in system',
    NEW.created_by,
    COALESCE((SELECT full_name FROM public.profiles WHERE id = NEW.created_by), 'System'));
  RETURN NEW;
END; $$;
CREATE TRIGGER shipments_initial_event_trg AFTER INSERT ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.shipments_initial_event();

-- ============ DELIVERY CONFIRMATIONS ============
CREATE TABLE public.delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL UNIQUE REFERENCES public.shipments(id) ON DELETE CASCADE,
  receiver_name TEXT NOT NULL,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  photo_url TEXT,
  signature_data TEXT,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  note TEXT,
  delivered_by UUID REFERENCES auth.users(id),
  delivered_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.delivery_confirmations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_confirmations TO authenticated;
GRANT ALL ON public.delivery_confirmations TO service_role;
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery_public_read" ON public.delivery_confirmations FOR SELECT USING (true);
CREATE POLICY "delivery_staff_write" ON public.delivery_confirmations FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_staff_read" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "audit_staff_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- ============ DEMO BRANCHES + CUSTOMERS (data only, no auth.users yet) ============
INSERT INTO public.branches (id, name, country, city, address, manager_name, phone) VALUES
  ('11111111-1111-1111-1111-111111111111','PME New York Hub','USA','New York','450 Lexington Ave, NY 10017','Michael Carter','+1-212-555-0101'),
  ('22222222-2222-2222-2222-222222222222','PME London Hub','United Kingdom','London','25 Old Broad Street, EC2N 1HQ','Sarah Bennett','+44-20-7946-0123'),
  ('33333333-3333-3333-3333-333333333333','PME Dubai Hub','United Arab Emirates','Dubai','Sheikh Zayed Rd, Trade Centre 1','Omar Al-Farsi','+971-4-555-0199'),
  ('44444444-4444-4444-4444-444444444444','PME Lagos Hub','Nigeria','Lagos','15 Adeola Odeku St, Victoria Island','Adaeze Okafor','+234-1-555-0177');

INSERT INTO public.customers (name, phone, email, country, city, address) VALUES
  ('Jonathan Pierce','+1-415-555-0111','jpierce@example.com','USA','San Francisco','120 Market St'),
  ('Amelia Khan','+44-7700-900123','amelia.k@example.com','United Kingdom','Manchester','55 Oxford Rd'),
  ('Yusuf Adeyemi','+234-803-555-0102','yusuf@example.com','Nigeria','Abuja','17 Aminu Kano Crescent');
