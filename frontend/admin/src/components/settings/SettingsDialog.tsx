import { type ReactNode, useState } from "react";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProfileSettingsForm from "@/components/settings/ProfileSettingsForm";

type SettingsTab = {
	id: string;
	label: string;
	icon: ReactNode;
	content: ReactNode;
};

const TABS: SettingsTab[] = [
	{
		id: "profile",
		label: "Hồ sơ",
		icon: <UserIcon className='h-4 w-4' />,
		content: <ProfileSettingsForm />,
	},
];

type SettingsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
	const [activeTab, setActiveTab] = useState(TABS[0].id);
	const activeTabData = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton
				className='flex h-full max-h-[min(640px,calc(100vh-2rem))] w-full max-w-[min(48rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(48rem,calc(100%-2rem))]'>
				<DialogTitle className='shrink-0 border-b px-4 py-3 text-lg font-semibold sm:hidden'>
					Cài đặt
				</DialogTitle>
				<DialogDescription className='sr-only'>
					Quản lý thông tin tài khoản và tùy chọn của bạn.
				</DialogDescription>

				<div className='flex flex-1 flex-col overflow-hidden sm:flex-row'>
					{/* Sidebar */}
					<aside className='w-full shrink-0 border-b bg-white dark:bg-transparent md:bg-muted/30 p-2 sm:w-56 sm:border-b-0 sm:border-r sm:p-3'>
						<h2 className='mb-4 hidden px-3 pt-2 text-lg font-semibold sm:block'>
							Cài đặt
						</h2>
						<nav className='flex gap-1 overflow-x-auto sm:block sm:space-y-1 sm:overflow-visible'>
							{TABS.map((tab) => (
								<button
									key={tab.id}
									type='button'
									onClick={() => setActiveTab(tab.id)}
									className={cn(
										"flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-normal transition-colors sm:w-full",
										activeTab === tab.id
											? "bg-accent text-accent-foreground"
											: "hover:bg-accent hover:text-accent-foreground",
									)}>
									{tab.icon}
									{tab.label}
								</button>
							))}
						</nav>
					</aside>

					{/* Content */}
					<div className='flex-1 overflow-y-auto p-4 sm:p-6'>
						<div className='mb-6 space-y-1'>
							<h3 className='text-lg font-semibold'>{activeTabData.label}</h3>
							<p className='text-sm text-muted-foreground'>
								Quản lý thông tin cá nhân và ảnh đại diện của bạn.
							</p>
						</div>
						{activeTabData.content}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default SettingsDialog;
