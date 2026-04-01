import { api } from "@/services/api.service";

export const authService = {
	// Redirect to Google OAuth
	redirectAdmin() {
		// Derive backend base URL from VITE_API_URL (strip "/api/v1" suffix)
		const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
		const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, "");
		const redirectUrl = `${baseUrl}/admin/auth/google`;
		console.log("Redirecting to:", redirectUrl);
		window.location.href = redirectUrl;
	},

	// Verify token from OAuth callback
	async verifyToken(token: string): Promise<{
		success: boolean;
		data?: any;
		token?: string;
		message?: string;
	}> {
		return api.get(`/auth/verify-token?token=${token}`);
	},

	// Logout current device
	async logout(): Promise<{ success: boolean; message: string }> {
		return api.post("/auth/logout");
	},

	// Logout all devices
	async logoutAll(): Promise<{ success: boolean; message: string }> {
		return api.post("/auth/logout-all");
	},

	// Get current user info
	async getMe(): Promise<{ success: boolean; data: any }> {
		return api.get("/auth/me");
	},
};

export type OAuthAuthSuccessPayload = {
	type: "OAUTH_AUTH_SUCCESS";
	token?: string;
	user?: unknown;
	message?: string;
};

export type OAuthAuthErrorPayload = {
	type: "OAUTH_AUTH_ERROR";
	message?: string;
};

export type OAuthAuthPayload = OAuthAuthSuccessPayload | OAuthAuthErrorPayload;

const AUTH_SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

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
