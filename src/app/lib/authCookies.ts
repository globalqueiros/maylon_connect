/** Cookie flags safe for local HTTP and production HTTPS. */
export function authCookieOptions(maxAgeSeconds: number) {
  // Only force Secure when explicitly enabled. Using NEXT_PUBLIC_APP_URL=https
  // while browsing http://localhost drops the session cookie.
  const secure = process.env.COOKIE_SECURE === "true";

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
