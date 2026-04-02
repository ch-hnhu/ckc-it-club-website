import { ChevronsUpDown, CircleUserRound, LogOut, Moon, Settings, Sun } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import type { User as UserType } from "@/types/user.type";
import userService from "@/services/user.service";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/provider/theme-provider";

export function NavUser({ user }: { user: UserType | null }) {
	const { isMobile } = useSidebar();
	const navigate = useNavigate();
	const { theme, setTheme } = useTheme();

	const handleLogout = async () => {
		try {
			await userService.logout();
		} catch (error) {
			console.error("Logout API failed:", error);
		} finally {
			localStorage.clear();
			navigate("/login");
		}
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size='lg'
							className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'>
							<Avatar className='h-8 w-8 rounded-lg'>
								<AvatarImage src={user?.avatar} alt={user?.full_name} />
								<AvatarFallback className='rounded-lg'>CN</AvatarFallback>
							</Avatar>
							<div className='grid flex-1 text-left text-sm leading-tight'>
								<span className='truncate font-medium'>{user?.full_name}</span>
								<span className='truncate text-xs'>{user?.email}</span>
							</div>
							<ChevronsUpDown className='ml-auto size-4' />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
						side={isMobile ? "bottom" : "right"}
						align='end'
						sideOffset={4}>
						<DropdownMenuLabel className='p-0 font-normal'>
							<div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
								<Avatar className='h-8 w-8 rounded-lg'>
									<AvatarImage src={user?.avatar} alt={user?.full_name} />
									<AvatarFallback className='rounded-lg'>CN</AvatarFallback>
								</Avatar>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-medium'>{user?.full_name}</span>
									<span className='truncate text-xs'>{user?.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<CircleUserRound />
								Hồ sơ
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
								{theme === "dark" ? <Sun /> : <Moon />}
								{theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Settings />
								Cài đặt
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleLogout}>
							<LogOut />
							Đăng xuất
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
