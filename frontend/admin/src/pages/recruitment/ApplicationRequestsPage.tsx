import { useEffect, useMemo, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	BarChart3,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Eye,
	FileText,
	Filter,
	LayoutPanelLeft,
	MessageSquareText,
	MoreHorizontal,
	RefreshCw,
	Settings2,
	Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import applicationService from "@/services/application.service";
import type {
	ApplicationStatus,
	ClubApplicationRecord,
	UpdateApplicationStatusPayload,
} from "@/types/application.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
	formatDate,
	getApplicantName,
	getNextStatuses,
	getStatusBadge,
	getStatusConfig,
} from "./application-detail-shared";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import { cn } from "@/lib/utils";

const statusOptions: Array<{ value: ApplicationStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "pending", label: "Chờ duyệt" },
	{ value: "processing", label: "Đang xử lý" },
	{ value: "interview", label: "Phỏng vấn" },
	{ value: "passed", label: "Đạt" },
	{ value: "failed", label: "Không đạt" },
];

const statusVisuals: Record<ApplicationStatus, { label: string; barClass: string }> = {
	pending: { label: "Chờ duyệt", barClass: "bg-amber-500 dark:bg-amber-400" },
	processing: { label: "Đang xử lý", barClass: "bg-sky-500 dark:bg-sky-400" },
	interview: { label: "Phỏng vấn", barClass: "bg-violet-500 dark:bg-violet-400" },
	passed: { label: "Đạt", barClass: "bg-emerald-500 dark:bg-emerald-400" },
	failed: { label: "Không đạt", barClass: "bg-rose-500 dark:bg-rose-400" },
};

type SortKey =
	| "id"
	| "full_name"
	| "email"
	| "student_code"
	| "status"
	| "created_at"
	| "updated_at";

function getSortValue(application: ClubApplicationRecord, key: SortKey) {
	switch (key) {
		case "id":
			return application.id;
		case "full_name":
			return getApplicantName(application);
		case "email":
			return application.applicant?.email || "";
		case "student_code":
			return application.applicant?.student_code || "";
		case "status":
			return getStatusConfig(application.status).label;
		case "created_at":
			return application.created_at || "";
		case "updated_at":
			return application.updated_at || "";
	}
}

function MetricCard({
	label,
	value,
	description,
	icon,
	footer,
}: {
	label: string;
	value: string;
	description: string;
	icon: React.ReactNode;
	footer: string;
}) {
	return (
		<Card className='border-border/80 bg-card/95 shadow-sm backdrop-blur'>
			<CardContent className='p-5'>
				<div className='flex items-start justify-between gap-4'>
					<div className='space-y-1'>
						<p className='text-sm font-semibold text-foreground'>{label}</p>
						<p className='text-foreground text-3xl font-semibold tracking-tight'>{value}</p>
						<p className='text-muted-foreground text-sm leading-6'>{description}</p>
					</div>
					<div className='rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-3 text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-300'>
						{icon}
					</div>
				</div>
				<div className='mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground'>
					<span className='h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400' />
					<span>{footer}</span>
				</div>
			</CardContent>
		</Card>
	);
}

function ApplicationRequestsPage() {
	const breadcrumb = useMemo(
		() => [
			{ title: "Dashboard", link: "/" },
			{ title: "Quản lý Yêu cầu tham gia" },
		],
		[],
	);

	useBreadcrumb(breadcrumb);

	const navigate = useNavigate();
	const [applications, setApplications] = useState<ClubApplicationRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
	const [statusDialogApplication, setStatusDialogApplication] =
		useState<ClubApplicationRecord | null>(null);
	const [statusNote, setStatusNote] = useState("");
	const [nextStatus, setNextStatus] =
		useState<UpdateApplicationStatusPayload["status"]>("processing");
	const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
	const [pagination, setPagination] = useState({ currentPage: 1, perPage: 10 });
	const [sortConfig, setSortConfig] = useState<{
		key: SortKey | null;
		order: "asc" | "desc" | null;
	}>({ key: "updated_at", order: "desc" });

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search.trim().toLowerCase());
			setPagination((prev) => ({ ...prev, currentPage: 1 }));
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		let mounted = true;
		applicationService
			.getApplications()
			.then((data) => mounted && setApplications(data))
			.finally(() => mounted && setLoading(false));
		return () => {
			mounted = false;
		};
	}, []);

	const filteredApplications = useMemo(
		() =>
			applications.filter((application) => {
				if (statusFilter !== "all" && application.status !== statusFilter) return false;
				if (!debouncedSearch) return true;

				const haystack = [
					application.id,
					application.status,
					application.note,
					application.created_by,
					application.updated_by,
					application.applicant?.full_name,
					application.applicant?.email,
					application.applicant?.student_code,
					application.applicant?.faculty,
					application.applicant?.major,
					application.applicant?.class_name,
					...application.answers.map((answer) => answer.question_label),
					...application.answers.map((answer) => answer.answer_value),
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();

				return haystack.includes(debouncedSearch);
			}),
		[applications, debouncedSearch, statusFilter],
	);

	const questionOptions = useMemo(() => {
		const map = new Map<number, { id: number; label: string; count: number }>();
		for (const application of applications) {
			for (const answer of application.answers) {
				const current = map.get(answer.question_id);
				if (current) current.count += 1;
				else
					map.set(answer.question_id, {
						id: answer.question_id,
						label: answer.question_label,
						count: 1,
					});
			}
		}
		return Array.from(map.values()).sort((left, right) => left.id - right.id);
	}, [applications]);

	const totalAnswers = applications.reduce(
		(sum, application) => sum + application.answers.length,
		0,
	);
	const reviewedApplications = applications.filter(
		(application) => application.status !== "pending",
	).length;
	const averageAnswers = applications.length
		? (totalAnswers / applications.length).toFixed(1)
		: "0.0";
	const activeFilterCount =
		Number(Boolean(search.trim())) + Number(statusFilter !== "all");
	const reviewedPercent = applications.length
		? Math.round((reviewedApplications / applications.length) * 100)
		: 0;
	const visiblePercent = applications.length
		? Math.round((filteredApplications.length / applications.length) * 100)
		: 0;
	const answerDepthPercent = questionOptions.length
		? Math.min(100, Math.round((Number(averageAnswers) / questionOptions.length) * 100))
		: 0;

	const statusInsights = useMemo(
		() =>
			Object.entries(statusVisuals).map(([key, visual]) => {
				const count = applications.filter(
					(application) => application.status === key,
				).length;
				return {
					key: key as ApplicationStatus,
					label: visual.label,
					count,
					percent: applications.length
						? Math.round((count / applications.length) * 100)
						: 0,
					barClass: visual.barClass,
				};
			}),
		[applications],
	);

	const topStatus = statusInsights.reduce(
		(current, item) => (item.count > current.count ? item : current),
		statusInsights[0] ?? {
			key: "pending" as ApplicationStatus,
			label: "Chưa có dữ liệu",
			count: 0,
			percent: 0,
			barClass: "bg-border",
		},
	);

	const sortedApplications = useMemo(() => {
		if (!sortConfig.key || !sortConfig.order) return filteredApplications;
		const sortKey = sortConfig.key;
		const sorted = [...filteredApplications].sort((left, right) => {
			const leftValue = getSortValue(left, sortKey);
			const rightValue = getSortValue(right, sortKey);

			if (typeof leftValue === "number" && typeof rightValue === "number") {
				return leftValue - rightValue;
			}

			return String(leftValue).localeCompare(String(rightValue), "vi", {
				numeric: true,
				sensitivity: "base",
			});
		});

		return sortConfig.order === "asc" ? sorted : sorted.reverse();
	}, [filteredApplications, sortConfig]);

	const totalPages = Math.max(1, Math.ceil(sortedApplications.length / pagination.perPage));
	const currentPage = Math.min(pagination.currentPage, totalPages);
	const paginatedApplications = sortedApplications.slice(
		(currentPage - 1) * pagination.perPage,
		currentPage * pagination.perPage,
	);
	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		paginatedApplications.map((application) => application.id),
	);

	const handleSort = (key: SortKey) => {
		let order: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key) {
			order =
				sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}
		setSortConfig({ key: order ? key : null, order });
		setPagination((prev) => ({ ...prev, currentPage: 1 }));
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

	const openStatusDialog = (application: ClubApplicationRecord) => {
		const availableStatuses = getNextStatuses(application.status);
		if (!availableStatuses.length) return;
		setStatusDialogApplication(application);
		setNextStatus(availableStatuses[0] as UpdateApplicationStatusPayload["status"]);
		setStatusNote(application.note || "");
	};

	const applyUpdatedApplication = (updatedApplication: ClubApplicationRecord) => {
		setApplications((prev) =>
			prev.map((application) =>
				application.id === updatedApplication.id ? updatedApplication : application,
			),
		);
	};

	const handleSubmitStatusUpdate = async () => {
		if (!statusDialogApplication) return;
		setIsSubmittingStatus(true);
		try {
			const updatedApplication = await applicationService.updateApplicationStatus(
				statusDialogApplication.id,
				{
					status: nextStatus,
					note: statusNote.trim() ? statusNote.trim() : null,
				},
			);
			applyUpdatedApplication(updatedApplication);
			setStatusDialogApplication(null);
			setStatusNote("");
			toast.success("Đã cập nhật trạng thái đơn ứng tuyển.");
		} catch (error) {
			console.error(error);
			toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
		} finally {
			setIsSubmittingStatus(false);
		}
	};

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8'>
				<section className='overflow-hidden rounded-[30px] border border-emerald-500/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(246,253,250,0.96)_44%,rgba(252,255,253,0.98)_100%)] shadow-sm dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(12,18,16,0.96)_45%,rgba(8,11,10,0.98)_100%)]'>
					<div className='grid gap-8 px-6 py-7 md:px-8 md:py-9 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)] xl:items-start'>
						<div className='max-w-3xl space-y-5'>
							<Badge className='w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-800 hover:bg-emerald-500/10 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'>
								Trang quản lý yêu cầu tham gia
							</Badge>
							<div className='space-y-3'>
								<h1 className='text-foreground max-w-3xl text-[1.85rem] font-semibold leading-tight md:text-[2.8rem] md:leading-[1.08] xl:text-[3.05rem]'>
									Theo dõi và xử lý hồ sơ ứng tuyển theo từng trạng thái
								</h1>
								<p className='max-w-2xl text-sm leading-7 text-emerald-950/72 md:text-base dark:text-emerald-50/70'>
									Xem tổng quan tiến độ duyệt hồ sơ, lọc nhanh theo trạng thái và từ
									khóa, sau đó chuyển sang trang chi tiết để xử lý từng ứng viên.
								</p>
							</div>

							<div className='flex flex-wrap items-center gap-3 pt-1'>
								<Button
									variant='outline'
									className='h-11 rounded-2xl border-emerald-500/20 bg-background/80 px-4 text-emerald-800 shadow-sm hover:bg-emerald-500/10 dark:bg-background/70 dark:text-emerald-200'
									onClick={() => {
										setSearch("");
										setStatusFilter("all");
									}}>
									<RefreshCw className='size-4' />
									Đặt lại bộ lọc
								</Button>
								<div className='inline-flex h-11 items-center gap-2 rounded-2xl border border-emerald-500/20 bg-background/72 px-4 text-sm font-medium text-emerald-800 dark:text-emerald-200'>
									<Filter className='size-4' />
									{activeFilterCount} điều kiện đang áp dụng
								</div>
							</div>
						</div>

						<div className='self-start rounded-[28px] border border-emerald-500/15 bg-background/82 p-5 shadow-sm backdrop-blur'>
							<div className='flex items-start justify-between gap-4'>
								<div className='space-y-2'>
									<p className='text-foreground inline-flex items-center gap-2 text-sm font-semibold'>
										<BarChart3 className='size-4' />
										Nhịp xử lý hồ sơ
									</p>
									<p className='text-foreground text-4xl font-semibold tracking-tight'>
										{reviewedPercent}%
									</p>
									<p className='text-muted-foreground text-sm leading-6'>
										{topStatus.label} đang là nhóm trạng thái lớn nhất với{" "}
										{topStatus.count} hồ sơ.
									</p>
								</div>
								<div className='rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-3 text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-300'>
									<Sparkles className='size-5' />
								</div>
							</div>

							<div className='mt-5 overflow-hidden rounded-full bg-emerald-500/10 dark:bg-emerald-400/10'>
								<div
									className='h-2 rounded-full bg-emerald-600 transition-all dark:bg-emerald-400'
									style={{ width: `${reviewedPercent}%` }}
								/>
							</div>

							<div className='mt-6 space-y-3'>
								{statusInsights.map((item) => (
									<div key={item.key} className='space-y-1.5'>
										<div className='flex items-center justify-between gap-3 text-sm'>
											<div className='flex items-center gap-2'>
												<span className={cn("h-2.5 w-2.5 rounded-full", item.barClass)} />
												<span className='font-medium text-foreground'>{item.label}</span>
											</div>
											<div className='text-muted-foreground'>
												{item.count} hồ sơ, {item.percent}%
											</div>
										</div>
										<div className='overflow-hidden rounded-full bg-muted/70'>
											<div
												className={cn("h-1.5 rounded-full transition-all", item.barClass)}
												style={{ width: `${item.percent}%` }}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				<section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
					<MetricCard
						label='Ứng viên hiển thị'
						value={String(filteredApplications.length)}
						description='Số hồ sơ khớp với bộ lọc hiện tại.'
						icon={<LayoutPanelLeft className='size-5' />}
						footer={`${visiblePercent}% tập hồ sơ đang được hiển thị`}
					/>
					<MetricCard
						label='Câu hỏi đang theo dõi'
						value={String(questionOptions.length)}
						description='Tổng số câu hỏi xuất hiện trong dữ liệu trả lời.'
						icon={<FileText className='size-5' />}
						footer={`${totalAnswers} lượt trả lời đã được ghi nhận`}
					/>
					<MetricCard
						label='Trung bình câu trả lời'
						value={averageAnswers}
						description='Số câu trả lời trung bình trên mỗi hồ sơ.'
						icon={<MessageSquareText className='size-5' />}
						footer={`${answerDepthPercent}% độ phủ so với tập câu hỏi`}
					/>
					<MetricCard
						label='Bộ lọc đang áp dụng'
						value={String(activeFilterCount).padStart(2, "0")}
						description='Tự động tăng khi bạn lọc theo trạng thái hoặc từ khóa.'
						icon={<Filter className='size-5' />}
						footer={
							activeFilterCount > 0
								? "Đang thu hẹp danh sách để soát nhanh hơn"
								: "Đang xem toàn bộ dữ liệu hiện có"
						}
					/>
				</section>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
						<div className='flex flex-1 items-center gap-2'>
							<Input
								placeholder='Lọc theo ứng viên, email, MSSV, ghi chú...'
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								className='h-8 w-full sm:w-64 md:w-72 lg:w-80'
							/>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='outline' size='sm' className='h-8'>
									<Settings2 className='h-4 w-4' />
									Xem theo trạng thái
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-[220px]'>
								<DropdownMenuLabel>Trạng thái hồ sơ</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{statusOptions.map((option) => (
									<DropdownMenuItem
										key={option.value}
										onClick={() => {
											setStatusFilter(option.value);
											setPagination((prev) => ({ ...prev, currentPage: 1 }));
										}}
										className={
											statusFilter === option.value ? "bg-muted font-medium" : ""
										}>
										{option.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className='overflow-hidden rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='w-[50px]'>
										<Checkbox
											aria-label='Select all applications'
											checked={allSelected}
											onCheckedChange={(checked) => toggleAll(checked === true)}
										/>
									</TableHead>
									<TableHead className='w-[120px]'>
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
											onClick={() => handleSort("full_name")}
											className='-ml-4 h-8 hover:bg-muted-foreground/10'>
											Ứng viên
											{getSortIcon("full_name")}
										</Button>
									</TableHead>
									<TableHead>
										<Button
											variant='ghost'
											onClick={() => handleSort("email")}
											className='-ml-4 h-8 hover:bg-muted-foreground/10'>
											Email
											{getSortIcon("email")}
										</Button>
									</TableHead>
									<TableHead>
										<Button
											variant='ghost'
											onClick={() => handleSort("student_code")}
											className='-ml-4 h-8 hover:bg-muted-foreground/10'>
											MSSV
											{getSortIcon("student_code")}
										</Button>
									</TableHead>
									<TableHead>
										<Button
											variant='ghost'
											onClick={() => handleSort("status")}
											className='-ml-4 h-8 hover:bg-muted-foreground/10'>
											Trạng thái
											{getSortIcon("status")}
										</Button>
									</TableHead>
									<TableHead>
										<Button
											variant='ghost'
											onClick={() => handleSort("created_at")}
											className='-ml-4 h-8 hover:bg-muted-foreground/10'>
											Ngày nộp
											{getSortIcon("created_at")}
										</Button>
									</TableHead>
									<TableHead>
										<Button
											variant='ghost'
											onClick={() => handleSort("updated_at")}
											className='-ml-4 h-8 hover:bg-muted-foreground/10'>
											Cập nhật
											{getSortIcon("updated_at")}
										</Button>
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									Array.from({ length: pagination.perPage }).map((_, index) => (
										<TableRow key={`skeleton-${index}`}>
											<TableCell>
												<Skeleton className='h-4 w-4' />
											</TableCell>
											<TableCell colSpan={8}>
												<Skeleton className='h-4 w-full' />
											</TableCell>
										</TableRow>
									))
								) : paginatedApplications.length > 0 ? (
									paginatedApplications.map((application) => {
										const availableStatuses = getNextStatuses(application.status);
										return (
											<TableRow key={application.id}>
												<TableCell>
													<Checkbox
														aria-label={`Select application ${application.id}`}
														checked={isSelected(application.id)}
														onCheckedChange={(checked) =>
															toggleOne(application.id, checked === true)
														}
													/>
												</TableCell>
												<TableCell className='font-medium'>
													APP-{application.id}
												</TableCell>
												<TableCell>
													<div className='space-y-1'>
														<p className='font-medium'>
															{getApplicantName(application)}
														</p>
														<p className='text-sm text-muted-foreground'>
															{application.applicant?.class_name || "Chưa có lớp"}
														</p>
													</div>
												</TableCell>
												<TableCell>
													{application.applicant?.email || "--"}
												</TableCell>
												<TableCell>
													{application.applicant?.student_code || "--"}
												</TableCell>
												<TableCell>{getStatusBadge(application.status)}</TableCell>
												<TableCell>{formatDate(application.created_at)}</TableCell>
												<TableCell>{formatDate(application.updated_at)}</TableCell>
												<TableCell className='text-right'>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant='ghost'
																className='ml-auto flex h-8 w-8 p-0 data-[state=open]:bg-muted'
																aria-label={`Mở hành động hồ sơ ${application.id}`}>
																<MoreHorizontal className='h-4 w-4' />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align='end' className='w-[190px]'>
															<DropdownMenuItem
																onClick={() =>
																	navigate(`/requests/${application.id}`)
																}>
																<Eye className='h-4 w-4' />
																Xem chi tiết
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => openStatusDialog(application)}
																disabled={availableStatuses.length === 0}>
																<RefreshCw className='h-4 w-4' />
																Cập nhật trạng thái
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										);
									})
								) : (
									<TableRow>
										<TableCell colSpan={9} className='h-24 text-center'>
											Không tìm thấy kết quả phù hợp.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
							<TableFooter className='bg-transparent'>
								<TableRow>
									<TableCell colSpan={9}>
										<div className='flex items-center justify-between px-2'>
											<div className='flex-1 text-sm text-muted-foreground'>
												{paginatedApplications.length} of{" "}
												{sortedApplications.length} row(s) displayed.
											</div>
											<div className='flex items-center space-x-6 lg:space-x-8'>
												<div className='flex items-center space-x-2'>
													<p className='text-sm font-medium'>Rows per page</p>
													<Select
														value={`${pagination.perPage}`}
														onValueChange={(value) =>
															setPagination({
																currentPage: 1,
																perPage: Number(value),
															})
														}>
														<SelectTrigger className='h-8 w-[70px]'>
															<SelectValue placeholder={pagination.perPage} />
														</SelectTrigger>
														<SelectContent side='top'>
															{[10, 20, 25, 30, 40, 50].map((pageSize) => (
																<SelectItem key={pageSize} value={`${pageSize}`}>
																	{pageSize}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div className='flex w-[110px] items-center justify-center text-sm font-medium'>
													Page {currentPage} of {totalPages}
												</div>
												<div className='flex items-center space-x-2'>
													<Button
														variant='outline'
														className='hidden h-8 w-8 p-0 lg:flex'
														onClick={() =>
															setPagination((prev) => ({
																...prev,
																currentPage: 1,
															}))
														}
														disabled={currentPage === 1}>
														<span className='sr-only'>Go to first page</span>
														<ChevronsLeft className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='h-8 w-8 p-0'
														onClick={() =>
															setPagination((prev) => ({
																...prev,
																currentPage: Math.max(1, prev.currentPage - 1),
															}))
														}
														disabled={currentPage === 1}>
														<span className='sr-only'>Quay lại trang trước</span>
														<ChevronLeft className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='h-8 w-8 p-0'
														onClick={() =>
															setPagination((prev) => ({
																...prev,
																currentPage: Math.min(
																	totalPages,
																	prev.currentPage + 1,
																),
															}))
														}
														disabled={currentPage === totalPages}>
														<span className='sr-only'>Đi đến trang tiếp theo</span>
														<ChevronRight className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='hidden h-8 w-8 p-0 lg:flex'
														onClick={() =>
															setPagination((prev) => ({
																...prev,
																currentPage: totalPages,
															}))
														}
														disabled={currentPage === totalPages}>
														<span className='sr-only'>Đi đến trang cuối</span>
														<ChevronsRight className='h-4 w-4' />
													</Button>
												</div>
											</div>
										</div>
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</div>
				</div>

				<Dialog
					open={Boolean(statusDialogApplication)}
					onOpenChange={(open) => {
						if (!open) {
							setStatusDialogApplication(null);
							setStatusNote("");
						}
					}}>
					<DialogContent className='sm:max-w-[560px]'>
						{statusDialogApplication ? (
							<>
								<DialogHeader>
									<DialogTitle>Cập nhật trạng thái đơn ứng tuyển</DialogTitle>
								</DialogHeader>
								<div className='space-y-4'>
									<div className='grid gap-2'>
										<p className='text-sm font-medium'>Ứng viên</p>
										<p className='text-sm text-muted-foreground'>
											{getApplicantName(statusDialogApplication)}
										</p>
									</div>
									<div className='grid gap-2'>
										<p className='text-sm font-medium'>Trạng thái hiện tại</p>
										<div>{getStatusBadge(statusDialogApplication.status)}</div>
									</div>
									<div className='grid gap-2'>
										<label className='text-sm font-medium' htmlFor='next-status'>
											Trạng thái tiếp theo
										</label>
										<div className='flex flex-wrap gap-2' id='next-status'>
											{getNextStatuses(statusDialogApplication.status).map((status) => {
												const isActive = nextStatus === status;
												const config = getStatusConfig(status);
												return (
													<Button
														key={status}
														type='button'
														variant='outline'
														onClick={() =>
															setNextStatus(
																status as UpdateApplicationStatusPayload["status"],
															)
														}
														className={isActive ? `${config.className} border-current` : ""}>
														{config.label}
													</Button>
												);
											})}
										</div>
									</div>
									<div className='grid gap-2'>
										<label
											className='text-sm font-medium'
											htmlFor='application-note'>
											Ghi chú
										</label>
										<Textarea
											id='application-note'
											value={statusNote}
											onChange={(event) => setStatusNote(event.target.value)}
											placeholder='Thêm ghi chú xét duyệt để lưu vào hệ thống'
											maxLength={255}
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										variant='outline'
										onClick={() => setStatusDialogApplication(null)}
										disabled={isSubmittingStatus}>
										Hủy
									</Button>
									<Button onClick={handleSubmitStatusUpdate} disabled={isSubmittingStatus}>
										{isSubmittingStatus ? "Đang cập nhật..." : "Lưu thay đổi"}
									</Button>
								</DialogFooter>
							</>
						) : null}
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}

export default ApplicationRequestsPage;
