export type ApplicationStatus =
	| "pending"
	| "processing"
	| "interview"
	| "passed"
	| "failed";

export interface ApplicationApplicant {
	id: number;
	full_name: string | null;
	email: string;
	student_code: string | null;
	faculty?: string | null;
	major?: string | null;
	class_name?: string | null;
}

export interface ApplicationAnswerItem {
	id: number;
	question_id: number;
	question_label: string;
	question_type: string;
	answer_value: string | null;
}

export interface ApplicationQuestionOption {
	id: number;
	question_id: number;
	value: string;
	label: string;
}

export interface ApplicationQuestionRecord {
	id: number;
	label: string;
	type: string;
	is_required: boolean;
	order_index: number;
	is_active: boolean;
	created_at: string | null;
	created_by: number | null;
	updated_at: string | null;
	updated_by: number | null;
	options: ApplicationQuestionOption[];
}

export interface ClubApplicationRecord {
	id: number;
	status: ApplicationStatus;
	note: string | null;
	created_at: string | null;
	updated_at: string | null;
	created_by: number;
	updated_by: number | null;
	applicant: ApplicationApplicant | null;
	answers: ApplicationAnswerItem[];
}

export interface UpdateApplicationStatusPayload {
	status: Exclude<ApplicationStatus, "pending">;
	note: string | null;
}
