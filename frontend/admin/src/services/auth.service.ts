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
