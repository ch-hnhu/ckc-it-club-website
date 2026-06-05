import Echo from "laravel-echo";
import Pusher from "pusher-js";
import type { ChannelAuthorizationCallback } from "pusher-js";

const reverbAppKey = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
const backendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "http://localhost:8000";

const echo = reverbAppKey
	? (() => {
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
				// Use a custom authorizer so every auth request reads the latest
				// Bearer token from localStorage, even after token refresh or expiry.
				authorizer: (channel: { name: string }) => ({
					authorize: (socketId: string, callback: ChannelAuthorizationCallback) => {
						fetch(`${backendUrl}/api/v1/broadcasting/auth`, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Accept: "application/json",
								Authorization: `Bearer ${localStorage.getItem("access_token") ?? ""}`,
							},
							body: JSON.stringify({
								socket_id: socketId,
								channel_name: channel.name,
							}),
						})
							.then((res) => {
								if (!res.ok) throw new Error(`Broadcasting auth failed: ${res.status}`);
								return res.json();
							})
							.then((data) => callback(null, data))
							.catch((err: Error) => callback(err, null));
					},
				}),
			});
		})()
	: null;

/** @deprecated Token is now read from localStorage on every auth request; this is a no-op. */
export function updateEchoAuthToken(_token: string): void {
	// No-op: the custom authorizer always reads the latest token from localStorage.
}

export default echo;
