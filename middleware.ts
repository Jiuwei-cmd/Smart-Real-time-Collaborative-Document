// src/middleware.ts
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
// import { createServerClient } from '@supabase/ssr';
// import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const publicPaths = ['/auth', '/_next', '/favicon.ico'];
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const supabase = await createServerSupabaseClient();

  // ✅ 关键：先 await cookies()
  // const cookieStore = await cookies();

  // const supabase = createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //   {
  //     cookies: {
  //       getAll() {
  //         return cookieStore.getAll();
  //       },
  //       setAll(cookiesToSet) {
  //         cookiesToSet.forEach(({ name, value, options }) => {
  //           cookieStore.set(name, value, options);
  //         });
  //       },
  //     },
  //   }
  // );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('session:', session);

  if (!session) {
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};