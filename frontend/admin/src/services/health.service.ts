import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";

const healthService = {
	async getHealth(): Promise<ApiResponse<{ message: string }>> {
		return api.get("/health");
	},
};

export default healthService;
