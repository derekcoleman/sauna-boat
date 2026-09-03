import { NextResponse, type NextRequest } from "next/server";
import { REF_COOKIE, REF_COOKIE_DAYS, VISITOR_COOKIE } from "@/lib/config";
import { normalizeReferralCode } from "@/lib/referral";

const REF_MAX_AGE = REF_COOKIE_DAYS * 86_400;
const VISITOR_MAX_AGE = 365 * 86_400;

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function unauthorized(message = "Authentication required") {
  return new NextResponse(message, {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"' },
  });
}

function checkAdmin(request: NextRequest): NextResponse | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("Admin is disabled: set ADMIN_PASSWORD.", { status: 503 });
  }
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return unauthorized();
  let decoded = "";
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }
  const supplied = decoded.slice(decoded.indexOf(":") + 1);
  return constantTimeEqual(supplied, password) ? null : unauthorized("Wrong password");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const denied = checkAdmin(request);
    if (denied) return denied;
  }

  const response = NextResponse.next();
  const secure = request.nextUrl.protocol === "https:";

  // First-party visitor id, used to block self-referral from the same browser.
  if (!request.cookies.get(VISITOR_COOKIE)) {
    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      maxAge: VISITOR_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
    });
  }

  // Referral attribution: /r/CODE sets a 30-day cookie. The page itself
  // renders the landing content with a banner.
  const refMatch = pathname.match(/^\/r\/([^/]+)$/);
  if (refMatch) {
    const code = normalizeReferralCode(decodeURIComponent(refMatch[1]));
    if (code) {
      response.cookies.set(REF_COOKIE, code, {
        maxAge: REF_MAX_AGE,
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};
