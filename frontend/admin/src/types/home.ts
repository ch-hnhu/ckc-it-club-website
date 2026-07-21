// Kiểu dữ liệu nội dung tĩnh của trang chủ (Landing) cho admin — khớp với
// payload GET/PUT /api/v1/home-page. Khối "Giải thưởng & Thành tích" dùng chung
// config trang About (xem @/types/about) nên không nằm ở đây.

export interface HomeStat {
	value: string;
	label: string;
}

export interface HomeHero {
	badge: string;
	title_line1: string;
	title_line2: string;
	highlight: string;
	lead_html: string;
	stats: HomeStat[];
	primary_label: string;
	primary_link: string;
	secondary_label: string;
	secondary_link: string;
}

export interface HomeQuickAction {
	emoji: string;
	title: string;
	desc: string;
	link: string;
	bg: string;
	requireAuth: boolean;
}

export interface HomeQuickActions {
	heading: string;
	subheading: string;
	items: HomeQuickAction[];
}

export interface HomeValue {
	emoji: string;
	title: string;
	subtitle: string;
	desc: string;
	bg: string;
}

export interface HomeAbout {
	heading: string;
	paragraphs_html: string[];
	milestones: HomeStat[];
	button_label: string;
	button_link: string;
	values: HomeValue[];
}

export interface HomeSectionHeader {
	title: string;
	subtitle: string;
}

export interface HomeFeaturedHeader extends HomeSectionHeader {
	blog_title: string;
	event_title: string;
	course_title: string;
}

export interface HomeLeaderboardHeader {
	title: string;
	cta_label: string;
}

export interface HomeHeaders {
	mentor: HomeSectionHeader;
	board: HomeSectionHeader;
	featured: HomeFeaturedHeader;
	leaderboard: HomeLeaderboardHeader;
	awards: HomeSectionHeader;
}

export interface HomeContribution {
	heading: string;
	body_html: string;
	button_label: string;
}

export interface HomeCta {
	badge: string;
	title_prefix: string;
	highlight: string;
	title_suffix: string;
	subtext: string;
	button_label: string;
	button_link: string;
	trust_text: string;
}

export interface HomeContent {
	hero: HomeHero;
	quick_actions: HomeQuickActions;
	about: HomeAbout;
	headers: HomeHeaders;
	contribution: HomeContribution;
	cta: HomeCta;
}
