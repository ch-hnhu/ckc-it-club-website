import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Permission } from "@/types/permission.type";

const permissionService = {
	async getPermissions(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
		roles?: string[];
	}): Promise<PaginatedResponse<Permission>> {
		return api.get("/permissions", params);
	},

	async syncPermissionRoles(id: number | string, roles: string[]): Promise<ApiResponse<Permission>> {
		return api.put<ApiResponse<Permission>, { roles: string[] }>(`/permissions/${id}/roles`, { roles });
	},
};

export default permissionService;
