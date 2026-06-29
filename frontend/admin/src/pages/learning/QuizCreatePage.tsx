import { Fragment, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
	ArrowLeft,
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	CircleDot,
	CircleX,
	Copy,
	Eye,
	FilePen,
	Lightbulb,
	ImagePlus,
	LayoutGrid,
	ListChecks,
	Link2,
	Rows3,
	Plus,
	Save,
	Send,
	TextCursorInput,
	Trash2,
	X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { cn } from "@/lib/utils";
import courseService, { type QuizQuestionDTO, type QuizOptionDTO } from "@/services/course.service";

type QuizQuestionType =
	| "multiple_choice"
	| "multiple_select"
	| "fill_blank"
	| "matching"
	| "word_bank_fill_blank"
	| "word_order";

type PersistedQuestionType = QuizQuestionType;

type QuestionOptionMetadata = {
	side?: "left" | "right";
	pairId?: string;
	slot_index?: number;
};

type QuizOption = {
	id: string;
	content: string;
	isCorrect: boolean;
	image: string | null;
	metadata?: QuestionOptionMetadata;
};

type QuizQuestion = {
	id: string;
	type: QuizQuestionType;
	persistedType: PersistedQuestionType;
	content: string;
	explanation: string;
	image: string | null;
	options: QuizOption[];
};

const questionTypeOptions: Array<{
	type: QuizQuestionType;
	label: string;
	description: string;
}> = [
	{
		type: "multiple_choice",
		label: "Chọn một đáp án",
		description: "Học viên chọn một phương án đúng.",
	},
	{
		type: "multiple_select",
		label: "Chọn nhiều đáp án",
		description: "Có thể có nhiều phương án đúng.",
	},
	{
		type: "fill_blank",
		label: "Điền vào chỗ trống",
		description: "Học viên nhập câu trả lời ngắn.",
	},
	{
		type: "word_bank_fill_blank",
		label: "Chọn từ điền vào chỗ trống",
		description: "Học viên chọn từ trong bank để điền vào ___.",
	},
	{
		type: "matching",
		label: "Ghép cặp",
		description: "Nối mỗi mục với cặp phù hợp.",
	},
	{
		type: "word_order",
		label: "Sắp xếp",
		description: "Chọn từ trong bank theo đúng thứ tự để tạo câu.",
	},
];

function createId(prefix: "question" | "option"): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function createOptions(type: QuizQuestionType): QuizOption[] {
	if (type === "fill_blank") {
		return [{ id: createId("option"), content: "", isCorrect: true, image: null }];
	}

	if (type === "word_bank_fill_blank") {
		return [
			{
				id: createId("option"),
				content: "",
				isCorrect: true,
				image: null,
				metadata: { slot_index: 0 },
			},
			{ id: createId("option"), content: "", isCorrect: false, image: null },
			{ id: createId("option"), content: "", isCorrect: false, image: null },
		];
	}

	if (type === "word_order") {
		return [
			{
				id: createId("option"),
				content: "",
				isCorrect: true,
				image: null,
				metadata: { slot_index: 0 },
			},
			{
				id: createId("option"),
				content: "",
				isCorrect: true,
				image: null,
				metadata: { slot_index: 1 },
			},
			{ id: createId("option"), content: "", isCorrect: false, image: null },
			{ id: createId("option"), content: "", isCorrect: false, image: null },
		];
	}

	if (type === "matching") return createMatchingPair();

	return [
		{ id: createId("option"), content: "", isCorrect: true, image: null },
		{ id: createId("option"), content: "", isCorrect: false, image: null },
	];
}

function createMatchingPair(): QuizOption[] {
	const pairId = `pair-${Math.random().toString(36).slice(2, 9)}`;
	return [
		{
			id: createId("option"),
			content: "",
			isCorrect: false,
			image: null,
			metadata: { side: "left", pairId },
		},
		{
			id: createId("option"),
			content: "",
			isCorrect: false,
			image: null,
			metadata: { side: "right", pairId },
		},
	];
}

function createQuestion(type: QuizQuestionType = "multiple_choice"): QuizQuestion {
	return {
		id: createId("question"),
		type,
		persistedType: getPersistedQuestionType(type),
		content: "",
		explanation: "",
		image: null,
		options: createOptions(type),
	};
}

const initialQuestions: QuizQuestion[] = [
	{
		id: "question-1",
		type: "multiple_choice",
		persistedType: "multiple_choice",
		content: "HTML là viết tắt của cụm từ nào?",
		explanation: "HTML là ngôn ngữ đánh dấu dùng để mô tả cấu trúc nội dung của một trang web.",
		image: null,
		options: [
			{ id: "option-1", content: "HyperText Markup Language", isCorrect: true, image: null },
			{ id: "option-2", content: "HighText Machine Language", isCorrect: false, image: null },
			{
				id: "option-3",
				content: "HyperTransfer Markup Language",
				isCorrect: false,
				image: null,
			},
		],
	},
];

function getPersistedQuestionType(type: QuizQuestionType): PersistedQuestionType {
	return type;
}

const KNOWN_UI_TYPES: QuizQuestionType[] = [
	"multiple_choice",
	"multiple_select",
	"fill_blank",
	"matching",
	"word_bank_fill_blank",
	"word_order",
];

/** State câu hỏi trên trình tạo → payload gửi backend. */
function toQuestionPayload(question: QuizQuestion): QuizQuestionDTO {
	return {
		type: question.persistedType,
		ui_type: question.type,
		content: question.content,
		explanation: question.explanation.trim() ? question.explanation : null,
		image: question.image,
		options: question.options.map<QuizOptionDTO>((option) => ({
			content: option.content,
			is_correct: option.isCorrect,
			image: option.image,
			metadata: option.metadata ? { ...option.metadata } : null,
		})),
	};
}

/** Payload backend → state câu hỏi để prefill trình tạo. */
function fromQuestionDTO(dto: QuizQuestionDTO): QuizQuestion {
	const uiType = (
		dto.ui_type && KNOWN_UI_TYPES.includes(dto.ui_type as QuizQuestionType)
			? dto.ui_type
			: dto.type
	) as QuizQuestionType;

	return {
		id: createId("question"),
		type: uiType,
		persistedType: getPersistedQuestionType(uiType),
		content: dto.content ?? "",
		explanation: dto.explanation ?? "",
		image: dto.image ?? null,
		options: dto.options.map((option) => ({
			id: createId("option"),
			content: option.content ?? "",
			isCorrect: option.is_correct,
			image: option.image ?? null,
			metadata: (option.metadata as QuizOption["metadata"]) ?? undefined,
		})),
	};
}

function getQuestionTypeLabel(type: QuizQuestionType) {
	return questionTypeOptions.find((item) => item.type === type)?.label ?? "Câu hỏi";
}

function QuestionTypeIcon({ type, className }: { type: QuizQuestionType; className?: string }) {
	if (type === "multiple_select") return <ListChecks className={className} />;
	if (type === "fill_blank") return <TextCursorInput className={className} />;
	if (type === "word_bank_fill_blank") return <LayoutGrid className={className} />;
	if (type === "word_order") return <Rows3 className={className} />;
	if (type === "matching") return <Link2 className={className} />;
	return <CircleDot className={className} />;
}

function isChoiceQuestion(type: QuizQuestionType) {
	return type === "multiple_choice" || type === "multiple_select";
}

function requiredOptions(type: QuizQuestionType) {
	if (type === "fill_blank") return 1;
	if (type === "word_bank_fill_blank") return 1;
	if (type === "word_order") return 2;
	return 2;
}

/** Một phương án được coi là "đã nhập" nếu có nội dung chữ hoặc ảnh. */
function isOptionFilled(option: QuizOption): boolean {
	return option.content.trim() !== "" || Boolean(option.image);
}

/**
 * Kiểm tra một câu hỏi đã đủ điều kiện xuất bản chưa.
 * Trả về null nếu hợp lệ, hoặc lý do (tiếng Việt) nếu chưa hợp lệ.
 */
function describeInvalidQuestion(question: QuizQuestion): string | null {
	if (!question.content.trim()) return "chưa có nội dung câu hỏi";

	switch (question.type) {
		case "fill_blank":
			return question.options.some((o) => o.content.trim()) ? null : "chưa nhập đáp án đúng";

		case "word_bank_fill_blank": {
			const blankCount = (question.content.match(/___/g) || []).length;
			const correct = question.options.filter((o) => o.isCorrect);
			if (blankCount === 0) return "chưa có chỗ trống (gõ ___ vào nội dung)";
			if (correct.length !== blankCount) return "số đáp án đúng chưa khớp số chỗ trống";
			if (correct.some((o) => !o.content.trim())) return "đáp án cho chỗ trống còn để trống";
			return null;
		}

		case "matching":
			return question.options.some((o) => !isOptionFilled(o))
				? "còn cặp ghép chưa nhập đủ nội dung"
				: null;

		case "word_order":
			return question.options.some((o) => !isOptionFilled(o))
				? "còn mục chưa nhập nội dung"
				: null;

		default: // multiple_choice, multiple_select
			if (question.options.some((o) => !isOptionFilled(o)))
				return "còn phương án chưa nhập nội dung";
			if (!question.options.some((o) => o.isCorrect)) return "chưa chọn đáp án đúng";
			return null;
	}
}

function QuizCreatePage() {
	const navigate = useNavigate();
	const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();

	const [courseTitle, setCourseTitle] = useState<string>("");
	const [lessonTitle, setLessonTitle] = useState<string>("");

	useBreadcrumb([
		{ title: "Khoá học", link: "/courses" },
		{
			title: courseTitle || (courseId ? `Khoá học: #${courseId}` : "Khóa học chưa xác định"),
			link: courseId ? `/courses/${courseId}` : undefined,
		},
		{
			title: lessonTitle || (lessonId ? `Buổi #${lessonId}` : "Buổi học chưa xác định"),
			link: lessonId ? `/courses/${courseId}/lessons/${lessonId}` : undefined,
		},
		{ title: "Tạo quiz" },
	]);

	const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
	const [activeQuestionId, setActiveQuestionId] = useState(initialQuestions[0].id);
	const [newQuestionType, setNewQuestionType] = useState<QuizQuestionType>("multiple_choice");
	const [previewAnswer, setPreviewAnswer] = useState<string[]>([]);
	const [previewTextAnswer, setPreviewTextAnswer] = useState("");
	const [previewChecked, setPreviewChecked] = useState(false);
	const [wordBankPlacements, setWordBankPlacements] = useState<(string | null)[]>([]);
	const [wordOrderPlacements, setWordOrderPlacements] = useState<string[]>([]);
	const [imageTarget, setImageTarget] = useState<{
		questionId: string;
		optionId?: string;
	} | null>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const [matchingSelected, setMatchingSelected] = useState<{
		side: "left" | "right";
		optionId: string;
	} | null>(null);
	const [matchingMatched, setMatchingMatched] = useState<Set<string>>(new Set());
	const [matchingWrong, setMatchingWrong] = useState<{ leftId: string; rightId: string } | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// Prefill nội dung quiz đã lưu (nếu có) khi mở trình tạo.
	useEffect(() => {
		if (!courseId || !lessonId) {
			setIsLoading(false);
			return;
		}

		let cancelled = false;
		(async () => {
			try {
				const [quizRes, courseRes] = await Promise.all([
					courseService.getQuiz(courseId, Number(lessonId)),
					courseService.getCourse(courseId),
				]);

				if (cancelled) return;

				if (courseRes.data) {
					setCourseTitle(courseRes.data.title);
					const lesson = courseRes.data.lessons?.find((l) => l.id === Number(lessonId));
					if (lesson) {
						setLessonTitle(lesson.title);
					}
				}

				const loaded = quizRes.data?.questions?.map(fromQuestionDTO) ?? [];
				if (loaded.length > 0) {
					setQuestions(loaded);
					setActiveQuestionId(loaded[0].id);
				}
			} catch {
				if (!cancelled) {
					toast.error("Không tải được thông tin khóa học hoặc quiz của buổi học.", {
						position: "top-right",
					});
				}
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [courseId, lessonId]);

	const activeQuestionIndex = questions.findIndex((question) => question.id === activeQuestionId);
	const activeQuestion = questions[activeQuestionIndex] ?? questions[0];

	const wordBankBlankCount = useMemo(
		() =>
			activeQuestion?.type === "word_bank_fill_blank"
				? (activeQuestion.content.match(/___/g) || []).length
				: 0,
		[activeQuestion?.type, activeQuestion?.content],
	);

	const wordBankCorrectOptions = useMemo(
		() =>
			activeQuestion?.type === "word_bank_fill_blank"
				? activeQuestion.options
						.filter((o) => o.isCorrect)
						.sort(
							(a, b) => (a.metadata?.slot_index ?? 0) - (b.metadata?.slot_index ?? 0),
						)
				: [],
		[activeQuestion?.type, activeQuestion?.options],
	);

	const wordBankDistractors = useMemo(
		() =>
			activeQuestion?.type === "word_bank_fill_blank"
				? activeQuestion.options.filter((o) => !o.isCorrect)
				: [],
		[activeQuestion?.type, activeQuestion?.options],
	);

	const shuffledWordBankOptionIds = useMemo(
		() =>
			activeQuestion?.type === "word_bank_fill_blank"
				? [...activeQuestion.options].sort(() => Math.random() - 0.5).map((o) => o.id)
				: [],
		// Re-shuffle only when question changes or options are added/removed, not on content edits
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[activeQuestion?.id, activeQuestion?.type, activeQuestion?.options.length],
	);

	const wordOrderCorrectOptions = useMemo(
		() =>
			activeQuestion?.type === "word_order"
				? activeQuestion.options
						.filter((o) => o.isCorrect)
						.sort(
							(a, b) => (a.metadata?.slot_index ?? 0) - (b.metadata?.slot_index ?? 0),
						)
				: [],
		[activeQuestion?.type, activeQuestion?.options],
	);

	const wordOrderDistractors = useMemo(
		() =>
			activeQuestion?.type === "word_order"
				? activeQuestion.options.filter((o) => !o.isCorrect)
				: [],
		[activeQuestion?.type, activeQuestion?.options],
	);

	const shuffledWordOrderOptionIds = useMemo(
		() =>
			activeQuestion?.type === "word_order"
				? [...activeQuestion.options].sort(() => Math.random() - 0.5).map((o) => o.id)
				: [],
		// Re-shuffle only when question changes or options are added/removed, not on content edits
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[activeQuestion?.id, activeQuestion?.type, activeQuestion?.options.length],
	);

	const previewIsCorrect = useMemo(() => {
		if (!activeQuestion) return false;

		if (activeQuestion.type === "matching") {
			const totalPairs = activeQuestion.options.filter(
				(o) => o.metadata?.side === "left",
			).length;
			return matchingMatched.size === totalPairs && totalPairs > 0;
		}

		if (activeQuestion.type === "fill_blank") {
			const normalizedAnswer = previewTextAnswer.trim().toLocaleLowerCase();
			return activeQuestion.options.some(
				(option) => option.content.trim().toLocaleLowerCase() === normalizedAnswer,
			);
		}

		if (activeQuestion.type === "word_bank_fill_blank") {
			if (wordBankBlankCount === 0 || wordBankCorrectOptions.length === 0) return false;
			return wordBankCorrectOptions.every((opt, i) => wordBankPlacements[i] === opt.id);
		}

		if (activeQuestion.type === "word_order") {
			const correctIds = wordOrderCorrectOptions.map((o) => o.id);
			return (
				correctIds.length > 0 &&
				wordOrderPlacements.length === correctIds.length &&
				correctIds.every((id, i) => wordOrderPlacements[i] === id)
			);
		}

		const correctOptionIds = activeQuestion.options
			.filter((option) => option.isCorrect)
			.map((option) => option.id);

		return (
			correctOptionIds.length > 0 &&
			correctOptionIds.length === previewAnswer.length &&
			correctOptionIds.every((optionId) => previewAnswer.includes(optionId))
		);
	}, [
		activeQuestion,
		previewAnswer,
		previewTextAnswer,
		matchingMatched,
		wordBankPlacements,
		wordBankBlankCount,
		wordBankCorrectOptions,
		wordOrderPlacements,
		wordOrderCorrectOptions,
	]);

	const wordBankAllFilled =
		activeQuestion?.type === "word_bank_fill_blank" &&
		wordBankBlankCount > 0 &&
		Array.from({ length: wordBankBlankCount }, (_, i) => wordBankPlacements[i]).every(Boolean);

	const hasPreviewAnswer =
		activeQuestion?.type === "fill_blank"
			? Boolean(previewTextAnswer.trim())
			: activeQuestion?.type === "word_bank_fill_blank"
				? wordBankAllFilled
				: activeQuestion?.type === "word_order"
					? wordOrderPlacements.length > 0
					: previewAnswer.length > 0;

	const resetPreview = () => {
		setPreviewAnswer([]);
		setPreviewTextAnswer("");
		setPreviewChecked(false);
		setMatchingSelected(null);
		setMatchingMatched(new Set());
		setMatchingWrong(null);
		setWordBankPlacements([]);
		setWordOrderPlacements([]);
	};

	const shuffledMatchingLeftIds = useMemo(
		() =>
			activeQuestion?.type === "matching"
				? activeQuestion.options
						.filter((o) => o.metadata?.side === "left")
						.map((o) => o.id)
						.sort(() => Math.random() - 0.5)
				: [],
		// re-shuffle on question/type change or when pairs are added/removed
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[activeQuestion?.id, activeQuestion?.type, activeQuestion?.options.length],
	);

	const shuffledMatchingRightIds = useMemo(
		() =>
			activeQuestion?.type === "matching"
				? activeQuestion.options
						.filter((o) => o.metadata?.side === "right")
						.map((o) => o.id)
						.sort(() => Math.random() - 0.5)
				: [],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[activeQuestion?.id, activeQuestion?.type, activeQuestion?.options.length],
	);

	const handleMatchingSelect = (side: "left" | "right", optionId: string) => {
		if (!activeQuestion) return;
		const option = activeQuestion.options.find((o) => o.id === optionId);
		const pairId = option?.metadata?.pairId;
		if (!pairId || matchingMatched.has(pairId)) return;

		if (!matchingSelected) {
			setMatchingSelected({ side, optionId });
			return;
		}

		if (matchingSelected.side === side) {
			setMatchingSelected(optionId === matchingSelected.optionId ? null : { side, optionId });
			return;
		}

		const leftId = side === "left" ? optionId : matchingSelected.optionId;
		const rightId = side === "right" ? optionId : matchingSelected.optionId;
		const leftOpt = activeQuestion.options.find((o) => o.id === leftId);
		const rightOpt = activeQuestion.options.find((o) => o.id === rightId);

		if (leftOpt?.metadata?.pairId && leftOpt.metadata.pairId === rightOpt?.metadata?.pairId) {
			const next = new Set(matchingMatched);
			next.add(leftOpt.metadata.pairId);
			setMatchingMatched(next);
			setMatchingSelected(null);
			const totalPairs = activeQuestion.options.filter(
				(o) => o.metadata?.side === "left",
			).length;
			if (next.size === totalPairs) setPreviewChecked(true);
		} else {
			setMatchingWrong({ leftId, rightId });
			setMatchingSelected(null);
			setTimeout(() => setMatchingWrong(null), 600);
		}
	};

	const handleWordBankSelect = (optionId: string) => {
		if (previewChecked) return;
		const firstEmptySlot = Array.from(
			{ length: wordBankBlankCount },
			(_, i) => wordBankPlacements[i] ?? null,
		).findIndex((p) => p === null);
		if (firstEmptySlot === -1) return;
		const next = [...wordBankPlacements];
		next[firstEmptySlot] = optionId;
		setWordBankPlacements(next);
	};

	const handleWordBankBlankClick = (slotIndex: number) => {
		if (previewChecked) return;
		const placed = wordBankPlacements[slotIndex];
		if (!placed) return;
		const next = [...wordBankPlacements];
		next[slotIndex] = null;
		setWordBankPlacements(next);
	};

	const handleWordOrderSelect = (optId: string) => {
		if (previewChecked) return;
		setWordOrderPlacements((prev) => [...prev, optId]);
	};

	const handleWordOrderPlacementClick = (index: number) => {
		if (previewChecked) return;
		setWordOrderPlacements((prev) => prev.filter((_, i) => i !== index));
	};

	const addWordOrderCorrectOption = () => {
		if (!activeQuestion) return;
		const correct = activeQuestion.options.filter((o) => o.isCorrect);
		const distractors = activeQuestion.options.filter((o) => !o.isCorrect);
		updateQuestion(activeQuestion.id, {
			options: [
				...correct,
				{
					id: createId("option"),
					content: "",
					isCorrect: true,
					image: null,
					metadata: { slot_index: correct.length },
				},
				...distractors,
			],
		});
	};

	const removeWordOrderCorrectOption = (optId: string) => {
		if (!activeQuestion) return;
		const correct = activeQuestion.options
			.filter((o) => o.isCorrect && o.id !== optId)
			.map((opt, i) => ({ ...opt, metadata: { ...opt.metadata, slot_index: i } }));
		if (correct.length < 2) return;
		const distractors = activeQuestion.options.filter((o) => !o.isCorrect);
		updateQuestion(activeQuestion.id, { options: [...correct, ...distractors] });
		setWordOrderPlacements((prev) => prev.filter((id) => id !== optId));
	};

	const removeWordOrderDistractor = (optId: string) => {
		if (!activeQuestion) return;
		updateQuestion(activeQuestion.id, {
			options: activeQuestion.options.filter((o) => o.id !== optId),
		});
	};

	const selectQuestion = (questionId: string) => {
		setActiveQuestionId(questionId);
		resetPreview();
	};

	const updateQuestion = (questionId: string, changes: Partial<QuizQuestion>) => {
		setQuestions((current) =>
			current.map((question) =>
				question.id === questionId ? { ...question, ...changes } : question,
			),
		);
	};

	const syncWordBankBlanks = (
		questionId: string,
		content: string,
		currentOptions: QuizOption[],
	) => {
		const blankCount = (content.match(/___/g) || []).length;
		const correctOptions = currentOptions
			.filter((o) => o.isCorrect)
			.sort((a, b) => (a.metadata?.slot_index ?? 0) - (b.metadata?.slot_index ?? 0));
		const distractors = currentOptions.filter((o) => !o.isCorrect);

		let newCorrectOptions = [...correctOptions];
		if (newCorrectOptions.length < blankCount) {
			for (let i = newCorrectOptions.length; i < blankCount; i++) {
				newCorrectOptions.push({
					id: createId("option"),
					content: "",
					isCorrect: true,
					image: null,
					metadata: { slot_index: i },
				});
			}
		} else if (newCorrectOptions.length > blankCount) {
			newCorrectOptions = newCorrectOptions.slice(0, blankCount);
		}

		newCorrectOptions = newCorrectOptions.map((opt, i) => ({
			...opt,
			metadata: { ...opt.metadata, slot_index: i },
		}));

		updateQuestion(questionId, { content, options: [...newCorrectOptions, ...distractors] });
	};

	const changeQuestionType = (type: QuizQuestionType) => {
		if (!activeQuestion) return;
		updateQuestion(activeQuestion.id, {
			type,
			persistedType: getPersistedQuestionType(type),
			options: createOptions(type),
		});
		resetPreview();
	};

	const updateOption = (optionId: string, content: string) => {
		if (!activeQuestion) return;
		updateQuestion(activeQuestion.id, {
			options: activeQuestion.options.map((option) =>
				option.id === optionId ? { ...option, content } : option,
			),
		});
	};

	const openImagePicker = (questionId: string, optionId?: string) => {
		setImageTarget({ questionId, optionId });
		if (imageInputRef.current) {
			imageInputRef.current.value = "";
			imageInputRef.current.click();
		}
	};

	const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file || !imageTarget) return;
		const image = URL.createObjectURL(file);
		if (imageTarget.optionId) {
			const question = questions.find((item) => item.id === imageTarget.questionId);
			if (!question) return;
			updateQuestion(question.id, {
				options: question.options.map((option) =>
					option.id === imageTarget.optionId ? { ...option, image } : option,
				),
			});
		} else {
			updateQuestion(imageTarget.questionId, { image });
		}
		setImageTarget(null);
	};

	const removeImage = (questionId: string, optionId?: string) => {
		const question = questions.find((item) => item.id === questionId);
		if (!question) return;
		if (optionId) {
			updateQuestion(question.id, {
				options: question.options.map((option) =>
					option.id === optionId ? { ...option, image: null } : option,
				),
			});
			return;
		}
		updateQuestion(question.id, { image: null });
	};

	const removeMatchingPair = (pairId: string) => {
		if (!activeQuestion) return;
		const pairs = new Set(activeQuestion.options.map((option) => option.metadata?.pairId));
		if (pairs.size <= 1) return;
		updateQuestion(activeQuestion.id, {
			options: activeQuestion.options.filter((option) => option.metadata?.pairId !== pairId),
		});
	};

	const toggleCorrectOption = (optionId: string, checked: boolean) => {
		if (!activeQuestion) return;
		const isMultipleChoice = activeQuestion.type === "multiple_select";
		updateQuestion(activeQuestion.id, {
			options: activeQuestion.options.map((option) => ({
				...option,
				isCorrect: isMultipleChoice
					? option.id === optionId
						? checked
						: option.isCorrect
					: option.id === optionId,
			})),
		});
	};

	const addOption = () => {
		if (!activeQuestion) return;
		if (
			activeQuestion.type === "word_bank_fill_blank" ||
			activeQuestion.type === "word_order"
		) {
			updateQuestion(activeQuestion.id, {
				options: [
					...activeQuestion.options,
					{ id: createId("option"), content: "", isCorrect: false, image: null },
				],
			});
			return;
		}
		updateQuestion(activeQuestion.id, {
			options:
				activeQuestion.type === "matching"
					? [...activeQuestion.options, ...createMatchingPair()]
					: [
							...activeQuestion.options,
							{
								id: createId("option"),
								content: "",
								isCorrect: false,
								image: null,
							},
						],
		});
	};

	const removeOption = (optionId: string) => {
		if (!activeQuestion) return;
		if (activeQuestion.type === "word_bank_fill_blank") {
			const distractors = activeQuestion.options.filter((o) => !o.isCorrect);
			if (distractors.length <= requiredOptions(activeQuestion.type)) return;
			updateQuestion(activeQuestion.id, {
				options: activeQuestion.options.filter((option) => option.id !== optionId),
			});
			return;
		}
		if (activeQuestion.options.length <= requiredOptions(activeQuestion.type)) return;
		updateQuestion(activeQuestion.id, {
			options: activeQuestion.options.filter((option) => option.id !== optionId),
		});
	};

	const addQuestion = (type: QuizQuestionType) => {
		const question = createQuestion(type);
		setQuestions((current) => [...current, question]);
		selectQuestion(question.id);
	};

	const deleteActiveQuestion = () => {
		if (!activeQuestion || questions.length === 1) return;
		const nextIndex = Math.max(0, activeQuestionIndex - 1);
		const nextQuestion = questions.filter((question) => question.id !== activeQuestion.id)[
			nextIndex
		];
		setQuestions((current) => current.filter((question) => question.id !== activeQuestion.id));
		selectQuestion(nextQuestion.id);
	};

	const moveQuestion = (direction: -1 | 1) => {
		if (activeQuestionIndex < 0) return;
		const nextIndex = activeQuestionIndex + direction;
		if (nextIndex < 0 || nextIndex >= questions.length) return;

		setQuestions((current) => {
			const reordered = [...current];
			const [movedQuestion] = reordered.splice(activeQuestionIndex, 1);
			reordered.splice(nextIndex, 0, movedQuestion);
			return reordered;
		});
	};

	const selectPreviewOption = (optionId: string) => {
		if (!activeQuestion) return;
		setPreviewChecked(false);
		if (activeQuestion.type === "multiple_select") {
			setPreviewAnswer((current) =>
				current.includes(optionId)
					? current.filter((selectedOptionId) => selectedOptionId !== optionId)
					: [...current, optionId],
			);
			return;
		}

		setPreviewAnswer([optionId]);
	};

	const handlePreviewTextAnswer = (event: ChangeEvent<HTMLInputElement>) => {
		setPreviewChecked(false);
		setPreviewTextAnswer(event.target.value);
	};

	const persistQuiz = async (successMessage: string) => {
		if (!courseId || !lessonId) {
			toast.error("Thiếu thông tin khóa học hoặc buổi học.", { position: "top-right" });
			return;
		}
		setIsSaving(true);
		try {
			await courseService.saveQuiz(courseId, Number(lessonId), {
				questions: questions.map(toQuestionPayload),
			});
			toast.success(successMessage, { position: "top-right" });
		} catch {
			toast.error("Lưu quiz thất bại. Vui lòng thử lại.", { position: "top-right" });
		} finally {
			setIsSaving(false);
		}
	};

	const saveDraft = () => {
		void persistQuiz("Đã lưu bản nháp quiz.");
	};

	const publishQuiz = () => {
		const invalidIndex = questions.findIndex(
			(question) => describeInvalidQuestion(question) !== null,
		);

		if (invalidIndex !== -1) {
			const reason = describeInvalidQuestion(questions[invalidIndex]);
			selectQuestion(questions[invalidIndex].id);
			toast.error(`Câu ${invalidIndex + 1}: ${reason}.`, {
				position: "top-right",
			});
			return;
		}

		void persistQuiz("Đã xuất bản quiz cho buổi học.");
	};

	if (isLoading) {
		return (
			<div className='min-h-full bg-muted/30'>
				<div className='mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-4 md:p-6 lg:p-8'>
					{/* Header skeleton */}
					<header className='flex flex-col gap-4 border-b border-border pb-5 xl:flex-row xl:items-center xl:justify-between'>
						<div className='flex min-w-0 items-start gap-3'>
							<Skeleton className='h-10 w-10 shrink-0' />
							<div className='space-y-2 min-w-0'>
								<Skeleton className='h-4 w-40' />
								<Skeleton className='h-8 w-64' />
							</div>
						</div>
						<div className='flex flex-wrap items-center gap-2'>
							<Skeleton className='h-10 w-28' />
							<Skeleton className='h-10 w-28' />
						</div>
					</header>

					{/* Grid skeleton */}
					<div className='space-y-6'>
						<div className='grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]'>
							{/* Questions list Card skeleton */}
							<aside className='relative h-[400px]'>
								<Card className='absolute inset-0 flex flex-col p-4 space-y-4'>
									<Skeleton className='h-6 w-32' />
									<Skeleton className='h-10 w-full' />
									<div className='space-y-2 flex-1 overflow-hidden'>
										<Skeleton className='h-14 w-full' />
										<Skeleton className='h-14 w-full' />
										<Skeleton className='h-14 w-full' />
									</div>
								</Card>
							</aside>

							{/* Editing Form Card skeleton */}
							<section className='min-w-0 space-y-5'>
								<Card className='p-6 space-y-6'>
									<div className='flex items-center gap-3 border-b pb-4'>
										<Skeleton className='h-9 w-9 rounded-lg' />
										<div className='space-y-1.5'>
											<Skeleton className='h-4 w-20' />
											<Skeleton className='h-3 w-32' />
										</div>
									</div>
									<div className='space-y-3'>
										<Skeleton className='h-4 w-28' />
										<div className='grid gap-2 sm:grid-cols-2'>
											{Array.from({ length: 6 }).map((_, i) => (
												<Skeleton key={i} className='h-16 w-full' />
											))}
										</div>
									</div>
									<div className='space-y-3'>
										<Skeleton className='h-4 w-32' />
										<Skeleton className='h-24 w-full' />
									</div>
								</Card>
							</section>
						</div>

						{/* Preview Quiz Card skeleton */}
						<aside className='space-y-5'>
							<Card className='p-6 space-y-4'>
								<div className='space-y-2'>
									<Skeleton className='h-6 w-36' />
									<Skeleton className='h-4 w-72' />
								</div>
								<Skeleton className='h-32 w-full rounded-2xl' />
							</Card>
						</aside>
					</div>
				</div>
			</div>
		);
	}

	if (!activeQuestion) return null;

	// Derived values for word bank preview rendering
	const wordBankSentenceParts =
		activeQuestion.type === "word_bank_fill_blank" ? activeQuestion.content.split("___") : [];

	return (
		<div className='min-h-full bg-muted/30'>
			<input
				ref={imageInputRef}
				type='file'
				accept='image/*'
				className='hidden'
				onChange={handleImageChange}
			/>
			<div className='mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-4 md:p-6 lg:p-8'>
				<header className='flex flex-col gap-4 pb-5 xl:flex-row xl:items-center xl:justify-between'>
					<div className='flex min-w-0 items-end gap-3'>
						<Button
							type='button'
							variant='outline'
							size='icon'
							aria-label='Quay lại trang trước'
							onClick={() => navigate(-1)}>
							<ArrowLeft />
						</Button>
						<div className='min-w-0'>
							<h1 className='text-2xl font-semibold tracking-tight md:text-3xl'>
								Tạo quiz cho buổi học
							</h1>
						</div>
					</div>

					<div className='flex flex-wrap items-center gap-2'>
						<Button
							type='button'
							variant='outline'
							onClick={saveDraft}
							disabled={isSaving || isLoading}>
							<Save />
							Lưu bản nháp
						</Button>
						<Button
							type='button'
							onClick={publishQuiz}
							disabled={isSaving || isLoading}>
							<Send />
							Xuất bản quiz
						</Button>
					</div>
				</header>

				<div className='space-y-6'>
					<div className='grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]'>
						<aside className='relative h-[280px] xl:h-auto'>
							<Card className='absolute inset-0 flex flex-col'>
								<CardHeader className='shrink-0 gap-3'>
									<div className='flex items-center justify-between gap-3'>
										<div>
											<CardTitle className='text-base'>Câu hỏi</CardTitle>
											<CardDescription>
												{questions.length} câu trong quiz
											</CardDescription>
										</div>
										<Badge variant='secondary' className='rounded-full'>
											{questions.length}
										</Badge>
									</div>
									<div className='flex gap-2'>
										<Select
											value={newQuestionType}
											onValueChange={(value) =>
												setNewQuestionType(value as QuizQuestionType)
											}>
											<SelectTrigger className='min-w-0 flex-1'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{questionTypeOptions.map((item) => (
													<SelectItem key={item.type} value={item.type}>
														{item.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Button
											type='button'
											size='icon'
											aria-label='Thêm câu hỏi'
											onClick={() => addQuestion(newQuestionType)}>
											<Plus />
										</Button>
									</div>
								</CardHeader>
								<CardContent className='min-h-0 flex-1 space-y-2 overflow-y-auto'>
									{questions.map((question, index) => {
										const isActive = question.id === activeQuestion.id;
										return (
											<button
												key={question.id}
												type='button'
												onClick={() => selectQuestion(question.id)}
												className={cn(
													"flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
													isActive
														? "border-primary bg-primary/5 shadow-sm"
														: "hover:bg-muted/60",
												)}>
												<span
													className={cn(
														"flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
														isActive
															? "border-primary bg-primary text-primary-foreground"
															: "bg-background",
													)}>
													{index + 1}
												</span>
												<div className='min-w-0 flex-1'>
													<p className='truncate text-sm font-medium'>
														{question.content.trim() ||
															"Câu hỏi chưa có nội dung"}
													</p>
													<div className='mt-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
														<QuestionTypeIcon
															type={question.type}
															className='size-3.5'
														/>
														{getQuestionTypeLabel(question.type)}
													</div>
												</div>
											</button>
										);
									})}
								</CardContent>
							</Card>
						</aside>

						<section className='min-w-0 space-y-5'>
							<Card className='overflow-hidden py-0 gap-0'>
								<div className='flex flex-col gap-3 border-b bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
									<div className='flex items-center gap-3'>
										<span className='flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
											<FilePen className='size-4' />
										</span>
										<div>
											<p className='text-sm font-semibold'>
												Câu {activeQuestionIndex + 1}
											</p>
											<p className='text-xs text-muted-foreground'>
												{activeQuestion.content.trim() ||
													"Câu hỏi chưa có nội dung"}
											</p>
										</div>
									</div>
									<div className='flex items-center gap-1'>
										<Button
											type='button'
											variant='ghost'
											size='icon-sm'
											aria-label='Di chuyển câu hỏi lên'
											disabled={activeQuestionIndex === 0}
											onClick={() => moveQuestion(-1)}>
											<ChevronUp />
										</Button>
										<Button
											type='button'
											variant='ghost'
											size='icon-sm'
											aria-label='Di chuyển câu hỏi xuống'
											disabled={activeQuestionIndex === questions.length - 1}
											onClick={() => moveQuestion(1)}>
											<ChevronDown />
										</Button>
										<Button
											type='button'
											variant='ghost'
											size='icon-sm'
											aria-label='Xoá câu hỏi'
											disabled={questions.length === 1}
											onClick={deleteActiveQuestion}>
											<Trash2 className='text-destructive' />
										</Button>
									</div>
								</div>

								<CardContent className='space-y-7 py-6'>
									<div className='space-y-3'>
										<Label>Loại câu hỏi</Label>
										<div className='grid gap-2 sm:grid-cols-2'>
											{questionTypeOptions.map((item) => {
												const isSelected =
													activeQuestion.type === item.type;
												return (
													<button
														key={item.type}
														type='button'
														aria-pressed={isSelected}
														onClick={() =>
															changeQuestionType(item.type)
														}
														className={cn(
															"flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
															isSelected
																? "border-primary bg-primary/5 ring-1 ring-primary"
																: "hover:bg-muted/50",
														)}>
														<span
															className={cn(
																"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
																isSelected
																	? "bg-primary text-primary-foreground"
																	: "bg-muted text-muted-foreground",
															)}>
															<QuestionTypeIcon
																type={item.type}
																className='size-4'
															/>
														</span>
														<span>
															<span className='block text-sm font-medium'>
																{item.label}
															</span>
															<span className='mt-0.5 block text-xs leading-5 text-muted-foreground'>
																{item.description}
															</span>
														</span>
													</button>
												);
											})}
										</div>
									</div>

									{
										<div className='space-y-2'>
											<div className='flex items-center justify-between gap-3'>
												<Label htmlFor='question-content'>
													Nội dung câu hỏi
												</Label>
												{(isChoiceQuestion(activeQuestion.type) ||
													activeQuestion.type === "fill_blank" ||
													activeQuestion.type ===
														"word_bank_fill_blank" ||
													activeQuestion.type === "word_order") && (
													<Button
														type='button'
														variant='outline'
														size='sm'
														onClick={() =>
															openImagePicker(activeQuestion.id)
														}>
														<ImagePlus />
														{activeQuestion.image
															? "Đổi ảnh"
															: "Thêm ảnh"}
													</Button>
												)}
											</div>
											<Textarea
												id='question-content'
												value={activeQuestion.content}
												onChange={(event) => {
													if (
														activeQuestion.type ===
														"word_bank_fill_blank"
													) {
														syncWordBankBlanks(
															activeQuestion.id,
															event.target.value,
															activeQuestion.options,
														);
													} else {
														updateQuestion(activeQuestion.id, {
															content: event.target.value,
														});
													}
												}}
												placeholder={
													activeQuestion.type === "word_bank_fill_blank"
														? "Ví dụ: Hôm nay trời ___ lắm. Tôi mặc áo ___ cho ấm."
														: activeQuestion.type === "word_order"
															? "Ví dụ: Hãy cho biết luồng hoạt động của một ứng dụng web từ khi người dùng nhập URL đến khi nhận được phản hồi."
															: activeQuestion.type === "matching"
																? "Ví dụ: Ghép mỗi mục ở cột trái với đáp án phù hợp ở cột phải."
																: "Ví dụ: Thẻ HTML nào dùng để tạo tiêu đề lớn nhất?"
												}
												className='min-h-28 resize-y text-base'
											/>
											{activeQuestion.type === "word_bank_fill_blank" && (
												<p className='text-xs text-muted-foreground'>
													Gõ{" "}
													<code className='rounded bg-muted px-1 py-0.5 font-mono'>
														___
													</code>{" "}
													(ba dấu gạch dưới) vào vị trí muốn tạo chỗ
													trống. Phát hiện{" "}
													<span className='font-semibold text-foreground'>
														{wordBankBlankCount} chỗ trống
													</span>
													.
												</p>
											)}
											{(isChoiceQuestion(activeQuestion.type) ||
												activeQuestion.type === "fill_blank" ||
												activeQuestion.type === "word_bank_fill_blank" ||
												activeQuestion.type === "word_order") &&
												activeQuestion.image && (
													<div className='relative overflow-hidden rounded-lg border bg-muted'>
														<img
															src={activeQuestion.image}
															alt='Ảnh minh hoạ câu hỏi'
															className='max-h-72 w-full object-contain'
														/>
														<Button
															type='button'
															variant='secondary'
															size='icon-xs'
															className='absolute right-2 top-2'
															aria-label='Xoá ảnh câu hỏi'
															onClick={() =>
																removeImage(activeQuestion.id)
															}>
															<X />
														</Button>
													</div>
												)}
										</div>
									}

									<div className='space-y-3'>
										<div className='flex flex-wrap items-center justify-between gap-2'>
											<div>
												<Label>
													{activeQuestion.type === "fill_blank"
														? "Đáp án chấp nhận"
														: activeQuestion.type ===
															  "word_bank_fill_blank"
															? "Word bank"
															: activeQuestion.type === "word_order"
																? "Các từ cần sắp xếp"
																: activeQuestion.type === "matching"
																	? "Các cặp cần ghép"
																	: "Các phương án trả lời"}
												</Label>
												<p className='mt-1 text-xs text-muted-foreground'>
													{activeQuestion.type === "multiple_select"
														? "Đánh dấu tất cả phương án đúng."
														: activeQuestion.type === "fill_blank"
															? "Mỗi dòng là một đáp án được chấp nhận."
															: activeQuestion.type ===
																  "word_bank_fill_blank"
																? "Nhập đáp án đúng cho từng chỗ trống, rồi thêm từ nhiễu."
																: activeQuestion.type ===
																	  "word_order"
																	? "Nhập các từ đúng theo thứ tự, rồi thêm từ nhiễu."
																	: activeQuestion.type ===
																		  "matching"
																		? "Mỗi hàng là một cặp đáp án đúng."
																		: "Chọn đúng một phương án."}
												</p>
											</div>
										</div>

										{/* ── word_bank_fill_blank options editor ── */}
										{activeQuestion.type === "word_bank_fill_blank" ? (
											<div className='space-y-4'>
												{wordBankBlankCount === 0 ? (
													<div className='rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300'>
														Chưa có chỗ trống nào. Gõ{" "}
														<code className='font-mono'>___</code> vào
														câu hỏi để tạo.
													</div>
												) : (
													<div className='space-y-2'>
														<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
															Đáp án đúng
														</p>
														{wordBankCorrectOptions.map((opt, idx) => (
															<div
																key={opt.id}
																className='flex items-center gap-2 rounded-lg border bg-card p-2.5'>
																<span className='flex size-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'>
																	<Check className='size-3.5 stroke-[3]' />
																</span>
																<span className='w-28 shrink-0 text-xs text-muted-foreground'>
																	Chỗ trống {idx + 1}
																</span>
																<Input
																	value={opt.content}
																	onChange={(event) =>
																		updateOption(
																			opt.id,
																			event.target.value,
																		)
																	}
																	placeholder='Từ đúng'
																	className='h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
																/>
															</div>
														))}
													</div>
												)}

												{wordBankBlankCount > 0 && (
													<>
														<div className='space-y-2'>
															<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
																Từ nhiễu
															</p>
															{wordBankDistractors.length === 0 && (
																<p className='text-xs text-muted-foreground'>
																	Thêm từ nhiễu để học viên phải
																	lựa chọn.
																</p>
															)}
															{wordBankDistractors.map((opt) => (
																<div
																	key={opt.id}
																	className='flex items-center gap-2 rounded-lg border bg-card p-2.5'>
																	<span className='flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'>
																		<X className='size-3.5' />
																	</span>
																	<Input
																		value={opt.content}
																		onChange={(event) =>
																			updateOption(
																				opt.id,
																				event.target.value,
																			)
																		}
																		placeholder='Từ nhiễu'
																		className='h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
																	/>
																	<Button
																		type='button'
																		variant='ghost'
																		size='icon-xs'
																		aria-label='Xoá từ nhiễu'
																		disabled={
																			wordBankDistractors.length <=
																			requiredOptions(
																				activeQuestion.type,
																			)
																		}
																		onClick={() =>
																			removeOption(opt.id)
																		}>
																		<X className='text-muted-foreground' />
																	</Button>
																</div>
															))}
														</div>

														<Button
															type='button'
															variant='outline'
															size='sm'
															onClick={addOption}>
															<Plus />
															Thêm từ nhiễu
														</Button>
													</>
												)}
											</div>
										) : activeQuestion.type === "word_order" ? (
											/* ── word_order options editor ── */
											<div className='space-y-4'>
												{/* Correct words in order */}
												<div className='space-y-2'>
													<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
														Từ đúng (theo thứ tự)
													</p>
													{wordOrderCorrectOptions.map((opt, idx) => (
														<div
															key={opt.id}
															className='flex items-center gap-2 rounded-lg border bg-card p-2.5'>
															<span className='flex size-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'>
																{idx + 1}
															</span>
															<Input
																value={opt.content}
																onChange={(event) =>
																	updateOption(
																		opt.id,
																		event.target.value,
																	)
																}
																placeholder={`Từ thứ ${idx + 1}`}
																className='h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
															/>
															<Button
																type='button'
																variant='ghost'
																size='icon-xs'
																aria-label={`Xoá từ thứ ${idx + 1}`}
																disabled={
																	wordOrderCorrectOptions.length <=
																	2
																}
																onClick={() =>
																	removeWordOrderCorrectOption(
																		opt.id,
																	)
																}>
																<X className='text-muted-foreground' />
															</Button>
														</div>
													))}
													<Button
														type='button'
														variant='outline'
														size='sm'
														onClick={addWordOrderCorrectOption}>
														<Plus />
														Thêm từ đúng
													</Button>
												</div>

												{/* Distractor words */}
												<div className='space-y-2'>
													<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
														Từ nhiễu
													</p>
													{wordOrderDistractors.length === 0 && (
														<p className='text-xs text-muted-foreground'>
															Thêm từ nhiễu để học viên phải lựa chọn.
														</p>
													)}
													{wordOrderDistractors.map((opt) => (
														<div
															key={opt.id}
															className='flex items-center gap-2 rounded-lg border bg-card p-2.5'>
															<span className='flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'>
																<X className='size-3.5' />
															</span>
															<Input
																value={opt.content}
																onChange={(event) =>
																	updateOption(
																		opt.id,
																		event.target.value,
																	)
																}
																placeholder='Từ nhiễu'
																className='h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
															/>
															<Button
																type='button'
																variant='ghost'
																size='icon-xs'
																aria-label='Xoá từ nhiễu'
																onClick={() =>
																	removeWordOrderDistractor(
																		opt.id,
																	)
																}>
																<X className='text-muted-foreground' />
															</Button>
														</div>
													))}
												</div>

												<Button
													type='button'
													variant='outline'
													size='sm'
													onClick={addOption}>
													<Plus />
													Thêm từ nhiễu
												</Button>
											</div>
										) : (
											/* ── tất cả loại khác ── */
											<div className='space-y-3'>
												<div className='space-y-2'>
													{activeQuestion.type === "matching"
														? activeQuestion.options
																.filter(
																	(option) =>
																		option.metadata?.side ===
																		"left",
																)
																.map((leftOption, index) => {
																	const rightOption =
																		activeQuestion.options.find(
																			(option) =>
																				option.metadata
																					?.pairId ===
																					leftOption
																						.metadata
																						?.pairId &&
																				option.metadata
																					?.side ===
																					"right",
																		);
																	return (
																		<div
																			key={leftOption.id}
																			className='grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center'>
																			<Input
																				value={
																					leftOption.content
																				}
																				onChange={(event) =>
																					updateOption(
																						leftOption.id,
																						event.target
																							.value,
																					)
																				}
																				placeholder={`Mục trái ${index + 1}`}
																			/>
																			<Link2 className='mx-auto size-4 text-muted-foreground' />
																			<Input
																				value={
																					rightOption?.content ??
																					""
																				}
																				onChange={(event) =>
																					rightOption &&
																					updateOption(
																						rightOption.id,
																						event.target
																							.value,
																					)
																				}
																				placeholder={`Mục phải ${index + 1}`}
																			/>
																			<Button
																				type='button'
																				variant='ghost'
																				size='icon-xs'
																				aria-label={`Xoá cặp ${index + 1}`}
																				onClick={() =>
																					leftOption
																						.metadata
																						?.pairId &&
																					removeMatchingPair(
																						leftOption
																							.metadata
																							.pairId,
																					)
																				}>
																				<X />
																			</Button>
																		</div>
																	);
																})
														: activeQuestion.options.map(
																(option, index) => {
																	const allowRemove =
																		activeQuestion.options
																			.length >
																		requiredOptions(
																			activeQuestion.type,
																		);
																	const isChoice =
																		isChoiceQuestion(
																			activeQuestion.type,
																		);
																	return (
																		<div
																			key={option.id}
																			className='rounded-lg border bg-card p-2.5'>
																			<div className='flex items-center gap-3'>
																				{activeQuestion.type ===
																				"multiple_select" ? (
																					<Checkbox
																						id={`correct-${option.id}`}
																						checked={
																							option.isCorrect
																						}
																						onCheckedChange={(
																							checked,
																						) =>
																							toggleCorrectOption(
																								option.id,
																								checked ===
																									true,
																							)
																						}
																						aria-label={`Đánh dấu phương án ${index + 1} là đúng`}
																					/>
																				) : isChoice ? (
																					<button
																						type='button'
																						aria-label={`Chọn phương án ${index + 1} là đáp án đúng`}
																						onClick={() =>
																							toggleCorrectOption(
																								option.id,
																								true,
																							)
																						}
																						className={cn(
																							"flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
																							option.isCorrect
																								? "border-primary bg-primary text-primary-foreground"
																								: "border-input bg-background",
																						)}>
																						{option.isCorrect && (
																							<Check className='size-3.5 stroke-[3]' />
																						)}
																					</button>
																				) : (
																					<span className='flex size-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700'>
																						<Check className='size-3.5 stroke-[3]' />
																					</span>
																				)}
																				<Input
																					value={
																						option.content
																					}
																					onChange={(
																						event,
																					) =>
																						updateOption(
																							option.id,
																							event
																								.target
																								.value,
																						)
																					}
																					placeholder={
																						activeQuestion.type ===
																						"fill_blank"
																							? "Nhập đáp án đúng"
																							: `Phương án ${index + 1}`
																					}
																					className='h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0'
																				/>
																				{isChoice && (
																					<Button
																						type='button'
																						variant='ghost'
																						size='icon-xs'
																						aria-label={`Thêm ảnh cho phương án ${index + 1}`}
																						onClick={() =>
																							openImagePicker(
																								activeQuestion.id,
																								option.id,
																							)
																						}>
																						<ImagePlus />
																					</Button>
																				)}
																				{allowRemove && (
																					<Button
																						type='button'
																						variant='ghost'
																						size='icon-xs'
																						aria-label={`Xoá phương án ${index + 1}`}
																						onClick={() =>
																							removeOption(
																								option.id,
																							)
																						}>
																						<X className='text-muted-foreground' />
																					</Button>
																				)}
																			</div>
																			{isChoice &&
																				option.image && (
																					<div className='relative mt-2 overflow-hidden rounded-md border bg-muted'>
																						<img
																							src={
																								option.image
																							}
																							alt={`Ảnh minh hoạ phương án ${index + 1}`}
																							className='max-h-32 w-full object-contain'
																						/>
																						<Button
																							type='button'
																							variant='secondary'
																							size='icon-xs'
																							className='absolute right-1.5 top-1.5'
																							aria-label={`Xoá ảnh phương án ${index + 1}`}
																							onClick={() =>
																								removeImage(
																									activeQuestion.id,
																									option.id,
																								)
																							}>
																							<X />
																						</Button>
																					</div>
																				)}
																		</div>
																	);
																},
															)}
												</div>

												<Button
													type='button'
													variant='outline'
													size='sm'
													onClick={addOption}>
													<Plus />
													{activeQuestion.type === "fill_blank"
														? "Thêm đáp án"
														: activeQuestion.type === "matching"
															? "Thêm cặp"
															: "Thêm phương án"}
												</Button>
											</div>
										)}
									</div>

									{activeQuestion.type !== "matching" && (
										<div className='rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20'>
											<div className='flex gap-3'>
												<Lightbulb className='mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300' />
												<div className='min-w-0 flex-1 space-y-2'>
													<Label
														htmlFor='question-explanation'
														className='text-amber-950 dark:text-amber-100'>
														Giải thích
													</Label>
													<Textarea
														id='question-explanation'
														value={activeQuestion.explanation}
														onChange={(event) =>
															updateQuestion(activeQuestion.id, {
																explanation: event.target.value,
															})
														}
														placeholder='Giải thích vì sao đáp án này đúng để học viên hiểu bài hơn.'
														className='min-h-24 resize-y border-amber-200 bg-background/80 dark:border-amber-900'
													/>
												</div>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</section>
					</div>

					<aside className='space-y-5'>
						<Card className='overflow-hidden py-0 gap-0'>
							<CardHeader className='border-b bg-muted/30 px-6! py-3!'>
								<div className='flex items-center justify-between gap-3'>
									<div>
										<CardTitle className='flex items-center gap-2 text-base'>
											<Eye className='size-4' />
											Preview quiz
										</CardTitle>
										<CardDescription>
											Xem quiz của bạn trông như thế nào từ góc nhìn của học
											viên.
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className='space-y-5 py-5'>
								<div className='rounded-2xl border-2 border-emerald-500/70 bg-emerald-50/50 p-4 dark:bg-emerald-950/20'>
									<div className='mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300'>
										<span className='flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white'>
											<FilePen className='size-3.5' />
										</span>
										{getQuestionTypeLabel(activeQuestion.type)}
									</div>

									{/* ── Question content ── */}
									{activeQuestion.type !== "matching" &&
										activeQuestion.type !== "word_bank_fill_blank" && (
											<h2 className='text-lg font-semibold leading-7'>
												{activeQuestion.content.trim() ||
													"Nội dung câu hỏi sẽ xuất hiện ở đây"}
											</h2>
										)}

									{activeQuestion.image && (
										<img
											src={activeQuestion.image}
											alt=''
											className='mt-4 max-h-44 w-full rounded-xl object-contain'
										/>
									)}

									{/* ── word_bank_fill_blank preview ── */}
									{activeQuestion.type === "word_bank_fill_blank" ? (
										<div>
											{/* Sentence with blank boxes */}
											<div className='flex flex-wrap items-center gap-x-1 gap-y-2 text-lg font-semibold leading-relaxed'>
												{wordBankSentenceParts.length <= 1 ? (
													<span className='text-muted-foreground'>
														{activeQuestion.content.trim() ||
															"Nội dung câu hỏi sẽ xuất hiện ở đây"}
													</span>
												) : (
													wordBankSentenceParts.map((part, i) => {
														const placedId =
															wordBankPlacements[i] ?? null;
														const placedOption = placedId
															? activeQuestion.options.find(
																	(o) => o.id === placedId,
																)
															: null;
														const correctOpt =
															wordBankCorrectOptions[i];
														const isCorrectSlot =
															previewChecked &&
															placedId === correctOpt?.id;
														const isWrongSlot =
															previewChecked &&
															placedId !== null &&
															placedId !== correctOpt?.id;
														return (
															<Fragment key={i}>
																{part && <span>{part}</span>}
																{i <
																	wordBankSentenceParts.length -
																		1 && (
																	<button
																		type='button'
																		disabled={previewChecked}
																		onClick={() =>
																			handleWordBankBlankClick(
																				i,
																			)
																		}
																		className={cn(
																			"inline-flex min-w-20 items-center justify-center rounded-lg border-b-2 px-3 py-1 text-sm font-semibold transition-colors",
																			isCorrectSlot &&
																				"border-emerald-500 bg-emerald-100 text-emerald-800",
																			isWrongSlot &&
																				"border-rose-500 bg-rose-100 text-rose-800",
																			!isCorrectSlot &&
																				!isWrongSlot &&
																				placedOption &&
																				"border-primary bg-primary/10 text-primary hover:bg-primary/20",
																			!isCorrectSlot &&
																				!isWrongSlot &&
																				!placedOption &&
																				"border-muted-foreground/40 bg-muted/50 text-muted-foreground",
																		)}>
																		{placedOption ? (
																			placedOption.content ||
																			"—"
																		) : (
																			<span className='opacity-0 select-none'>
																				___
																			</span>
																		)}
																	</button>
																)}
															</Fragment>
														);
													})
												)}
											</div>

											{/* Word bank */}
											{!previewChecked && (
												<div className='mt-5'>
													<p className='mb-2 text-xs font-medium text-muted-foreground'>
														Chọn từ bên dưới để điền vào chỗ trống:
													</p>
													<div className='flex flex-wrap gap-2'>
														{shuffledWordBankOptionIds
															.filter(
																(id) =>
																	!Array.from(
																		{
																			length: wordBankBlankCount,
																		},
																		(_, idx) =>
																			wordBankPlacements[idx],
																	).includes(id),
															)
															.map((id) => {
																const opt =
																	activeQuestion.options.find(
																		(o) => o.id === id,
																	);
																if (!opt) return null;
																return (
																	<button
																		key={id}
																		type='button'
																		onClick={() =>
																			handleWordBankSelect(id)
																		}
																		className='rounded-xl border-2 border-emerald-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-transparent dark:hover:border-emerald-600'>
																		{opt.content || "—"}
																	</button>
																);
															})}
													</div>
												</div>
											)}
										</div>
									) : activeQuestion.type === "word_order" ? (
										/* ── word_order preview ── */
										<div>
											{/* Construction area */}
											<div className='min-h-16 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-3 dark:border-emerald-800 dark:bg-emerald-950/20'>
												{wordOrderPlacements.length === 0 ? (
													<p className='text-sm text-muted-foreground'>
														Chọn từ bên dưới theo đúng thứ tự…
													</p>
												) : (
													<div className='flex flex-wrap gap-2'>
														{wordOrderPlacements.map((optId, idx) => {
															const opt = activeQuestion.options.find(
																(o) => o.id === optId,
															);
															const isCorrectPos =
																previewChecked &&
																wordOrderCorrectOptions[idx]?.id ===
																	optId;
															const isWrongPos =
																previewChecked &&
																wordOrderCorrectOptions[idx]?.id !==
																	optId;
															return (
																<button
																	key={idx}
																	type='button'
																	disabled={previewChecked}
																	onClick={() =>
																		handleWordOrderPlacementClick(
																			idx,
																		)
																	}
																	className={cn(
																		"rounded-xl border-2 px-4 py-1.5 text-sm font-medium transition-colors",
																		isCorrectPos &&
																			"border-emerald-500 bg-emerald-100 text-emerald-800",
																		isWrongPos &&
																			"border-rose-500 bg-rose-100 text-rose-800",
																		!isCorrectPos &&
																			!isWrongPos &&
																			"border-emerald-400 bg-white hover:bg-emerald-50 dark:bg-transparent",
																	)}>
																	{opt?.content || "—"}
																</button>
															);
														})}
													</div>
												)}
											</div>

											{/* Show correct answer after wrong check */}
											{previewChecked && !previewIsCorrect && (
												<div className='mt-2 flex flex-wrap gap-1.5'>
													{wordOrderCorrectOptions.map((opt, i) => (
														<span
															key={opt.id}
															className='rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'>
															{i + 1}. {opt.content || "—"}
														</span>
													))}
												</div>
											)}

											{/* Separator */}
											<div className='my-4 border-t border-border' />

											{/* Word bank */}
											{!previewChecked && (
												<div className='flex flex-wrap gap-2'>
													{shuffledWordOrderOptionIds
														.filter(
															(id) =>
																!wordOrderPlacements.includes(id),
														)
														.map((id) => {
															const opt = activeQuestion.options.find(
																(o) => o.id === id,
															);
															if (!opt) return null;
															return (
																<button
																	key={id}
																	type='button'
																	onClick={() =>
																		handleWordOrderSelect(id)
																	}
																	className='rounded-xl border-2 border-emerald-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-transparent dark:hover:border-emerald-600'>
																	{opt.content || "—"}
																</button>
															);
														})}
												</div>
											)}
										</div>
									) : activeQuestion.type === "matching" ? (
										<div className='mt-5 grid grid-cols-2 gap-2'>
											{[
												{
													ids: shuffledMatchingLeftIds,
													side: "left" as const,
												},
												{
													ids: shuffledMatchingRightIds,
													side: "right" as const,
												},
											].map(({ ids, side }) => (
												<div key={side} className='space-y-2'>
													{ids.map((optionId) => {
														const option = activeQuestion.options.find(
															(o) => o.id === optionId,
														);
														if (!option) return null;
														const isSelected =
															matchingSelected?.optionId ===
															option.id;
														const isMatched = matchingMatched.has(
															option.metadata?.pairId ?? "",
														);
														const isWrong =
															side === "left"
																? matchingWrong?.leftId ===
																	option.id
																: matchingWrong?.rightId ===
																	option.id;
														return (
															<button
																key={option.id}
																type='button'
																disabled={
																	isMatched || previewChecked
																}
																onClick={() =>
																	handleMatchingSelect(
																		side,
																		option.id,
																	)
																}
																className={cn(
																	"w-full rounded-xl border-2 px-3 py-2.5 text-center text-sm font-medium transition-colors disabled:cursor-default",
																	isMatched &&
																		"border-emerald-500 bg-emerald-50 text-emerald-800 opacity-70",
																	isWrong &&
																		"border-rose-400 bg-rose-50 text-rose-800",
																	isSelected &&
																		!isMatched &&
																		!isWrong &&
																		"border-primary bg-primary/10 text-primary",
																	!isSelected &&
																		!isMatched &&
																		!isWrong &&
																		"border-emerald-200 bg-white hover:border-emerald-400",
																)}>
																{option.content || "—"}
															</button>
														);
													})}
												</div>
											))}
										</div>
									) : activeQuestion.type === "fill_blank" ? (
										<Input
											value={previewTextAnswer}
											onChange={handlePreviewTextAnswer}
											placeholder='Nhập câu trả lời của bạn'
											className='mt-5 bg-background'
										/>
									) : (
										<div className='mt-5 space-y-2.5'>
											{activeQuestion.options.map((option, index) => {
												const isSelected = previewAnswer.includes(
													option.id,
												);
												const showCorrect =
													previewChecked && option.isCorrect;
												const showIncorrect =
													previewChecked &&
													isSelected &&
													!option.isCorrect;
												return (
													<button
														key={option.id}
														type='button'
														onClick={() =>
															selectPreviewOption(option.id)
														}
														disabled={previewChecked}
														className={cn(
															"flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default",
															showCorrect &&
																"border-emerald-600 bg-emerald-100 text-emerald-950",
															showIncorrect &&
																"border-rose-500 bg-rose-100 text-rose-950",
															!showCorrect &&
																!showIncorrect &&
																isSelected &&
																"border-emerald-500 bg-white",
															!showCorrect &&
																!showIncorrect &&
																!isSelected &&
																"border-emerald-200 bg-white hover:border-emerald-400",
														)}>
														<span
															className={cn(
																"flex size-6 shrink-0 items-center justify-center border-2 text-xs font-semibold",
																activeQuestion.type ===
																	"multiple_select"
																	? "rounded-md"
																	: "rounded-full",
																showCorrect
																	? "border-emerald-600 bg-emerald-600 text-white"
																	: showIncorrect
																		? "border-rose-500 bg-rose-500 text-white"
																		: isSelected
																			? "border-emerald-500 bg-emerald-500 text-white"
																			: "border-emerald-200 bg-white text-emerald-700",
															)}>
															{showCorrect ? (
																<Check className='size-3.5 stroke-[3]' />
															) : showIncorrect ? (
																<X className='size-3.5 stroke-[3]' />
															) : (
																String.fromCharCode(65 + index)
															)}
														</span>
														<span className='min-w-0 flex-1'>
															{option.content ||
																`Phương án ${index + 1}`}
															{option.image && (
																<img
																	src={option.image}
																	alt=''
																	className='mt-2 max-h-24 rounded-md object-contain'
																/>
															)}
														</span>
													</button>
												);
											})}
										</div>
									)}

									{previewChecked && (
										<div
											className={cn(
												"mt-5 rounded-xl border p-3.5",
												previewIsCorrect
													? "border-emerald-300 bg-emerald-100/80 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"
													: "border-rose-300 bg-rose-100/80 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100",
											)}>
											<div className='flex gap-2.5'>
												{previewIsCorrect ? (
													<CheckCircle2 className='mt-0.5 size-5 shrink-0' />
												) : (
													<CircleX className='mt-0.5 size-5 shrink-0' />
												)}
												<div>
													<p className='font-semibold'>
														{previewIsCorrect ? (
															activeQuestion.type === "matching" ? (
																"Xuất sắc! Bạn đã ghép đúng tất cả các cặp."
															) : (
																"Chính xác!"
															)
														) : activeQuestion.type === "fill_blank" ? (
															`Đáp án: ${activeQuestion.options
																.map((o) => o.content)
																.filter(Boolean)
																.join(" / ")}`
														) : activeQuestion.type ===
														  "word_bank_fill_blank" ? (
															<>
																Đáp án:{" "}
																{wordBankSentenceParts.map(
																	(part, i) => (
																		<Fragment key={i}>
																			{part}
																			{i <
																				wordBankSentenceParts.length -
																					1 && (
																				<span className='underline decoration-2 underline-offset-2'>
																					{wordBankCorrectOptions[
																						i
																					]?.content ??
																						""}
																				</span>
																			)}
																		</Fragment>
																	),
																)}
															</>
														) : (
															"Chưa đúng"
														)}
													</p>
													{activeQuestion.type !== "matching" && (
														<p className='mt-1 text-xs leading-5 opacity-90'>
															{activeQuestion.explanation.trim() ||
																"Thêm giải thích để học viên hiểu rõ đáp án."}
														</p>
													)}
												</div>
											</div>
										</div>
									)}
								</div>

								{previewChecked ? (
									<Button
										type='button'
										variant='outline'
										className='w-full'
										onClick={resetPreview}>
										<Copy />
										Làm lại câu này
									</Button>
								) : (
									activeQuestion.type !== "matching" && (
										<Button
											type='button'
											className='w-full bg-emerald-600 text-white hover:bg-emerald-700'
											disabled={!hasPreviewAnswer}
											onClick={() => setPreviewChecked(true)}>
											Kiểm tra đáp án
										</Button>
									)
								)}
							</CardContent>
						</Card>
					</aside>
				</div>
			</div>
		</div>
	);
}

export default QuizCreatePage;
