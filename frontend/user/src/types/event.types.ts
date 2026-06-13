export type EventStatus = "draft" | "published" | "ongoing" | "ended" | "cancelled";

export type RegistrationStatus = "registered" | "cancelled" | "attended";

export interface EventCreator {
	id: number;
	full_name: string;
	avatar: string | null;
}

export interface EventItem {
	id: number;
	title: string;
	slug: string;
	description: string | null;
	thumbnail: string | null;
	start_at: string;
	end_at: string;
	registration_start_at: string | null;
	registration_end_at: string | null;
	location: string | null;
	max_attendees: number | null;
	is_members_only: boolean;
	is_registration_open: boolean;
	status: EventStatus;
	registrations_count: number;
	is_full: boolean;
	creator: EventCreator | null;
	my_registration_status?: RegistrationStatus | null;
}

export interface EventGalleryImage {
	id: number;
	image_url: string;
	caption: string | null;
}

export interface EventFeedbackSummary {
	average_rating: number;
	total: number;
	distribution: Record<string, number>;
}

export interface MyFeedback {
	rating: number;
	comment: string | null;
}

export interface EventDetail extends EventItem {
	content: string | null;
	my_qr_token?: string | null;
	has_feedback?: boolean;
	gallery?: EventGalleryImage[];
	feedback_summary?: EventFeedbackSummary;
	my_attended?: boolean;
	my_feedback?: MyFeedback | null;
}

export interface EventFeedbackUser {
	id: number;
	full_name: string;
	avatar: string | null;
}

export interface EventFeedbackItem {
	id: number;
	rating: number;
	comment: string | null;
	created_at: string;
	user: EventFeedbackUser | null;
}

export interface EventListParams {
	page?: number;
	per_page?: number;
	status?: EventStatus;
	search?: string;
}

export interface EventTicket {
	qr_token: string;
	event_title: string;
	start_at: string;
	location: string | null;
}
