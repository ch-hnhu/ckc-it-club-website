export interface UserNotificationActor {
	id: number;
	full_name: string;
	avatar: string | null;
	username: string | null;
}

export interface UserNotificationData {
	title: string;
	message: string;
	type: "reaction" | "comment" | "comment_reply" | "mention" | "follow" | "blog_comment" | "blog_comment_reply" | "blog_approved" | "report_resolved" | "report_dismissed" | "board_member_added" | "comment_moderated" | "post_moderated" | "post_hidden";
	actor: UserNotificationActor;
	reaction_type?: string;
	target_type: string;
	target_id: number;
	link?: string | null;
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
