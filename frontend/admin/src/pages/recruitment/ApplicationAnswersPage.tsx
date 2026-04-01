import { useEffect, useMemo, useState } from "react";
import {
	ArrowRight,
	FileText,
	Filter,
	LayoutPanelLeft,
	Mail,
	MessageSquareText,
	Search,
	Sparkles,
	UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import applicationService from "@/services/application.service";
import type { ApplicationStatus, ClubApplicationRecord } from "@/types/application.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
}: {
	label: string;
	value: string;
	description: string;
	icon: React.ReactNode;
}) {
	return (
		<Card className='border-border bg-card/95 shadow-sm backdrop-blur'>
			<CardContent className='flex items-start justify-between gap-4 p-5'>
				<div className='space-y-1'>
					<p className='text-primary text-sm font-medium'>{label}</p>
					<p className='text-foreground text-3xl font-semibold tracking-tight'>{value}</p>
					<p className='text-muted-foreground text-sm leading-6'>{description}</p>
				</div>
				<div className='text-primary rounded-2xl border border-border bg-muted/40 p-3'>
					{icon}
				</div>
			</CardContent>
		</Card>
	);
}

function ApplicationAnswersPage() {
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

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8'>
				<section className='overflow-hidden rounded-[30px] border border-border bg-primary text-primary-foreground shadow-sm'>
					<div className='grid gap-8 px-6 py-7 md:px-8 md:py-9 xl:grid-cols-[1.2fr_0.8fr] xl:items-end'>
						<div className='space-y-4'>
							<Badge className='w-fit border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-primary-foreground hover:bg-primary-foreground/10'>
								Trang quản lý câu trả lời tuyển thành viên
							</Badge>
							<div className='space-y-3'>
								<h1 className='max-w-4xl text-[2rem] font-semibold leading-tight md:text-[3.5rem] md:leading-[1.02]'>
									Duyệt câu trả lời theo từng ứng viên, không cần mở từng hồ sơ riêng lẻ
								</h1>
								<p className='max-w-3xl text-sm leading-7 text-primary-foreground/72 md:text-base'>
									Tập trung vào chất lượng câu trả lời, lọc nhanh theo trạng thái và câu hỏi,
									sau đó chuyển sang trang chi tiết hồ sơ khi cần xử lý sâu hơn.
								</p>
							</div>
						</div>

						<div className='grid gap-3 sm:grid-cols-3 xl:grid-cols-1'>
							<div className='rounded-[24px] border border-primary-foreground/10 bg-primary-foreground/8 p-4 backdrop-blur-sm'>
								<p className='text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/55'>Hồ sơ có câu trả lời</p>
								<p className='mt-2 text-3xl font-semibold'>{applications.length}</p>
								<p className='mt-2 text-sm text-primary-foreground/65'>Tổng hồ sơ đang đồng bộ vào giao diện.</p>
							</div>
							<div className='rounded-[24px] border border-primary-foreground/10 bg-primary-foreground/8 p-4 backdrop-blur-sm'>
								<p className='text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/55'>Câu trả lời đã thu thập</p>
								<p className='mt-2 text-3xl font-semibold'>{totalAnswers}</p>
								<p className='mt-2 text-sm text-primary-foreground/65'>Bao gồm các câu text, textarea và lựa chọn.</p>
							</div>
							<div className='rounded-[24px] border border-primary-foreground/10 bg-primary-foreground/8 p-4 backdrop-blur-sm'>
								<p className='text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/55'>Hồ sơ đã được xử lý</p>
								<p className='mt-2 text-3xl font-semibold'>{reviewedApplications}</p>
								<p className='mt-2 text-sm text-primary-foreground/65'>Các hồ sơ đã qua bước chờ duyệt ban đầu.</p>
							</div>
						</div>
					</div>
				</section>

				<section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
					<MetricCard label='Ứng viên hiển thị' value={String(filteredApplications.length)} description='Số hồ sơ khớp với bộ lọc hiện tại.' icon={<LayoutPanelLeft className='size-5' />} />
					<MetricCard label='Câu hỏi đang theo dõi' value={String(questionOptions.length)} description='Tổng số câu hỏi xuất hiện trong dữ liệu trả lời.' icon={<FileText className='size-5' />} />
					<MetricCard label='Trung bình câu trả lời' value={averageAnswers} description='Số câu trả lời trung bình trên mỗi hồ sơ.' icon={<MessageSquareText className='size-5' />} />
					<MetricCard label='Bộ lọc đang áp dụng' value={statusFilter === "all" ? "01" : "02"} description='Tự động tăng khi bạn lọc theo trạng thái hoặc câu hỏi.' icon={<Filter className='size-5' />} />
				</section>

				<section className='grid gap-6 xl:grid-cols-[0.88fr_1.12fr]'>
					<Card className='overflow-hidden rounded-[28px] border-border bg-card shadow-sm'>
						<CardHeader className='space-y-5 border-b border-border bg-muted/20 px-5 py-5 md:px-6 md:py-6'>
							<div className='flex flex-wrap items-start justify-between gap-3'>
								<div className='space-y-1.5'>
									<CardTitle className='text-foreground text-[1.7rem] font-semibold'>Danh sách ứng viên</CardTitle>
									<CardDescription className='text-muted-foreground max-w-xl text-sm leading-6'>Chọn một hồ sơ để xem toàn bộ câu trả lời ở khung bên phải.</CardDescription>
								</div>
								<div className='bg-background text-primary rounded-full border border-border px-3 py-1.5 text-sm font-medium'>{filteredApplications.length} hồ sơ</div>
							</div>

							<div className='grid gap-3'>
								<div className='relative'>
									<Search className='text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2' />
									<Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Tìm theo ứng viên, email, MSSV, câu hỏi, câu trả lời...' className='bg-background h-11 rounded-2xl border-border pl-10' />
								</div>

								<div className='grid gap-3 md:grid-cols-2'>
									<Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ApplicationStatus | "all")}>
										<SelectTrigger className='bg-background h-11 rounded-2xl border-border'>
											<SelectValue placeholder='Chọn trạng thái' />
										</SelectTrigger>
										<SelectContent>
											{statusOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
											))}
										</SelectContent>
									</Select>

									<Select value={questionFilter} onValueChange={setQuestionFilter}>
										<SelectTrigger className='bg-background h-11 rounded-2xl border-border'>
											<SelectValue placeholder='Lọc theo câu hỏi' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>Tất cả câu hỏi</SelectItem>
											{questionOptions.map((question) => (
												<SelectItem key={question.id} value={String(question.id)}>{question.label}</SelectItem>
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
											<button key={application.id} type='button' onClick={() => setSelectedApplicationId(application.id)} className={`w-full rounded-[24px] border p-4 text-left transition ${isActive ? "border-primary/30 bg-primary/5 shadow-sm" : "border-border bg-card hover:bg-muted/20"}`}>
												<div className='flex items-start justify-between gap-3'>
													<div className='flex min-w-0 items-start gap-3'>
														<div className='bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold'>{getInitials(applicantName)}</div>
														<div className='min-w-0 space-y-1'>
															<div className='flex flex-wrap items-center gap-2'>
																<p className='text-foreground truncate text-lg font-semibold'>{applicantName}</p>
																{getStatusBadge(application.status)}
															</div>
															<p className='text-muted-foreground truncate text-sm'>{application.applicant?.email || "Chưa có email"}</p>
															<p className='text-muted-foreground line-clamp-2 text-sm leading-6'>{getAnswerPreview(application)}</p>
														</div>
													</div>
													<Badge variant='outline' className='bg-background text-primary rounded-full border-border'>{application.answers.length} câu</Badge>
												</div>

												<div className='text-muted-foreground mt-4 flex flex-wrap items-center gap-2 text-xs'>
													<Badge variant='secondary' className='rounded-full'>APP-{application.id}</Badge>
													<span>{application.applicant?.student_code || "Chưa có MSSV"}</span>
													<span className='text-border'>•</span>
													<span>{formatDate(application.created_at)}</span>
												</div>
											</button>
										);
									})}
								</div>
							) : (
								<div className='bg-muted/30 rounded-[24px] border border-dashed border-border px-6 py-12 text-center'>
									<div className='text-primary bg-muted mx-auto flex size-14 items-center justify-center rounded-2xl'>
										<Search className='size-6' />
									</div>
									<p className='text-foreground mt-4 text-2xl font-semibold'>Không có hồ sơ phù hợp</p>
									<p className='text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-7'>Hãy nới điều kiện lọc hoặc thay đổi từ khóa tìm kiếm để tiếp tục duyệt câu trả lời.</p>
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
												<Badge className='bg-primary text-primary-foreground rounded-full hover:bg-primary'>Hồ sơ #{selectedApplication.id}</Badge>
												{getStatusBadge(selectedApplication.status)}
												<Badge variant='outline' className={getStatusConfig(selectedApplication.status).className}>{selectedApplication.answers.length} câu trả lời</Badge>
											</div>
											<div>
												<CardTitle className='text-foreground text-[1.9rem] font-semibold leading-tight'>{getApplicantName(selectedApplication)}</CardTitle>
												<CardDescription className='text-muted-foreground mt-2 max-w-2xl text-sm leading-7'>Xem toàn bộ câu trả lời đã lưu cho ứng viên này và chuyển sang trang chi tiết hồ sơ nếu cần xử lý trạng thái hoặc ghi chú.</CardDescription>
											</div>
										</div>
										<Button asChild className='h-11 rounded-2xl px-4'>
											<Link to={`/requests/${selectedApplication.id}`}>
												Mở hồ sơ chi tiết
												<ArrowRight className='size-4' />
											</Link>
										</Button>
									</div>
								</CardHeader>

								<CardContent className='space-y-6 p-5 md:p-6'>
									<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
										<div className='bg-muted/40 rounded-[22px] border border-border p-4'>
											<div className='text-primary flex items-center gap-2'><UserRound className='size-4' /><p className='text-sm font-medium'>Ứng viên</p></div>
											<p className='text-foreground mt-3 text-base font-semibold leading-7'>{getApplicantName(selectedApplication)}</p>
										</div>
										<div className='bg-muted/40 rounded-[22px] border border-border p-4'>
											<div className='text-primary flex items-center gap-2'><Mail className='size-4' /><p className='text-sm font-medium'>Liên hệ</p></div>
											<p className='text-foreground mt-3 break-words text-base font-semibold leading-7'>{selectedApplication.applicant?.email || "--"}</p>
										</div>
										<div className='bg-muted/40 rounded-[22px] border border-border p-4'>
											<div className='text-primary flex items-center gap-2'><FileText className='size-4' /><p className='text-sm font-medium'>Thông tin lớp</p></div>
											<p className='text-foreground mt-3 text-base font-semibold leading-7'>{selectedApplication.applicant?.class_name || "--"}</p>
										</div>
										<div className='bg-muted/40 rounded-[22px] border border-border p-4'>
											<div className='text-primary flex items-center gap-2'><Sparkles className='size-4' /><p className='text-sm font-medium'>Ghi chú duyệt</p></div>
											<p className='text-foreground mt-3 text-base font-semibold leading-7'>{selectedApplication.note || "Chưa có ghi chú"}</p>
										</div>
									</div>

									<div className='bg-muted/20 rounded-[26px] border border-border p-4 md:p-5'>
										<div className='flex flex-wrap items-center justify-between gap-3'>
											<div>
												<p className='text-primary text-sm font-semibold uppercase tracking-[0.18em]'>Câu trả lời biểu mẫu</p>
												<p className='text-foreground mt-2 text-xl font-semibold'>Nội dung ứng viên đã gửi</p>
											</div>
											<div className='text-muted-foreground text-sm'>Nộp lúc {formatDate(selectedApplication.created_at)}</div>
										</div>

										<div className='mt-5 max-h-[calc(100vh-28rem)] space-y-4 overflow-auto pr-1'>
											{selectedApplication.answers.length > 0 ? (
												selectedApplication.answers.map((answer, index) => (
													<div key={answer.id} className='rounded-[24px] border border-border bg-card p-5 shadow-sm'>
														<div className='flex flex-wrap items-start justify-between gap-3'>
															<div className='space-y-2'>
																<div className='flex flex-wrap items-center gap-2'>
																	<p className='text-primary text-xs font-semibold uppercase tracking-[0.16em]'>Câu {index + 1}</p>
																	<Badge variant='secondary' className='rounded-full'>{answer.question_type}</Badge>
																</div>
																<h3 className='text-foreground text-lg font-semibold leading-8'>{answer.question_label}</h3>
															</div>
															<Badge variant='outline' className='bg-muted/30 text-primary rounded-full border-border'>Q-{answer.question_id}</Badge>
														</div>
														<div className='bg-muted/40 mt-4 rounded-[20px] border border-border px-4 py-4'>
															<p className='text-muted-foreground text-xs font-semibold uppercase tracking-[0.16em]'>Trả lời</p>
															<p className='text-foreground mt-2 break-words text-base leading-8'>{answer.answer_value || "Ứng viên chưa trả lời câu hỏi này."}</p>
														</div>
													</div>
												))
											) : (
												<div className='bg-background rounded-[24px] border border-dashed border-border px-6 py-12 text-center'>
													<p className='text-foreground text-2xl font-semibold'>Chưa có câu trả lời</p>
													<p className='text-muted-foreground mt-2 text-sm leading-7'>Hồ sơ này chưa ghi nhận dữ liệu trong danh sách câu trả lời.</p>
												</div>
											)}
										</div>
									</div>
								</CardContent>
							</>
						) : (
							<div className='flex min-h-[32rem] items-center justify-center p-6'>
								<div className='bg-muted/30 max-w-md rounded-[24px] border border-dashed border-border px-6 py-12 text-center'>
									<div className='text-primary bg-muted mx-auto flex size-14 items-center justify-center rounded-2xl'>
										<MessageSquareText className='size-6' />
									</div>
									<p className='text-foreground mt-4 text-2xl font-semibold'>Chọn một hồ sơ để xem câu trả lời</p>
									<p className='text-muted-foreground mt-2 text-sm leading-7'>Khi bạn chọn một ứng viên ở cột bên trái, toàn bộ nội dung trả lời sẽ xuất hiện tại đây.</p>
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
