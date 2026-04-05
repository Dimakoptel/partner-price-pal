
ALTER TABLE public.saved_calculations
ADD COLUMN partner_request_id uuid REFERENCES public.partner_requests(id) DEFAULT NULL;

ALTER TABLE public.orders
ADD COLUMN partner_request_id uuid REFERENCES public.partner_requests(id) DEFAULT NULL;
