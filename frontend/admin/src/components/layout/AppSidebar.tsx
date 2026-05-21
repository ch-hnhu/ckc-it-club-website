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
import { useAuth } from "@/contexts/AuthContext";
import type { AdminNavItem } from "@/config/navigation";
import type { ContactStats } from "@/types/contact.type";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user, hasPermission, hasAnyPermission } = useAuth();
	const [contactStats, setContactStats] = useState<ContactStats | null>(null);

	const fetchContactStats = () => {
		if (!hasPermission("contacts.view")) return;
		contactService
			.getStats()
			.then((stats) => setContactStats(stats))
			.catch((err) => console.error("Failed to fetch contact stats", err));
	};

	useEffect(() => {
		const handleContactStatsRefresh = () => fetchContactStats();
		fetchContactStats();
		window.addEventListener("contacts:stats-refresh", handleContactStatsRefresh);
		return () =>
			window.removeEventListener("contacts:stats-refresh", handleContactStatsRefresh);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	const filteredNavItems: AdminNavItem[] = adminNavMain
		.map((item) => {
			const visibleChildren = item.items?.filter(
				(child) => !child.permission || hasPermission(child.permission),
			);

			const withBadge =
				item.url === "/contacts" ? { ...item, badge: contactStats?.pending ?? 0 } : item;

			return { ...withBadge, items: visibleChildren };
		})
		.filter((item) => {
			if (!item.items || item.items.length === 0) return false;
			return (
				!item.permission ||
				hasPermission(item.permission) ||
				hasAnyPermission(item.items.map((c) => c.permission).filter(Boolean) as string[])
			);
		});

	const navUser = user
		? {
				id: user.id,
				full_name: user.full_name,
				email: user.email,
				avatar: user.avatar,
				roles: user.roles,
			}
		: null;

	return (
		<Sidebar collapsible='icon' {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={adminNavHead} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={filteredNavItems} title='General' />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={navUser as any} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
