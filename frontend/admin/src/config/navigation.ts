import {
	Building,
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
};

export type AdminNavItem = {
	title: string;
	url: string;
	icon: LucideIcon;
	isActive?: boolean;
	items?: AdminNavChildItem[];
};

export const adminNavHead: AdminNavHeadItem[] = [
	{
		name: "CKC IT CLUB",
		logo: "../../public/img/ckc-it-club-logo.jpg",
		role: "Quản trị viên",
	},
];

export const adminNavMain: AdminNavItem[] = [
	{
		title: "Dashboard",
		url: "/",
		icon: House,
		isActive: true,
		items: [
			{
				title: "Thống kê",
				url: "/",
			},
			{
				title: "Báo cáo",
				url: "/reports",
			},
		],
	},
	{
		title: "Quản lý người dùng",
		url: "/users",
		icon: Users,
		items: [
			{
				title: "Người dùng",
				url: "/users",
			},
			{
				title: "Vai trò",
				url: "/roles",
			},
			{
				title: "Phân quyền",
				url: "/permissions",
			},
		],
	},
	{
		title: "Quản lý đơn vị",
		url: "/departments",
		icon: Building,
		items: [
			{
				title: "Khoa",
				url: "/departments",
			},
			{
				title: "Ngành",
				url: "/majors",
			},
			{
				title: "Lớp",
				url: "/classes",
			},
		],
	},
	{
		title: "Quản lý CLB",
		url: "/club-info",
		icon: Trophy,
		items: [
			{
				title: "Các ban",
				url: "/divisions",
			},
			{
				title: "Thông tin CLB",
				url: "/club-info",
			},
			{
				title: "Trường thông tin",
				url: "/fields",
			},
		],
	},
	{
		title: "Quản lý liên hệ",
		url: "/contacts",
		icon: MailOpen,
		items: [
			{
				title: "Danh sách liên hệ",
				url: "/contacts",
			},
		],
	},
	{
		title: "Tuyển thành viên",
		url: "/requests",
		icon: UserRoundPlus,
		items: [
			{
				title: "Câu hỏi ứng tuyển",
				url: "/questions",
			},
			{
				title: "Câu trả lời",
				url: "/answers",
			},
			{
				title: "Yêu cầu tham gia",
				url: "/requests",
			},
		],
	},
];

const rootBreadcrumb: BreadcrumbItemType = { title: "Dashboard", link: "/" };

function normalizePath(path: string) {
	if (!path) return "/";
	if (path === "/") return path;
	return path.replace(/\/+$/, "");
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
		const childItem = item.items?.find((subItem) => normalizePath(subItem.url) === normalizedTarget);
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
