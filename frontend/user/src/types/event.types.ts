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
	location: string | null;
	max_attendees: number | null;
	is_registration_required: boolean;
	status: EventStatus;
	registrations_count: number;
	is_full: boolean;
	creator: EventCreator | null;
	my_registration_status?: RegistrationStatus | null;
}

export interface EventDetail extends EventItem {
	content: string | null;
	my_qr_token?: string | null;
	has_feedback?: boolean;
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
