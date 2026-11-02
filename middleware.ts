import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup")
    || pathname.startsWith("/forgot-password") || pathname.startsWith("/activate")
    || pathname.startsWith("/welcome");

  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Activation gate: authenticated but not yet activated
  if (user) {
    const isActivated = user.user_metadata?.is_activated === true
      || user.email === process.env.ADMIN_EMAIL;
    if (!isActivated && !pathname.startsWith("/activate")) {
      return NextResponse.redirect(new URL("/activate", request.url));
    }
    if (isActivated && pathname.startsWith("/activate")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-192.png|icon-512.png|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
