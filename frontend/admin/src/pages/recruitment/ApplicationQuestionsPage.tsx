import { useEffect, useMemo, useState } from "react";
import {
	Eye,
	ListFilter,
	ListOrdered,
	MoveVertical,
	PencilLine,
	Plus,
	SquarePen,
	TextCursorInput,
	Type,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import applicationService from "@/services/application.service";
import type { ApplicationQuestionOption, ApplicationQuestionRecord } from "@/types/application.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type FieldTemplate = {
	type: string;
	label: string;
	description: string;
	icon: React.ReactNode;
};

const fieldTemplates: FieldTemplate[] = [
	{ type: "text", label: "Text", description: "Câu trả lời ngắn một dòng.", icon: <TextCursorInput className='h-4 w-4' /> },
	{ type: "textarea", label: "Textarea", description: "Phù hợp cho mô tả dài và tự luận.", icon: <SquarePen className='h-4 w-4' /> },
	{ type: "radio", label: "Radio", description: "Ứng viên chỉ chọn một đáp án.", icon: <ListFilter className='h-4 w-4' /> },
];

const emptyQuestion = (type: string, orderIndex: number): ApplicationQuestionRecord => ({
	id: Date.now(),
	label: "Câu hỏi mới",
	type,
	is_required: false,
	order_index: orderIndex,
	is_active: true,
	created_at: null,
	created_by: null,
	updated_at: null,
	updated_by: null,
	options:
		type === "radio" || type === "select"
			? [
					{ id: Date.now() + 1, question_id: Date.now(), value: "option_1", label: "Lựa chọn 1" },
					{ id: Date.now() + 2, question_id: Date.now(), value: "option_2", label: "Lựa chọn 2" },
				]
			: [],
});

function normalizeQuestionType(type: string) {
	return type === "select" ? "Radio" : type.charAt(0).toUpperCase() + type.slice(1);
}

function ApplicationQuestionsPage() {
	const navigate = useNavigate();
	const [questions, setQuestions] = useState<ApplicationQuestionRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

	useEffect(() => {
		let mounted = true;
		applicationService
			.getQuestions()
			.then((data) => {
				if (!mounted) return;
				const sorted = [...data].sort((a, b) => a.order_index - b.order_index);
				setQuestions(sorted);
				setSelectedQuestionId(sorted[0]?.id ?? null);
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, []);

	const selectedQuestion = useMemo(
		() => questions.find((question) => question.id === selectedQuestionId) ?? null,
		[questions, selectedQuestionId],
	);

	const visibleCount = questions.filter((question) => question.is_active).length;

	const updateQuestion = (
		questionId: number,
		updater: (question: ApplicationQuestionRecord) => ApplicationQuestionRecord,
	) => {
		setQuestions((prev) =>
			prev.map((question) => (question.id === questionId ? updater(question) : question)),
		);
	};

	const handleAddField = (template: FieldTemplate) => {
		const nextOrderIndex =
			questions.length > 0 ? Math.max(...questions.map((item) => item.order_index)) + 1 : 1;
		const nextQuestion = emptyQuestion(template.type, nextOrderIndex);
		setQuestions((prev) => [...prev, nextQuestion]);
		setSelectedQuestionId(nextQuestion.id);
	};

	const handleMove = (questionId: number, direction: "up" | "down") => {
		setQuestions((prev) => {
			const sorted = [...prev].sort((a, b) => a.order_index - b.order_index);
			const index = sorted.findIndex((item) => item.id === questionId);
			if (index < 0) return prev;

			const targetIndex = direction === "up" ? index - 1 : index + 1;
			if (targetIndex < 0 || targetIndex >= sorted.length) return prev;

			const current = sorted[index];
			const target = sorted[targetIndex];
			const currentOrder = current.order_index;
			current.order_index = target.order_index;
			target.order_index = currentOrder;

			return [...sorted].sort((a, b) => a.order_index - b.order_index);
		});
	};

	const handleOptionChange = (
		optionId: number,
		key: keyof ApplicationQuestionOption,
		value: string,
	) => {
		if (!selectedQuestion) return;
		updateQuestion(selectedQuestion.id, (question) => ({
			...question,
			options: question.options.map((option) =>
				option.id === optionId ? { ...option, [key]: value } : option,
			),
		}));
	};

	const handleAddOption = () => {
		if (!selectedQuestion) return;
		updateQuestion(selectedQuestion.id, (question) => ({
			...question,
			options: [
				...question.options,
				{
					id: Date.now(),
					question_id: question.id,
					value: `option_${question.options.length + 1}`,
					label: `Lựa chọn ${question.options.length + 1}`,
				},
			],
		}));
	};

	const handleRemoveOption = (optionId: number) => {
		if (!selectedQuestion) return;
		updateQuestion(selectedQuestion.id, (question) => ({
			...question,
			options: question.options.filter((option) => option.id !== optionId),
		}));
	};

	const sortedQuestions = [...questions].sort((a, b) => a.order_index - b.order_index);

	return (
		<div className='min-h-full bg-background'>
			<div className='border-b border-border bg-card px-4 py-4 md:px-6 md:py-5 lg:px-7'>
				<div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
					<div>
						<p className='text-primary text-[11px] font-semibold uppercase tracking-[0.26em]'>Tuyển thành viên</p>
						<h1 className='text-foreground mt-2 text-[2.2rem] font-semibold tracking-tight md:text-[3.6rem] md:leading-[1.05]'>Thiết kế câu hỏi ứng tuyển</h1>
						<p className='text-muted-foreground mt-2 max-w-3xl text-sm leading-6 md:text-lg md:leading-[1.45]'>
							Quản lý trực quan danh sách câu hỏi, thứ tự hiển thị, trạng thái bắt buộc và các tùy chọn trả lời.
						</p>
					</div>
					<div className='flex flex-wrap items-center gap-2.5 xl:justify-end'>
						<div className='bg-background text-foreground rounded-full border border-border px-4 py-2 text-sm font-semibold shadow-sm'>
							{visibleCount} trường đang hiển thị
						</div>
						<Button
							variant='outline'
							className='bg-background h-10 rounded-2xl border-border px-4 text-sm shadow-sm'
							disabled={!selectedQuestion}
							onClick={() => selectedQuestion && navigate(`/questions/${selectedQuestion.id}`)}>
							<Eye className='h-4 w-4' />
							Xem trước
						</Button>
					</div>
				</div>
			</div>

			<div className='grid gap-4 p-4 md:p-6 xl:grid-cols-[0.88fr_1.02fr_0.9fr] xl:items-start lg:p-6'>
				<Card className='overflow-hidden rounded-[22px] border-border bg-card shadow-sm'>
					<CardHeader className='space-y-2 px-5 py-5 md:px-6 md:py-6'>
						<CardTitle className='text-foreground flex items-center gap-3 text-[1.85rem] font-semibold'>
							<Type className='text-primary h-5 w-5' />
							Loại trường
						</CardTitle>
						<CardDescription className='text-muted-foreground text-sm leading-6 md:text-[15px]'>
							Chọn một loại trường và thêm nhanh vào form.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3 px-5 pb-5 md:px-6 md:pb-6'>
						{fieldTemplates.map((template) => (
							<button
								key={template.type}
								type='button'
								onClick={() => handleAddField(template)}
								className='bg-background hover:bg-muted/40 flex w-full items-start justify-between rounded-[20px] border border-border px-4 py-3.5 text-left shadow-sm transition'>
								<div className='flex gap-3'>
									<div className='text-primary rounded-2xl border border-border bg-muted/40 p-2.5 shadow-sm'>
										{template.icon}
									</div>
									<div className='space-y-1'>
										<p className='text-foreground text-base font-semibold'>{template.label}</p>
										<p className='text-muted-foreground max-w-[12rem] text-sm leading-6'>{template.description}</p>
									</div>
								</div>
								<Plus className='text-muted-foreground mt-1 h-4 w-4' />
							</button>
						))}
					</CardContent>
				</Card>

				<Card className='overflow-hidden rounded-[22px] border-border bg-card shadow-sm'>
					<CardHeader className='space-y-2 border-b border-border px-5 py-5 md:px-6 md:py-6'>
						<CardTitle className='text-foreground flex items-center gap-3 text-[1.85rem] font-semibold'>
							<ListOrdered className='text-primary h-5 w-5' />
							Vùng thiết kế form
						</CardTitle>
						<CardDescription className='text-muted-foreground text-sm leading-6 md:text-[15px]'>
							Hiển thị trực quan form đăng ký với các trường lấy từ `application_questions`.
						</CardDescription>
					</CardHeader>
					<CardContent className='px-5 py-5 md:px-6 md:py-6'>
						{loading ? (
							<div className='space-y-4'>
								<Skeleton className='h-24 w-full rounded-[22px]' />
								<Skeleton className='h-24 w-full rounded-[22px]' />
								<Skeleton className='h-24 w-full rounded-[22px]' />
							</div>
						) : sortedQuestions.length > 0 ? (
							<div className='space-y-4'>
								{sortedQuestions.map((question) => {
									const isSelected = selectedQuestionId === question.id;
									return (
										<div key={question.id} className={`rounded-[20px] border px-4 py-4 transition ${isSelected ? "border-primary/30 bg-primary/5 shadow-sm" : "border-border bg-card shadow-sm"}`}>
											<div className='flex flex-wrap items-start justify-between gap-3'>
												<div className='flex flex-wrap items-center gap-2'>
													<Badge variant='outline' className='bg-background text-foreground rounded-full border-border px-2.5 py-1 text-xs'>Thứ tự {question.order_index}</Badge>
													<Badge variant='secondary' className='rounded-full px-2.5 py-1 text-xs'>{normalizeQuestionType(question.type)}</Badge>
													{question.is_required ? <Badge className='rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive shadow-none hover:bg-destructive/10'>Bắt buộc</Badge> : null}
												</div>
												<div className='flex flex-wrap gap-2'>
													<Button variant={isSelected ? "default" : "outline"} className='h-8 rounded-xl px-3 text-xs' onClick={() => setSelectedQuestionId(question.id)}>
														<PencilLine className='h-3.5 w-3.5' />
														Sửa
													</Button>
													<Button variant='outline' size='icon' className='h-8 w-8 rounded-xl' onClick={() => handleMove(question.id, "up")}><span className='text-base'>↑</span></Button>
													<Button variant='outline' size='icon' className='h-8 w-8 rounded-xl' onClick={() => handleMove(question.id, "down")}><span className='text-base'>↓</span></Button>
													<Button variant='outline' className='h-8 rounded-xl px-3 text-xs' onClick={() => updateQuestion(question.id, (current) => ({ ...current, is_active: !current.is_active }))}>
														{question.is_active ? "Ẩn" : "Hiện"}
													</Button>
												</div>
											</div>
											<div className='mt-4 flex flex-wrap items-center gap-3'>
												<Badge variant='outline' className='bg-background text-muted-foreground rounded-full border-border px-2.5 py-1 text-sm'>#{String(question.order_index).padStart(2, "0")}</Badge>
												<h3 className='text-foreground max-w-[14rem] text-xl font-semibold leading-[1.35]'>{question.label}{question.is_required ? <span className='text-destructive ml-2'>*</span> : null}</h3>
												<div className='bg-background text-muted-foreground rounded-full border border-border px-3 py-1.5 text-xs font-medium'>
													<MoveVertical className='mr-1.5 inline h-3.5 w-3.5' />
													Kéo để di chuyển
												</div>
											</div>
											<p className='text-muted-foreground mt-3 max-w-md text-sm leading-6'>Dùng giá trị `order_index` để sắp xếp thứ tự hiển thị và quản lý cấu hình câu hỏi ngay trên form.</p>
										</div>
									);
								})}
							</div>
						) : (
							<div className='bg-muted/30 text-muted-foreground rounded-[22px] border border-dashed border-border px-6 py-10 text-center text-sm'>
								Chưa có câu hỏi nào. Hãy thêm một loại trường ở cột bên trái.
							</div>
						)}
					</CardContent>
				</Card>

				<Card className='overflow-hidden rounded-[22px] border-border bg-card shadow-sm'>
					<CardHeader className='space-y-2 border-b border-border px-5 py-5 md:px-6 md:py-6'>
						<CardTitle className='text-foreground flex items-center gap-3 text-[1.85rem] font-semibold'>
							<PencilLine className='text-primary h-5 w-5' />
							Bảng chỉnh sửa
						</CardTitle>
						<CardDescription className='text-muted-foreground text-sm leading-6 md:text-[15px]'>
							Sửa label, type, is_required, is_active và các tùy chọn của câu hỏi đang chọn.
						</CardDescription>
					</CardHeader>
					<CardContent className='px-5 py-5 md:px-6 md:py-6'>
						{selectedQuestion ? (
							<div className='space-y-4'>
								<div className='grid gap-2'>
									<Label htmlFor='question-label'>Label câu hỏi</Label>
									<Input id='question-label' value={selectedQuestion.label} onChange={(event) => updateQuestion(selectedQuestion.id, (question) => ({ ...question, label: event.target.value }))} className='h-10 rounded-xl text-sm' />
								</div>
								<div className='grid gap-2'>
									<Label htmlFor='question-type'>Loại trường</Label>
									<Input id='question-type' value={selectedQuestion.type} onChange={(event) => updateQuestion(selectedQuestion.id, (question) => ({ ...question, type: event.target.value }))} className='h-10 rounded-xl text-sm' />
								</div>
								<div className='bg-muted/40 grid gap-3 rounded-2xl border border-border p-4'>
									<div className='flex items-center justify-between gap-4'>
										<div>
											<p className='text-foreground text-sm font-semibold'>Bắt buộc</p>
											<p className='text-muted-foreground text-xs'>Ứng viên phải trả lời câu hỏi này.</p>
										</div>
										<Switch checked={selectedQuestion.is_required} onCheckedChange={(checked) => updateQuestion(selectedQuestion.id, (question) => ({ ...question, is_required: checked }))} />
									</div>
									<div className='flex items-center justify-between gap-4'>
										<div>
											<p className='text-foreground text-sm font-semibold'>Đang hiển thị</p>
											<p className='text-muted-foreground text-xs'>Cho phép câu hỏi xuất hiện trên form.</p>
										</div>
										<Switch checked={selectedQuestion.is_active} onCheckedChange={(checked) => updateQuestion(selectedQuestion.id, (question) => ({ ...question, is_active: checked }))} />
									</div>
								</div>
								<div className='grid gap-2'>
									<Label htmlFor='question-note'>Ghi chú hiển thị</Label>
									<Textarea id='question-note' value={`Loại: ${selectedQuestion.type}\nThứ tự hiện tại: ${selectedQuestion.order_index}\nSố lựa chọn: ${selectedQuestion.options.length}`} readOnly className='bg-muted/40 min-h-24 rounded-2xl text-sm leading-6' />
								</div>
								<div className='space-y-3'>
									<div className='flex items-center justify-between gap-3'>
										<Label>Tùy chọn trả lời</Label>
										<Button variant='outline' className='h-8 rounded-xl px-3 text-xs' onClick={handleAddOption} disabled={selectedQuestion.type !== "radio" && selectedQuestion.type !== "select"}>
											<Plus className='h-4 w-4' />
											Thêm option
										</Button>
									</div>
									{selectedQuestion.options.length > 0 ? (
										<div className='space-y-3'>
											{selectedQuestion.options.map((option) => (
												<div key={option.id} className='bg-muted/40 rounded-2xl border border-border p-4'>
													<div className='grid gap-3'>
														<div className='grid gap-2'>
															<Label>Label</Label>
															<Input value={option.label} onChange={(event) => handleOptionChange(option.id, "label", event.target.value)} className='bg-background h-10 rounded-xl text-sm' />
														</div>
														<div className='grid gap-2'>
															<Label>Value</Label>
															<Input value={option.value} onChange={(event) => handleOptionChange(option.id, "value", event.target.value)} className='bg-background h-10 rounded-xl text-sm' />
														</div>
														<Button variant='outline' className='h-8 w-fit rounded-xl px-3 text-xs' onClick={() => handleRemoveOption(option.id)}>Xóa option</Button>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className='bg-muted/30 rounded-[22px] border border-dashed border-border px-6 py-10 text-center'>
											<PencilLine className='text-primary mx-auto h-10 w-10' />
											<p className='text-foreground mt-4 text-2xl font-semibold'>Chọn một câu hỏi để chỉnh sửa</p>
											<p className='text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-7'>Nhấn nút Sửa ở cột giữa để mở thông tin cấu hình chi tiết của câu hỏi.</p>
										</div>
									)}
								</div>
							</div>
						) : (
							<div className='bg-muted/30 rounded-[22px] border border-dashed border-border px-6 py-10 text-center'>
								<PencilLine className='text-primary mx-auto h-10 w-10' />
								<p className='text-foreground mt-4 text-2xl font-semibold'>Chọn một câu hỏi để chỉnh sửa</p>
								<p className='text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-7'>Nhấn nút Sửa ở cột giữa để mở thông tin cấu hình chi tiết của câu hỏi.</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default ApplicationQuestionsPage;
