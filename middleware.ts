import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()

    // Protect Admin Routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Allow access to login page
        if (request.nextUrl.pathname === '/admin/login') {
            if (session) {
                return NextResponse.redirect(new URL('/admin', request.url))
            }
            return response
        }

        // Require session for other admin routes
        if (!session) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        // Check if user has a shop (unless already on create-shop)
        // Relaxed check: Let the client-side handle redirection if shop is missing
        // This prevents infinite loops if middleware RLS context is flaky
        /*
        if (request.nextUrl.pathname !== '/admin/create-shop') {
            const { data: userRole } = await supabase
                .from('user_roles')
                .select('shop_id')
                .eq('id', session.user.id)
                .single();

            if (!userRole) {
                return NextResponse.redirect(new URL('/admin/create-shop', request.url));
            }
        }
        */
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*'],
}
