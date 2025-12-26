import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const PUBLIC_PATHS = ["/", "/login"] as const;
const PROTECTED_PATHS = ["/deploy", "/wallet"] as const;
export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const cookieStore = await cookies();
    const token = cookieStore.get("privy-token");
    const isAuthenticated = !!token;
    const walletAddress = req.cookies.get("wallet-deployed")?.value;
    const walletDeployed = !!walletAddress;
    const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
    const isPublic = !isProtected && PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
    if (isPublic) {
        if (isAuthenticated) {

            if (walletDeployed) {
                return NextResponse.redirect(new URL("/wallet", req.url));
            } else {
                return NextResponse.redirect(new URL("/deploy", req.url));
            }
        }
        return NextResponse.next();
    }
    if (isProtected) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        if (pathname.startsWith("/deploy")) {
            if (walletDeployed) {
                return NextResponse.redirect(new URL("/wallet", req.url));
            }
            return NextResponse.next();
        }
        if (pathname.startsWith("/wallet")) {
            if (!walletDeployed) {
                return NextResponse.redirect(new URL("/deploy", req.url));
            }
            return NextResponse.next();
        }
    }
    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};