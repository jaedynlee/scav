import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Routes that should always be accessible without auth
const PUBLIC_PATHS = ["/auth", "/auth/callback"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((publicPath) =>
    pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

async function checkUserRole(accessToken: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables");
    return null;
  }

  try {
    // First, verify the user and get their ID using the auth API
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!userResponse.ok) {
      return null;
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    if (!userId) {
      return null;
    }

    // Query user_roles joined to roles via REST with the user's access token
    // Assumes FK user_roles.role_id -> roles.id and relationship named "roles"
    const roleResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&select=roles(name)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseAnonKey,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
      }
    );

    if (roleResponse.ok) {
      const roleData = await roleResponse.json();
      if (Array.isArray(roleData) && roleData.length > 0) {
        const first = roleData[0] as any;
        const roleName = first?.roles?.name ?? null;
        return roleName;
      }
      return null;
    }

    // If this fails (e.g. RLS misconfigured), just treat as no role
    return null;
  } catch (error) {
    console.error("Error checking user role:", error);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and public paths through without checks
  if (
    isPublicPath(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets/")
  ) {
    return NextResponse.next();
  }

  // Check for admin routes - require admin role
  if (isAdminPath(pathname)) {
    const sessionCookie = request.cookies.get("authSession")?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("redirectTo", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin role
    const role = await checkUserRole(sessionCookie);
    const isAdmin = role?.toUpperCase() === "ADMIN" || role?.toLowerCase() === "admin";

    if (!isAdmin) {
      // Redirect non-admins to home page
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // For non-admin routes, just check if user is authenticated
  const sessionCookie = request.cookies.get("authSession")?.value;

  if (!sessionCookie) {
    const loginUrl = new URL("/auth", request.url);
    // Preserve where the user was trying to go so you can redirect back after login
    loginUrl.searchParams.set("redirectTo", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply proxy to all application routes except static assets by default
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
