import { useEffect, useState } from "react";
import {
	CalendarDays,
	ClipboardList,
	Filter,
	Mail,
	MessageSquareText,
	MoreHorizontal,
	Search,
	UserRound,
} from "lucide-react";
import applicationService from "@/services/application.service";
import type { ApplicationStatus, ClubApplicationRecord } from "@/types/application.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusOptions: Array<{ value: ApplicationStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "pending", label: "Chờ duyệt" },
	{ value: "processing", label: "Đang xử lý" },
	{ value: "interview", label: "Phỏng vấn" },
	{ value: "passed", label: "Đạt" },
	{ value: "failed", label: "Không đạt" },
];

const statusMap: Record<ApplicationStatus, { label: string; className: string }> = {
	pending: {
		label: "Chờ duyệt",
		className: "border-amber-200 bg-amber-50 text-amber-700",
	},
	processing: {
		label: "Đang xử lý",
		className: "border-sky-200 bg-sky-50 text-sky-700",
	},
	interview: {
		label: "Phỏng vấn",
		className: "border-violet-200 bg-violet-50 text-violet-700",
	},
	passed: {
		label: "Đạt",
		className: "border-emerald-200 bg-emerald-50 text-emerald-700",
	},
	failed: {
		label: "Không đạt",
		className: "border-rose-200 bg-rose-50 text-rose-700",
	},
};

function formatDate(dateString: string | null) {
	if (!dateString) {
		return "--";
	}

	return new Intl.DateTimeFormat("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(dateString));
}

function getApplicantName(application: ClubApplicationRecord) {
	return application.applicant?.full_name || `Người dùng #${application.created_by}`;
}

function getStatusBadge(status: ApplicationStatus) {
	const statusConfig = statusMap[status];

	return (
		<Badge variant='outline' className={statusConfig.className}>
			{statusConfig.label}
		</Badge>
	);
}

function SummaryCard({
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
		<div className='rounded-2xl border border-[#dde4d5] bg-white p-5 shadow-sm'>
			<div className='flex items-start gap-3'>
				<div className='mt-1 shrink-0 text-[#2e3820]'>{icon}</div>
				<div className='min-w-0'>
					<p className='text-sm text-muted-foreground'>{label}</p>
					{children ? (
						<div className='pt-2'>{children}</div>
					) : (
						<p className='mt-1 text-lg font-semibold leading-7 text-foreground break-words'>
							{value}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

function ApplicationRequestsPage() {
	const [applications, setApplications] = useState<ClubApplicationRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
	const [selectedApplication, setSelectedApplication] = useState<ClubApplicationRecord | null>(null);

	useEffect(() => {
		let mounted = true;

		applicationService.getApplications().then((data) => {
			if (!mounted) {
				return;
			}

			setApplications(data);
			setLoading(false);
		});

		return () => {
			mounted = false;
		};
	}, []);

	const normalizedSearch = search.trim().toLowerCase();
	const filteredApplications = applications.filter((application) => {
		const matchesStatus = statusFilter === "all" || application.status === statusFilter;
		if (!matchesStatus) {
			return false;
		}

		if (!normalizedSearch) {
			return true;
		}

		const haystack = [
			application.id,
			application.applicant?.full_name,
			application.applicant?.email,
			application.applicant?.student_code,
			application.note,
			...application.answers.map((answer) => answer.answer_value),
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();

		return haystack.includes(normalizedSearch);
	});

	const pendingCount = applications.filter((item) => item.status === "pending").length;
	const interviewCount = applications.filter((item) => item.status === "interview").length;
	const passedCount = applications.filter((item) => item.status === "passed").length;

	return (
		<main className='min-h-full bg-[#f6f8f4]'>
			<div className='border-b border-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75'>
				<div className='px-6 py-5'>
					<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
						<div className='space-y-1'>
							<p className='text-sm font-semibold uppercase tracking-[0.22em] text-[#6e7c57]'>
								Tuyển thành viên
							</p>
							<h1 className='text-3xl font-bold tracking-tight text-foreground'>
								Quản lý đơn ứng tuyển
							</h1>
							<p className='max-w-3xl text-sm text-muted-foreground'>
								Theo dõi hồ sơ ứng tuyển, câu trả lời biểu mẫu và trạng thái xử lý theo dữ
								liệu sẵn có trong hệ thống.
							</p>
						</div>

						<div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
							<Card className='gap-3 border-[#dde4d5] bg-[#fbfcf9] py-4 shadow-none'>
								<CardContent className='px-4'>
									<p className='text-xs uppercase tracking-[0.18em] text-muted-foreground'>
										Tổng hồ sơ
									</p>
									<p className='mt-2 text-2xl font-bold text-[#2e3820]'>{applications.length}</p>
								</CardContent>
							</Card>
							<Card className='gap-3 border-amber-100 bg-amber-50/80 py-4 shadow-none'>
								<CardContent className='px-4'>
									<p className='text-xs uppercase tracking-[0.18em] text-amber-700/80'>
										Chờ duyệt
									</p>
									<p className='mt-2 text-2xl font-bold text-amber-700'>{pendingCount}</p>
								</CardContent>
							</Card>
							<Card className='gap-3 border-emerald-100 bg-emerald-50/80 py-4 shadow-none'>
								<CardContent className='px-4'>
									<p className='text-xs uppercase tracking-[0.18em] text-emerald-700/80'>
										Đã đạt
									</p>
									<p className='mt-2 text-2xl font-bold text-emerald-700'>{passedCount}</p>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>

			<div className='space-y-6 p-6'>
				<Card className='overflow-hidden border-[#dde4d5] shadow-sm'>
					<CardHeader className='border-b border-border bg-white'>
						<div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
							<div className='space-y-1'>
								<CardTitle className='flex items-center gap-2 text-xl'>
									<div className='rounded-xl bg-[#eef3e8] p-2 text-[#2e3820]'>
										<ClipboardList className='size-5' />
									</div>
									Danh sách ứng tuyển
								</CardTitle>
								<CardDescription>
									Lọc theo trạng thái, tìm theo thông tin sinh viên hoặc nội dung trả lời.
								</CardDescription>
							</div>

							<CardAction className='w-full xl:w-auto'>
								<div className='flex w-full flex-col gap-3 md:flex-row'>
									<div className='relative min-w-[280px] flex-1'>
										<Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
										<Input
											value={search}
											onChange={(event) => setSearch(event.target.value)}
											placeholder='Tìm theo tên, email, MSSV, ghi chú...'
											className='pl-9'
										/>
									</div>
									<Select
										value={statusFilter}
										onValueChange={(value: ApplicationStatus | "all") => setStatusFilter(value)}>
										<SelectTrigger className='w-full md:w-[220px]'>
											<div className='flex items-center gap-2'>
												<Filter className='size-4 text-muted-foreground' />
												<SelectValue placeholder='Lọc trạng thái' />
											</div>
										</SelectTrigger>
										<SelectContent>
											{statusOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</CardAction>
						</div>
					</CardHeader>

					<CardContent className='space-y-4 bg-white px-0 pb-0'>
						<div className='grid gap-4 px-6 pt-6 md:grid-cols-3'>
							<div className='rounded-2xl border border-[#e7ece1] bg-[#fafcf8] p-4'>
								<p className='text-sm text-muted-foreground'>Đang phỏng vấn</p>
								<p className='mt-2 text-2xl font-semibold text-[#2e3820]'>{interviewCount}</p>
							</div>
							<div className='rounded-2xl border border-[#e7ece1] bg-[#fafcf8] p-4'>
								<p className='text-sm text-muted-foreground'>Đang hiển thị</p>
								<p className='mt-2 text-2xl font-semibold text-[#2e3820]'>
									{filteredApplications.length}
								</p>
							</div>
							<div className='rounded-2xl border border-[#e7ece1] bg-[#fafcf8] p-4'>
								<p className='text-sm text-muted-foreground'>Tổng câu trả lời</p>
								<p className='mt-2 text-2xl font-semibold text-[#2e3820]'>
									{filteredApplications.reduce((sum, item) => sum + item.answers.length, 0)}
								</p>
							</div>
						</div>

						{loading ? (
							<div className='space-y-3 px-6 pb-6'>
								<Skeleton className='h-12 w-full' />
								<Skeleton className='h-12 w-full' />
								<Skeleton className='h-12 w-full' />
							</div>
						) : filteredApplications.length === 0 ? (
							<div className='px-6 pb-6'>
								<Empty className='border-[#dde4d5] bg-[#fafcf8]'>
									<EmptyHeader>
										<EmptyMedia variant='icon'>
											<ClipboardList />
										</EmptyMedia>
										<EmptyTitle>Chưa có đơn phù hợp</EmptyTitle>
										<EmptyDescription>
											Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái để xem thêm kết quả.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							</div>
						) : (
							<div className='border-t border-border'>
								<Table>
									<TableHeader className='bg-[#f8faf6]'>
										<TableRow className='hover:bg-[#f8faf6]'>
											<TableHead className='px-6'>ID</TableHead>
											<TableHead>Ứng viên</TableHead>
											<TableHead>Liên hệ</TableHead>
											<TableHead>Trạng thái</TableHead>
											<TableHead>Số câu trả lời</TableHead>
											<TableHead>Cập nhật</TableHead>
											<TableHead className='px-6 text-right'>Thao tác</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredApplications.map((application) => (
											<TableRow key={application.id} className='bg-white'>
												<TableCell className='px-6 font-semibold text-[#2e3820]'>
													#{application.id}
												</TableCell>
												<TableCell>
													<div className='space-y-1'>
														<p className='font-semibold text-foreground'>
															{getApplicantName(application)}
														</p>
														<p className='text-sm text-muted-foreground'>
															{application.applicant?.student_code || "Chưa có MSSV"}
														</p>
													</div>
												</TableCell>
												<TableCell>
													<div className='space-y-1'>
														<p>{application.applicant?.email || "--"}</p>
														<p className='text-sm text-muted-foreground'>
															{application.applicant?.class_name || "Chưa phân lớp"}
														</p>
													</div>
												</TableCell>
												<TableCell>{getStatusBadge(application.status)}</TableCell>
												<TableCell>{application.answers.length}</TableCell>
												<TableCell>{formatDate(application.updated_at)}</TableCell>
												<TableCell className='px-6 text-right'>
													<Button
													variant='ghost'
													size='icon-sm'
													className='text-muted-foreground hover:text-foreground'
													aria-label='Xem chi ti?t h? s?'
													onClick={() => setSelectedApplication(application)}>
													<MoreHorizontal className='size-4' />
												</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<Dialog
				open={Boolean(selectedApplication)}
				onOpenChange={(open: boolean) => {
					if (!open) {
						setSelectedApplication(null);
					}
				}}>
				<DialogContent className='max-h-[92vh] w-[min(1120px,calc(100vw-2rem))] overflow-hidden p-0'>
					{selectedApplication ? (
						<div className='overflow-hidden rounded-lg bg-white'>
							<div className='bg-[#2e3820] px-6 py-6 text-white md:px-8 md:py-7'>
								<DialogHeader>
									<div className='mb-3 flex flex-wrap items-center gap-2'>
										<Badge className='border border-white/15 bg-white/10 text-white hover:bg-white/10'>
											Hồ sơ #{selectedApplication.id}
										</Badge>
										{getStatusBadge(selectedApplication.status)}
									</div>
									<DialogTitle className='text-2xl leading-tight md:text-4xl'>
										Hồ sơ #{selectedApplication.id} - {getApplicantName(selectedApplication)}
									</DialogTitle>
									<DialogDescription className='max-w-3xl text-base leading-7 text-white/75 md:text-lg'>
										Xem nhanh thông tin người nộp đơn, trạng thái xử lý và toàn bộ câu trả lời.
									</DialogDescription>
								</DialogHeader>
							</div>

							<div className='max-h-[calc(92vh-180px)] space-y-6 overflow-y-auto bg-[#fcfdfb] p-6 md:px-8 md:py-7'>
								<div className='grid gap-4 sm:grid-cols-2 2xl:grid-cols-4'>
									<SummaryCard
										icon={<UserRound className='size-5' />}
										label='Ứng viên'
										value={getApplicantName(selectedApplication)}
									/>
									<SummaryCard
										icon={<Mail className='size-5' />}
										label='Email'
										value={selectedApplication.applicant?.email || "--"}
									/>
									<SummaryCard
										icon={<CalendarDays className='size-5' />}
										label='Ngày nộp'
										value={formatDate(selectedApplication.created_at)}
									/>
									<SummaryCard icon={<MessageSquareText className='size-5' />} label='Trạng thái'>
										{getStatusBadge(selectedApplication.status)}
									</SummaryCard>
								</div>

								<div className='space-y-6'>
									<Card className='gap-4 border-[#dde4d5] bg-white py-5 shadow-sm'>
										<CardHeader className='px-6'>
											<CardTitle>Thông tin hồ sơ</CardTitle>
											<CardDescription>
												Thông tin định danh và dữ liệu hồ sơ của ứng viên.
											</CardDescription>
										</CardHeader>
										<CardContent className='space-y-5 px-6'>
											<div className='grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]'>
												<div className='overflow-hidden rounded-2xl border border-[#e3e9dc] bg-[#fbfcf9]'>
													<div className='grid divide-y divide-[#e3e9dc]'>
														<div className='grid gap-2 px-5 py-4 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-center'>
															<p className='text-sm font-medium text-muted-foreground'>Mã sinh viên</p>
															<p className='break-words text-base font-semibold text-foreground'>
																{selectedApplication.applicant?.student_code || "--"}
															</p>
														</div>
														<div className='grid gap-2 px-5 py-4 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-center'>
															<p className='text-sm font-medium text-muted-foreground'>Khoa</p>
															<p className='break-words text-base font-semibold text-foreground'>
																{selectedApplication.applicant?.faculty || "--"}
															</p>
														</div>
														<div className='grid gap-2 px-5 py-4 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-center'>
															<p className='text-sm font-medium text-muted-foreground'>Ngành</p>
															<p className='break-words text-base font-semibold text-foreground'>
																{selectedApplication.applicant?.major || "--"}
															</p>
														</div>
														<div className='grid gap-2 px-5 py-4 sm:grid-cols-[128px_minmax(0,1fr)] sm:items-center'>
															<p className='text-sm font-medium text-muted-foreground'>Lớp</p>
															<p className='break-words text-base font-semibold text-foreground'>
																{selectedApplication.applicant?.class_name || "--"}
															</p>
														</div>
													</div>
												</div>

												<div className='rounded-2xl border border-[#e3e9dc] bg-[#fbfcf9] p-5'>
													<p className='text-sm font-medium text-muted-foreground'>Ghi chép xem xét</p>
													<p className='mt-3 break-words text-base leading-8 text-foreground'>
														{selectedApplication.note || "Chưa có ghi chép xem xét."}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>

									<Card className='gap-4 border-[#dde4d5] bg-white py-5 shadow-sm'>
										<CardHeader className='px-6'>
											<CardTitle>Câu trả lời biểu mẫu</CardTitle>
											<CardDescription>
												Danh sách câu trả lời theo từng câu hỏi để đánh giá.
											</CardDescription>
										</CardHeader>
										<CardContent className='space-y-4 px-6'>
											{selectedApplication.answers.map((answer, index) => (
												<div key={answer.id} className='rounded-2xl border border-[#e3e9dc] bg-[#fbfcf9] p-5'>
													<div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
														<div className='min-w-0 space-y-2'>
															<div className='flex flex-wrap items-center gap-3'>
																<p className='text-xs font-semibold uppercase tracking-[0.16em] text-[#6e7c57]'>
																	Câu {index + 1}
																</p>
																<Badge variant='secondary'>{answer.question_type}</Badge>
															</div>
															<p className='break-words text-xl font-semibold leading-8 text-foreground'>
																{answer.question_label}
															</p>
														</div>
													</div>

													<div className='mt-4 rounded-xl bg-white px-4 py-4'>
														<p className='text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground'>
															Trả lời
														</p>
														<p className='mt-2 break-words text-base leading-8 text-foreground'>
															{answer.answer_value || "Ứng viên chưa trả lời câu hỏi này."}
														</p>
													</div>
												</div>
											))}
										</CardContent>
									</Card>
								</div>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</main>
	);
}

export default ApplicationRequestsPage;


