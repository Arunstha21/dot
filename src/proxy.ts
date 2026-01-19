import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const AUTH_COOKIE_SECRET = process.env.NEXTAUTH_SECRET
if (!AUTH_COOKIE_SECRET) {
  console.warn("WARNING: NEXTAUTH_SECRET is not set — middleware auth will be disabled.");
}

type IPRecord = { windowStart: number; count: number }
const RATE_WINDOW_MS = 30_000 // 30 Sec
const MAX_REQUESTS_PER_WINDOW = Number(process.env.RATE_LIMIT_MAX || 120)
const ipMap = new Map<string, IPRecord>()

function checkRateLimit(ip: string) {
  const now = Date.now()
  const rec = ipMap.get(ip)
  if (!rec) {
    ipMap.set(ip, { windowStart: now, count: 1 })
    return { ok: true }
  }
  if (now - rec.windowStart > RATE_WINDOW_MS) {
    ipMap.set(ip, { windowStart: now, count: 1 })
    return { ok: true }
  }
  rec.count++
  if (rec.count > MAX_REQUESTS_PER_WINDOW) {
    return {
      ok: false,
      retryAfter: Math.ceil((rec.windowStart + RATE_WINDOW_MS - now) / 1000),
    }
  }
  return { ok: true }
}

const PROTECTED_MATCHERS: Array<{ pattern: RegExp; requireSuperUser?: boolean }> = [
  { pattern: /^\/dashboard(\/|$)/ },
  { pattern: /^\/admin(\/|$)/, requireSuperUser: true }, // only super users
  { pattern: /^\/api\/admin(\/|$)/, requireSuperUser: true },
  { pattern: /^\/api\/private(\/|$)/ }, // example: protect other private APIs
]

export async function proxy(req: NextRequest) {
  try {
    const ip = (req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "unknown") as string

    const rl = checkRateLimit(ip)
    if (!rl.ok) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(rl.retryAfter || 60),
        },
      })
    }

    const pathname = req.nextUrl.pathname

    // only run heavy auth checks for protected routes
    const match = PROTECTED_MATCHERS.find((m) => m.pattern.test(pathname))
    if (!match) return NextResponse.next()

    // read token (NextAuth JWT) at the edge
    const token = await getToken({ req, secret: AUTH_COOKIE_SECRET, secureCookie: process.env.NODE_ENV === "production" })

    if (!token) {
      // redirect to login (client side route). Keeps `next` param to return after login.
      const loginUrl = new URL("/?next=" + encodeURIComponent(req.nextUrl.pathname), req.url)
      return NextResponse.redirect(loginUrl)
    }

    // optional: enforce superUser for some paths
    if (match.requireSuperUser && !token.superUser) {
      // Not authorized
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "content-type": "application/json" } })
    }

    // inject a few headers for downstream server handlers / logging
    const res = NextResponse.next()
    res.headers.set("x-auth-user-id", String(token.id ?? ""))
    res.headers.set("x-auth-user-email", String(token.email ?? ""))
    res.headers.set("x-auth-superuser", String(Boolean(token.superUser)))

    return res
  } catch (err) {
    console.error("Middleware error:", err)
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "content-type": "application/json" } })
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/admin/:path*", "/adduser/:path*", "/settings/:path*"],
}
