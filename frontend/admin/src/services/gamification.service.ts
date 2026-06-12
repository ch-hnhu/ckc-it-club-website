import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
	LeaderboardEntry,
	Rank,
	RankPayload,
	PointRule,
	PointRulePayload,
} from "@/types/gamification.type";

function rankToFormData(payload: RankPayload): FormData {
	const formData = new FormData();
	formData.append("name", payload.name);
	formData.append("min_points", String(payload.min_points));

	if (payload.badge) {
		formData.append("badge", payload.badge);
	}

	return formData;
}

const gamificationService = {
	// ─── Point rules ──────────────────────────────────────────────
	async getPointRules(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
		status?: "active" | "inactive";
	}): Promise<PaginatedResponse<PointRule>> {
		return api.get("/point-rules", params as Record<string, unknown>);
	},

	async createPointRule(payload: PointRulePayload): Promise<ApiResponse<PointRule>> {
		return api.post<ApiResponse<PointRule>, PointRulePayload>("/point-rules", payload);
	},

	async updatePointRule(
		id: number | string,
		payload: PointRulePayload,
	): Promise<ApiResponse<PointRule>> {
		return api.put<ApiResponse<PointRule>, PointRulePayload>(`/point-rules/${id}`, payload);
	},

	async deletePointRule(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/point-rules/${id}`);
	},

	// ─── Ranks ───────────────────────────────────────────────────
	async getRanks(): Promise<ApiResponse<Rank[]>> {
		return api.get("/ranks");
	},

	async createRank(payload: RankPayload): Promise<ApiResponse<Rank>> {
		return api.post<ApiResponse<Rank>, FormData>("/ranks", rankToFormData(payload), {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	async updateRank(id: number | string, payload: RankPayload): Promise<ApiResponse<Rank>> {
		const formData = rankToFormData(payload);
		formData.append("_method", "PUT");

		return api.post<ApiResponse<Rank>, FormData>(`/ranks/${id}`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	async deleteRank(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/ranks/${id}`);
	},

	// ─── Leaderboards ─────────────────────────────────────────────
	async getWeeklyLeaderboard(): Promise<ApiResponse<LeaderboardEntry[]>> {
		return api.get("/gamification/leaderboard/weekly");
	},

	async getAllTimeLeaderboard(): Promise<ApiResponse<LeaderboardEntry[]>> {
		return api.get("/gamification/leaderboard/all-time");
	},
};

export default gamificationService;
