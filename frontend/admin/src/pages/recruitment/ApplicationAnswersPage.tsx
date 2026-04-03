import { useEffect, useMemo, useState } from "react";
import {
	ArrowRight,
	BarChart3,
	CheckCheck,
	FileText,
	Filter,
	LayoutPanelLeft,
	Mail,
	MessageSquareText,
	RefreshCw,
	Search,
	Sparkles,
	UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getBreadcrumbsFromNavigation } from "@/config/navigation";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { cn } from "@/lib/utils";
import applicationService from "@/services/application.service";
import type { ApplicationStatus, ClubApplicationRecord } from "@/types/application.type";

import {
	formatDate,
	getApplicantName,
	getStatusBadge,
	getStatusConfig,
} from "./application-detail-shared";

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

function getInitials(name: string) {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
}

function getAnswerPreview(application: ClubApplicationRecord) {
	const firstMeaningfulAnswer = application.answers.find((answer) => answer.answer_value?.trim());
	return firstMeaningfulAnswer?.answer_value || "Ứng viên chưa có câu trả lời nổi bật để xem nhanh.";
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
						<p className='text-sm font-semibold text-emerald-700 dark:text-emerald-300'>{label}</p>
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

function ApplicationAnswersPage() {
	const breadcrumb = useMemo(() => getBreadcrumbsFromNavigation("/answers"), []);

	useBreadcrumb(breadcrumb);

	const [applications, setApplications] = useState<ClubApplicationRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
	const [questionFilter, setQuestionFilter] = useState<string>("all");
	const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);

	useEffect(() => {
		let mounted = true;

		applicationService
			.getApplications()
			.then((data) => {
				if (!mounted) return;
				setApplications(data);
				setSelectedApplicationId(data[0]?.id ?? null);
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, []);

	const questionOptions = useMemo(() => {
		const map = new Map<number, { id: number; label: string; count: number }>();

		for (const application of applications) {
			for (const answer of application.answers) {
				const current = map.get(answer.question_id);
				if (current) current.count += 1;
				else {
					map.set(answer.question_id, {
						id: answer.question_id,
						label: answer.question_label,
						count: 1,
					});
				}
			}
		}

		return Array.from(map.values()).sort((left, right) => left.id - right.id);
	}, [applications]);

	const filteredApplications = useMemo(() => {
		const keyword = search.trim().toLowerCase();

		return applications.filter((application) => {
			if (statusFilter !== "all" && application.status !== statusFilter) return false;
			if (
				questionFilter !== "all" &&
				!application.answers.some((answer) => String(answer.question_id) === questionFilter)
			) {
				return false;
			}
			if (!keyword) return true;

			const haystack = [
				application.id,
				getApplicantName(application),
				application.applicant?.email,
				application.applicant?.student_code,
				application.applicant?.faculty,
				application.applicant?.major,
				application.applicant?.class_name,
				application.note,
				...application.answers.map((answer) => answer.question_label),
				...application.answers.map((answer) => answer.answer_value),
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			return haystack.includes(keyword);
		});
	}, [applications, questionFilter, search, statusFilter]);

	useEffect(() => {
		if (!filteredApplications.length) {
			setSelectedApplicationId(null);
			return;
		}

		if (!filteredApplications.some((application) => application.id === selectedApplicationId)) {
			setSelectedApplicationId(filteredApplications[0].id);
		}
	}, [filteredApplications, selectedApplicationId]);

	const selectedApplication = useMemo(
		() =>
			filteredApplications.find((application) => application.id === selectedApplicationId) ||
			filteredApplications[0] ||
			null,
		[filteredApplications, selectedApplicationId],
	);

	const totalAnswers = applications.reduce((sum, application) => sum + application.answers.length, 0);
	const reviewedApplications = applications.filter((application) => application.status !== "pending").length;
	const averageAnswers = applications.length ? (totalAnswers / applications.length).toFixed(1) : "0.0";
	const activeFilterCount =
		Number(Boolean(search.trim())) +
		Number(statusFilter !== "all") +
		Number(questionFilter !== "all");
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
				const count = applications.filter((application) => application.status === key).length;

				return {
					key: key as ApplicationStatus,
					label: visual.label,
					count,
					percent: applications.length ? Math.round((count / applications.length) * 100) : 0,
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

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8'>
				<section className='overflow-hidden rounded-[30px] border border-emerald-500/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(246,253,250,0.96)_44%,rgba(252,255,253,0.98)_100%)] shadow-sm dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(12,18,16,0.96)_45%,rgba(8,11,10,0.98)_100%)]'>
					<div className='grid gap-8 px-6 py-7 md:px-8 md:py-9 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)] xl:items-start'>
						<div className='max-w-3xl space-y-5'>
							<Badge className='w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-800 hover:bg-emerald-500/10 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'>
								Trang quản lý câu trả lời tuyển thành viên
							</Badge>
							<div className='space-y-3'>
								<h1 className='max-w-3xl text-[1.85rem] font-semibold leading-tight text-emerald-950 md:text-[2.8rem] md:leading-[1.08] xl:text-[3.05rem] dark:text-emerald-50'>
									Duyệt câu trả lời theo từng ứng viên, không cần mở từng hồ sơ riêng lẻ
								</h1>
								<p className='max-w-2xl text-sm leading-7 text-emerald-950/72 md:text-base dark:text-emerald-50/70'>
									Tập trung vào chất lượng câu trả lời, lọc nhanh theo trạng thái và câu hỏi,
									sau đó chuyển sang trang chi tiết hồ sơ khi cần xử lý sâu hơn.
								</p>
							</div>

							<div className='flex flex-wrap items-center gap-3 pt-1'>
								{selectedApplication ? (
									<Button
										asChild
										className='h-11 rounded-2xl bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-500 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400'>
										<Link to={`/requests/${selectedApplication.id}`}>
											<CheckCheck className='size-4' />
											Mở hồ sơ #{selectedApplication.id}
										</Link>
									</Button>
								) : null}
								<Button
									variant='outline'
									className='h-11 rounded-2xl border-emerald-500/20 bg-background/80 px-4 text-emerald-800 shadow-sm hover:bg-emerald-500/10 dark:bg-background/70 dark:text-emerald-200'
									onClick={() => {
										setSearch("");
										setStatusFilter("all");
										setQuestionFilter("all");
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
									<p className='inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
										<BarChart3 className='size-4' />
										Nhịp xử lý hồ sơ
									</p>
									<p className='text-foreground text-4xl font-semibold tracking-tight'>{reviewedPercent}%</p>
									<p className='text-muted-foreground text-sm leading-6'>
										{topStatus.label} đang là nhóm trạng thái lớn nhất với {topStatus.count} hồ sơ.
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
						description='Tự động tăng khi bạn lọc theo trạng thái, câu hỏi hoặc từ khóa.'
						icon={<Filter className='size-5' />}
						footer={
							activeFilterCount > 0
								? "Đang thu hẹp danh sách để soát nhanh hơn"
								: "Đang xem toàn bộ dữ liệu hiện có"
						}
					/>
				</section>

				<section className='grid gap-6 xl:grid-cols-[0.88fr_1.12fr]'>
					<Card className='overflow-hidden rounded-[28px] border-border bg-card shadow-sm'>
						<CardHeader className='space-y-5 border-b border-border bg-muted/20 px-5 py-5 md:px-6 md:py-6'>
							<div className='flex flex-wrap items-start justify-between gap-3'>
								<div className='space-y-1.5'>
									<CardTitle className='text-foreground text-[1.7rem] font-semibold'>
										Danh sách ứng viên
									</CardTitle>
									<CardDescription className='text-muted-foreground max-w-xl text-sm leading-6'>
										Chọn một hồ sơ để xem toàn bộ câu trả lời ở khung bên phải.
									</CardDescription>
								</div>
								<div className='rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300'>
									{filteredApplications.length} hồ sơ
								</div>
							</div>

							<div className='grid gap-3'>
								<div className='flex flex-wrap items-center gap-2'>
									<div className='inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300'>
										<Search className='size-3.5' />
										Tìm kiếm nhanh
									</div>
									<div className='inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground'>
										<FileText className='size-3.5' />
										{questionOptions.length} câu hỏi có dữ liệu
									</div>
								</div>

								<div className='relative'>
									<Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
									<Input
										value={search}
										onChange={(event) => setSearch(event.target.value)}
										placeholder='Tìm theo ứng viên, email, MSSV, câu hỏi, câu trả lời...'
										className='h-11 rounded-2xl border-border bg-background pl-10'
									/>
								</div>

								<div className='grid gap-3 md:grid-cols-2'>
									<Select
										value={statusFilter}
										onValueChange={(value) => setStatusFilter(value as ApplicationStatus | "all")}>
										<SelectTrigger className='h-11 rounded-2xl border-border bg-background'>
											<SelectValue placeholder='Chọn trạng thái' />
										</SelectTrigger>
										<SelectContent>
											{statusOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									<Select value={questionFilter} onValueChange={setQuestionFilter}>
										<SelectTrigger className='h-11 rounded-2xl border-border bg-background'>
											<SelectValue placeholder='Lọc theo câu hỏi' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>Tất cả câu hỏi</SelectItem>
											{questionOptions.map((question) => (
												<SelectItem key={question.id} value={String(question.id)}>
													{question.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardHeader>

						<CardContent className='p-4 md:p-5'>
							{loading ? (
								<div className='space-y-3'>
									<Skeleton className='h-28 rounded-[22px]' />
									<Skeleton className='h-28 rounded-[22px]' />
									<Skeleton className='h-28 rounded-[22px]' />
								</div>
							) : filteredApplications.length > 0 ? (
								<div className='max-h-[calc(100vh-22rem)] space-y-3 overflow-auto pr-1'>
									{filteredApplications.map((application) => {
										const applicantName = getApplicantName(application);
										const isActive = selectedApplication?.id === application.id;

										return (
											<button
												key={application.id}
												type='button'
												onClick={() => setSelectedApplicationId(application.id)}
												className={`w-full rounded-[24px] border p-4 text-left transition ${
													isActive
														? "border-primary/20 bg-accent/40 shadow-sm"
														: "border-border bg-card hover:bg-muted/20"
												}`}>
												<div className='flex items-start justify-between gap-3'>
													<div className='flex min-w-0 items-start gap-3'>
														<div className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-semibold text-secondary-foreground'>
															{getInitials(applicantName)}
														</div>
														<div className='min-w-0 space-y-1'>
															<div className='flex flex-wrap items-center gap-2'>
																<p className='truncate text-lg font-semibold text-foreground'>
																	{applicantName}
																</p>
																{getStatusBadge(application.status)}
															</div>
															<p className='truncate text-sm text-muted-foreground'>
																{application.applicant?.email || "Chưa có email"}
															</p>
															<p className='line-clamp-2 text-sm leading-6 text-muted-foreground'>
																{getAnswerPreview(application)}
															</p>
														</div>
													</div>
													<Badge
														variant='outline'
														className='rounded-full border-border bg-background text-primary'>
														{application.answers.length} câu
													</Badge>
												</div>

												<div className='mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
													<Badge variant='secondary' className='rounded-full'>
														APP-{application.id}
													</Badge>
													<span>{application.applicant?.student_code || "Chưa có MSSV"}</span>
													<span className='text-border'>•</span>
													<span>{formatDate(application.created_at)}</span>
												</div>
											</button>
										);
									})}
								</div>
							) : (
								<div className='rounded-[24px] border border-dashed border-border bg-muted/30 px-6 py-12 text-center'>
									<div className='mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-primary'>
										<Search className='size-6' />
									</div>
									<p className='mt-4 text-2xl font-semibold text-foreground'>Không có hồ sơ phù hợp</p>
									<p className='mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground'>
										Hãy nới điều kiện lọc hoặc thay đổi từ khóa tìm kiếm để tiếp tục duyệt câu trả lời.
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card className='overflow-hidden rounded-[28px] border-border bg-card shadow-sm'>
						{loading ? (
							<div className='space-y-4 p-5 md:p-6'>
								<Skeleton className='h-36 rounded-[24px]' />
								<Skeleton className='h-28 rounded-[24px]' />
								<Skeleton className='h-28 rounded-[24px]' />
								<Skeleton className='h-28 rounded-[24px]' />
							</div>
						) : selectedApplication ? (
							<>
								<CardHeader className='border-b border-border bg-muted/20 px-5 py-5 md:px-6 md:py-6'>
									<div className='flex flex-wrap items-start justify-between gap-4'>
										<div className='space-y-3'>
											<div className='flex flex-wrap items-center gap-2'>
												<Badge variant='secondary' className='rounded-full'>
													Hồ sơ #{selectedApplication.id}
												</Badge>
												{getStatusBadge(selectedApplication.status)}
												<Badge
													variant='outline'
													className={getStatusConfig(selectedApplication.status).className}>
													{selectedApplication.answers.length} câu trả lời
												</Badge>
											</div>
											<div>
												<CardTitle className='text-[1.9rem] font-semibold leading-tight text-foreground'>
													{getApplicantName(selectedApplication)}
												</CardTitle>
												<CardDescription className='mt-2 max-w-2xl text-sm leading-7 text-muted-foreground'>
													Xem toàn bộ câu trả lời đã lưu cho ứng viên này và chuyển sang trang chi
													tiết hồ sơ nếu cần xử lý trạng thái hoặc ghi chú.
												</CardDescription>
											</div>
										</div>
										<Button
											asChild
											className='h-11 rounded-2xl bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-500 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400'>
											<Link to={`/requests/${selectedApplication.id}`}>
												Mở hồ sơ chi tiết
												<ArrowRight className='size-4' />
											</Link>
										</Button>
									</div>
								</CardHeader>

								<CardContent className='space-y-6 p-5 md:p-6'>
									<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
										<div className='rounded-[22px] border border-border bg-muted/40 p-4'>
											<div className='flex items-center gap-2 text-primary'>
												<UserRound className='size-4' />
												<p className='text-sm font-medium'>Ứng viên</p>
											</div>
											<p className='mt-3 text-base font-semibold leading-7 text-foreground'>
												{getApplicantName(selectedApplication)}
											</p>
										</div>
										<div className='rounded-[22px] border border-border bg-muted/40 p-4'>
											<div className='flex items-center gap-2 text-primary'>
												<Mail className='size-4' />
												<p className='text-sm font-medium'>Liên hệ</p>
											</div>
											<p className='mt-3 break-words text-base font-semibold leading-7 text-foreground'>
												{selectedApplication.applicant?.email || "--"}
											</p>
										</div>
										<div className='rounded-[22px] border border-border bg-muted/40 p-4'>
											<div className='flex items-center gap-2 text-primary'>
												<FileText className='size-4' />
												<p className='text-sm font-medium'>Thông tin lớp</p>
											</div>
											<p className='mt-3 text-base font-semibold leading-7 text-foreground'>
												{selectedApplication.applicant?.class_name || "--"}
											</p>
										</div>
										<div className='rounded-[22px] border border-border bg-muted/40 p-4'>
											<div className='flex items-center gap-2 text-primary'>
												<Sparkles className='size-4' />
												<p className='text-sm font-medium'>Ghi chú duyệt</p>
											</div>
											<p className='mt-3 text-base font-semibold leading-7 text-foreground'>
												{selectedApplication.note || "Chưa có ghi chú"}
											</p>
										</div>
									</div>

									<div className='rounded-[26px] border border-border bg-muted/20 p-4 md:p-5'>
										<div className='flex flex-wrap items-center justify-between gap-3'>
											<div>
												<p className='text-sm font-semibold uppercase tracking-[0.18em] text-primary'>
													Câu trả lời biểu mẫu
												</p>
												<p className='mt-2 text-xl font-semibold text-foreground'>
													Nội dung ứng viên đã gửi
												</p>
											</div>
											<div className='text-sm text-muted-foreground'>
												Nộp lúc {formatDate(selectedApplication.created_at)}
											</div>
										</div>

										<div className='mt-5 max-h-[calc(100vh-28rem)] space-y-4 overflow-auto pr-1'>
											{selectedApplication.answers.length > 0 ? (
												selectedApplication.answers.map((answer, index) => (
													<div
														key={answer.id}
														className='rounded-[24px] border border-border bg-card p-5 shadow-sm'>
														<div className='flex flex-wrap items-start justify-between gap-3'>
															<div className='space-y-2'>
																<div className='flex flex-wrap items-center gap-2'>
																	<p className='text-xs font-semibold uppercase tracking-[0.16em] text-primary'>
																		Câu {index + 1}
																	</p>
																	<Badge variant='secondary' className='rounded-full'>
																		{answer.question_type}
																	</Badge>
																</div>
																<h3 className='text-lg font-semibold leading-8 text-foreground'>
																	{answer.question_label}
																</h3>
															</div>
															<Badge
																variant='outline'
																className='rounded-full border-border bg-muted/30 text-primary'>
																Q-{answer.question_id}
															</Badge>
														</div>
														<div className='mt-4 rounded-[20px] border border-border bg-muted/40 px-4 py-4'>
															<p className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
																Trả lời
															</p>
															<p className='mt-2 break-words text-base leading-8 text-foreground'>
																{answer.answer_value || "Ứng viên chưa trả lời câu hỏi này."}
															</p>
														</div>
													</div>
												))
											) : (
												<div className='rounded-[24px] border border-dashed border-border bg-background px-6 py-12 text-center'>
													<p className='text-2xl font-semibold text-foreground'>Chưa có câu trả lời</p>
													<p className='mt-2 text-sm leading-7 text-muted-foreground'>
														Hồ sơ này chưa ghi nhận dữ liệu trong danh sách câu trả lời.
													</p>
												</div>
											)}
										</div>
									</div>
								</CardContent>
							</>
						) : (
							<div className='flex min-h-[32rem] items-center justify-center p-6'>
								<div className='max-w-md rounded-[24px] border border-dashed border-border bg-muted/30 px-6 py-12 text-center'>
									<div className='mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-primary'>
										<MessageSquareText className='size-6' />
									</div>
									<p className='mt-4 text-2xl font-semibold text-foreground'>
										Chọn một hồ sơ để xem câu trả lời
									</p>
									<p className='mt-2 text-sm leading-7 text-muted-foreground'>
										Khi bạn chọn một ứng viên ở cột bên trái, toàn bộ nội dung trả lời sẽ xuất hiện
										tại đây.
									</p>
								</div>
							</div>
						)}
					</Card>
				</section>
			</div>
		</div>
	);
}

export default ApplicationAnswersPage;
