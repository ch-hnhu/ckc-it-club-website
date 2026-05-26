import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { NotificationLogRecord, NotificationAdminStats } from "@/pages/community/SystemNotificationPage";

const notificationService = {
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
