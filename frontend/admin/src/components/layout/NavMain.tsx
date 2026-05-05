import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
	items,
	title,
}: {
	title?: string;
	items: {
		title: string;
		url: string;
		icon?: LucideIcon;
		badge?: number;
		isActive?: boolean;
		items?: {
			title: string;
			url: string;
		}[];
	}[];
}) {
	const { pathname } = useLocation();

	return (
		<SidebarGroup>
			{title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
			<SidebarMenu>
				{items.map((item) => {
					const isParentActive =
						pathname === item.url ||
						pathname.startsWith(item.url + "/") ||
						item.items?.some(
							(subItem) =>
								pathname === subItem.url || pathname.startsWith(subItem.url + "/"),
						);

					return (
						<Collapsible
							key={item.title}
							asChild
							defaultOpen={isParentActive}
							className='group/collapsible'>
							<SidebarMenuItem>
								<CollapsibleTrigger asChild>
									<SidebarMenuButton tooltip={item.title}>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
										{typeof item.badge === "number" && item.badge > 0 ? (
											<span className='ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-sidebar-accent px-1 text-xs font-medium text-sidebar-accent-foreground tabular-nums'>
												{item.badge > 99 ? "99+" : item.badge}
											</span>
										) : null}
										<ChevronRight
											className={`transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${
												typeof item.badge === "number" && item.badge > 0
													? "ml-2"
													: "ml-auto"
											}`}
										/>
									</SidebarMenuButton>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.items?.map((subItem) => {
											const isSubActive =
												pathname === subItem.url ||
												pathname.startsWith(subItem.url + "/");

											return (
												<SidebarMenuSubItem key={subItem.title}>
													<SidebarMenuSubButton
														asChild
														isActive={isSubActive}>
														<Link to={subItem.url}>
															<span>{subItem.title}</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											);
										})}
									</SidebarMenuSub>
								</CollapsibleContent>
							</SidebarMenuItem>
						</Collapsible>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
