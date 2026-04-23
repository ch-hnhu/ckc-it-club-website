import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";

export interface SubmitContactPayload {
	full_name: string;
	email: string;
	subject: string;
	message: string;
}

export interface ContactSubmission {
	id: number;
	email: string;
	full_name: string;
	subject: string;
	message: string;
	status: "pending" | "processing" | "done";
	created_at: string | null;
}

export const contactService = {
	submit: (payload: SubmitContactPayload) =>
		api.post<ApiResponse<ContactSubmission>, SubmitContactPayload>("/contacts", payload),
};
