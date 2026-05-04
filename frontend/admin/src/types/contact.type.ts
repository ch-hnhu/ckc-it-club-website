export type ContactStatus = "pending" | "processing" | "done";

export interface ContactStats {
	total: number;
	pending: number;
	processing: number;
	done: number;
}

export interface ContactRecord {
	id: number;
	email: string;
	full_name: string | null;
	subject: string | null;
	message: string;
	status: ContactStatus;
	created_at: string | null;
	updated_at: string | null;
	created_by: number | null;
	updated_by: number | null;
}

export interface UpdateContactStatusPayload {
	status: ContactStatus;
}
