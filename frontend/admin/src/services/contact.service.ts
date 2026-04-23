import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { ContactRecord, ContactStatus, UpdateContactStatusPayload } from "@/types/contact.type";

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

	async updateStatus(contactId: number, payload: UpdateContactStatusPayload): Promise<ContactRecord> {
		const response = await api.patch<ApiResponse<ContactRecord>, UpdateContactStatusPayload>(
			`/contacts/${contactId}/status`,
			payload,
		);

		return response.data;
	},
};

export default contactService;
