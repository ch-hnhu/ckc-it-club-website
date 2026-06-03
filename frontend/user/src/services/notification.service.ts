import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { UserNotificationsPayload } from "@/types/notification.types";

const notificationService = {
	getNotifications: (page?: number, perPage?: number) =>
		api.get<ApiResponse<UserNotificationsPayload>>("/user-notifications", {
			...(page ? { page } : {}),
			...(perPage ? { per_page: perPage } : {}),
		}),

	getUnreadCount: () =>
		api.get<ApiResponse<{ count: number }>>("/user-notifications/unread-count"),

	markAsRead: (id: string) =>
		api.patch<ApiResponse<null>, undefined>(`/user-notifications/${id}/read`),

	markAllAsRead: () =>
		api.patch<ApiResponse<null>, undefined>("/user-notifications/read-all"),
};

export default notificationService;
