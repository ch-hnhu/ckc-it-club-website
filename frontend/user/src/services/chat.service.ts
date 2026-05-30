import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { ChatMessage, ChatRoom } from "@/types/chat.types";

export const chatService = {
	getRooms: () =>
		api.get<ApiResponse<ChatRoom[]>>("/community/chat-rooms"),

	getMessages: (roomId: number, params?: { per_page?: number; before?: string }) =>
		api.get<ApiResponse<ChatMessage[]>>(`/community/chat-rooms/${roomId}/messages`, params as Record<string, unknown>),

	poll: (roomId: number, after: string) =>
		api.get<ApiResponse<ChatMessage[]>>(`/community/chat-rooms/${roomId}/poll`, { after }),

	createRoom: (name: string) =>
		api.post<ApiResponse<ChatRoom>>("/community/chat-rooms", { name }),

	sendMessage: (roomId: number, content: string, replyToId?: number) =>
		api.post<ApiResponse<ChatMessage>>(`/community/chat-rooms/${roomId}/messages`, {
			content,
			reply_to_id: replyToId ?? null,
		}),
};
