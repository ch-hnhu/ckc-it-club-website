import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { RoleOption } from "@/types/role.type";

const roleService = {
	async getRoles(): Promise<ApiResponse<RoleOption[]>> {
		return api.get("/roles");
	},
};

export default roleService;
