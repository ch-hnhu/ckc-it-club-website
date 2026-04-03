import { api } from "@/services/api.service";
import type { PaginatedResponse } from "@/types/api.types";
import type { Major } from "@/types/major.type";

const majorService = {
	async getMajors(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<Major>> {
		return api.get("/majors", params);
	},
};

export default majorService;
