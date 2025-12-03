import { supabaseAdmin } from '@/lib/supabase-admin';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const cookieStore = cookies();

    // Create a Supabase client with the Auth context of the logged in user
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.delete({ name, ...options })
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin in DB
    const { data: userRole } = await supabase
        .from('user_roles')
        .select('role, shop_id')
        .eq('id', session.user.id)
        .single();

    if (!userRole || userRole.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    // Fetch shop slug
    const { data: shop } = await supabase
        .from('shops')
        .select('slug')
        .eq('id', userRole.shop_id)
        .single();

    if (!shop) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    try {
        const { username, password, name } = await request.json();

        if (!username || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const email = `${username}@${shop.slug}`;

        // 2. Create User in Auth (using Service Role)
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name }
        });

        if (createError) throw createError;
        if (!newUser.user) throw new Error("Failed to create user");

        // 3. Assign Staff Role
        const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
                id: newUser.user.id,
                role: 'staff',
                shop_id: userRole.shop_id // Assign to same shop as admin
            });

        if (roleError) {
            // Rollback: Delete user if role assignment fails
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            throw roleError;
        }

        return NextResponse.json({ success: true, user: newUser.user });

    } catch (error: any) {
        console.error('Error creating staff:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.delete({ name, ...options })
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userRole } = await supabase
        .from('user_roles')
        .select('role, shop_id')
        .eq('id', session.user.id)
        .single();

    if (!userRole || userRole.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: staffRoles, error } = await supabase
        .from('user_roles')
        .select('id, role, created_at')
        .eq('shop_id', userRole.shop_id)
        .eq('role', 'staff');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const staffWithDetails = await Promise.all(staffRoles.map(async (role) => {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(role.id);
        return {
            ...role,
            email: user?.email,
            name: user?.user_metadata?.full_name
        };
    }));

    return NextResponse.json(staffWithDetails);
}
