import { api } from "@/services/api.service";
import type { PaginatedResponse } from "@/types/api.types";
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
};

export default roleService;
