import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";

// Một lượt hội thoại theo định dạng backend/Gemini mong đợi.
export interface ChatTurn {
	role: "user" | "model";
	text: string;
}

export interface ChatbotAskPayload {
	message: string;
	history?: ChatTurn[];
}

export interface ChatbotAnswer {
	answer: string;
}

export const chatbotService = {
	ask: (payload: ChatbotAskPayload) =>
		api.post<ApiResponse<ChatbotAnswer>, ChatbotAskPayload>("/chatbot", payload),
};
