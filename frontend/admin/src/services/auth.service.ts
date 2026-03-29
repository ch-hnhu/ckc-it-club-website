import { api } from "@/services/api.service";

export const authService = {
	// Redirect to Google OAuth
	redirectAdmin() {
		const baseUrl = "http://localhost:8000"; // Tạm hardcode
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
