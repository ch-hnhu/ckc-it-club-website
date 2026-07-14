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

	/** Tải một ảnh lên (vd banner giải thưởng) và nhận URL để lưu vào nội dung About. */
	async uploadImage(file: File): Promise<string> {
		const formData = new FormData();
		formData.append("image", file);
		const res = await api.post<ApiResponse<{ url: string }>, FormData>(
			"/about-page/upload-image",
			formData,
			{ headers: { "Content-Type": "multipart/form-data" } },
		);
		return res.data.url;
	},
};

export default aboutPageService;
