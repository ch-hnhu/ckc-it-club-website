import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { NotificationsPayload } from "@/types/notification.type";

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
};

export default notificationService;
