import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { EventRecord, EventStats, EventStatus } from "@/pages/event/EventListPage";
import type { EventRegistrationRecord } from "@/pages/event/EventDetailPage";

const eventService = {
	async getEvents(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
		status?: EventStatus | "all";
	}): Promise<PaginatedResponse<EventRecord>> {
		return api.get("/events", params as Record<string, unknown>);
	},

	async getStats(): Promise<ApiResponse<EventStats>> {
		return api.get("/events/stats");
	},

	async getEvent(id: number | string): Promise<ApiResponse<EventRecord & { content: string | null }>> {
		return api.get(`/events/${id}`);
	},

	async createEvent(payload: FormData): Promise<ApiResponse<EventRecord>> {
		return api.post<ApiResponse<EventRecord>, FormData>("/events", payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	async updateEvent(id: number | string, payload: FormData): Promise<ApiResponse<EventRecord>> {
		// PHP không parse multipart với method PUT — dùng POST + _method spoofing
		payload.append("_method", "PUT");
		return api.post<ApiResponse<EventRecord>, FormData>(`/events/${id}`, payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	async updateStatus(
		id: number | string,
		status: EventStatus,
	): Promise<ApiResponse<{ status: EventStatus }>> {
		return api.patch<ApiResponse<{ status: EventStatus }>, { status: EventStatus }>(
			`/events/${id}/status`,
			{ status },
		);
	},

	async deleteEvent(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/events/${id}`);
	},

	async getRegistrations(id: number | string): Promise<ApiResponse<EventRegistrationRecord[]>> {
		return api.get(`/events/${id}/registrations`);
	},

	async checkIn(
		id: number | string,
		payload: { qr_token: string } | { registration_id: number },
	): Promise<ApiResponse<EventRegistrationRecord>> {
		return api.post<ApiResponse<EventRegistrationRecord>>(`/events/${id}/check-in`, payload);
	},
};

export default eventService;
