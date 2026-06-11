import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Mail, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import mailTemplateService from "@/services/mail-template.service";
import type { MailTemplateType } from "@/types/mail-template";

const SLUG_LABELS: Record<string, { label: string; color: string }> = {
	processing: { label: "Đang xét duyệt", color: "bg-sky-100 text-sky-800 border-sky-200" },
	interview: { label: "Mời phỏng vấn", color: "bg-violet-100 text-violet-800 border-violet-200" },
	passed: { label: "Trúng tuyển", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
	failed: { label: "Không trúng tuyển", color: "bg-rose-100 text-rose-800 border-rose-200" },
};

type SortKey = "id" | "label" | "slug" | "description" | "templates_count";

function formatText(value?: string | null) {
	return value?.trim() || "--";
}

function getStatusLabel(slug: string) {
	return SLUG_LABELS[slug]?.label ?? slug;
}

function MailTemplateListPage() {
	const navigate = useNavigate();
	const breadcrumb = useMemo(
		() => [
			{ title: "Dashboard", link: "/" },
			{ title: "Tuyển thành viên", link: "/requests" },
			{ title: "Mail template" },
		],
		[],
	);
	useBreadcrumb(breadcrumb);

	const [types, setTypes] = useState<MailTemplateType[]>([]);
	const [loading, setLoading] = useState(true);
	const [autoSendEnabled, setAutoSendEnabled] = useState(false);
	const [toggling, setToggling] = useState(false);
	const [sortConfig, setSortConfig] = useState<{
		key: SortKey | null;
		order: "asc" | "desc" | null;
	}>({
		key: "id",
		order: "asc",
	});

	useEffect(() => {
		Promise.all([
			mailTemplateService.getTypes(),
			mailTemplateService.getEmailNotificationSetting(),
		])
			.then(([typesRes, settingRes]) => {
				setTypes(typesRes.data ?? []);
				setAutoSendEnabled(settingRes.data?.enabled ?? false);
			})
			.catch(() => toast.error("Không thể tải dữ liệu."))
			.finally(() => setLoading(false));
	}, []);

	const handleToggle = async (checked: boolean) => {
		setToggling(true);
		try {
			await mailTemplateService.toggleEmailNotification(checked);
			setAutoSendEnabled(checked);
			toast.success(checked ? "Đã bật tự động gửi mail." : "Đã tắt tự động gửi mail.");
		} catch {
			toast.error("Không thể cập nhật cài đặt.");
		} finally {
			setToggling(false);
		}
	};

	const handleSort = (key: SortKey) => {
		let order: "asc" | "desc" | null = "asc";

		if (sortConfig.key === key) {
			order = sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}

		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: SortKey) =>
		sortConfig.key !== key ? (
			<ArrowUpDown className='ml-2 h-4 w-4' />
		) : sortConfig.order === "asc" ? (
			<ArrowUp className='ml-2 h-4 w-4' />
		) : sortConfig.order === "desc" ? (
			<ArrowDown className='ml-2 h-4 w-4' />
		) : (
			<ArrowUpDown className='ml-2 h-4 w-4' />
		);

	const sortedTypes = useMemo(() => {
		if (!sortConfig.key || !sortConfig.order) return types;

		const { key, order } = sortConfig;

		return [...types].sort((a, b) => {
			let valueA: string | number;
			let valueB: string | number;

			if (key === "slug") {
				valueA = getStatusLabel(a.slug).toLowerCase();
				valueB = getStatusLabel(b.slug).toLowerCase();
			} else if (key === "description") {
				valueA = (a.description ?? "").toLowerCase();
				valueB = (b.description ?? "").toLowerCase();
			} else if (key === "label") {
				valueA = a.label.toLowerCase();
				valueB = b.label.toLowerCase();
			} else {
				valueA = a[key];
				valueB = b[key];
			}

			if (valueA < valueB) return order === "asc" ? -1 : 1;
			if (valueA > valueB) return order === "asc" ? 1 : -1;
			return 0;
		});
	}, [types, sortConfig]);

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		sortedTypes.map((type) => type.id),
	);

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<div>
				<h1 className='text-2xl font-bold tracking-tight'>Mail template</h1>
				<p className='text-muted-foreground mt-1 text-sm'>
					Quản lý các mẫu email gửi cho ứng viên khi cập nhật trạng thái đơn ứng tuyển.
				</p>
			</div>

			<Card>
				<CardHeader className='pb-3'>
					<CardTitle className='flex items-center gap-2 text-base'>
						<Mail className='h-4 w-4' />
						Tự động gửi mail
					</CardTitle>
					<CardDescription>
						Khi bật, hệ thống sẽ tự động gửi email theo template mặc định mỗi khi trạng thái đơn
						ứng tuyển được cập nhật.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex items-center gap-3'>
						<Switch
							id='auto-send-toggle'
							checked={autoSendEnabled}
							onCheckedChange={handleToggle}
							disabled={toggling || loading}
						/>
						<Label htmlFor='auto-send-toggle' className='cursor-pointer select-none'>
							{autoSendEnabled ? "Đang bật" : "Đang tắt"}
						</Label>
					</div>
				</CardContent>
			</Card>

			<div className='overflow-hidden rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='w-[50px]'>
								<Checkbox
									aria-label='Select all'
									checked={allSelected}
									onCheckedChange={(checked) => toggleAll(checked === true)}
								/>
							</TableHead>
							<TableHead>
								<Button
									variant='ghost'
									onClick={() => handleSort("id")}
									className='-ml-4 h-8 hover:bg-muted-foreground/10'>
									ID
									{getSortIcon("id")}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant='ghost'
									onClick={() => handleSort("label")}
									className='-ml-4 h-8 hover:bg-muted-foreground/10'>
									Loại mail
									{getSortIcon("label")}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant='ghost'
									onClick={() => handleSort("slug")}
									className='-ml-4 h-8 hover:bg-muted-foreground/10'>
									Trạng thái ứng dụng
									{getSortIcon("slug")}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant='ghost'
									onClick={() => handleSort("description")}
									className='-ml-4 h-8 hover:bg-muted-foreground/10'>
									Mô tả
									{getSortIcon("description")}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant='ghost'
									onClick={() => handleSort("templates_count")}
									className='-ml-4 h-8 hover:bg-muted-foreground/10'>
									Số template
									{getSortIcon("templates_count")}
								</Button>
							</TableHead>
							<TableHead className='w-16' />
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							Array.from({ length: 4 }).map((_, i) => (
								<TableRow key={i}>
									{Array.from({ length: 7 }).map((_, j) => (
										<TableCell key={j}>
											<div className='bg-muted h-4 animate-pulse rounded' />
										</TableCell>
									))}
								</TableRow>
							))
						) : sortedTypes.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className='h-24 text-center'>
									Không có dữ liệu.
								</TableCell>
							</TableRow>
						) : (
							sortedTypes.map((type) => {
								const meta = SLUG_LABELS[type.slug];
								return (
									<TableRow key={type.id}>
										<TableCell>
											<Checkbox
												aria-label={`Select mail template type ${type.id}`}
												checked={isSelected(type.id)}
												onCheckedChange={(checked) =>
													toggleOne(type.id, checked === true)
												}
											/>
										</TableCell>
										<TableCell className='font-medium'>{type.id}</TableCell>
										<TableCell className='font-medium'>{type.label}</TableCell>
										<TableCell>
											{meta ? (
												<Badge variant='outline' className={`text-xs ${meta.color}`}>
													{meta.label}
												</Badge>
											) : (
												<span className='text-muted-foreground text-xs'>
													{type.slug}
												</span>
											)}
										</TableCell>
										<TableCell className='text-muted-foreground max-w-xs truncate text-sm'>
											{formatText(type.description)}
										</TableCell>
										<TableCell>
											<Badge variant='secondary'>{type.templates_count}</Badge>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant='ghost'
														className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
														<MoreHorizontal className='h-4 w-4' />
														<span className='sr-only'>Open menu</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end' className='w-[160px]'>
													<DropdownMenuItem
														onClick={() => navigate(`/mail-templates/${type.id}`)}>
														<Eye className='h-4 w-4' />
														Chi tiết
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

export default MailTemplateListPage;
