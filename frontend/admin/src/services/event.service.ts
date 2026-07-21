import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { EventRecord, EventStats, EventStatus } from "@/pages/event/EventListPage";
import type { EventRegistrationRecord } from "@/pages/event/EventDetailPage";

// ─── Feedback & Gallery types ──────────────────────────────────────────────────

export interface EventFeedbackItem {
	id: number;
	rating: number;
	comment: string | null;
	is_hidden: boolean;
	moderation_reason: string | null;
	moderated_at: string | null;
	created_at: string | null;
	user: {
		id: number;
		full_name: string | null;
		email: string;
		avatar: string | null;
	} | null;
}

export interface EventFeedbackStats {
	average_rating: number;
	total: number;
	distribution: Record<string, number>;
	attended_count: number;
	response_rate: number;
}

export interface EventFeedbackResponse {
	items: EventFeedbackItem[];
	stats: EventFeedbackStats;
}

export interface EventMemberRecord {
	id: number;
	full_name: string | null;
	email: string;
	avatar: string | null;
}

export interface EventGalleryItem {
	id: number;
	image_url: string;
	caption: string | null;
	display_order: number;
	created_at: string | null;
}

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

	async getUnregisteredMembers(id: number | string): Promise<ApiResponse<EventMemberRecord[]>> {
		return api.get(`/events/${id}/unregistered-members`);
	},

	async remindMembers(
		id: number | string,
		userIds?: number[],
	): Promise<ApiResponse<{ reminded_count: number }>> {
		return api.post<ApiResponse<{ reminded_count: number }>>(
			`/events/${id}/remind-members`,
			userIds && userIds.length > 0 ? { user_ids: userIds } : {},
		);
	},

	async checkIn(
		id: number | string,
		payload: { qr_token: string } | { registration_id: number },
	): Promise<ApiResponse<EventRegistrationRecord>> {
		return api.post<ApiResponse<EventRegistrationRecord>>(`/events/${id}/check-in`, payload);
	},

	async getFeedbacks(id: number | string): Promise<ApiResponse<EventFeedbackResponse>> {
		return api.get(`/events/${id}/feedbacks`);
	},

	async setFeedbackVisibility(
		id: number | string,
		feedbackId: number,
		isHidden: boolean,
	): Promise<ApiResponse<{ is_hidden: boolean }>> {
		return api.patch(`/events/${id}/feedbacks/${feedbackId}/visibility`, { is_hidden: isHidden });
	},

	async deleteFeedback(id: number | string, feedbackId: number): Promise<ApiResponse<null>> {
		return api.delete(`/events/${id}/feedbacks/${feedbackId}`);
	},

	async getGallery(id: number | string): Promise<ApiResponse<EventGalleryItem[]>> {
		return api.get(`/events/${id}/gallery`);
	},

	async uploadGallery(
		id: number | string,
		payload: FormData,
	): Promise<ApiResponse<EventGalleryItem[]>> {
		return api.post<ApiResponse<EventGalleryItem[]>, FormData>(`/events/${id}/gallery`, payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	async reorderGallery(id: number | string, ids: number[]): Promise<ApiResponse<null>> {
		return api.patch<ApiResponse<null>, { ids: number[] }>(`/events/${id}/gallery/reorder`, { ids });
	},

	async deleteGalleryItem(
		id: number | string,
		itemId: number,
	): Promise<ApiResponse<null>> {
		return api.delete(`/events/${id}/gallery/${itemId}`);
	},
};

export default eventService;
