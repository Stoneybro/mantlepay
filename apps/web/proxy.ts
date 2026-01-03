import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const PUBLIC_PATHS = ["/", "/login"];
const PROTECTED_PATHS = ["/deploy", "/wallet"];

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const cookieStore = await cookies();
    const token = cookieStore.get("privy-token");
    const isAuthenticated = !!token;
    const isPublic = !PROTECTED_PATHS.some((path) => pathname.startsWith(path)) &&
        PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));

    if (isPublic) {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL("/wallet", req.url));
        }
        return NextResponse.next();
    }
    const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

    if (isProtected) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    if (!token && isProtected) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};