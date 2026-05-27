import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { ChatRoomRecord, ChatRoomStats, ChatSystemMessageRecord } from "@/pages/community/ChatRoomListPage";

const chatService = {
	async getRooms(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		type?: "direct" | "group";
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<ChatRoomRecord>> {
		return api.get("/chat-rooms", params as Record<string, unknown>);
	},

	async getStats(): Promise<ApiResponse<ChatRoomStats>> {
		return api.get("/chat-rooms/stats");
	},

	async getSystemMessages(
		roomId: number,
		params?: {
			page?: number;
			per_page?: number;
			event_type?: string;
		},
	): Promise<PaginatedResponse<ChatSystemMessageRecord>> {
		return api.get(`/chat-rooms/${roomId}/system-messages`, params as Record<string, unknown>);
	},

	async deleteSystemMessage(roomId: number, messageId: number): Promise<ApiResponse<null>> {
		return api.delete(`/chat-rooms/${roomId}/messages/${messageId}`);
	},
};

export default chatService;
