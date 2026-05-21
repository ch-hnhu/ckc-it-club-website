import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { NotificationsPayload } from "@/types/notification.type";

const notificationService = {
	getNotifications: (page = 1, perPage = 20) =>
		api.get<ApiResponse<NotificationsPayload>>("/notifications", { page, per_page: perPage }),

	getUnreadCount: () => api.get<ApiResponse<{ count: number }>>("/notifications/unread-count"),

	markAsRead: (id: string) => api.patch<ApiResponse<null>>(`/notifications/${id}/read`),

	markAllAsRead: () => api.patch<ApiResponse<null>>("/notifications/read-all"),
};

export default notificationService;
