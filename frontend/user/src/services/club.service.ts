import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { BoardMember } from "@/types/club.types";

export const clubService = {
	// Danh sách Ban Chủ Nhiệm (public) cho landing / trang giới thiệu
	getBoard: () => api.get<ApiResponse<BoardMember[]>>("/club-board"),
};
