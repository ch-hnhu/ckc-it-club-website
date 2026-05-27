import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { NotificationsPayload } from "@/types/notification.type";
import type { NotificationLogRecord, NotificationAdminStats } from "@/pages/community/SystemNotificationPage";

const notificationService = {
	async getNotifications(
		page?: number,
		perPage?: number,
	): Promise<ApiResponse<NotificationsPayload>> {
		return api.get("/notifications", {
			...(page ? { page } : {}),
			...(perPage ? { per_page: perPage } : {}),
		});
	},

	async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
		return api.get("/notifications/unread-count");
	},

	async markAsRead(id: string): Promise<ApiResponse<null>> {
		return api.patch<ApiResponse<null>, undefined>(`/notifications/${id}/read`);
	},

	async markAllAsRead(): Promise<ApiResponse<null>> {
		return api.patch<ApiResponse<null>, undefined>("/notifications/read-all");
	},

	async getLog(params?: {
		page?: number;
		per_page?: number;
		sort?: "created_at" | "community_type" | "read_at";
		order?: "asc" | "desc";
		community_type?: string;
		read_status?: "read" | "unread" | "all";
	}): Promise<PaginatedResponse<NotificationLogRecord>> {
		return api.get("/notifications/log", params as Record<string, unknown>);
	},

	async getAdminStats(): Promise<ApiResponse<NotificationAdminStats>> {
		return api.get("/notifications/admin-stats");
	},

	async deleteNotification(id: string): Promise<ApiResponse<null>> {
		return api.delete(`/notifications/${id}/admin`);
	},
};

export default notificationService;
