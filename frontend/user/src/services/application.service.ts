import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
	ApplicationQuestion,
	ClubApplicationResponse,
	SubmitApplicationPayload,
} from "@/types/application.types";

function normalizeQuestions(
	payload:
		| PaginatedResponse<ApplicationQuestion>
		| ApiResponse<ApplicationQuestion[]>
		| ApplicationQuestion[],
): ApplicationQuestion[] {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload.data)) return payload.data;
	return [];
}

export const applicationService = {
	async getQuestions(): Promise<ApplicationQuestion[]> {
		const response = await api.get<
			PaginatedResponse<ApplicationQuestion> | ApiResponse<ApplicationQuestion[]>
		>("/user/application-questions");
		return normalizeQuestions(response);
	},

	async submitApplication(payload: SubmitApplicationPayload): Promise<ClubApplicationResponse> {
		const response = await api.post<
			ApiResponse<ClubApplicationResponse>,
			SubmitApplicationPayload
		>("/user/club-applications", payload);
		if ("data" in response) return response.data;
		return response as unknown as ClubApplicationResponse;
	},

	async getMyApplication(): Promise<ClubApplicationResponse | null> {
		try {
			const response = await api.get<ApiResponse<ClubApplicationResponse>>(
				"/user/club-applications/me",
			);
			if ("data" in response) return response.data;
			return null;
		} catch {
			return null;
		}
	},
};
