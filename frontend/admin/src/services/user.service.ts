import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { User } from "@/types/user.type";

const userService = {
	async getUsers(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<User>> {
		return api.get("/users", params);
	},
	async getMe(): Promise<{ success: boolean; data: User }> {
		return api.get("/auth/me");
	},
	async getUserById(id: number | string): Promise<ApiResponse<User>> {
		return api.get(`/users/${id}`);
	},
	async createUser(payload: FormData): Promise<ApiResponse<User>> {
		return api.post<ApiResponse<User>, FormData>("/users", payload, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	},
	async updateUser(id: number | string, payload: FormData): Promise<ApiResponse<User>> {
		return api.put<ApiResponse<User>, FormData>(`/users/${id}`, payload, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	},
	async logout(): Promise<{ success: boolean; message: string }> {
		return api.post("/auth/logout");
	},
	async logoutAll(): Promise<{ success: boolean; message: string }> {
		return api.post("/auth/logout-all");
	},
};

export default userService;
