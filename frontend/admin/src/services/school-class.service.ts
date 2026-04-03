import { api } from "@/services/api.service";
import type { PaginatedResponse } from "@/types/api.types";
import type { SchoolClass } from "@/types/school-class.type";

const schoolClassService = {
	async getSchoolClasses(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<SchoolClass>> {
		return api.get("/school-classes", params);
	},
};

export default schoolClassService;
