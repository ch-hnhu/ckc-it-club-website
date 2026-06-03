import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { ChatRoomRecord, ChatRoomStats, ChatSystemMessageRecord } from "@/pages/community/ChatRoomListPage";

export interface ChatRoomPayload {
	name: string;
	image?: File | null;
}

function toFormData(payload: ChatRoomPayload): FormData {
	const fd = new FormData();
	fd.append("name", payload.name);
	if (payload.image) fd.append("image", payload.image);
	return fd;
}

const chatService = {
	async getRooms(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<ChatRoomRecord>> {
		return api.get("/chat-rooms", params as Record<string, unknown>);
	},

	async getStats(): Promise<ApiResponse<ChatRoomStats>> {
		return api.get("/chat-rooms/stats");
	},

	async createRoom(payload: ChatRoomPayload): Promise<ApiResponse<ChatRoomRecord>> {
		return api.post<ApiResponse<ChatRoomRecord>, FormData>("/chat-rooms", toFormData(payload), {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	async updateRoom(id: number, payload: ChatRoomPayload): Promise<ApiResponse<ChatRoomRecord>> {
		const fd = toFormData(payload);
		fd.append("_method", "PUT");
		return api.post<ApiResponse<ChatRoomRecord>, FormData>(`/chat-rooms/${id}`, fd, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	async deleteRoom(id: number): Promise<ApiResponse<null>> {
		return api.delete(`/chat-rooms/${id}`);
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
