import Echo from "laravel-echo";
import Pusher from "pusher-js";

const reverbAppKey = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
const backendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "http://localhost:8000";

const echo = reverbAppKey
	? (() => {
			// Required: expose Pusher on window so Laravel Echo can find it.
			(window as unknown as Record<string, unknown>).Pusher = Pusher;

			return new Echo({
				broadcaster: "reverb",
				key: reverbAppKey,
				wsHost: (import.meta.env.VITE_REVERB_HOST as string) ?? "localhost",
				wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
				wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
				forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https",
				enabledTransports: ["ws", "wss"],
				activityTimeout: 120_000,
				pongTimeout: 30_000,
				// Private channel auth — token is re-read lazily via updateAuthToken()
				authEndpoint: `${backendUrl}/broadcasting/auth`,
				auth: {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}`,
						Accept: "application/json",
					},
				},
			});
		})()
	: null;

/**
 * Call after login/token-refresh so Echo picks up the new Bearer token
 * before subscribing to private channels.
 */
export function updateEchoAuthToken(token: string): void {
	if (!echo) return;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const pusher = (echo.connector as any).pusher;
	if (pusher?.config?.auth?.headers) {
		pusher.config.auth.headers.Authorization = `Bearer ${token}`;
	}
}

export default echo;
