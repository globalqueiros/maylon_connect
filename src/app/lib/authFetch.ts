"use client";

async function refreshSession(): Promise<boolean> {
  try {
    const refreshRes = await fetch("/api/refresh", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
    const meRes = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    return meRes.ok || refreshRes.ok;
  } catch {
    return false;
  }
}

/**
 * Authenticated browser fetch.
 * Warms the session, retries once after refresh on 401.
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

  if (!input.includes("/api/me") && !input.includes("/api/refresh")) {
    try {
      await fetch("/api/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // continue
    }
  }

  let res = await fetch(input, options);

  if (res.status === 401) {
    const ok = await refreshSession();
    if (ok) {
      res = await fetch(input, options);
    }
  }

  return res;
}

/** Load current user + trips together for dashboard/viagens. */
export async function fetchTripsSafe(): Promise<{
  user: any | null;
  trips: any[];
  unauthorized: boolean;
}> {
  let user: any | null = null;

  try {
    let meRes = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (meRes.status === 401) {
      await refreshSession();
      meRes = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
    }

    if (meRes.ok) {
      user = await meRes.json();
    }
  } catch {
    // ignore
  }

  try {
    let tripsRes = await fetch("/api/trips", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (tripsRes.status === 401) {
      await refreshSession();
      tripsRes = await fetch("/api/trips", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });
    }

    if (!tripsRes.ok) {
      return {
        user,
        trips: [],
        unauthorized: tripsRes.status === 401,
      };
    }

    const data = await tripsRes.json();
    const trips = Array.isArray(data)
      ? data
      : Array.isArray(data?.trips)
        ? data.trips
        : [];

    return { user, trips, unauthorized: false };
  } catch {
    return { user, trips: [], unauthorized: false };
  }
}
