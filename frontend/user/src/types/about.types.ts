// Kiểu dữ liệu nội dung trang "Về chúng tôi" (About) — khớp payload từ
// GET /api/v1/about-page. `icon` là tên chuỗi, được map sang component lucide
// ở phía render (xem @/lib/aboutIcons).

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
	faqs: AboutFaq[];
	cta: AboutCta;
}
