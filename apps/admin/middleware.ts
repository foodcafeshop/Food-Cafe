
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();
    const path = request.nextUrl.pathname;

    const isPublicPath = path === '/login' || path === '/unauthorized';

    // 1. Unauthenticated -> Login
    if (!session && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Authenticated -> Check Super Admin
    if (session) {
        // If on login, go to dashboard
        if (path === '/login') {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Check permissions
        // Note: RPC call in middleware adds latency but ensures security
        const { data: isSuperAdmin, error } = await supabase.rpc('is_super_admin');

        if (!isSuperAdmin || error) {
            if (path !== '/unauthorized') {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
