import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { AboutContent } from "@/types/about";

/**
 * Nội dung trang "Về chúng tôi" (About) — dạng config.
 * Đọc dùng chung endpoint public GET /about-page; lưu qua PUT /about-page
 * (yêu cầu quyền club_info.manage).
 */
const aboutPageService = {
	async getAboutContent(): Promise<AboutContent> {
		const res = await api.get<ApiResponse<AboutContent>>("/about-page");
		return res.data;
	},

	async updateAboutContent(payload: AboutContent): Promise<AboutContent> {
		const res = await api.put<ApiResponse<AboutContent>, AboutContent>("/about-page", payload);
		return res.data;
	},
};

export default aboutPageService;
