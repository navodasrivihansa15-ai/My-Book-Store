const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://gmbiynqnswlmqpgzzboy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtYml5bnFuc3dsbXFwZ3p6Ym95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzODM3ODAsImV4cCI6MjEwNjk1OTc4MH0.BIrsdlIwYCfGF9yJ7PNKqXsgojOf7FK18-I4It4bA68');

(async () => {
  const sql = `
CREATE OR REPLACE VIEW public.staff_performance_stats AS
SELECT 
    up.full_name,
    up.email,
    up.role,
    (SELECT COUNT(*) FROM public.orders o WHERE (o.handled_by = up.full_name OR o.handled_by = up.email) AND o.order_source = 'POS') AS total_pos_handled,
    (SELECT COUNT(*) FROM public.orders o WHERE (o.payment_verified_by = up.full_name OR o.payment_verified_by = up.email) AND o.handled_by IS NULL) AS web_payments_verified,
    (SELECT COUNT(*) FROM public.orders o WHERE (o.packed_by = up.full_name OR o.packed_by = up.email) AND o.handled_by IS NULL) AS web_orders_packed
FROM public.user_profiles up
WHERE up.role IN ('ADMIN', 'STAFF', 'OWNER');
  `;
  
  // Note: We need a backend function or direct postgres access to execute raw DDL like CREATE VIEW.
  // We cannot execute this via standard Supabase JS client unless there is an RPC function.
  // But wait, the user HAS Supabase SQL Editor. We should just give them the SQL.
})();
