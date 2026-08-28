import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";
import { sessionOptions, type SessionData } from "./lib/session";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cookie = request.cookies.get(sessionOptions.cookieName)?.value;
  let session: SessionData | null = null;
  if (cookie) {
    try {
      const data = await unsealData<SessionData>(cookie, { password: sessionOptions.password });
      if (data.userId) session = data;
    } catch {
      session = null;
    }
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session && isPublic) {
    const dest = session.role === "作業者" ? "/report/new" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }
  if (session && pathname.startsWith("/admin") && session.role !== "管理者") {
    return NextResponse.redirect(new URL("/report/new", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
