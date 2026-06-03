export type ApplicationQuestionType = "text" | "textarea" | "radio" | "select";

export interface ApplicationQuestionOption {
	id: number;
	value: string;
	label: string;
}

export interface ApplicationQuestion {
	id: number;
	label: string;
	type: ApplicationQuestionType;
	is_required: boolean;
	is_active: boolean;
	order_index: number;
	options: ApplicationQuestionOption[];
}

export interface SubmitAnswerItem {
	question_id: number;
	answer_value: string;
}

export interface SubmitApplicationPayload {
	answers: SubmitAnswerItem[];
}

export type ApplicationStatus = "pending" | "processing" | "interview" | "passed" | "failed";

export interface ClubApplicationResponse {
	id: number;
	status: ApplicationStatus;
	note: string | null;
	created_at: string | null;
}
