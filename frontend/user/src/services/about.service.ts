import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { AboutContent } from "@/types/about.types";

/**
 * Nội dung mặc định của trang About — trùng khớp thiết kế hardcode ban đầu.
 * Dùng làm fallback khi API lỗi/đang tải và để merge cho các section thiếu,
 * đảm bảo giao diện luôn hiển thị đầy đủ.
 */
export const DEFAULT_ABOUT_CONTENT: AboutContent = {
	hero: {
		badge: "Trường Cao đẳng Kỹ thuật Cao Thắng",
		title_prefix: "Không chỉ là câu lạc bộ, đây là",
		highlight: "ngôi nhà thứ hai",
		lead_html:
			"CKC IT CLUB là nơi những sinh viên IT năng động cùng nhau <strong>học hỏi</strong>, <strong>chia sẻ</strong> và <strong>phát triển</strong> — biến đam mê công nghệ thành hành trình sự nghiệp thực sự.",
		primary_label: "Tham gia CLB",
		primary_link: "/ung-tuyen",
		secondary_label: "Liên hệ với chúng tôi",
		secondary_link: "/lien-he",
	},
	story: {
		heading: "Câu chuyện của chúng tôi",
		image: "/assets/img/ckc-event-title.png",
		paragraphs: [
			"Mọi thứ bắt đầu từ năm <strong>2018</strong>, khi một nhóm nhỏ sinh viên đam mê công nghệ tại <strong>Trường Cao đẳng Kỹ thuật Cao Thắng</strong> cùng chung một khát khao: tạo ra một sân chơi nơi ai cũng có thể học, chia sẻ và cùng nhau lớn lên.",
			"Từ những buổi họp nhóm nhỏ, CKC IT CLUB đã trở thành cộng đồng hàng nghìn sinh viên IT. Chúng tôi tin rằng <mark>mọi sinh viên đều có tiềm năng to lớn</mark> khi được trao đúng cơ hội và sự hỗ trợ.",
			"Hôm nay, chúng tôi tiếp tục kết nối sinh viên với tài nguyên, mentor và cơ hội việc làm thực tế — vun đắp một cộng đồng công nghệ tử tế và bền vững.",
		],
	},
	mission: {
		title: "Sứ mệnh",
		body: "Trao cho mỗi sinh viên IT cơ hội tiếp cận tri thức, môi trường thực hành và cộng đồng hỗ trợ — để không ai bị bỏ lại phía sau trên hành trình chinh phục công nghệ.",
	},
	vision: {
		title: "Tầm nhìn",
		body: "Trở thành cộng đồng công nghệ sinh viên hàng đầu — nơi ươm mầm những lập trình viên, nhà thiết kế và người dẫn dắt tương lai, mang giá trị tích cực cho xã hội.",
	},
	stats: [
		{ value: "1000+", label: "Thành viên" },
		{ value: "2018", label: "Năm thành lập" },
		{ value: "50+", label: "Workshop & Sự kiện" },
		{ value: "95%", label: "Có việc sau khi học" },
	],
	values: [
		{
			icon: "BookOpen",
			emoji: "📚",
			title: "Học hỏi",
			subtitle: "Học không ngừng",
			desc: "Tiếp cận tài nguyên, khóa học và kiến thức thực chiến từ mentor đi trước. Chúng tôi tin học tập là hành trình cả đời.",
			bg: "var(--color-pastel-green)",
		},
		{
			icon: "Heart",
			emoji: "🤝",
			title: "Chia sẻ",
			subtitle: "Cho đi là còn mãi",
			desc: "Văn hóa open-source: chia sẻ code, tài liệu, kinh nghiệm với cả cộng đồng — không giữ riêng cho mình.",
			bg: "var(--color-pastel-blue)",
		},
		{
			icon: "Trophy",
			emoji: "🏆",
			title: "Bứt phá",
			subtitle: "Cạnh tranh lành mạnh",
			desc: "Tham gia hackathon, leaderboard và những thử thách để vượt qua giới hạn của chính mình mỗi ngày.",
			bg: "var(--color-pastel-yellow)",
		},
		{
			icon: "Sprout",
			emoji: "🌱",
			title: "Trưởng thành",
			subtitle: "Phát triển toàn diện",
			desc: "Xây dựng portfolio, kỹ năng mềm và mạng lưới chuyên nghiệp ngay từ khi còn ngồi trên ghế nhà trường.",
			bg: "var(--color-pastel-purple)",
		},
	],
	timeline: [
		{
			year: "2018",
			title: "Ngày đầu thành lập",
			desc: "CKC IT CLUB ra đời từ nhóm nhỏ sinh viên đam mê lập trình, với ước mơ tạo ra một sân chơi công nghệ cho sinh viên Cao Thắng.",
			icon: "Flag",
			bg: "var(--color-pastel-green)",
		},
		{
			year: "2020",
			title: "Mở rộng cộng đồng",
			desc: "Chuỗi workshop, seminar và các buổi chia sẻ định kỳ thu hút hàng trăm thành viên. Câu lạc bộ hình thành các ban chuyên môn.",
			icon: "Users",
			bg: "var(--color-pastel-blue)",
		},
		{
			year: "2022",
			title: "Vươn tầm sự kiện",
			desc: "Tổ chức hackathon, cuộc thi lập trình và kết nối doanh nghiệp, mở ra cơ hội thực tập và việc làm cho thành viên.",
			icon: "Rocket",
			bg: "var(--color-pastel-yellow)",
		},
		{
			year: "2024",
			title: "Chuyển đổi số",
			desc: "Xây dựng nền tảng cộng đồng trực tuyến: tài nguyên, blog, khóa học và hệ thống điểm thưởng gamification cho thành viên.",
			icon: "Sparkles",
			bg: "var(--color-pastel-purple)",
		},
		{
			year: "Hôm nay",
			title: "Ngôi nhà thứ hai",
			desc: "Hơn 1000+ thành viên cùng học, chia sẻ và phát triển. Chúng tôi vẫn đang viết tiếp câu chuyện của mình mỗi ngày.",
			icon: "Heart",
			bg: "var(--color-pastel-pink)",
		},
	],
	departments: [
		{
			icon: "Code2",
			title: "Ban Kỹ thuật",
			desc: "Phụ trách chuyên môn, workshop lập trình, mentor kỹ thuật và xây dựng các sản phẩm công nghệ của câu lạc bộ.",
			bg: "var(--color-pastel-green)",
		},
		{
			icon: "Palette",
			title: "Ban Thiết kế",
			desc: "Sáng tạo bộ nhận diện, ấn phẩm truyền thông và trải nghiệm hình ảnh cho mọi hoạt động, sự kiện.",
			bg: "var(--color-pastel-purple2)",
		},
		{
			icon: "Megaphone",
			title: "Ban Truyền thông",
			desc: "Lan tỏa hình ảnh câu lạc bộ, quản lý các kênh mạng xã hội và kết nối với cộng đồng sinh viên.",
			bg: "var(--color-pastel-blue)",
		},
		{
			icon: "CalendarDays",
			title: "Ban Sự kiện",
			desc: "Lên ý tưởng và tổ chức workshop, hackathon, talkshow — nơi những trải nghiệm đáng nhớ được tạo ra.",
			bg: "var(--color-pastel-orange)",
		},
		{
			icon: "PenLine",
			title: "Ban Nội dung",
			desc: "Biên soạn tài liệu, bài viết blog và các khóa học chất lượng, xây dựng kho tri thức chung.",
			bg: "var(--color-pastel-yellow)",
		},
		{
			icon: "Users",
			title: "Ban Nhân sự",
			desc: "Chăm lo đời sống thành viên, gắn kết nội bộ và phát triển văn hóa cộng đồng CKC IT CLUB.",
			bg: "var(--color-pastel-pink)",
		},
	],
	faqs: [
		{
			q: "Ai có thể tham gia CKC IT CLUB?",
			a: "Tất cả sinh viên Trường Cao đẳng Kỹ thuật Cao Thắng yêu thích công nghệ đều có thể tham gia — dù bạn là người mới bắt đầu hay đã có kinh nghiệm. Chúng tôi chào đón mọi đam mê!",
		},
		{
			q: "Tôi cần biết lập trình trước khi tham gia không?",
			a: "Không bắt buộc. Câu lạc bộ có lộ trình, tài nguyên và mentor hỗ trợ người mới. Điều quan trọng nhất là tinh thần ham học hỏi và sẵn sàng chia sẻ.",
		},
		{
			q: "Tham gia CLB có mất phí không?",
			a: "Hoàn toàn miễn phí. CKC IT CLUB là cộng đồng phi lợi nhuận, hoạt động dựa trên tinh thần tự nguyện và văn hóa chia sẻ của các thành viên.",
		},
		{
			q: "Làm sao để đăng ký tham gia?",
			a: 'Bạn chỉ cần nhấn nút "Ứng tuyển" trên trang web, điền thông tin và chờ ban chủ nhiệm liên hệ. Chúng tôi sẽ hướng dẫn bạn những bước tiếp theo.',
		},
		{
			q: "Các hoạt động chính của CLB là gì?",
			a: "Workshop chuyên môn, hackathon, cuộc thi lập trình, chia sẻ tài nguyên, khóa học trực tuyến, cộng đồng thảo luận và nhiều sự kiện kết nối doanh nghiệp.",
		},
	],
	cta: {
		title: "Sẵn sàng viết tiếp câu chuyện cùng chúng tôi?",
		body_html:
			"Trở thành một phần của cộng đồng hơn <strong>1000+ sinh viên IT</strong> — nơi bạn được học, được chia sẻ và được là chính mình.",
		primary_label: "Tham gia ngay",
		primary_link: "/ung-tuyen",
		secondary_label: "Khám phá cộng đồng",
		secondary_link: "/cong-dong",
	},
};

/**
 * Lấy nội dung trang About từ API. Mỗi section trả về được dùng nếu hợp lệ
 * (object không rỗng / mảng có phần tử), ngược lại giữ giá trị mặc định — nhờ
 * đó giao diện luôn đầy đủ kể cả khi backend chưa seed hoặc lỗi.
 */
export const aboutService = {
	async getAboutContent(): Promise<AboutContent> {
		try {
			const res = await api.get<ApiResponse<Partial<AboutContent>>>("/about-page");
			const data = (res as ApiResponse<Partial<AboutContent>>).data ?? {};
			return mergeAboutContent(data);
		} catch {
			return DEFAULT_ABOUT_CONTENT;
		}
	},
};

function mergeAboutContent(data: Partial<AboutContent>): AboutContent {
	const pickArray = <T>(value: unknown, fallback: T[]): T[] =>
		Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback;

	const pickObject = <T extends object>(value: unknown, fallback: T): T =>
		value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0
			? { ...fallback, ...(value as T) }
			: fallback;

	return {
		hero: pickObject(data.hero, DEFAULT_ABOUT_CONTENT.hero),
		story: pickObject(data.story, DEFAULT_ABOUT_CONTENT.story),
		mission: pickObject(data.mission, DEFAULT_ABOUT_CONTENT.mission),
		vision: pickObject(data.vision, DEFAULT_ABOUT_CONTENT.vision),
		stats: pickArray(data.stats, DEFAULT_ABOUT_CONTENT.stats),
		values: pickArray(data.values, DEFAULT_ABOUT_CONTENT.values),
		timeline: pickArray(data.timeline, DEFAULT_ABOUT_CONTENT.timeline),
		departments: pickArray(data.departments, DEFAULT_ABOUT_CONTENT.departments),
		faqs: pickArray(data.faqs, DEFAULT_ABOUT_CONTENT.faqs),
		cta: pickObject(data.cta, DEFAULT_ABOUT_CONTENT.cta),
	};
}
