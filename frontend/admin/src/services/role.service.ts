import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Role } from "@/types/role.type";

const roleService = {
	async getRoles(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<Role>> {
		return api.get("/roles", params);
	},

	async createRole(payload: FormData): Promise<ApiResponse<Role>> {
		return api.post<ApiResponse<Role>, FormData>("/roles", payload, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	},

	async getRole(id: number | string): Promise<ApiResponse<Role>> {
		return api.get(`/roles/${id}`);
	},

	async updateRole(id: number | string, payload: FormData): Promise<ApiResponse<Role>> {
		return api.put<ApiResponse<Role>, FormData>(`/roles/${id}`, payload, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
	},

	async deleteRole(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/roles/${id}`);
	},
};

export default roleService;
