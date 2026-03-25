import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { User } from "@/types/user.type";

const userService = {
	async getUsers(): Promise<ApiResponse<User[]>> {
		return api.get("/users");
	},
	async getMe(): Promise<{ success: boolean; data: User }> {
		return api.get("/user");
	},
};

export default userService;
