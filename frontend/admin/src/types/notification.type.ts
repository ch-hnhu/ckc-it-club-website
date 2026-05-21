export interface NotificationData {
	title: string;
	message: string;
	action: "created" | "updated" | "deleted" | "status_changed";
	entity_type: string;
	entity_id: number | null;
	performed_by: string;
	link?: string | null;
}

export interface Notification {
	id: string;
	data: NotificationData;
	read_at: string | null;
	created_at: string;
}

export interface NotificationsPayload {
	notifications: Notification[];
	unread_count: number;
	has_more: boolean;
	total: number;
}
