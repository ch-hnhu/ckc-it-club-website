"use client";

import * as React from "react";
import { useEffect, useState } from "react";

import { NavMain } from "@/components/layout/NavMain";
import { NavUser } from "@/components/layout/NavUser";
import { TeamSwitcher } from "@/components/layout/TeamSwitcher";
import { adminNavHead, adminNavMain } from "@/config/navigation";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import contactService from "@/services/contact.service";
import userService from "@/services/user.service";
import type { AdminNavItem } from "@/config/navigation";
import type { ContactStats } from "@/types/contact.type";
import type { User as UserType } from "@/types/user.type";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const [user, setUser] = useState<UserType | null>(null);
	const [contactStats, setContactStats] = useState<ContactStats | null>(null);

	const fetchContactStats = () => {
		contactService
			.getStats()
			.then((stats) => setContactStats(stats))
			.catch((err) => console.error("Failed to fetch contact stats", err));
	};

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

	useEffect(() => {
		const handleContactStatsRefresh = () => {
			fetchContactStats();
		};

		fetchContactStats();
		window.addEventListener("contacts:stats-refresh", handleContactStatsRefresh);

		return () => {
			window.removeEventListener("contacts:stats-refresh", handleContactStatsRefresh);
		};
	}, []);

	const navItems: AdminNavItem[] = adminNavMain.map((item) =>
		item.url === "/contacts"
			? {
					...item,
					badge: contactStats?.pending ?? 0,
				}
			: item,
	);

	return (
		<Sidebar collapsible='icon' {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={adminNavHead} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navItems} title='General' />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
