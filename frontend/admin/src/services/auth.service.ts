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
