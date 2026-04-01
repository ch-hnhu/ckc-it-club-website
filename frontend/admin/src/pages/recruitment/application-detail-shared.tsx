import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus, ClubApplicationRecord } from "@/types/application.type";

export const statusMap: Record<ApplicationStatus, { label: string; className: string }> = {
	pending: { label: "Chờ duyệt", className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300" },
	processing: { label: "Đang xử lý", className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300" },
	interview: { label: "Phỏng vấn", className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300" },
	passed: { label: "Đạt", className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" },
	failed: { label: "Không đạt", className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300" },
};

export const statusTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
	pending: ["processing"],
	processing: ["interview"],
	interview: ["passed", "failed"],
	passed: [],
	failed: [],
};

const fallbackStatusConfig = {
	label: "Chưa xác định",
	className: "border-border bg-muted text-muted-foreground",
};

export function formatDate(dateString: string | null) {
	if (!dateString) return "--";
	return new Intl.DateTimeFormat("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(dateString));
}

export function getApplicantName(application: ClubApplicationRecord) {
	return application.applicant?.full_name || `Người dùng #${application.created_by}`;
}

export function getStatusConfig(status: string | null | undefined) {
	return status ? statusMap[status as ApplicationStatus] || fallbackStatusConfig : fallbackStatusConfig;
}

export function getNextStatuses(status: string | null | undefined) {
	return status ? statusTransitions[status as ApplicationStatus] || [] : [];
}

export function getStatusBadge(status: string | null | undefined) {
	const config = getStatusConfig(status);
	return (
		<Badge variant='outline' className={config.className}>
			{config.label}
		</Badge>
	);
}

export function SummaryCard({
	icon,
	label,
	value,
	children,
}: {
	icon: React.ReactNode;
	label: string;
	value?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className='rounded-2xl border border-border bg-card p-5 shadow-sm'>
			<div className='flex items-start gap-3'>
				<div className='text-primary mt-1 shrink-0'>{icon}</div>
				<div className='min-w-0'>
					<p className='text-sm text-muted-foreground'>{label}</p>
					{children ? (
						<div className='pt-2'>{children}</div>
					) : (
						<p className='mt-1 break-words text-lg font-semibold leading-7 text-foreground'>
							{value}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
