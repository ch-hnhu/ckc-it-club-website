import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { EventDetail, EventItem, EventListParams, EventTicket } from "@/types/event.types";

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
};
