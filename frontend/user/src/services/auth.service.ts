export interface AuthUser {
	id?: string;
	email?: string;
	name?: string;
	picture?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const AUTH_SERVER_URL = API_URL.replace(/\/api\/v1\/?$/, "");

function getAccessToken(): string | null {
	return sessionStorage.getItem("access_token");
}

export function setAccessToken(token: string) {
	sessionStorage.setItem("access_token", token);
	localStorage.removeItem("access_token");
}

export function clearAccessToken() {
	sessionStorage.removeItem("access_token");
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
