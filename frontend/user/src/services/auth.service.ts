export interface AuthUser {
	id?: string;
	email?: string;
	name?: string;
	picture?: string;
}

export type OAuthAuthSuccessPayload = {
	type: "OAUTH_AUTH_SUCCESS";
	token?: string;
	user?: unknown;
};

export type OAuthAuthErrorPayload = {
	type: "OAUTH_AUTH_ERROR";
	message?: string;
};

export type OAuthAuthPayload = OAuthAuthSuccessPayload | OAuthAuthErrorPayload;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const AUTH_SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

function getAccessToken(): string | null {
	return localStorage.getItem("access_token");
}

export function setAccessToken(token: string) {
	localStorage.setItem("access_token", token);
}

export function clearAccessToken() {
	localStorage.removeItem("access_token");
}

async function parseJsonSafe(response: Response) {
	try {
		return await response.json();
	} catch {
		return null;
	}
}

export async function getGoogleAuthUrl(): Promise<string> {
	return `${AUTH_SERVER_URL}/user/auth/google`;
}

export function getAuthServerOrigin(): string | null {
	try {
		return new URL(AUTH_SERVER_URL).origin;
	} catch {
		return null;
	}
}

export function listenOAuthAuthMessage(options: {
	onSuccess?: (payload: OAuthAuthSuccessPayload) => void | Promise<void>;
	onError?: (payload: OAuthAuthErrorPayload) => void | Promise<void>;
}) {
	const authServerOrigin = getAuthServerOrigin();

	const handler = async (event: MessageEvent) => {
		const allowedOrigins = new Set(
			[window.location.origin, authServerOrigin].filter(Boolean) as string[],
		);
		if (!allowedOrigins.has(event.origin)) return;

		const data = event?.data as OAuthAuthPayload | undefined;
		if (!data || typeof data !== "object") return;

		if (data.type === "OAUTH_AUTH_SUCCESS") {
			await options.onSuccess?.(data);
			return;
		}

		if (data.type === "OAUTH_AUTH_ERROR") {
			await options.onError?.(data);
		}
	};

	window.addEventListener("message", handler);
	return () => window.removeEventListener("message", handler);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
	const token = getAccessToken();
	const response = await fetch(`${API_URL}/auth/me`, {
		method: "GET",
		credentials: "include",
		headers: {
			Accept: "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	});

	if (response.status === 401) return null;

	const data = await parseJsonSafe(response);
	if (!response.ok) return null;

	const user = data?.data;
	if (!user) return null;

	return {
		id: user.id?.toString(),
		email: user.email,
		name: user.full_name,
		picture: user.avatar,
	} as AuthUser;
}

export async function logout(): Promise<void> {
	const token = getAccessToken();
	await fetch(`${API_URL}/auth/logout`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	});

	clearAccessToken();
}
