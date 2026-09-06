import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: me-refresh sesi Auth Supabase di setiap request dan
 * menyinkronkan cookies, supaya Server Components selalu lihat sesi terbaru.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Terapkan ke request supaya handler berikutnya baca cookie baru
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          // Terapkan ke response supaya browser simpan cookie baru
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() me-refresh sesi jika token hampir habis.
  // Jangan pakai getSession() — tidak diverifikasi server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lindungi rute panel: dashboard masyarakat & panel staf butuh login.
  const protectedPaths = ["/masyarakat", "/petugas", "/pimpinan", "/admin"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Jalankan di semua rute kecuali static assets & Next internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)",
  ],
};
