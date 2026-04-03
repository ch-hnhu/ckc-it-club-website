import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
	ArrowLeft,
	CircleHelp,
	ListChecks,
	MessageSquareText,
	ShieldCheck,
	ToggleLeft,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import applicationService from "@/services/application.service";
import type { ApplicationQuestionRecord } from "@/types/application.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getBreadcrumbsFromNavigation } from "@/config/navigation";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";

function formatDate(dateString: string | null) {
	if (!dateString) return "--";
	return new Intl.DateTimeFormat("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(dateString));
}

function getErrorMessage(error: unknown, fallback: string) {
	if (axios.isAxiosError(error)) {
		const responseMessage = (error.response?.data as { message?: string } | undefined)?.message;
		if (responseMessage) {
			return responseMessage;
		}
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return fallback;
}

function SummaryCard({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className='rounded-2xl border border-border bg-card p-5 shadow-sm'>
			<div className='flex items-start gap-3'>
				<div className='text-primary mt-1 shrink-0'>{icon}</div>
				<div className='min-w-0'>
					<p className='text-sm text-muted-foreground'>{label}</p>
					<div className='mt-1 break-words text-lg font-semibold leading-7 text-foreground'>
						{value}
					</div>
				</div>
			</div>
		</div>
	);
}

function ApplicationQuestionDetailPage() {
	const { questionId } = useParams();
	const [question, setQuestion] = useState<ApplicationQuestionRecord | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const breadcrumb = useMemo(
		() =>
			getBreadcrumbsFromNavigation("/questions", [
				{ title: question ? question.label : `Câu hỏi #${questionId ?? "--"}` },
			]),
		[question, questionId],
	);

	useBreadcrumb(breadcrumb);

	useEffect(() => {
		let mounted = true;

		const fetchQuestion = async () => {
			if (!questionId) {
				setLoading(false);
				setError("Thiếu mã câu hỏi.");
				return;
			}

			try {
				const data = await applicationService.getQuestion(Number(questionId));
				if (!mounted) return;
				setQuestion(data);
				setError(null);
			} catch (fetchError) {
				if (!mounted) return;
				setQuestion(null);
				setError(getErrorMessage(fetchError, "Không thể tải chi tiết câu hỏi."));
			} finally {
				if (mounted) setLoading(false);
			}
		};

		void fetchQuestion();

		return () => {
			mounted = false;
		};
	}, [questionId]);

	if (loading) {
		return (
			<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
				<Skeleton className='h-10 w-40' />
				<Skeleton className='h-40 w-full' />
				<Skeleton className='h-64 w-full' />
			</div>
		);
	}

	if (!question) {
		return (
			<div className='flex flex-col gap-4 p-4 md:p-6 lg:p-8'>
				<Button asChild variant='outline' className='w-fit'>
					<Link to='/questions'>
						<ArrowLeft className='h-4 w-4' />
						Quay lại danh sách câu hỏi
					</Link>
				</Button>
				<Card>
					<CardHeader>
						<CardTitle>Không tải được câu hỏi</CardTitle>
						<CardDescription>{error || "Câu hỏi này không tồn tại hoặc đã bị xóa."}</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<Button asChild variant='outline' className='w-fit'>
				<Link to='/questions'>
					<ArrowLeft className='h-4 w-4' />
					Quay lại danh sách câu hỏi
				</Link>
			</Button>

			<div className='overflow-hidden rounded-3xl border border-border bg-card shadow-sm'>
				<div className='border-b border-border bg-background/60 px-6 py-6 md:px-8 md:py-7'>
					<div className='mb-3 flex flex-wrap items-center gap-2'>
						<Badge variant='secondary'>
							Câu hỏi #{question.id}
						</Badge>
						<Badge variant='outline'>
							{question.type}
						</Badge>
					</div>
					<h1 className='text-2xl font-semibold leading-tight text-foreground md:text-4xl'>{question.label}</h1>
					<p className='mt-3 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg'>
						Chi tiết cấu hình câu hỏi ứng tuyển và danh sách lựa chọn nếu có.
					</p>
				</div>

				<div className='space-y-6 bg-background/40 p-6 md:px-8 md:py-7'>
					<div className='grid gap-4 sm:grid-cols-2 2xl:grid-cols-5'>
						<SummaryCard icon={<CircleHelp className='size-5' />} label='Loại câu hỏi' value={question.type} />
						<SummaryCard icon={<ListChecks className='size-5' />} label='Số lựa chọn' value={question.options.length} />
						<SummaryCard
							icon={<ShieldCheck className='size-5' />}
							label='Bắt buộc'
							value={question.is_required ? "Có" : "Không"}
						/>
						<SummaryCard
							icon={<ToggleLeft className='size-5' />}
							label='Trạng thái'
							value={question.is_active ? "Đang hoạt động" : "Tạm ẩn"}
						/>
						<SummaryCard
							icon={<MessageSquareText className='size-5' />}
							label='Câu trả lời đã có'
							value={question.answers_count}
						/>
					</div>

					<Card className='border-border py-5 shadow-sm'>
						<CardHeader className='px-6'>
							<CardTitle>Thông tin cấu hình</CardTitle>
							<CardDescription>Thông tin kỹ thuật và thứ tự hiển thị của câu hỏi.</CardDescription>
						</CardHeader>
						<CardContent className='px-6'>
							<div className='grid gap-4 xl:grid-cols-2'>
								<div className='space-y-4 rounded-2xl border border-border bg-muted/40 p-5'>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>ID</p><p className='font-semibold'>{question.id}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Thứ tự</p><p className='font-semibold'>{question.order_index}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Ngày tạo</p><p className='font-semibold'>{formatDate(question.created_at)}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Lần cập nhật cuối</p><p className='font-semibold'>{formatDate(question.updated_at)}</p></div>
								</div>
								<div className='space-y-4 rounded-2xl border border-border bg-muted/40 p-5'>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Người tạo</p><p className='font-semibold'>{question.created_by || "--"}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Người cập nhật</p><p className='font-semibold'>{question.updated_by || "--"}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Bắt buộc</p><p className='font-semibold'>{question.is_required ? "Có" : "Không"}</p></div>
									<div className='grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)]'><p className='text-sm font-medium text-muted-foreground'>Trạng thái</p><p className='font-semibold'>{question.is_active ? "Đang hoạt động" : "Tạm ẩn"}</p></div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className='border-border py-5 shadow-sm'>
						<CardHeader className='px-6'>
							<CardTitle>Lựa chọn câu hỏi</CardTitle>
							<CardDescription>Danh sách option áp dụng cho câu hỏi dạng chọn.</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4 px-6'>
							{question.options.length > 0 ? (
								question.options.map((option, index) => (
									<div key={option.id} className='rounded-2xl border border-border bg-muted/40 p-5'>
										<div className='flex flex-wrap items-center gap-3'>
											<Badge variant='secondary'>Option {index + 1}</Badge>
											<p className='text-sm text-muted-foreground'>Value: {option.value}</p>
										</div>
										<p className='mt-3 text-lg font-semibold leading-8 text-foreground'>{option.label}</p>
									</div>
								))
							) : (
								<div className='rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground'>
									Câu hỏi này không có lựa chọn đi kèm.
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default ApplicationQuestionDetailPage;
