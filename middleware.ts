import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const pathname = request.nextUrl.pathname

  if (!token && pathname !== "/" && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|images|icon.svg).*)"],
}
