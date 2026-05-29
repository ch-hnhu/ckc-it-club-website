/**
 * Laravel Echo (Reverb) configuration.
 *
 * Connects to the Reverb WebSocket server using Pusher-compatible protocol.
 * Uses a public channel (no auth) for broadcasting comment visibility changes.
 */
import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Required: expose Pusher on window so Laravel Echo can find it
(window as unknown as Record<string, unknown>).Pusher = Pusher;

const echo = new Echo({
	broadcaster: "reverb",
	key: import.meta.env.VITE_REVERB_APP_KEY as string,
	wsHost: (import.meta.env.VITE_REVERB_HOST as string) ?? "localhost",
	wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
	wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
	forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "http") === "https",
	enabledTransports: ["ws", "wss"],
	// Disable activity checks to avoid unnecessary pings on low-traffic dev setup
	activityTimeout: 120_000,
	pongTimeout: 30_000,
});

export default echo;
