import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { SkillRecord } from "@/pages/community/SkillListPage";

const skillService = {
	async getSkills(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
		status?: "active" | "inactive";
	}): Promise<PaginatedResponse<SkillRecord>> {
		return api.get("/skills", params as Record<string, unknown>);
	},

	async createSkill(payload: {
		name: string;
		slug?: string;
		is_active?: boolean;
		sort_order?: number;
	}): Promise<ApiResponse<SkillRecord>> {
		return api.post<ApiResponse<SkillRecord>, typeof payload>("/skills", payload);
	},

	async updateSkill(
		id: number | string,
		payload: { name: string; slug?: string; is_active?: boolean; sort_order?: number },
	): Promise<ApiResponse<SkillRecord>> {
		return api.put<ApiResponse<SkillRecord>, typeof payload>(`/skills/${id}`, payload);
	},

	async reorderSkills(items: { id: number; sort_order: number }[]): Promise<ApiResponse<null>> {
		return api.patch<ApiResponse<null>, { items: typeof items }>("/skills/reorder", { items });
	},

	async toggleStatus(id: number | string): Promise<ApiResponse<SkillRecord>> {
		return api.patch<ApiResponse<SkillRecord>, Record<string, never>>(`/skills/${id}/toggle-status`, {});
	},

	async deleteSkill(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/skills/${id}`);
	},
};

export default skillService;
