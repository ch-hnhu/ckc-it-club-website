import { type DragEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
	Eye,
	GripVertical,
	LayoutPanelLeft,
	ListFilter,
	ListOrdered,
	MoreHorizontal,
	PanelRightClose,
	PanelRightOpen,
	Plus,
	RotateCcw,
	Save,
	SquarePen,
	TextCursorInput,
	Trash2,
	Type,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getBreadcrumbsFromNavigation } from "@/config/navigation";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { cn } from "@/lib/utils";
import applicationService from "@/services/application.service";
import type {
	ApplicationQuestionOption,
	ApplicationQuestionOptionPayload,
	ApplicationQuestionPayload,
	ApplicationQuestionRecord,
	ApplicationQuestionType,
} from "@/types/application.type";

type FieldTemplate = {
	type: ApplicationQuestionType;
	label: string;
	description: string;
	icon: ReactNode;
};

type DraftQuestion = ApplicationQuestionRecord;

const fieldTemplates: FieldTemplate[] = [
	{
		type: "text",
		label: "Trả lời ngắn",
		description: "Một dòng văn bản ngắn như họ tên hoặc liên hệ.",
		icon: <TextCursorInput className='h-4 w-4' />,
	},
	{
		type: "textarea",
		label: "Đoạn văn",
		description: "Phù hợp cho mục tiêu, mô tả hoặc câu hỏi tự luận.",
		icon: <SquarePen className='h-4 w-4' />,
	},
	{
		type: "radio",
		label: "Chọn một",
		description: "Ứng viên chọn một đáp án duy nhất.",
		icon: <ListFilter className='h-4 w-4' />,
	},
	{
		type: "select",
		label: "Danh sách chọn",
		description: "Dùng khi muốn thu gọn nhiều lựa chọn vào menu thả xuống.",
		icon: <Type className='h-4 w-4' />,
	},
];

function sortQuestions(data: ApplicationQuestionRecord[]) {
	return [...data].sort((left, right) => left.order_index - right.order_index);
}

function cloneQuestion(question: ApplicationQuestionRecord): DraftQuestion {
	return {
		...question,
		options: question.options.map((option) => ({ ...option })),
	};
}

function supportsOptions(type: ApplicationQuestionType) {
	return type === "radio" || type === "select";
}

function defaultOptions(type: ApplicationQuestionType): ApplicationQuestionOptionPayload[] {
	if (!supportsOptions(type)) {
		return [];
	}

	return [
		{ value: "option_1", label: "Lựa chọn 1" },
		{ value: "option_2", label: "Lựa chọn 2" },
	];
}

function buildPayload(question: DraftQuestion): ApplicationQuestionPayload {
	const options =
		supportsOptions(question.type)
			? question.options.map((option) => ({
					id: option.id > 0 ? option.id : undefined,
					value: option.value.trim(),
					label: option.label.trim(),
				}))
			: [];

	return {
		label: question.label.trim(),
		type: question.type,
		is_required: question.is_required,
		is_active: question.is_active,
		options,
	};
}

function normalizeQuestionType(type: ApplicationQuestionType) {
	switch (type) {
		case "textarea":
			return "Đoạn văn";
		case "radio":
			return "Chọn một";
		case "select":
			return "Danh sách chọn";
		default:
			return "Trả lời ngắn";
	}
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

function validateDraft(question: DraftQuestion | null) {
	if (!question) {
		return "Chưa có câu hỏi nào được chọn.";
	}

	if (!question.label.trim()) {
		return "Nội dung câu hỏi không được để trống.";
	}

	if (supportsOptions(question.type)) {
		if (question.options.length < 2) {
			return "Câu hỏi dạng chọn phải có ít nhất 2 lựa chọn.";
		}

		const normalizedValues = question.options.map((option) => option.value.trim());
		const normalizedLabels = question.options.map((option) => option.label.trim());

		if (normalizedValues.some((value) => !value) || normalizedLabels.some((label) => !label)) {
			return "Mỗi lựa chọn phải có đủ nhãn hiển thị và giá trị lưu.";
		}

		if (new Set(normalizedValues).size !== normalizedValues.length) {
			return "Giá trị của các lựa chọn không được trùng nhau.";
		}
	}

	return null;
}

function renderQuestionPreview(
	question: ApplicationQuestionRecord,
	isSelected: boolean,
	onOptionLabelChange: (optionId: number, value: string) => void,
) {
	if (question.type === "textarea") {
		return (
			<Textarea
				readOnly
				disabled
				value=''
				placeholder='Ứng viên sẽ nhập câu trả lời dài tại đây'
				className='pointer-events-none min-h-28 rounded-2xl border-border bg-background/80 text-sm opacity-100 disabled:cursor-default disabled:opacity-100'
			/>
		);
	}

	if (question.type === "radio") {
		return (
			<div className='space-y-3'>
				{question.options.map((option) => (
					<div key={option.id} className='flex items-center gap-3 rounded-2xl border border-border bg-background/80 px-4 py-3'>
						<span className='h-4 w-4 rounded-full border border-muted-foreground/40' />
						{isSelected ? (
							<Input
								value={option.label}
								onChange={(event) => onOptionLabelChange(option.id, event.target.value)}
								className='h-9 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0'
							/>
						) : (
							<span className='text-sm text-foreground'>{option.label}</span>
						)}
					</div>
				))}
			</div>
		);
	}

	if (question.type === "select") {
		return (
			<div className='rounded-2xl border border-border bg-background/80 p-3'>
				<div className='rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground'>Chọn một mục từ danh sách</div>
				<div className='mt-3 space-y-2'>
					{question.options.map((option) => (
						<div key={option.id} className='rounded-xl bg-muted/40 px-3 py-2'>
							{isSelected ? (
								<Input
									value={option.label}
									onChange={(event) => onOptionLabelChange(option.id, event.target.value)}
									className='h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0'
								/>
							) : (
								<span className='text-sm text-foreground'>{option.label}</span>
							)}
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<Input
			readOnly
			disabled
			value=''
			placeholder='Ứng viên sẽ nhập câu trả lời tại đây'
			className='pointer-events-none h-11 rounded-2xl border-border bg-background/80 text-sm opacity-100 disabled:cursor-default disabled:opacity-100'
		/>
	);
}

function ApplicationQuestionsPage() {
	const breadcrumb = useMemo(() => getBreadcrumbsFromNavigation("/questions"), []);

	useBreadcrumb(breadcrumb);

	const navigate = useNavigate();
	const [questions, setQuestions] = useState<ApplicationQuestionRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
	const [draftQuestion, setDraftQuestion] = useState<DraftQuestion | null>(null);
	const [editorOpen, setEditorOpen] = useState(false);
	const [toolRailCollapsed, setToolRailCollapsed] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [creatingType, setCreatingType] = useState<ApplicationQuestionType | null>(null);
	const [draggingQuestionId, setDraggingQuestionId] = useState<number | null>(null);
	const [dragOverQuestionId, setDragOverQuestionId] = useState<number | null>(null);
	const [editingLabelId, setEditingLabelId] = useState<number | null>(null);

	const selectedQuestion = useMemo(
		() => questions.find((question) => question.id === selectedQuestionId) ?? null,
		[questions, selectedQuestionId],
	);

	const isDirty = useMemo(() => {
		if (!selectedQuestion || !draftQuestion) {
			return false;
		}

		return JSON.stringify(buildPayload(selectedQuestion)) !== JSON.stringify(buildPayload(draftQuestion));
	}, [draftQuestion, selectedQuestion]);

	const visibleCount = useMemo(() => questions.filter((question) => question.is_active).length, [questions]);
	const draftSupportsOptions = supportsOptions(draftQuestion?.type ?? "text");

	const displayQuestions = useMemo(() => {
		const merged = questions.map((question) =>
			draftQuestion && question.id === draftQuestion.id ? draftQuestion : question,
		);
		return sortQuestions(merged);
	}, [draftQuestion, questions]);

	const syncSelection = (nextQuestions: ApplicationQuestionRecord[], preferredId?: number | null) => {
		const resolvedId =
			preferredId && nextQuestions.some((question) => question.id === preferredId)
				? preferredId
				: nextQuestions[0]?.id ?? null;

		setQuestions(nextQuestions);
		setSelectedQuestionId(resolvedId);

		const nextSelected =
			(resolvedId ? nextQuestions.find((question) => question.id === resolvedId) : null) ?? null;
		setDraftQuestion(nextSelected ? cloneQuestion(nextSelected) : null);
	};

	const loadQuestions = async (preferredId?: number | null) => {
		try {
			setError(null);
			const data = sortQuestions(await applicationService.getQuestions());
			syncSelection(data, preferredId ?? selectedQuestionId);
		} catch (fetchError) {
			setQuestions([]);
			setSelectedQuestionId(null);
			setDraftQuestion(null);
			setEditorOpen(false);
			setError(getErrorMessage(fetchError, "Không thể tải danh sách câu hỏi ứng tuyển."));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadQuestions();
	}, []);

	const updateDraft = (updater: (question: DraftQuestion) => DraftQuestion) => {
		setDraftQuestion((prev) => (prev ? updater(prev) : prev));
	};

	const handleSelectQuestion = (questionId: number, openEditor = true) => {
		if (questionId === selectedQuestionId) {
			if (openEditor) {
				setEditorOpen(true);
			}
			return;
		}

		if (isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bỏ qua để chuyển sang câu hỏi khác?")) {
			return;
		}

		const nextQuestion = questions.find((question) => question.id === questionId) ?? null;
		setSelectedQuestionId(questionId);
		setDraftQuestion(nextQuestion ? cloneQuestion(nextQuestion) : null);
		setEditingLabelId(null);
		setEditorOpen(openEditor);
	};

	const persistQuestion = async (sourceQuestion: DraftQuestion, successMessage: string) => {
		const validationMessage = validateDraft(sourceQuestion);
		if (validationMessage) {
			toast.error(validationMessage);
			return null;
		}

		const updatedQuestion = await applicationService.updateQuestion(
			sourceQuestion.id,
			buildPayload(sourceQuestion),
		);
		const nextQuestions = sortQuestions(
			questions.map((question) => (question.id === updatedQuestion.id ? updatedQuestion : question)),
		);
		syncSelection(nextQuestions, updatedQuestion.id);
		setEditingLabelId(null);
		toast.success(successMessage);
		return updatedQuestion;
	};

	const handleSaveQuestion = async () => {
		if (!draftQuestion) {
			return;
		}

		try {
			setSaving(true);
			await persistQuestion(draftQuestion, "Đã lưu cấu hình câu hỏi.");
		} catch (saveError) {
			toast.error(getErrorMessage(saveError, "Không thể lưu câu hỏi."));
		} finally {
			setSaving(false);
		}
	};

	const handleDiscardChanges = () => {
		if (!selectedQuestion) {
			return;
		}

		setDraftQuestion(cloneQuestion(selectedQuestion));
		setEditingLabelId(null);
	};

	const handleAddField = async (template: FieldTemplate) => {
		if (isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Tạo câu hỏi mới sẽ bỏ qua phần đang sửa. Tiếp tục?")) {
			return;
		}

		try {
			setCreatingType(template.type);
			const createdQuestion = await applicationService.createQuestion({
				label: "Câu hỏi mới",
				type: template.type,
				is_required: false,
				is_active: true,
				options: defaultOptions(template.type),
			});

			const nextQuestions = sortQuestions([...questions, createdQuestion]);
			syncSelection(nextQuestions, createdQuestion.id);
			setEditorOpen(true);
			setEditingLabelId(createdQuestion.id);
			toast.success("Đã tạo câu hỏi mới.");
		} catch (createError) {
			toast.error(getErrorMessage(createError, "Không thể tạo câu hỏi mới."));
		} finally {
			setCreatingType(null);
		}
	};

	const handleQuickToggle = async (question: ApplicationQuestionRecord) => {
		const source =
			draftQuestion && question.id === draftQuestion.id ? draftQuestion : cloneQuestion(question);
		const nextDraft = { ...source, is_active: !source.is_active };

		try {
			if (draftQuestion && question.id === draftQuestion.id) {
				setDraftQuestion(nextDraft);
			}

			await persistQuestion(
				nextDraft,
				nextDraft.is_active ? "Đã hiển thị câu hỏi." : "Đã ẩn câu hỏi.",
			);
		} catch (toggleError) {
			if (draftQuestion && question.id === draftQuestion.id) {
				setDraftQuestion(source);
			}
			toast.error(getErrorMessage(toggleError, "Không thể cập nhật trạng thái hiển thị."));
		}
	};

	const handleDeleteQuestion = async (question: ApplicationQuestionRecord) => {
		if (
			!window.confirm(
				`Bạn có chắc muốn xóa câu hỏi "${question.label}"? Thao tác này không thể hoàn tác.`,
			)
		) {
			return;
		}

		try {
			setDeleting(true);
			await applicationService.deleteQuestion(question.id);

			const remainingQuestions = sortQuestions(questions.filter((item) => item.id !== question.id));
			syncSelection(remainingQuestions, remainingQuestions[0]?.id ?? null);
			setEditorOpen(false);
			setEditingLabelId(null);
			toast.success("Đã xóa câu hỏi.");
		} catch (deleteError) {
			toast.error(getErrorMessage(deleteError, "Không thể xóa câu hỏi."));
		} finally {
			setDeleting(false);
		}
	};

	const handleQuestionTypeChange = (type: ApplicationQuestionType) => {
		updateDraft((question) => ({
			...question,
			type,
			options: supportsOptions(type)
				? question.options.length > 0
					? question.options
					: defaultOptions(type).map((option, index) => ({
							id: -(index + 1),
							question_id: question.id,
							value: option.value,
							label: option.label,
						}))
				: [],
		}));
	};

	const handleOptionChange = (
		optionId: number,
		key: keyof ApplicationQuestionOption,
		value: string,
	) => {
		updateDraft((question) => ({
			...question,
			options: question.options.map((option) =>
				option.id === optionId ? { ...option, [key]: value } : option,
			),
		}));
	};

	const handleAddOption = () => {
		updateDraft((question) => ({
			...question,
			options: [
				...question.options,
				{
					id: -Date.now(),
					question_id: question.id,
					value: `option_${question.options.length + 1}`,
					label: `Lựa chọn ${question.options.length + 1}`,
				},
			],
		}));
	};

	const handleRemoveOption = (optionId: number) => {
		updateDraft((question) => ({
			...question,
			options: question.options.filter((option) => option.id !== optionId),
		}));
	};

	const handleInlineLabelCommit = async () => {
		if (!draftQuestion || !isDirty) {
			setEditingLabelId(null);
			return;
		}

		await handleSaveQuestion();
	};

	const handleDragStart = (questionId: number) => {
		if (isDirty) {
			toast.error("Hãy lưu hoặc hoàn tác thay đổi hiện tại trước khi kéo thả sắp xếp.");
			return;
		}

		setDraggingQuestionId(questionId);
		setDragOverQuestionId(questionId);
	};

	const handleDragOver = (event: DragEvent<HTMLDivElement>, questionId: number) => {
		event.preventDefault();
		if (dragOverQuestionId !== questionId) {
			setDragOverQuestionId(questionId);
		}
	};

	const handleDrop = async (targetQuestionId: number) => {
		if (!draggingQuestionId || draggingQuestionId === targetQuestionId) {
			setDraggingQuestionId(null);
			setDragOverQuestionId(null);
			return;
		}

		const currentQuestions = [...displayQuestions];
		const sourceIndex = currentQuestions.findIndex((question) => question.id === draggingQuestionId);
		const targetIndex = currentQuestions.findIndex((question) => question.id === targetQuestionId);
		if (sourceIndex < 0 || targetIndex < 0) {
			setDraggingQuestionId(null);
			setDragOverQuestionId(null);
			return;
		}

		const reorderedQuestions = [...currentQuestions];
		const [movedQuestion] = reorderedQuestions.splice(sourceIndex, 1);
		reorderedQuestions.splice(targetIndex, 0, movedQuestion);

		setQuestions(
			reorderedQuestions.map((question, index) => ({
				...question,
				order_index: index + 1,
			})),
		);

		try {
			const response = sortQuestions(
				await applicationService.reorderQuestions(reorderedQuestions.map((question) => question.id)),
			);
			syncSelection(response, selectedQuestionId);
			toast.success("Đã cập nhật thứ tự câu hỏi.");
		} catch (reorderError) {
			toast.error(getErrorMessage(reorderError, "Không thể cập nhật thứ tự câu hỏi."));
			await loadQuestions(selectedQuestionId);
		} finally {
			setDraggingQuestionId(null);
			setDragOverQuestionId(null);
		}
	};

	const builderCanvas = (
		<div className='space-y-4'>
			<div className='flex flex-col gap-3 rounded-[24px] border border-border/70 bg-background/90 p-3.5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between'>
				<div>
					<p className='text-sm font-semibold text-foreground'>Canvas biểu mẫu</p>
					<p className='text-sm text-muted-foreground'>
						Kéo thả để đổi thứ tự, nhấp trực tiếp vào nội dung để sửa, rê chuột để hiện menu thao tác.
					</p>
				</div>
				{draftQuestion ? (
					<div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center md:justify-end'>
						{isDirty ? (
							<Badge className='w-fit rounded-full bg-amber-500/10 px-3 py-1 text-amber-700 hover:bg-amber-500/10'>
								Chưa lưu
							</Badge>
						) : (
							<Badge variant='outline' className='w-fit rounded-full px-3 py-1'>
								Đồng bộ với dữ liệu hiện tại
							</Badge>
						)}
						<Button
							variant='outline'
							className='h-9 w-full justify-center rounded-xl px-3.5 text-sm sm:w-auto'
							disabled={!draftQuestion || !isDirty || saving}
							onClick={handleDiscardChanges}>
							<RotateCcw className='h-4 w-4' />
							Hoàn tác
						</Button>
						<Button
							className='h-9 w-full justify-center rounded-xl px-3.5 text-sm sm:w-auto'
							disabled={!draftQuestion || !isDirty || saving}
							onClick={() => void handleSaveQuestion()}>
							<Save className='h-4 w-4' />
							{saving ? "Đang lưu..." : "Lưu thay đổi"}
						</Button>
					</div>
				) : null}
			</div>

			{loading ? (
				<div className='space-y-4'>
					<Skeleton className='h-40 w-full rounded-[24px]' />
					<Skeleton className='h-40 w-full rounded-[24px]' />
					<Skeleton className='h-40 w-full rounded-[24px]' />
				</div>
			) : error ? (
				<Card className='rounded-[24px] border-destructive/20 bg-destructive/5 shadow-sm'>
					<CardContent className='px-6 py-8'>
						<p className='text-base font-semibold text-destructive'>Không tải được dữ liệu câu hỏi.</p>
						<p className='mt-2 text-sm leading-6 text-destructive/80'>{error}</p>
						<Button
							variant='outline'
							className='mt-4 rounded-xl'
							onClick={() => {
								setLoading(true);
								void loadQuestions();
							}}>
							Tải lại
						</Button>
					</CardContent>
				</Card>
			) : displayQuestions.length > 0 ? (
				<div className='space-y-4'>
					{displayQuestions.map((question) => {
						const isSelected = selectedQuestionId === question.id;
						const isEditingLabel = editingLabelId === question.id && isSelected;
						const hasAnswers = question.answers_count > 0;

						return (
							<div
								key={question.id}
								draggable
								onDragStart={() => handleDragStart(question.id)}
								onDragOver={(event) => handleDragOver(event, question.id)}
								onDrop={() => void handleDrop(question.id)}
								onDragEnd={() => {
									setDraggingQuestionId(null);
									setDragOverQuestionId(null);
								}}
								className={cn(
									"group relative overflow-hidden rounded-[24px] border bg-background/95 shadow-sm transition-all",
									isSelected
										? "border-primary/40 ring-1 ring-primary/20"
										: "border-border/70 hover:border-primary/20",
									draggingQuestionId === question.id && "opacity-70",
									dragOverQuestionId === question.id && "border-primary bg-primary/5",
									!question.is_active && "opacity-70",
								)}>
								<div className='absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500/55 via-lime-400/45 to-sky-200/35' />

								<div className='flex gap-3 px-4 py-4 md:px-5 md:py-5'>
									<button
										type='button'
										className='mt-1 flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground transition group-hover:border-primary/30 group-hover:text-primary active:cursor-grabbing'
										title='Kéo để thay đổi thứ tự'
										onClick={(event) => event.preventDefault()}>
										<GripVertical className='h-4 w-4' />
									</button>

									<div className='min-w-0 flex-1'>
										<div className='flex flex-wrap items-start justify-between gap-3'>
											<div className='flex flex-wrap items-center gap-2'>
												<Badge variant='outline' className='rounded-full bg-background px-3 py-1 text-xs'>
													Thứ tự {question.order_index}
												</Badge>
												<Badge variant='secondary' className='rounded-full px-3 py-1 text-xs'>
													{normalizeQuestionType(question.type)}
												</Badge>
												{question.is_required ? (
													<Badge className='rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10'>
														Bắt buộc
													</Badge>
												) : null}
												{hasAnswers ? (
													<Badge variant='outline' className='rounded-full px-3 py-1 text-xs'>
														{question.answers_count} phản hồi
													</Badge>
												) : null}
												{!question.is_active ? (
													<Badge variant='outline' className='rounded-full px-3 py-1 text-xs'>
														Đang ẩn
													</Badge>
												) : null}
											</div>

											<div className='flex items-center gap-1 rounded-full border border-border/80 bg-background/95 p-1 opacity-100 shadow-sm transition md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100'>
												<Button
													variant='ghost'
													size='icon'
													className='h-8 w-8 rounded-full'
													title='Mở bảng cấu hình'
													onClick={() => handleSelectQuestion(question.id, true)}>
													<MoreHorizontal className='h-4 w-4' />
												</Button>
												<Button
													variant='ghost'
													size='icon'
													className='h-8 w-8 rounded-full'
													title={question.is_active ? "Ẩn câu hỏi" : "Hiện câu hỏi"}
													onClick={() => void handleQuickToggle(question)}>
													<Eye className='h-4 w-4' />
												</Button>
												<Button
													variant='ghost'
													size='icon'
													className='h-8 w-8 rounded-full text-destructive hover:text-destructive'
													title='Xóa câu hỏi'
													disabled={hasAnswers || deleting}
													onClick={() => void handleDeleteQuestion(question)}>
													<Trash2 className='h-4 w-4' />
												</Button>
											</div>
										</div>

										<div
											role='button'
											tabIndex={0}
											className='mt-4 cursor-text outline-none'
											onClick={() => {
												handleSelectQuestion(question.id, true);
												setEditingLabelId(question.id);
											}}
											onKeyDown={(event) => {
												if (event.key === "Enter" || event.key === " ") {
													event.preventDefault();
													handleSelectQuestion(question.id, true);
													setEditingLabelId(question.id);
												}
											}}>
											{isEditingLabel ? (
												<Input
													autoFocus
													value={question.label}
													onChange={(event) =>
														updateDraft((current) => ({
															...current,
															label: event.target.value,
														}))
													}
													onBlur={() => void handleInlineLabelCommit()}
													onKeyDown={(event) => {
														if (event.key === "Enter") {
															event.preventDefault();
															void handleInlineLabelCommit();
														}
														if (event.key === "Escape") {
															event.preventDefault();
															setEditingLabelId(null);
															handleDiscardChanges();
														}
													}}
													className='h-auto border-0 bg-transparent px-0 text-[1.45rem] font-semibold leading-tight shadow-none focus-visible:ring-0 md:text-[1.7rem]'
												/>
											) : (
												<h3 className='text-xl font-semibold leading-tight text-foreground md:text-[1.65rem]'>
													{question.label}
													{question.is_required ? (
														<span className='ml-2 text-destructive'>*</span>
													) : null}
												</h3>
											)}
										</div>

										<div className='mt-5' onClick={() => handleSelectQuestion(question.id, true)}>
											{renderQuestionPreview(question, isSelected, (optionId, value) =>
												handleOptionChange(optionId, "label", value),
											)}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<Card className='rounded-[24px] border-dashed border-border bg-background/80 shadow-sm'>
					<CardContent className='px-8 py-12 text-center'>
						<ListOrdered className='mx-auto h-9 w-9 text-primary' />
						<p className='mt-4 text-2xl font-semibold text-foreground'>Chưa có câu hỏi nào</p>
						<p className='mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground'>
							Chọn một loại trường ở thanh bên trái để tạo câu hỏi đầu tiên cho biểu mẫu ứng tuyển.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);

	const contextualSidebar = (
		<Sheet open={editorOpen && !!draftQuestion} onOpenChange={setEditorOpen}>
			<SheetContent side='right' className='w-full border-l border-border bg-background/98 sm:max-w-lg'>
				{draftQuestion ? (
					<>
						<SheetHeader className='border-b border-border px-6 py-5'>
							<div className='pr-8'>
								<SheetTitle className='text-xl'>Cấu hình câu hỏi đang chọn</SheetTitle>
								<SheetDescription className='mt-2 leading-6'>
									Thanh bên này chỉ chứa thiết lập ngữ cảnh: loại trường, ràng buộc và dữ liệu lựa chọn.
								</SheetDescription>
							</div>
							<div className='mt-4 flex flex-wrap items-center gap-2'>
								<Badge variant='outline' className='rounded-full px-3 py-1'>
									ID #{draftQuestion.id}
								</Badge>
								<Badge variant='secondary' className='rounded-full px-3 py-1'>
									{normalizeQuestionType(draftQuestion.type)}
								</Badge>
								{draftQuestion.answers_count > 0 ? (
									<Badge variant='outline' className='rounded-full px-3 py-1'>
										{draftQuestion.answers_count} phản hồi
									</Badge>
								) : null}
							</div>
						</SheetHeader>

						<div className='flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6'>
							<div className='grid gap-2'>
								<Label htmlFor='question-label'>Tên câu hỏi</Label>
								<Input
									id='question-label'
									value={draftQuestion.label}
									onChange={(event) =>
										updateDraft((question) => ({ ...question, label: event.target.value }))
									}
									className='h-10 rounded-xl text-sm'
								/>
								<p className='text-xs leading-5 text-muted-foreground'>
									Nội dung này sẽ hiển thị trực tiếp ở canvas biểu mẫu và trên form ứng tuyển.
								</p>
							</div>

							<div className='grid gap-2'>
								<Label htmlFor='question-type'>Loại trường</Label>
								<Select
									value={draftQuestion.type}
									onValueChange={(value) => handleQuestionTypeChange(value as ApplicationQuestionType)}
									disabled={draftQuestion.answers_count > 0}>
									<SelectTrigger id='question-type' className='h-10 rounded-xl text-sm'>
										<SelectValue placeholder='Chọn loại trường' />
									</SelectTrigger>
									<SelectContent>
										{fieldTemplates.map((template) => (
											<SelectItem key={template.type} value={template.type}>
												{template.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{draftQuestion.answers_count > 0 ? (
									<p className='text-xs leading-5 text-muted-foreground'>
										Câu hỏi đã có phản hồi nên không thể đổi loại để tránh sai lệch dữ liệu cũ.
									</p>
								) : null}
							</div>

							<div className='grid gap-3 rounded-[20px] border border-border bg-muted/30 p-4'>
								<div className='flex items-center justify-between gap-4'>
									<div>
										<p className='text-sm font-semibold text-foreground'>Bắt buộc trả lời</p>
										<p className='text-xs leading-5 text-muted-foreground'>
											Ứng viên phải điền câu hỏi này trước khi nộp form.
										</p>
									</div>
									<Switch
										checked={draftQuestion.is_required}
										onCheckedChange={(checked) =>
											updateDraft((question) => ({ ...question, is_required: checked }))
										}
									/>
								</div>

								<div className='flex items-center justify-between gap-4'>
									<div>
										<p className='text-sm font-semibold text-foreground'>Hiển thị trên form</p>
										<p className='text-xs leading-5 text-muted-foreground'>
											Tắt nếu muốn ẩn câu hỏi khỏi biểu mẫu nhưng vẫn giữ dữ liệu.
										</p>
									</div>
									<Switch
										checked={draftQuestion.is_active}
										onCheckedChange={(checked) =>
											updateDraft((question) => ({ ...question, is_active: checked }))
										}
									/>
								</div>
							</div>

							<div className='grid gap-2'>
								<Label htmlFor='question-summary'>Tóm tắt cấu hình</Label>
								<Textarea
									id='question-summary'
									readOnly
									value={`Thứ tự hiển thị: ${draftQuestion.order_index}\nLoại trường: ${normalizeQuestionType(
										draftQuestion.type,
									)}\nSố lựa chọn: ${draftQuestion.options.length}\nSố phản hồi đã ghi nhận: ${draftQuestion.answers_count}`}
									className='min-h-24 rounded-xl bg-muted/30 text-sm leading-6'
								/>
							</div>

							{draftSupportsOptions ? (
								<div className='space-y-3'>
									<div className='flex items-center justify-between gap-3'>
										<div>
											<p className='text-sm font-semibold text-foreground'>Danh sách lựa chọn</p>
											<p className='text-xs leading-5 text-muted-foreground'>
												Áp dụng cho dạng chọn một và danh sách chọn.
											</p>
										</div>
										<Button
											variant='outline'
											className='h-8 rounded-xl px-3 text-xs'
											onClick={handleAddOption}
											disabled={!draftSupportsOptions}>
											<Plus className='h-4 w-4' />
											Thêm
										</Button>
									</div>

									<div className='space-y-3'>
										{draftQuestion.options.map((option) => (
											<div key={option.id} className='rounded-[20px] border border-border bg-background p-4 shadow-sm'>
												<div className='grid gap-3'>
													<div className='grid gap-2'>
														<Label>Nhãn hiển thị</Label>
														<Input
															value={option.label}
															onChange={(event) => handleOptionChange(option.id, 'label', event.target.value)}
															className='h-10 rounded-xl'
														/>
													</div>
													<div className='grid gap-2'>
														<Label>Giá trị lưu</Label>
														<Input
															value={option.value}
															onChange={(event) => handleOptionChange(option.id, 'value', event.target.value)}
															className='h-10 rounded-xl'
														/>
													</div>
													<Button
														variant='outline'
														className='h-8 w-fit rounded-xl px-3 text-xs text-destructive hover:text-destructive'
														onClick={() => handleRemoveOption(option.id)}>
														<Trash2 className='h-4 w-4' />
														Xóa lựa chọn
													</Button>
												</div>
											</div>
										))}
									</div>
								</div>
							) : null}
						</div>

						<SheetFooter className='border-t border-border bg-background px-6 py-4'>
							<div className='flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
								<Button
									variant='outline'
									className='h-10 rounded-2xl text-destructive hover:text-destructive'
									disabled={deleting || draftQuestion.answers_count > 0}
									onClick={() => void handleDeleteQuestion(draftQuestion)}>
									<Trash2 className='h-4 w-4' />
									{deleting ? "Đang xóa..." : "Xóa câu hỏi"}
								</Button>
								<div className='flex gap-2'>
									<Button
										variant='outline'
										className='h-10 rounded-2xl px-4'
										disabled={!isDirty || saving}
										onClick={handleDiscardChanges}>
										<RotateCcw className='h-4 w-4' />
										Hoàn tác
									</Button>
									<Button
										className='h-10 rounded-2xl px-4'
										disabled={!isDirty || saving}
										onClick={() => void handleSaveQuestion()}>
										<Save className='h-4 w-4' />
										{saving ? "Đang lưu..." : "Lưu thay đổi"}
									</Button>
								</div>
							</div>
							{draftQuestion.answers_count > 0 ? (
								<p className='text-xs leading-5 text-muted-foreground'>
									Câu hỏi này đã có phản hồi nên không thể xóa cứng. Nếu không muốn dùng nữa, hãy chuyển về trạng thái ẩn.
								</p>
							) : null}
						</SheetFooter>
					</>
				) : null}
			</SheetContent>
		</Sheet>
	);

	return (
		<div className='min-h-full bg-background'>
			<div className='border-b border-border/70 bg-background/90 px-4 py-4 backdrop-blur md:px-6 md:py-5 lg:px-8'>
				<div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
					<div>
						<p className='text-primary text-[11px] font-semibold uppercase tracking-[0.28em]'>Tuyển thành viên</p>
						<h1 className='mt-2 text-foreground text-[2rem] font-semibold tracking-tight md:text-[3rem] md:leading-[1.08]'>
							Form Builder câu hỏi ứng tuyển
						</h1>
						<p className='mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-[15px]'>
							Khu vực trung tâm hiển thị đúng ngữ cảnh form, hỗ trợ kéo thả sắp xếp và chỉnh sửa trực tiếp.
							Thanh cấu hình chỉ mở khi cần để giữ vùng làm việc chính luôn thoáng.
						</p>
					</div>

					<div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center'>
						<div className='rounded-full border border-border bg-background px-4 py-2 text-center text-sm font-semibold shadow-sm'>
							{visibleCount} câu hỏi đang hiển thị
						</div>
						{selectedQuestion ? (
							<Button
								variant='outline'
								className='h-9 w-full justify-center rounded-xl border-border bg-background px-3.5 text-sm shadow-sm sm:w-auto'
								onClick={() => navigate(`/questions/${selectedQuestion.id}`)}>
								<Eye className='h-4 w-4' />
								Xem chi tiết
							</Button>
						) : null}
						<Button
							variant='outline'
							className='hidden h-9 rounded-xl border-border bg-background px-3.5 text-sm shadow-sm lg:inline-flex'
							onClick={() => setToolRailCollapsed((prev) => !prev)}>
							<LayoutPanelLeft className='h-4 w-4' />
							{toolRailCollapsed ? "Mở thư viện trường" : "Thu gọn thư viện"}
						</Button>
					</div>
				</div>
			</div>

			<div className='grid min-h-[calc(100vh-10rem)] items-start gap-4 p-4 md:p-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:px-8'>
				<Card
					className={cn(
						"h-fit rounded-[24px] border-border/70 bg-background/90 shadow-lg backdrop-blur lg:sticky lg:top-4",
						toolRailCollapsed ? "w-full lg:w-[88px]" : "w-full lg:w-[280px]",
					)}>
					<CardContent className='p-3'>
						<div className='mb-3 flex items-center justify-between gap-2 px-2 pt-2'>
							<div className={cn("space-y-1", toolRailCollapsed && "hidden")}>
								<p className='text-sm font-semibold text-foreground'>Loại trường</p>
								<p className='text-xs leading-5 text-muted-foreground'>Thêm câu hỏi mới trực tiếp từ thư viện.</p>
							</div>
							<Button
								variant='ghost'
								size='icon'
								className='hidden h-8 w-8 rounded-xl lg:inline-flex'
								onClick={() => setToolRailCollapsed((prev) => !prev)}>
								{toolRailCollapsed ? <PanelRightOpen className='h-4 w-4' /> : <PanelRightClose className='h-4 w-4' />}
							</Button>
						</div>

						<div className='space-y-2'>
							{fieldTemplates.map((template) => (
								<button
									key={template.type}
									type='button'
									title={template.label}
									onClick={() => void handleAddField(template)}
									disabled={creatingType !== null}
									className={cn(
										"group flex w-full items-start gap-3 rounded-[18px] border border-border bg-background px-3 py-2.5 text-left shadow-sm transition hover:border-primary/30 hover:bg-primary/5 disabled:opacity-60",
										toolRailCollapsed && "justify-center px-0",
									)}>
									<div className='rounded-xl border border-border bg-muted/60 p-2.5 text-primary shadow-sm'>
										{template.icon}
									</div>
									<div className={cn("min-w-0 flex-1", toolRailCollapsed && "hidden")}>
										<p className='text-sm font-semibold text-foreground'>{template.label}</p>
										<p className='mt-1 text-xs leading-5 text-muted-foreground'>
											{creatingType === template.type ? "Đang tạo câu hỏi..." : template.description}
										</p>
									</div>
									{toolRailCollapsed ? null : <Plus className='mt-1 h-4 w-4 text-muted-foreground' />}
								</button>
							))}
						</div>
					</CardContent>
				</Card>

				{builderCanvas}
			</div>

			{contextualSidebar}
		</div>
	);
}

export default ApplicationQuestionsPage;
