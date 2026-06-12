import {
	Award,
	Building,
	CalendarDays,
	Globe,
	House,
	MailOpen,
	Trophy,
	UserRoundPlus,
	Users,
	type LucideIcon,
} from "lucide-react";
import type { BreadcrumbItemType } from "@/components/partials/CustomBreadcrumb";

export type AdminNavHeadItem = {
	name: string;
	logo: string;
	role: string;
};

export type AdminNavChildItem = {
	title: string;
	url: string;
	permission?: string;
};

export type AdminNavItem = {
	title: string;
	url: string;
	icon: LucideIcon;
	badge?: number;
	isActive?: boolean;
	permission?: string;
	items?: AdminNavChildItem[];
};

export const adminNavHead: AdminNavHeadItem[] = [
	{
		name: "CKC IT CLUB",
		logo: "https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images/it_club_ckc.jpg",
		role: "Quản trị viên",
	},
];

export const adminNavMain: AdminNavItem[] = [
	{
		title: "Dashboard",
		url: "/",
		icon: House,
		isActive: true,
		permission: "dashboard.view",
		items: [
			{
				title: "Thống kê",
				url: "/",
				permission: "dashboard.view",
			},
		],
	},
	{
		title: "Người dùng & Phân quyền",
		url: "/users",
		icon: Users,
		permission: "users.view",
		items: [
			{
				title: "Người dùng",
				url: "/users",
				permission: "users.view",
			},
			{
				title: "Vai trò",
				url: "/roles",
				permission: "roles.view",
			},
			{
				title: "Quyền hạn",
				url: "/permissions",
				permission: "permissions.view",
			},
		],
	},
	{
		title: "Quản lý đơn vị",
		url: "/organization/upload",
		icon: Building,
		permission: "academic_data.view",
		items: [
			{
				title: "Tải lên danh sách đơn vị",
				url: "/organization/upload",
				permission: "academic_structure.import",
			},
			{
				title: "Khoa",
				url: "/departments",
				permission: "academic_data.view",
			},
			{
				title: "Ngành",
				url: "/majors",
				permission: "academic_data.view",
			},
			{
				title: "Lớp",
				url: "/classes",
				permission: "academic_data.view",
			},
		],
	},
	{
		title: "Quản lý CLB",
		url: "/club-informations",
		icon: Trophy,
		permission: "club_info.view",
		items: [
			{
				title: "Các ban",
				url: "/divisions",
				permission: "club_info.view",
			},
			{
				title: "Thông tin CLB",
				url: "/club-informations",
				permission: "club_info.view",
			},
		],
	},
	{
		title: "Tuyển thành viên",
		url: "/requests",
		icon: UserRoundPlus,
		permission: "applications.view",
		items: [
			{
				title: "Form ứng tuyển",
				url: "/questions",
				permission: "application_questions.view",
			},
			{
				title: "Yêu cầu tham gia",
				url: "/requests",
				permission: "applications.view",
			},
			{
				title: "Mail template",
				url: "/mail-templates",
				permission: "mail_templates.view",
			},
		],
	},
	{
		title: "Quản lý cộng đồng",
		url: "/community/posts",
		icon: Globe,
		permission: "community.view",
		items: [
			{
				title: "Kênh cộng đồng",
				url: "/community/channels",
				permission: "community.channels.manage",
			},
			{
				title: "Post",
				url: "/community/posts",
				permission: "community.posts.view",
			},
			{
				title: "Blog",
				url: "/community/blogs",
				permission: "community.blogs.view",
			},
			{
				title: "Bình luận",
				url: "/community/comments",
				permission: "community.comments.view",
			},
			{
				title: "Tags",
				url: "/community/tags",
				permission: "community.tags.manage",
			},
			{
				title: "Phòng chat",
				url: "/community/chat",
				permission: "community.chat.view",
			},
			{
				title: "Tài nguyên",
				url: "/community/media",
				permission: "community.media.view",
			},
			{
				title: "Skills",
				url: "/community/skills",
				permission: "community.skills.manage",
			},
			{
				title: "Báo cáo vi phạm",
				url: "/community/reports",
				permission: "community.reports.view",
			},
		],
	},
	{
		title: "Quản lý sự kiện",
		url: "/events",
		icon: CalendarDays,
		permission: "events.view",
		items: [
			{
				title: "Sự kiện",
				url: "/events",
				permission: "events.view",
			},
		],
	},
	{
		title: "Điểm & Bảng xếp hạng",
		url: "/gamification/leaderboard",
		icon: Award,
		permission: "gamification.view",
		items: [
			{
				title: "Leaderboard",
				url: "/gamification/leaderboard",
				permission: "gamification.view",
			},
			{
				title: "Activity Point Rules",
				url: "/gamification/point-rules",
				permission: "gamification.manage",
			},
			{
				title: "Level Rules",
				url: "/gamification/levels",
				permission: "gamification.manage",
			},
		],
	},
	{
		title: "Quản lý liên hệ",
		url: "/contacts",
		icon: MailOpen,
		permission: "contacts.view",
	},
];

const rootBreadcrumb: BreadcrumbItemType = { title: "Dashboard", link: "/" };

function normalizePath(path: string) {
	if (!path) return "/";
	if (path === "/") return path;
	return path.replace(/\/+$/, "");
}

const adminRoutePermissionRules: Array<{ pattern: RegExp; permission: string }> = [
	{ pattern: /^\/$/, permission: "dashboard.view" },
	{ pattern: /^\/users$/, permission: "users.view" },
	{ pattern: /^\/users\/create$/, permission: "users.create" },
	{ pattern: /^\/users\/[^/]+$/, permission: "users.update" },
	{ pattern: /^\/roles$/, permission: "roles.view" },
	{ pattern: /^\/roles\/[^/]+$/, permission: "roles.view" },
	{ pattern: /^\/permissions$/, permission: "permissions.view" },
	{ pattern: /^\/organization\/upload$/, permission: "academic_structure.import" },
	{ pattern: /^\/departments$/, permission: "academic_data.view" },
	{ pattern: /^\/departments\/trash$/, permission: "academic_data.view" },
	{ pattern: /^\/majors$/, permission: "academic_data.view" },
	{ pattern: /^\/majors\/trash$/, permission: "academic_data.view" },
	{ pattern: /^\/classes$/, permission: "academic_data.view" },
	{ pattern: /^\/classes\/trash$/, permission: "academic_data.view" },
	{ pattern: /^\/contacts$/, permission: "contacts.view" },
	{ pattern: /^\/divisions$/, permission: "club_info.view" },
	{ pattern: /^\/divisions\/trash$/, permission: "club_info.view" },
	{ pattern: /^\/divisions\/[^/]+$/, permission: "club_info.view" },
	{ pattern: /^\/club-informations$/, permission: "club_info.view" },
	{ pattern: /^\/club-informations\/create$/, permission: "club_info.manage" },
	{ pattern: /^\/club-informations\/[^/]+$/, permission: "club_info.view" },
	{ pattern: /^\/requests$/, permission: "applications.view" },
	{ pattern: /^\/requests\/[^/]+$/, permission: "applications.view" },
	{ pattern: /^\/questions$/, permission: "application_questions.view" },
	{ pattern: /^\/questions\/[^/]+$/, permission: "application_questions.view" },
	{ pattern: /^\/answers$/, permission: "applications.view" },
	{ pattern: /^\/mail-templates$/, permission: "mail_templates.view" },
	{ pattern: /^\/mail-templates\/[^/]+$/, permission: "mail_templates.view" },
	{ pattern: /^\/community\/channels$/, permission: "community.channels.manage" },
	{ pattern: /^\/community\/posts$/, permission: "community.posts.view" },
	{ pattern: /^\/community\/posts\/[^/]+$/, permission: "community.posts.view" },
	{ pattern: /^\/community\/blogs$/, permission: "community.blogs.view" },
	{ pattern: /^\/community\/blogs\/create$/, permission: "community.blogs.manage" },
	{ pattern: /^\/community\/blogs\/[^/]+$/, permission: "community.blogs.view" },
	{ pattern: /^\/community\/comments$/, permission: "community.comments.view" },
	{ pattern: /^\/community\/tags$/, permission: "community.tags.manage" },
	{ pattern: /^\/community\/chat$/, permission: "community.chat.view" },
	{ pattern: /^\/community\/notifications$/, permission: "community.notifications.send" },
	{ pattern: /^\/community\/media$/, permission: "community.media.view" },
	{ pattern: /^\/community\/skills$/, permission: "community.skills.manage" },
	{ pattern: /^\/community\/reports$/, permission: "community.reports.view" },
	{ pattern: /^\/community\/blog-reports$/, permission: "community.reports.view" },
	{ pattern: /^\/events$/, permission: "events.view" },
	{ pattern: /^\/events\/create$/, permission: "events.manage" },
	{ pattern: /^\/events\/[^/]+\/edit$/, permission: "events.manage" },
	{ pattern: /^\/gamification\/leaderboard$/, permission: "gamification.view" },
	{ pattern: /^\/gamification\/point-rules$/, permission: "gamification.manage" },
	{ pattern: /^\/gamification\/levels$/, permission: "gamification.manage" },
];

export function getRequiredPermissionForPath(pathname: string): string | null {
	const normalizedPath = normalizePath(pathname);
	return (
		adminRoutePermissionRules.find((rule) => rule.pattern.test(normalizedPath))?.permission ??
		null
	);
}

export function getBreadcrumbsFromNavigation(
	targetUrl: string,
	extraItems: BreadcrumbItemType[] = [],
): BreadcrumbItemType[] {
	const normalizedTarget = normalizePath(targetUrl);

	if (normalizedTarget === "/") {
		return extraItems.length ? [rootBreadcrumb, ...extraItems] : [rootBreadcrumb];
	}

	for (const item of adminNavMain) {
		const childItem = item.items?.find(
			(subItem) => normalizePath(subItem.url) === normalizedTarget,
		);
		if (childItem) {
			return [
				rootBreadcrumb,
				{ title: item.title, link: item.url },
				{ title: childItem.title, link: childItem.url },
				...extraItems,
			];
		}

		if (normalizePath(item.url) === normalizedTarget) {
			return [rootBreadcrumb, { title: item.title, link: item.url }, ...extraItems];
		}
	}

	return extraItems.length ? [rootBreadcrumb, ...extraItems] : [rootBreadcrumb];
}

export function getFirstAuthorizedNavPath(permissions: string[]): string | null {
	const hasPermission = (permission?: string) => !permission || permissions.includes(permission);

	for (const item of adminNavMain) {
		const firstAuthorizedChild = item.items?.find((child) => hasPermission(child.permission));

		if (firstAuthorizedChild) {
			return firstAuthorizedChild.url;
		}

		if (hasPermission(item.permission)) {
			return item.url;
		}
	}

	return null;
}
