import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
	ContactRecord,
	ContactStats,
	ContactStatus,
	UpdateContactStatusPayload,
} from "@/types/contact.type";

const contactService = {
	getContacts(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		status?: ContactStatus;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<ContactRecord>> {
		return api.get("/contacts", params);
	},

	async getStats(): Promise<ContactStats> {
		const response = await api.get<ApiResponse<ContactStats>>("/contacts/stats");
		return response.data;
	},

	async updateStatus(contactId: number, payload: UpdateContactStatusPayload): Promise<ContactRecord> {
		const response = await api.patch<ApiResponse<ContactRecord>, UpdateContactStatusPayload>(
			`/contacts/${contactId}/status`,
			payload,
		);

		return response.data;
	},
};

export default contactService;
