import { api } from "@/services/api.service";
import type { PaginatedResponse } from "@/types/api.types";
import type {
	CertificateTemplate,
	CertificateTemplateListParams,
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
};

export default certificateTemplateService;
