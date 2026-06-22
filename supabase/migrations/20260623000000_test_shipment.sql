-- Add Abuja Hub
INSERT INTO public.branches (id, name, country, city, address, manager_name, phone)
VALUES ('55555555-5555-5555-5555-555555555555', 'PME Abuja Hub', 'Nigeria', 'Abuja', '17 Aminu Kano Crescent', 'Yusuf Adeyemi', '+234-803-555-0102')
ON CONFLICT (id) DO NOTHING;

-- Add Test Shipment
INSERT INTO public.shipments (
  id,
  tracking_number,
  receipt_number,
  sender_name,
  sender_phone,
  sender_email,
  sender_country,
  sender_city,
  sender_address,
  receiver_name,
  receiver_phone,
  receiver_email,
  receiver_country,
  receiver_city,
  receiver_address,
  package_description,
  package_contents,
  quantity,
  weight_kg,
  delivery_type,
  origin_branch_id,
  destination_branch_id,
  destination_country,
  destination_city,
  departure_date,
  expected_arrival_date,
  current_status,
  current_location
) VALUES (
  'deadbeef-dead-beef-dead-beefdeadbeef',
  'PME-AWB-20260622-000001',
  'PME-RCP-20260622-000001',
  'Jonathan Pierce',
  '+1-415-555-0111',
  'jpierce@example.com',
  'USA',
  'San Francisco',
  '120 Market St',
  'Yusuf Adeyemi',
  '+234-803-555-0102',
  'yusuf@example.com',
  'Nigeria',
  'Abuja',
  '17 Aminu Kano Crescent',
  'Enterprise Server Equipment',
  'Electronics',
  2,
  45.50,
  'Express',
  '44444444-4444-4444-4444-444444444444', -- Lagos Hub
  '55555555-5555-5555-5555-555555555555', -- Abuja Hub
  'Nigeria',
  'Abuja',
  '2026-06-22',
  '2026-06-27',
  'in_transit',
  'Lagos, Nigeria'
) ON CONFLICT (tracking_number) DO NOTHING;

-- Add Sample Shipment Events
-- Note: The trigger 'shipments_initial_event_trg' will automatically create 'shipment_registered'.
-- We'll add more events to match the 'in_transit' status.

INSERT INTO public.shipment_events (shipment_id, status, location, note, updated_by_name, event_at)
VALUES
  ('deadbeef-dead-beef-dead-beefdeadbeef', 'received_at_origin', 'Lagos Hub', 'Shipment received at Lagos sorting center', 'Adaeze Okafor', '2026-06-22 09:00:00+00'),
  ('deadbeef-dead-beef-dead-beefdeadbeef', 'processing_sorting', 'Lagos Hub', 'Package sorted and prepared for dispatch', 'Adaeze Okafor', '2026-06-22 14:30:00+00'),
  ('deadbeef-dead-beef-dead-beefdeadbeef', 'dispatched_origin', 'Lagos Hub', 'Dispatched from Lagos Hub to Abuja', 'Adaeze Okafor', '2026-06-22 18:00:00+00'),
  ('deadbeef-dead-beef-dead-beefdeadbeef', 'in_transit', 'En route to Abuja', 'Shipment is currently in transit to the destination city', 'System', '2026-06-23 08:00:00+00');
