// Kiểu dữ liệu nội dung trang "Về chúng tôi" (About) cho admin — khớp với
// payload GET/PUT /api/v1/about-page. `icon` là tên chuỗi (map sang lucide ở FE user).

export interface AboutHero {
	badge: string;
	title_prefix: string;
	highlight: string;
	lead_html: string;
	primary_label: string;
	primary_link: string;
	secondary_label: string;
	secondary_link: string;
}

export interface AboutStory {
	heading: string;
	image: string;
	paragraphs: string[];
}

export interface AboutMissionVision {
	title: string;
	body: string;
}

export interface AboutStat {
	value: string;
	label: string;
}

export interface AboutValue {
	icon: string;
	emoji: string;
	title: string;
	subtitle: string;
	desc: string;
	bg: string;
}

export interface AboutTimelineItem {
	year: string;
	title: string;
	desc: string;
	icon: string;
	bg: string;
}

export interface AboutDepartment {
	icon: string;
	title: string;
	desc: string;
	bg: string;
}

export interface AboutAward {
	icon: string;
	title: string;
	event: string;
	year: string;
	desc: string;
	bg: string;
}

export interface AboutFaq {
	q: string;
	a: string;
}

export interface AboutCta {
	title: string;
	body_html: string;
	primary_label: string;
	primary_link: string;
	secondary_label: string;
	secondary_link: string;
}

export interface AboutContent {
	hero: AboutHero;
	story: AboutStory;
	mission: AboutMissionVision;
	vision: AboutMissionVision;
	stats: AboutStat[];
	values: AboutValue[];
	timeline: AboutTimelineItem[];
	departments: AboutDepartment[];
	awards: AboutAward[];
	faqs: AboutFaq[];
	cta: AboutCta;
}

/** Tên icon cho phép chọn (đồng bộ với @/lib/aboutIcons ở FE user). */
export const ABOUT_ICON_NAMES = [
	"BookOpen",
	"Heart",
	"Trophy",
	"Sprout",
	"Flag",
	"Users",
	"Rocket",
	"Sparkles",
	"Code2",
	"Palette",
	"Megaphone",
	"CalendarDays",
	"PenLine",
	"Star",
	"Award",
	"Medal",
	"Crown",
] as const;

/** Màu nền pastel (biến CSS ở FE user) dùng cho các thẻ. */
export const ABOUT_BG_OPTIONS = [
	{ value: "var(--color-pastel-green)", label: "Xanh lá pastel" },
	{ value: "var(--color-pastel-blue)", label: "Xanh dương pastel" },
	{ value: "var(--color-pastel-yellow)", label: "Vàng pastel" },
	{ value: "var(--color-pastel-purple)", label: "Tím pastel" },
	{ value: "var(--color-pastel-purple2)", label: "Tím pastel 2" },
	{ value: "var(--color-pastel-pink)", label: "Hồng pastel" },
	{ value: "var(--color-pastel-orange)", label: "Cam pastel" },
] as const;
