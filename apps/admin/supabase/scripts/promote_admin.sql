-- Script: Promote User to Super Admin
-- Usage: Replace 'YOUR_EMAIL' with the user's email address.

INSERT INTO public.user_roles (id, role, shop_id)
SELECT id, 'admin', NULL
FROM auth.users
WHERE email = 'admin@platform.com' -- <--- REPLACE THIS EMAIL
ON CONFLICT (id, shop_id) DO NOTHING;

-- Verification
-- SELECT * FROM public.user_roles WHERE role = 'admin' AND shop_id IS NULL;
