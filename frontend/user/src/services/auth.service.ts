export interface AuthUser {
	id?: string;
	email?: string;
	name?: string;
	picture?: string;
	username?: string | null;
	provider?: string | null;
	permissions?: string[];
	roles?: string[];
	is_school_student?: boolean;
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

export type AuthCredentialResponse = {
	success?: boolean;
	token?: string;
	message?: string;
	errors?: Record<string, string[]>;
};

export type RegisterCredentials = {
	full_name: string;
	username: string;
	email: string;
	password: string;
	password_confirmation: string;
};

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

export function getGithubAuthUrl(): string {
	return `${AUTH_SERVER_URL}/user/auth/github`;
}

export async function loginWithCredentials(
	identifier: string,
	password: string,
): Promise<AuthCredentialResponse> {
	const response = await fetch(`${API_URL}/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify({ identifier, password }),
	});
	return response.json();
}

export async function sendRegistrationOtp(
	credentials: RegisterCredentials,
): Promise<RegisterOtpResponse> {
	const response = await fetch(`${API_URL}/auth/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify(credentials),
	});
	return response.json();
}

export async function verifyRegistrationOtp(
	email: string,
	otp: string,
): Promise<VerifyRegisterOtpResponse> {
	const response = await fetch(`${API_URL}/auth/register/verify-otp`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify({ email, otp }),
	});
	return response.json();
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
	if (!token) return null;

	const response = await fetch(`${API_URL}/auth/me`, {
		method: "GET",
		credentials: "include",
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	});

	if (response.status === 401) {
		clearAccessToken();
		return null;
	}

	const data = await parseJsonSafe(response);
	if (!response.ok) return null;

	const user = data?.data;
	if (!user) return null;

	return {
		id: user.id?.toString(),
		email: user.email,
		name: user.full_name,
		picture: user.avatar,
		username: user.username ?? null,
		provider: user.provider ?? null,
		permissions: Array.isArray(user.permissions) ? user.permissions : [],
		roles: Array.isArray(user.roles)
			? user.roles.map((r: { name: string }) => r.name)
			: [],
		is_school_student: user.is_school_student === true,
	} as AuthUser;
}

export type RegisterOtpResponse = { success: boolean; message?: string; errors?: Record<string, string[]> };
export type VerifyRegisterOtpResponse = AuthCredentialResponse;

export type ForgotPasswordResponse = { success: boolean; message?: string };
export type VerifyOtpResponse = { success: boolean; message?: string; reset_token?: string };
export type ResetPasswordResponse = { success: boolean; message?: string };

export async function sendForgotPasswordOtp(email: string): Promise<ForgotPasswordResponse> {
	const response = await fetch(`${API_URL}/auth/forgot-password`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify({ email }),
	});
	return response.json();
}

export async function verifyForgotPasswordOtp(
	email: string,
	otp: string,
): Promise<VerifyOtpResponse> {
	const response = await fetch(`${API_URL}/auth/verify-otp`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify({ email, otp }),
	});
	return response.json();
}

export async function resetPassword(
	email: string,
	resetToken: string,
	password: string,
	passwordConfirmation: string,
): Promise<ResetPasswordResponse> {
	const response = await fetch(`${API_URL}/auth/reset-password`, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify({
			email,
			reset_token: resetToken,
			password,
			password_confirmation: passwordConfirmation,
		}),
	});
	return response.json();
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
