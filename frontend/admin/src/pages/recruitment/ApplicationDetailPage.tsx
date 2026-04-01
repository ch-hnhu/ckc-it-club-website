import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mail, MessageSquareText, Settings2, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import applicationService from "@/services/application.service";
import type { ClubApplicationRecord } from "@/types/application.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	formatDate,
	getApplicantName,
	getStatusBadge,
	SummaryCard,
} from "./application-detail-shared";

function ApplicationDetailPage() {
	const { applicationId } = useParams();
	const [applications, setApplications] = useState<ClubApplicationRecord[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		applicationService
			.getApplications()
			.then((data) => {
				if (mounted) setApplications(data);
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, []);

	const application = useMemo(
		() => applications.find((item) => item.id === Number(applicationId)) || null,
		[applicationId, applications],
	);

	if (loading) {
		return (
			<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
				<Skeleton className='h-10 w-40' />
				<Skeleton className='h-40 w-full' />
				<Skeleton className='h-64 w-full' />
				<Skeleton className='h-64 w-full' />
			</div>
		);
	}

	if (!application) {
		return (
			<div className='flex flex-col gap-4 p-4 md:p-6 lg:p-8'>
				<Button asChild variant='outline' className='w-fit'>
					<Link to='/requests'>
						<ArrowLeft className='h-4 w-4' />
						Quay lại danh sách
					</Link>
				</Button>
				<Card>
					<CardHeader>
						<CardTitle>Không tìm thấy hồ sơ</CardTitle>
						<CardDescription>Đơn ứng tuyển này không tồn tại hoặc đã bị xóa.</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<Button asChild variant='outline' className='w-fit'>
				<Link to='/requests'>
					<ArrowLeft className='h-4 w-4' />
					Quay lại danh sách
				</Link>
			</Button>

			<div className='overflow-hidden rounded-3xl border border-border bg-card shadow-sm'>
				<div className='border-b border-border bg-primary px-6 py-6 text-primary-foreground md:px-8 md:py-7'>
					<div className='mb-3 flex flex-wrap items-center gap-2'>
						<Badge className='border border-primary-foreground/20 bg-primary-foreground text-primary hover:bg-primary-foreground'>
							Hồ sơ #{application.id}
						</Badge>
						<div className='[&_span]:border-primary-foreground/30 [&_span]:bg-transparent [&_span]:text-primary-foreground'>
							{getStatusBadge(application.status)}
						</div>
					</div>
					<h1 className='text-2xl font-semibold leading-tight md:text-4xl'>
						Hồ sơ #{application.id} - {getApplicantName(application)}
					</h1>
					<p className='mt-3 max-w-3xl text-base leading-7 text-primary-foreground/75 md:text-lg'>
						Chi tiết hồ sơ ứng tuyển và các câu trả lời đang lưu trong hệ thống.
					</p>
				</div>

				<div className='space-y-6 bg-background/40 p-6 md:px-8 md:py-7'>
					<div className='grid gap-4 sm:grid-cols-2 2xl:grid-cols-4'>
						<SummaryCard
							icon={<UserRound className='size-5' />}
							label='Ứng viên'
							value={getApplicantName(application)}
						/>
						<SummaryCard
							icon={<Mail className='size-5' />}
							label='Email'
							value={application.applicant?.email || "--"}
						/>
						<SummaryCard
							icon={<MessageSquareText className='size-5' />}
							label='Ghi chú xét duyệt'
							value={application.note || "Chưa có ghi chú"}
						/>
						<SummaryCard icon={<Settings2 className='size-5' />} label='Trạng thái'>
							{getStatusBadge(application.status)}
						</SummaryCard>
					</div>

					<Card className='border-border py-5 shadow-sm'>
						<CardHeader className='px-6'>
							<CardTitle>Thông tin hồ sơ</CardTitle>
							<CardDescription>
								Các trường định danh hiện có từ dữ liệu ứng tuyển và người nộp đơn.
							</CardDescription>
						</CardHeader>
						<CardContent className='px-6'>
							<div className='grid gap-4 xl:grid-cols-2'>
								<div className='space-y-4 rounded-2xl border border-border bg-muted/40 p-5'>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>ID hồ sơ</p><p className='font-semibold'>{application.id}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Người tạo</p><p className='font-semibold'>{application.created_by}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Người cập nhật</p><p className='font-semibold'>{application.updated_by || "--"}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Ngày nộp</p><p className='font-semibold'>{formatDate(application.created_at)}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Lần cập nhật cuối</p><p className='font-semibold'>{formatDate(application.updated_at)}</p></div>
								</div>
								<div className='space-y-4 rounded-2xl border border-border bg-muted/40 p-5'>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Họ tên</p><p className='font-semibold'>{getApplicantName(application)}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Mã sinh viên</p><p className='font-semibold'>{application.applicant?.student_code || "--"}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Khoa</p><p className='font-semibold'>{application.applicant?.faculty || "--"}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Ngành</p><p className='font-semibold'>{application.applicant?.major || "--"}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Lớp</p><p className='font-semibold'>{application.applicant?.class_name || "--"}</p></div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className='border-border py-5 shadow-sm'>
						<CardHeader className='px-6'>
							<CardTitle>Câu trả lời biểu mẫu</CardTitle>
							<CardDescription>
								Dữ liệu trả lời đang gắn với hồ sơ trong bảng `application_answers`.
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4 px-6'>
							{application.answers.length > 0 ? (
								application.answers.map((answer, index) => (
									<div
										key={answer.id}
										className='rounded-2xl border border-border bg-muted/40 p-5'>
										<div className='space-y-2'>
											<div className='flex flex-wrap items-center gap-3'>
												<p className='text-primary text-xs font-semibold uppercase tracking-[0.16em]'>
													Câu {index + 1}
												</p>
												<Badge variant='secondary'>{answer.question_type}</Badge>
											</div>
											<p className='text-lg font-semibold leading-8 text-foreground'>
												{answer.question_label}
											</p>
										</div>
										<div className='mt-4 rounded-xl border border-border bg-card px-4 py-4'>
											<p className='text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground'>
												Trả lời
											</p>
											<p className='mt-2 break-words text-base leading-8 text-foreground'>
												{answer.answer_value || "Ứng viên chưa trả lời câu hỏi này."}
											</p>
										</div>
									</div>
								))
							) : (
								<div className='rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground'>
									Chưa có câu trả lời nào được lưu cho hồ sơ này.
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default ApplicationDetailPage;
