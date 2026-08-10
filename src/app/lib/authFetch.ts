"use client";

/**
 * Authenticated fetch for browser code.
 * Ensures session cookie is warm, refreshes once on 401, then retries.
 */
export async function authFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const options: RequestInit = {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(init.headers || {}),
    },
  };

  // Warm/refresh access_token before protected calls (except /api/me itself)
  if (!input.includes("/api/me")) {
    try {
      await fetch("/api/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // continue — the main request may still succeed
    }
  }

  let res = await fetch(input, options);

  if (res.status === 401) {
    try {
      await fetch("/api/refresh", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      await fetch("/api/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // ignore
    }
    res = await fetch(input, options);
  }

  return res;
}
