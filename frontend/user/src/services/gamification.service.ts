import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
	GamificationMe,
	LeaderboardEntry,
	PointHistoryItem,
} from "@/types/gamification.types";

export const gamificationService = {
	getMe: () => api.get<ApiResponse<GamificationMe>>("/gamification/me"),

	getHistory: (page = 1, perPage = 20) =>
		api.get<PaginatedResponse<PointHistoryItem>>("/gamification/me/history", {
			page,
			per_page: perPage,
		}),

	getWeeklyLeaderboard: (page = 1, perPage = 20) =>
		api.get<PaginatedResponse<LeaderboardEntry>>("/gamification/leaderboard/weekly", {
			page,
			per_page: perPage,
		}),

	getAllTimeLeaderboard: (page = 1, perPage = 20) =>
		api.get<PaginatedResponse<LeaderboardEntry>>("/gamification/leaderboard/all-time", {
			page,
			per_page: perPage,
		}),
};
