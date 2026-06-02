export interface ChatRoom {
	id: number;
	name: string;
	image: string | null;
	member_count: number;
	message_count: number;
	last_message_at: string | null;
	created_at: string;
}

export interface ChatMessageUser {
	id: number;
	full_name: string;
	email: string;
	avatar: string | null;
	username: string | null;
}

export interface ChatReplyTo {
	id: number;
	content: string;
	full_name: string | null;
}

export interface ChatMessage {
	id: number;
	content: string;
	created_by: ChatMessageUser | null;
	reply_to: ChatReplyTo | null;
	created_at: string;
}
