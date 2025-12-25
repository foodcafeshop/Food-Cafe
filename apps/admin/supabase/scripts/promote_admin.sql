-- Script: Promote User to Super Admin
-- Usage: Replace 'YOUR_EMAIL' with the user's email address.

INSERT INTO public.user_roles (id, role)
SELECT id, 'superadmin'
FROM auth.users
WHERE email = 'admin@foodcafeshop.in' -- <--- REPLACE THIS EMAIL
ON CONFLICT (id) DO NOTHING;

-- Verification
-- SELECT * FROM public.user_roles WHERE role = 'superadmin';
