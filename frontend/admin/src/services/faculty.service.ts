import { api } from "@/services/api.service";
import type { PaginatedResponse } from "@/types/api.types";
import type { Faculty } from "@/types/faculty.type";

const facultyService = {
	async getFaculties(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<Faculty>> {
		return api.get("/faculties", params);
	},
};

export default facultyService;
