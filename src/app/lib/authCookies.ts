/** Cookie flags safe for local HTTP and production HTTPS. */
export function authCookieOptions(maxAgeSeconds: number) {
  const isProd = process.env.NODE_ENV === "production";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const secure =
    isProd &&
    (appUrl.startsWith("https://") || process.env.COOKIE_SECURE === "true");

  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function clearAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: false,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
