import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
	EventDetail,
	EventFeedbackItem,
	EventItem,
	EventListParams,
	EventTicket,
	MyFeedback,
} from "@/types/event.types";

export const eventService = {
	getEvents: (params?: EventListParams) =>
		api.get<PaginatedResponse<EventItem>>("/community/events", params as Record<string, unknown>),

	getEvent: (slug: string) =>
		api.get<ApiResponse<EventDetail>>(`/community/events/${slug}`),

	registerEvent: (eventId: number) =>
		api.post<ApiResponse<{ qr_token: string }>>(`/community/events/${eventId}/register`),

	cancelRegistration: (eventId: number) =>
		api.delete<ApiResponse<null>>(`/community/events/${eventId}/register`),

	getMyTicket: (eventId: number) =>
		api.get<ApiResponse<EventTicket>>(`/community/events/${eventId}/my-ticket`),

	getFeedbacks: (eventId: number, params?: { page?: number; per_page?: number }) =>
		api.get<PaginatedResponse<EventFeedbackItem>>(
			`/community/events/${eventId}/feedbacks`,
			params as Record<string, unknown>,
		),

	submitFeedback: (eventId: number, payload: { rating: number; comment?: string | null }) =>
		api.post<ApiResponse<MyFeedback>, { rating: number; comment?: string | null }>(
			`/community/events/${eventId}/feedback`,
			payload,
		),
};
