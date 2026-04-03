"use client";

import * as React from "react";
import { Building, House, Trophy, UserRoundPlus, Users } from "lucide-react";

import { NavMain } from "@/components/layout/NavMain";
import { NavUser } from "@/components/layout/NavUser";
import { TeamSwitcher } from "@/components/layout/TeamSwitcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import type { User as UserType } from "@/types/user.type";
import userService from "@/services/user.service";

// Dữ liệu mẫu từ sidebar cũ
const data = {
	navHead: [
		{
			name: "CKC IT CLUB",
			logo: "../../public/img/ckc-it-club-logo.jpg",
			role: "Quản trị viên",
		},
	],
	navMain: [
		{
			title: "Dashboard",
			url: "/",
			icon: House,
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
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const [user, setUser] = useState<UserType | null>(null);

	useEffect(() => {
		userService
			.getMe()
			.then((response) => {
				if (response.success) {
					setUser(response.data);
				}
			})
			.catch((err) => console.error("Failed to fetch user", err));
	}, []);

	return (
		<Sidebar collapsible='icon' {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={data.navHead} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} title='General' />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
