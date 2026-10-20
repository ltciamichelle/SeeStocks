import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
const isPlaceholder = !pubKey || pubKey.startsWith("pk_test_placeholder");

const isProtectedRoute = createRouteMatcher([]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url).toString();
    await auth.protect({
      unauthenticatedUrl: signInUrl,
    });
  }
});

export default function middleware(req: NextRequest) {
  // Skip auth protection when Clerk keys are placeholders
  if (isPlaceholder) {
    const res = NextResponse.next();
    res.headers.set("x-clerk-placeholder", "true");
    return res;
  }
  return (clerkHandler as unknown as (r: NextRequest) => Promise<NextResponse>)(req);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
