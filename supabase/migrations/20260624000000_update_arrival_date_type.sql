ALTER TABLE public.shipments
ALTER COLUMN expected_arrival_date TYPE TIMESTAMPTZ USING expected_arrival_date::TIMESTAMPTZ;

ALTER TABLE public.shipments
ALTER COLUMN departure_date TYPE TIMESTAMPTZ USING departure_date::TIMESTAMPTZ;
