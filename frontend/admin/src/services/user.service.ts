import { api } from "@/services/api.service";
import type { PaginatedResponse } from "@/types/api.types";
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
		return api.get("/user");
	},
};

export default userService;
