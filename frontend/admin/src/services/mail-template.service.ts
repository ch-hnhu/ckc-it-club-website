import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
	CreateMailTemplatePayload,
	MailTemplate,
	MailTemplateType,
	UpdateMailTemplatePayload,
} from "@/types/mail-template";

const mailTemplateService = {
	async getTypes(): Promise<{ success: boolean; data: MailTemplateType[] }> {
		return api.get("/mail-template-types");
	},

	async getType(
		id: number,
		params?: {
			page?: number;
			per_page?: number;
			search?: string;
			sort?: string;
			order?: "asc" | "desc";
		},
	): Promise<PaginatedResponse<MailTemplate>> {
		return api.get(`/mail-template-types/${id}`, params);
	},

	async createTemplate(
		typeId: number,
		payload: CreateMailTemplatePayload,
	): Promise<ApiResponse<MailTemplate>> {
		return api.post(`/mail-template-types/${typeId}/templates`, payload);
	},

	async updateTemplate(
		typeId: number,
		templateId: number,
		payload: UpdateMailTemplatePayload,
	): Promise<ApiResponse<MailTemplate>> {
		return api.put(`/mail-template-types/${typeId}/templates/${templateId}`, payload);
	},

	async setDefaultTemplate(
		typeId: number,
		templateId: number,
	): Promise<ApiResponse<MailTemplate>> {
		return api.patch(`/mail-template-types/${typeId}/templates/${templateId}/default`);
	},

	async deleteTemplate(
		typeId: number,
		templateId: number,
	): Promise<ApiResponse<{ id: number }>> {
		return api.delete(`/mail-template-types/${typeId}/templates/${templateId}`);
	},

	async getEmailNotificationSetting(): Promise<{ success: boolean; data: { enabled: boolean } }> {
		return api.get("/mail-settings/email-notification");
	},

	async toggleEmailNotification(
		enabled: boolean,
	): Promise<ApiResponse<{ enabled: boolean }>> {
		return api.patch("/mail-settings/email-notification", { enabled });
	},
};

export default mailTemplateService;
