export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
}

const AUTH_SERVER_URL = import.meta.env.VITE_AUTH_SERVER_URL || "http://localhost:3000";

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function getGoogleAuthUrl(): Promise<string> {
  const response = await fetch(`${AUTH_SERVER_URL}/api/auth/google/url`, {
    method: "GET",
    credentials: "include",
  });

  const data = await parseJsonSafe(response);

  if (!response.ok || !data?.url) {
    throw new Error(data?.error || "Cannot get Google auth URL");
  }

  return data.url as string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${AUTH_SERVER_URL}/api/user`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) return null;

  const data = await parseJsonSafe(response);
  if (!response.ok) return null;

  return (data ?? null) as AuthUser | null;
}

export async function logout(): Promise<void> {
  await fetch(`${AUTH_SERVER_URL}/api/logout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
}
