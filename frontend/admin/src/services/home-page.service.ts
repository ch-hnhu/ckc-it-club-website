import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { HomeContent } from "@/types/home";

/**
 * Nội dung tĩnh của trang chủ (Landing) — dạng config.
 * Đọc dùng chung endpoint public GET /home-page; lưu qua PUT /home-page
 * (yêu cầu quyền club_info.manage). Backend chỉ cập nhật những section có trong
 * payload nên có thể gửi một phần.
 */

/** Giá trị mặc định — dùng để lấp các section còn thiếu, tránh vỡ form editor. */
export const DEFAULT_HOME_CONTENT: HomeContent = {
	hero: {
		badge: "Trường Cao đẳng Kỹ thuật Cao Thắng",
		title_line1: "CKC IT CLUB",
		title_line2: "Kết nối công nghệ, kiến tạo",
		highlight: "tương lai",
		lead_html:
			"Khám phá tài nguyên, tham gia sự kiện và phát triển kỹ năng cùng hơn <strong>1000+ sinh viên IT</strong> tại Cao Thắng.",
		stats: [
			{ value: "1000+", label: "Thành viên" },
			{ value: "50+", label: "Tài nguyên" },
			{ value: "20+", label: "Sự kiện/năm" },
		],
		primary_label: "Khám phá ngay",
		primary_link: "#resources",
		secondary_label: "Tham gia CLB",
		secondary_link: "/ung-tuyen",
	},
	quick_actions: {
		heading: "Khám phá CKC IT CLUB",
		subheading: "Tất cả những gì bạn cần để học, chia sẻ và phát triển trong cộng đồng IT",
		items: [],
	},
	about: {
		heading: "Về CKC IT CLUB",
		paragraphs_html: [],
		milestones: [],
		button_label: "Xem thêm về chúng tôi",
		button_link: "#events",
		values: [],
	},
	headers: {
		mentor: { title: "Người thành lập", subtitle: "" },
		board: { title: "Ban Chủ Nhiệm", subtitle: "" },
		featured: {
			title: "Nội dung nổi bật",
			subtitle: "",
			blog_title: "✍️ Bài viết nổi bật",
			event_title: "🎉 Sự kiện sắp diễn ra",
			course_title: "🎓 Khóa học nổi bật",
		},
		leaderboard: { title: "Bảng Xếp Hạng", cta_label: "Xem bảng đầy đủ" },
		awards: { title: "Giải Thưởng & Thành Tích", subtitle: "" },
	},
	contribution: {
		heading: "Góp phần xây dựng kho tài nguyên chung",
		body_html: "",
		button_label: "Đóng góp tài nguyên",
	},
	cta: {
		badge: "Miễn phí — Không cần kinh nghiệm",
		title_prefix: "Tham gia cộng đồng",
		highlight: "1000+ sinh viên IT",
		title_suffix: "ngay hôm nay",
		subtext: "",
		button_label: "Tham gia ngay miễn phí",
		button_link: "/ung-tuyen",
		trust_text: "",
	},
};

function isFilledObject(value: unknown): value is Record<string, unknown> {
	return (
		!!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0
	);
}

/** Gộp dữ liệu API với mặc định: section rỗng/thiếu thì lấy mặc định. */
function mergeHomeContent(data: Partial<HomeContent>): HomeContent {
	const pick = <K extends keyof HomeContent>(key: K): HomeContent[K] =>
		isFilledObject(data[key])
			? ({ ...DEFAULT_HOME_CONTENT[key], ...(data[key] as object) } as HomeContent[K])
			: DEFAULT_HOME_CONTENT[key];

	return {
		hero: pick("hero"),
		quick_actions: pick("quick_actions"),
		about: pick("about"),
		headers: pick("headers"),
		contribution: pick("contribution"),
		cta: pick("cta"),
	};
}

const homePageService = {
	async getHomeContent(): Promise<HomeContent> {
		const res = await api.get<ApiResponse<Partial<HomeContent>>>("/home-page");
		return mergeHomeContent(res.data ?? {});
	},

	async updateHomeContent(payload: Partial<HomeContent>): Promise<HomeContent> {
		const res = await api.put<ApiResponse<Partial<HomeContent>>, Partial<HomeContent>>(
			"/home-page",
			payload,
		);
		return mergeHomeContent(res.data ?? {});
	},
};

export default homePageService;
