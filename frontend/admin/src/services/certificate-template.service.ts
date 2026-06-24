import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
	CertificateTemplate,
	CertificateTemplateDetail,
	CertificateTemplateListParams,
	CertificateTemplatePayload,
} from "@/types/certificate-template.type";

const certificateTemplateService = {
	/** Danh sách mẫu chứng chỉ (admin) — phân trang, tìm kiếm, sắp xếp theo cột. */
	async getTemplates(
		params: CertificateTemplateListParams = {},
	): Promise<PaginatedResponse<CertificateTemplate>> {
		const query: Record<string, unknown> = {
			page: params.page,
			per_page: params.per_page,
		};

		if (params.search) query.search = params.search;
		if (params.sort) query.sort = params.sort;
		if (params.order) query.order = params.order;

		return api.get("/certificate-templates", query);
	},

	/** Chi tiết một mẫu (kèm `design`) để nạp vào editor. */
	async getTemplate(id: number): Promise<ApiResponse<CertificateTemplateDetail>> {
		return api.get(`/certificate-templates/${id}`);
	},

	/** Tạo mẫu mới từ thiết kế editor. */
	async createTemplate(
		payload: CertificateTemplatePayload,
	): Promise<ApiResponse<CertificateTemplateDetail>> {
		return api.post("/certificate-templates", payload);
	},

	/** Cập nhật thiết kế / tên / thumbnail của một mẫu. */
	async updateTemplate(
		id: number,
		payload: CertificateTemplatePayload,
	): Promise<ApiResponse<CertificateTemplateDetail>> {
		return api.put(`/certificate-templates/${id}`, payload);
	},

	async deleteTemplate(id: number): Promise<ApiResponse<null>> {
		return api.delete(`/certificate-templates/${id}`);
	},

	async setDefault(id: number): Promise<ApiResponse<CertificateTemplate>> {
		return api.post(`/certificate-templates/${id}/default`);
	},

	async duplicate(id: number): Promise<ApiResponse<CertificateTemplateDetail>> {
		return api.post(`/certificate-templates/${id}/duplicate`);
	},

	/** Render thử PDF (data URI) từ thiết kế đang soạn — cho nút "Xem trước". */
	async previewTemplate(
		design: CertificateTemplatePayload["design"],
	): Promise<ApiResponse<{ pdf: string }>> {
		return api.post("/certificate-templates/preview", { design });
	},

	/** Upload ảnh nền / logo → trả URL công khai để gắn vào `design`. */
	async uploadAsset(file: File): Promise<ApiResponse<{ url: string }>> {
		const form = new FormData();
		form.append("image", file);
		return api.post("/certificate-templates/assets", form, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},
};

export default certificateTemplateService;
