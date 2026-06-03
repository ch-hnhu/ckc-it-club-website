export interface UserNotificationActor {
	id: number;
	full_name: string;
	avatar: string | null;
	username: string | null;
}

export interface UserNotificationData {
	title: string;
	message: string;
	type: "reaction" | "comment" | "mention";
	actor: UserNotificationActor;
	reaction_type?: string;
	target_type: string;
	target_id: number;
	link: string;
}

export interface UserNotification {
	id: string;
	data: UserNotificationData;
	read_at: string | null;
	created_at: string;
}

export interface UserNotificationsPayload {
	notifications: UserNotification[];
	unread_count: number;
	has_more: boolean;
	total: number;
}
