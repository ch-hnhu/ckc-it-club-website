import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, RotateCcw, BookCheck, Trophy, X } from "lucide-react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { learningService } from "@/services/learning.service";
import type { AuthUser } from "@/services/auth.service";
import type { QuizOption, QuizPlay, QuizQuestion, QuizSubmitResult } from "@/types/learning.types";

type LayoutOutletContext = { user: AuthUser | null; loadingUser: boolean };

type Phase = "intro" | "playing" | "result";

const QUESTION_TYPE_LABELS: Record<QuizQuestion["ui_type"], string> = {
	multiple_choice: "Chọn một đáp án",
	multiple_select: "Chọn nhiều đáp án",
	fill_blank: "Điền vào chỗ trống",
	word_bank_fill_blank: "Chọn từ điền vào chỗ trống",
	matching: "Ghép cặp",
	word_order: "Sắp xếp các từ theo đúng thứ tự",
	true_false: "Đúng / Sai",
};

/** Trạng thái trả lời đang dựng cho câu hỏi hiện tại. */
interface WorkingAnswer {
	selected: number[]; // choice / multiple_select
	text: string; // fill_blank
	slots: (number | null)[]; // word_bank_fill_blank
	sequence: number[]; // word_order
	pairs: Array<[number, number]>; // matching
}

const emptyAnswer = (): WorkingAnswer => ({
	selected: [],
	text: "",
	slots: [],
	sequence: [],
	pairs: [],
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalize = (v: string) => v.trim().toLowerCase().replace(/\s+/g, " ");

const sameSet = (a: number[], b: number[]) => {
	if (a.length !== b.length) return false;
	const sa = [...a].sort((x, y) => x - y);
	const sb = [...b].sort((x, y) => x - y);
	return sa.every((v, i) => v === sb[i]);
};

const sameOrder = (a: number[], b: number[]) =>
	a.length === b.length && a.every((v, i) => v === b[i]);

const shuffle = <T,>(arr: T[]): T[] => {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
};

const blankCount = (content: string) => (content.match(/___/g) || []).length;

const correctOptions = (q: QuizQuestion) => q.options.filter((o) => o.is_correct);
const leftOptions = (q: QuizQuestion) => q.options.filter((o) => o.metadata?.side === "left");
const rightOptions = (q: QuizQuestion) => q.options.filter((o) => o.metadata?.side === "right");

/** Đã trả lời đủ để bấm "Kiểm tra" chưa. */
function isAnswered(q: QuizQuestion, a: WorkingAnswer): boolean {
	switch (q.type) {
		case "multiple_choice":
			return a.selected.length === 1;
		case "multiple_select":
			return a.selected.length >= 1;
		case "fill_blank":
			return a.text.trim().length > 0;
		case "word_bank_fill_blank":
			return a.slots.length > 0 && a.slots.every((s) => s !== null);
		case "word_order":
			return a.sequence.length === correctOptions(q).length;
		case "matching":
			return a.pairs.length === leftOptions(q).length;
		default:
			return false;
	}
}

/** Chấm tại client để phản hồi tức thì (server vẫn chấm lại khi nộp). */
function gradeLocal(q: QuizQuestion, a: WorkingAnswer): boolean {
	switch (q.type) {
		case "multiple_choice":
		case "multiple_select":
			return sameSet(
				a.selected,
				correctOptions(q).map((o) => o.id),
			);
		case "fill_blank":
			return correctOptions(q).some((o) => normalize(o.content ?? "") === normalize(a.text));
		case "word_bank_fill_blank": {
			const bySlot = new Map<number, number>();
			correctOptions(q).forEach((o) => bySlot.set(o.metadata?.slot_index ?? -1, o.id));
			if (bySlot.size !== a.slots.length) return false;
			return a.slots.every((optId, i) => bySlot.get(i) === optId);
		}
		case "word_order": {
			const expected = correctOptions(q)
				.slice()
				.sort((x, y) => (x.metadata?.slot_index ?? 0) - (y.metadata?.slot_index ?? 0))
				.map((o) => o.id);
			return sameOrder(a.sequence, expected);
		}
		case "matching": {
			if (a.pairs.length !== leftOptions(q).length) return false;
			const byId = new Map(q.options.map((o) => [o.id, o]));
			return a.pairs.every(([leftId, rightId]) => {
				const left = byId.get(leftId);
				const right = byId.get(rightId);
				return (
					!!left &&
					!!right &&
					left.metadata?.side === "left" &&
					left.metadata?.pairId &&
					left.metadata.pairId === right.metadata?.pairId
				);
			});
		}
		default:
			return false;
	}
}

/** Chuyển trạng thái client → answer_data gửi server. */
function toAnswerData(q: QuizQuestion, a: WorkingAnswer): Record<string, unknown> {
	switch (q.type) {
		case "multiple_choice":
		case "multiple_select":
			return { selected: a.selected };
		case "fill_blank":
			return { text: a.text.trim() };
		case "word_bank_fill_blank":
			return { slots: a.slots };
		case "word_order":
			return { order: a.sequence };
		case "matching":
			return { pairs: a.pairs };
		default:
			return {};
	}
}

// ─── Đáp án đúng (để hé lộ khi sai) ──────────────────────────────────────────

/** Thứ tự id đúng cho word_order (theo slot_index). */
const expectedWordOrder = (q: QuizQuestion) =>
	correctOptions(q)
		.slice()
		.sort((a, b) => (a.metadata?.slot_index ?? 0) - (b.metadata?.slot_index ?? 0))
		.map((o) => o.id);

/** Map chỗ trống (slot_index) → option đúng cho word_bank. */
const correctSlotMap = (q: QuizQuestion) => {
	const map = new Map<number, QuizOption>();
	correctOptions(q).forEach((o) => map.set(o.metadata?.slot_index ?? -1, o));
	return map;
};

/** Các cặp ghép đúng [leftId, rightId] cho matching. */
const correctPairs = (q: QuizQuestion): Array<[QuizOption, QuizOption]> => {
	const rights = rightOptions(q);
	return leftOptions(q)
		.map((l) => {
			const r = rights.find((x) => x.metadata?.pairId === l.metadata?.pairId);
			return r ? ([l, r] as [QuizOption, QuizOption]) : null;
		})
		.filter((p): p is [QuizOption, QuizOption] => p !== null);
};

/** Chuỗi đáp án đúng để hé lộ trong ô phản hồi khi học viên trả lời sai. */
function revealText(q: QuizQuestion): string {
	switch (q.type) {
		case "multiple_choice":
		case "multiple_select":
			return correctOptions(q)
				.map((o) => o.content)
				.filter(Boolean)
				.join(", ");
		case "fill_blank":
			return correctOptions(q)
				.map((o) => o.content)
				.filter(Boolean)
				.join(" / ");
		case "word_bank_fill_blank": {
			const slotMap = correctSlotMap(q);
			return q.content
				.split("___")
				.map((part, i, arr) =>
					i < arr.length - 1
						? `${part}<u class="font-extrabold">${slotMap.get(i)?.content ?? "?"}</u>`
						: part,
				)
				.join("");
		}
		case "word_order":
			return expectedWordOrder(q)
				.map((id) => q.options.find((o) => o.id === id)?.content)
				.filter(Boolean)
				.join(" ");
		case "matching":
			return correctPairs(q)
				.map(([left, right]) => `${left.content} → ${right.content}`)
				.join(", ");
		default:
			return "";
	}
}

// ─── Small UI atoms ──────────────────────────────────────────────────────────

const Chip: React.FC<{
	onClick?: () => void;
	disabled?: boolean;
	active?: boolean;
	tone?: "default" | "muted";
	children: React.ReactNode;
}> = ({ onClick, disabled, active, tone = "default", children }) => (
	<button
		type='button'
		onClick={onClick}
		disabled={disabled}
		className={[
			"rounded-xl border-2 border-black px-4 py-2 font-heading text-sm font-extrabold transition",
			"shadow-[2px_2px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none",
			"disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
			active ? "bg-[var(--color-primary)]" : tone === "muted" ? "bg-gray-100" : "bg-white",
		].join(" ")}>
		{children}
	</button>
);

const OptionImage: React.FC<{ src: string | null }> = ({ src }) =>
	src ? (
		<img
			src={src}
			alt=''
			className='mb-2 h-28 w-full rounded-lg border-2 border-black object-cover'
		/>
	) : null;

// ─── QuizPlayPage ────────────────────────────────────────────────────────────

const QuizPlayPage: React.FC = () => {
	const { slug, lessonSlug } = useParams<{ slug: string; lessonSlug: string }>();
	const navigate = useNavigate();
	const { user } = useOutletContext<LayoutOutletContext>();

	const [quiz, setQuiz] = useState<QuizPlay | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [phase, setPhase] = useState<Phase>("intro");
	const [index, setIndex] = useState(0);
	const [answer, setAnswer] = useState<WorkingAnswer>(emptyAnswer());
	const [checked, setChecked] = useState(false);
	// Ghép đôi: ô đang chọn chờ ghép + cặp vừa ghép sai (đỏ chớp rồi mất).
	const [matchSelected, setMatchSelected] = useState<{
		side: "left" | "right";
		id: number;
	} | null>(null);
	const [matchWrong, setMatchWrong] = useState<{ leftId: number; rightId: number } | null>(null);
	const [storedAnswers, setStoredAnswers] = useState<Record<number, Record<string, unknown>>>({});
	const [correctCountLocal, setCorrectCountLocal] = useState(0);

	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<QuizSubmitResult | null>(null);

	const lessonHref = `/khoa-hoc/${slug}/${lessonSlug}`;

	useEffect(() => {
		if (!slug || !lessonSlug) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		learningService
			.getQuiz(slug, lessonSlug)
			.then((res) => {
				if (cancelled) return;
				setQuiz(res.data);
			})
			.catch(() => {
				if (!cancelled) setError("Không tải được quiz của buổi học này.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [slug, lessonSlug]);

	const question = quiz?.questions[index] ?? null;
	const total = quiz?.questions.length ?? 0;
	const questionTypeLabel = question ? QUESTION_TYPE_LABELS[question.ui_type] : "";

	// Chuẩn bị (xáo trộn) dữ liệu hiển thị ổn định theo từng câu hỏi.
	const prepared = useMemo(() => {
		if (!question) return null;
		const banks = shuffle(question.options);
		const rights = shuffle(rightOptions(question));
		const blanks = blankCount(question.content);
		return { banks, rights, blanks };
	}, [question]);

	// Khởi tạo trạng thái trả lời mỗi khi đổi câu hỏi.
	useEffect(() => {
		if (!question || !prepared) return;
		const fresh = emptyAnswer();
		if (question.type === "word_bank_fill_blank") {
			fresh.slots = Array.from({ length: prepared.blanks }, () => null);
		}
		setAnswer(fresh);
		setChecked(false);
		setMatchSelected(null);
		setMatchWrong(null);
	}, [question, prepared]);

	// Ghép đôi: tự động "kiểm tra đúng" khi đã ghép hết các cặp (chỉ cặp đúng mới được giữ).
	useEffect(() => {
		if (!question || question.type !== "matching" || checked) return;
		const totalPairs = leftOptions(question).length;
		if (totalPairs > 0 && answer.pairs.length === totalPairs) {
			setChecked(true);
			setCorrectCountLocal((c) => c + 1);
			setStoredAnswers((prev) => ({
				...prev,
				[question.id]: toAnswerData(question, answer),
			}));
		}
	}, [answer, question, checked]);

	if (loading) {
		return (
			<div className='mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-10 pt-24'>
				<div className='h-3 w-full animate-pulse rounded-full bg-gray-200' />
				<div className='h-40 animate-pulse rounded-2xl border-2 border-black bg-gray-100' />
				<div className='h-14 animate-pulse rounded-2xl border-2 border-black bg-gray-100' />
				<div className='h-14 animate-pulse rounded-2xl border-2 border-black bg-gray-100' />
			</div>
		);
	}

	if (error || !quiz || total === 0) {
		return (
			<div className='mx-auto max-w-md px-4 pb-16 pt-28 text-center'>
				<p className='font-heading text-xl font-extrabold'>
					{error ?? "Buổi học này chưa có quiz."}
				</p>
				<Link
					to={lessonHref}
					className='mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-black px-5 py-3 font-heading text-sm font-extrabold text-white shadow-[3px_3px_0_#555] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					Quay lại buổi học
				</Link>
			</div>
		);
	}

	const answered = question ? isAnswered(question, answer) : false;

	// ─── Handlers chung ──
	const handleCheck = () => {
		if (!question || !answered) return;
		const ok = gradeLocal(question, answer);
		setChecked(true);
		if (ok) setCorrectCountLocal((c) => c + 1);
		setStoredAnswers((prev) => ({
			...prev,
			[question.id]: toAnswerData(question, answer),
		}));
	};

	const handleContinue = async () => {
		if (index < total - 1) {
			setIndex((i) => i + 1);
			return;
		}
		// Câu cuối → nộp bài.
		if (!user) {
			// Khách: tính kết quả cục bộ, không ghi nhận tiến độ.
			setResult({
				score: Math.round((correctCountLocal / total) * 100),
				is_passed: Math.round((correctCountLocal / total) * 100) >= quiz.pass_threshold,
				pass_threshold: quiz.pass_threshold,
				correct_count: correctCountLocal,
				total,
				results: [],
			});
			setPhase("result");
			return;
		}
		setSubmitting(true);
		try {
			const payload = quiz.questions.map((q) => ({
				question_id: q.id,
				answer_data: storedAnswers[q.id] ?? {},
			}));
			const res = await learningService.submitQuiz(slug!, lessonSlug!, payload);
			setResult(res.data);
			setPhase("result");
		} catch {
			setError("Nộp bài thất bại. Vui lòng thử lại.");
		} finally {
			setSubmitting(false);
		}
	};

	const restart = () => {
		setPhase("intro");
		setIndex(0);
		setAnswer(emptyAnswer());
		setChecked(false);
		setStoredAnswers({});
		setCorrectCountLocal(0);
		setResult(null);
		setError(null);
	};

	const currentCorrect = question && checked ? gradeLocal(question, answer) : false;

	// ─── Intro ──
	if (phase === "intro") {
		return (
			<div className='flex h-[100dvh] flex-col pt-16 overflow-hidden bg-white justify-center items-center px-4'>
				<div className='w-full max-w-2xl rounded-3xl border-2 border-black bg-white p-8 text-center shadow-[6px_6px_0_#111]'>
					<div className='mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-200'>
						<BookCheck className='h-12 w-12 text-white' strokeWidth={2.5} />
					</div>
					<h1 className='mt-6 font-heading text-3xl font-extrabold'>
						Quiz kiểm tra buổi {quiz.lesson.order}
					</h1>
					<p className='mt-2 font-medium text-gray-500'>
						{total} câu hỏi · Cần đúng{" "}
						<span className='font-extrabold text-black'>≥ {quiz.pass_threshold}%</span>{" "}
						để vượt ải
					</p>
					{quiz.completed && (
						<p className='mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-[var(--color-pastel-green)] px-3 py-1 text-sm font-extrabold'>
							<Trophy className='h-4 w-4' strokeWidth={2.5} /> Bạn đã vượt qua quiz
							này
						</p>
					)}
					<div className='mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center'>
						<button
							type='button'
							onClick={() => setPhase("playing")}
							className='inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 py-3 font-heading text-base font-extrabold shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							{quiz.completed ? "Làm lại" : "Bắt đầu"}
							{quiz.completed ? (
								<RotateCcw className='h-5 w-5' strokeWidth={2.5} />
							) : (
								<ArrowRight className='h-5 w-5' strokeWidth={2.5} />
							)}
						</button>
						<Link
							to={lessonHref}
							className='inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-6 py-3 font-heading text-base font-extrabold shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Để sau
						</Link>
					</div>
				</div>
			</div>
		);
	}

	// ─── Result ──
	if (phase === "result" && result) {
		const passed = result.is_passed;
		return (
			<div className='flex h-[100dvh] flex-col pt-16 overflow-hidden bg-white justify-center items-center px-4'>
				<div
					className={[
						"w-full max-w-2xl rounded-3xl border-2 border-black p-8 text-center",
						passed ? "bg-green-100" : "bg-red-100",
					].join(" ")}>
					<div className='mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white'>
						{passed ? (
							<Trophy className='h-12 w-12 text-amber-500' strokeWidth={2.5} />
						) : (
							<RotateCcw className='h-12 w-12' strokeWidth={2.5} />
						)}
					</div>
					<h1 className='mt-6 font-heading text-3xl font-extrabold'>
						{passed ? "Tuyệt vời!" : "Cố lên nhé!"}
					</h1>
					<p className='mt-2 font-medium text-gray-600'>
						{passed
							? "Bạn đã vượt qua quiz này."
							: `Cần ≥ ${result.pass_threshold}% để qua. Thử lại nào!`}
					</p>

					<div className='mt-6 flex items-center justify-center gap-4'>
						<div className='rounded-2xl border-2 border-black bg-white px-6 py-4 shadow-[3px_3px_0_#111]'>
							<p className='font-heading text-4xl font-extrabold'>{result.score}%</p>
							<p className='text-xs font-bold uppercase tracking-wide text-gray-500'>
								Điểm số
							</p>
						</div>
						<div className='rounded-2xl border-2 border-black bg-white px-6 py-4 shadow-[3px_3px_0_#111]'>
							<p className='font-heading text-4xl font-extrabold'>
								{result.correct_count}/{result.total}
							</p>
							<p className='text-xs font-bold uppercase tracking-wide text-gray-500'>
								Câu đúng
							</p>
						</div>
					</div>

					{!user && (
						<p className='mt-5 text-sm font-bold text-gray-600'>
							Đăng nhập để lưu kết quả và tiến độ học tập của bạn.
						</p>
					)}

					<div className='mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center'>
						<button
							type='button'
							onClick={restart}
							className='inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-6 py-3 font-heading text-base font-extrabold shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							<RotateCcw className='h-5 w-5' strokeWidth={2.5} /> Làm lại
						</button>
						<button
							type='button'
							onClick={() => navigate(lessonHref)}
							className='inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 py-3 font-heading text-base font-extrabold shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Quay lại buổi học
							<ArrowRight className='h-5 w-5' strokeWidth={2.5} />
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!question || !prepared) return null;

	// ─── Render khu vực trả lời theo loại câu hỏi ──
	const renderAnswerArea = () => {
		const lockClass = checked ? "pointer-events-none" : "";

		// Trắc nghiệm / Đúng-Sai / Chọn nhiều
		if (question.type === "multiple_choice" || question.type === "multiple_select") {
			const multi = question.type === "multiple_select";
			return (
				<div className={`grid gap-3 sm:grid-cols-2 ${lockClass}`}>
					{question.options.map((opt) => {
						const active = answer.selected.includes(opt.id);
						const showCorrect = checked && opt.is_correct;
						const showWrong = checked && active && !opt.is_correct;
						return (
							<button
								key={opt.id}
								type='button'
								onClick={() =>
									setAnswer((a) => ({
										...a,
										selected: multi
											? active
												? a.selected.filter((id) => id !== opt.id)
												: [...a.selected, opt.id]
											: [opt.id],
									}))
								}
								className={[
									"flex flex-col rounded-2xl border-2 border-black p-4 text-left font-heading font-extrabold transition",
									"shadow-[3px_3px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none",
									showCorrect
										? "bg-green-100 text-green-800"
										: showWrong
											? "bg-red-100 text-red-800"
											: active
												? "bg-[var(--color-primary)]"
												: "bg-white",
								].join(" ")}>
								<OptionImage src={opt.image} />
								<span>{opt.content}</span>
							</button>
						);
					})}
				</div>
			);
		}

		// Điền đáp án
		if (question.type === "fill_blank") {
			return (
				<input
					value={answer.text}
					onChange={(e) => setAnswer((a) => ({ ...a, text: e.target.value }))}
					disabled={checked}
					placeholder='Nhập câu trả lời...'
					className={`w-full rounded-2xl border-2 border-black px-5 py-4 font-heading text-lg font-extrabold outline-none focus:border-black focus:shadow-[0_0_0_3px_#A3E635] ${
						checked
							? currentCorrect
								? "bg-green-100 text-green-800"
								: "bg-red-100 text-red-800"
							: "bg-white"
					}`}
				/>
			);
		}

		// Chọn từ điền vào chỗ trống
		if (question.type === "word_bank_fill_blank") {
			const parts = question.content.split("___");
			const placedIds = answer.slots.filter((s): s is number => s !== null);
			const optById = new Map(question.options.map((o) => [o.id, o]));
			const slotMap = checked ? correctSlotMap(question) : null;
			return (
				<div className={lockClass}>
					<div className='flex flex-wrap items-center gap-2 rounded-2xl border-2 border-black bg-white p-5 text-lg font-extrabold'>
						{parts.map((part, i) => (
							<React.Fragment key={i}>
								<span>{part}</span>
								{i < parts.length - 1 && (
									<button
										type='button'
										onClick={() =>
											setAnswer((a) => {
												const slots = [...a.slots];
												slots[i] = null;
												return { ...a, slots };
											})
										}
										className={`min-w-20 rounded-lg border-2 border-dashed border-black px-3 py-1 font-heading ${
											slotMap
												? answer.slots[i] === slotMap.get(i)?.id
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
												: "bg-gray-100 text-gray-800"
										}`}>
										{answer.slots[i] != null
											? optById.get(answer.slots[i] as number)?.content
											: "____"}
									</button>
								)}
							</React.Fragment>
						))}
					</div>
					<div className='mt-4 flex flex-wrap gap-2'>
						{prepared.banks.map((opt) => {
							const used = placedIds.includes(opt.id);
							return (
								<Chip
									key={opt.id}
									tone={used ? "muted" : "default"}
									disabled={used}
									onClick={() =>
										setAnswer((a) => {
											const next = a.slots.findIndex((s) => s === null);
											if (next === -1) return a;
											const slots = [...a.slots];
											slots[next] = opt.id;
											return { ...a, slots };
										})
									}>
									{opt.content}
								</Chip>
							);
						})}
					</div>
				</div>
			);
		}

		// Sắp xếp từ thành câu (word bank theo thứ tự)
		if (question.type === "word_order") {
			const optById = new Map(question.options.map((o) => [o.id, o]));
			const expected = checked ? expectedWordOrder(question) : null;
			return (
				<div className={lockClass}>
					<div className='flex min-h-20 flex-wrap items-center gap-2 rounded-2xl border-2 border-black bg-white p-4'>
						{answer.sequence.length === 0 && (
							<span className='font-medium text-gray-400'>
								Chạm vào các từ bên dưới để sắp xếp...
							</span>
						)}
						{answer.sequence.map((id, pos) => {
							const tone = expected
								? expected[pos] === id
									? "bg-green-100 text-green-800"
									: "bg-red-100 text-red-800"
								: "bg-[var(--color-primary)]";
							return (
								<button
									key={`${id}-${pos}`}
									type='button'
									onClick={() =>
										setAnswer((a) => ({
											...a,
											sequence: a.sequence.filter((_, p) => p !== pos),
										}))
									}
									className={`rounded-xl border-2 border-black px-4 py-2 font-heading text-sm font-extrabold shadow-[2px_2px_0_#111] ${tone}`}>
									{optById.get(id)?.content}
								</button>
							);
						})}
					</div>
					{expected && !currentCorrect && (
						<div className='mt-3 flex flex-wrap gap-2'>
							{expected.map((id, index) => (
								<span
									key={`expected-${id}`}
									className='rounded-lg bg-green-100 px-3 py-1 font-heading text-sm font-bold text-green-800'>
									{index + 1}. {optById.get(id)?.content}
								</span>
							))}
						</div>
					)}
					<div className='mt-4 flex flex-wrap gap-2'>
						{prepared.banks.map((opt) => {
							const used = answer.sequence.includes(opt.id);
							return (
								<Chip
									key={opt.id}
									tone={used ? "muted" : "default"}
									disabled={used}
									onClick={() =>
										setAnswer((a) => ({
											...a,
											sequence: [...a.sequence, opt.id],
										}))
									}>
									{opt.content}
								</Chip>
							);
						})}
					</div>
				</div>
			);
		}

		// Ghép đôi — phản hồi tức thì: ghép đúng giữ xanh, ghép sai chớp đỏ rồi bỏ chọn.
		if (question.type === "matching") {
			const lefts = leftOptions(question);
			const matchedIds = new Set(answer.pairs.flatMap(([l, r]) => [l, r]));

			const handleMatchSelect = (side: "left" | "right", id: number) => {
				if (matchedIds.has(id) || matchWrong) return;

				// Chưa chọn gì → chọn ô này.
				if (!matchSelected) {
					setMatchSelected({ side, id });
					return;
				}
				// Bấm lại cùng phía → đổi/bỏ chọn.
				if (matchSelected.side === side) {
					setMatchSelected(matchSelected.id === id ? null : { side, id });
					return;
				}
				// Khác phía → kiểm tra cặp.
				const leftId = side === "left" ? id : matchSelected.id;
				const rightId = side === "right" ? id : matchSelected.id;
				const left = question.options.find((o) => o.id === leftId);
				const right = question.options.find((o) => o.id === rightId);

				if (left?.metadata?.pairId && left.metadata.pairId === right?.metadata?.pairId) {
					setAnswer((a) => ({
						...a,
						pairs: [...a.pairs, [leftId, rightId] as [number, number]],
					}));
					setMatchSelected(null);
				} else {
					setMatchWrong({ leftId, rightId });
					setMatchSelected(null);
					window.setTimeout(() => setMatchWrong(null), 700);
				}
			};

			const toneFor = (id: number) => {
				if (matchWrong && (matchWrong.leftId === id || matchWrong.rightId === id))
					return "bg-red-100 text-red-800 opacity-70";
				if (matchedIds.has(id)) return "bg-green-100 text-green-800 opacity-70";
				if (matchSelected?.id === id) return "bg-[var(--color-primary)]";
				return "bg-white";
			};

			const renderColumn = (items: QuizOption[], side: "left" | "right") => (
				<div className='flex flex-col gap-2'>
					{items.map((opt) => (
						<button
							key={opt.id}
							type='button'
							disabled={matchedIds.has(opt.id)}
							onClick={() => handleMatchSelect(side, opt.id)}
							className={`rounded-2xl border-2 border-black p-3 text-left font-heading font-extrabold shadow-[3px_3px_0_#111] transition disabled:cursor-default ${toneFor(
								opt.id,
							)}`}>
							{opt.content}
						</button>
					))}
				</div>
			);

			return (
				<div className='grid grid-cols-2 gap-3'>
					{renderColumn(lefts, "left")}
					{renderColumn(prepared.rights, "right")}
				</div>
			);
		}

		return null;
	};

	// ─── Playing layout ──
	return (
		<div className='flex h-[100dvh] flex-col pt-16 overflow-hidden bg-white'>
			{/* Top bar: X + progress */}
			<div className='mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-5 shrink-0'>
				<button
					type='button'
					onClick={() => navigate(lessonHref)}
					aria-label='Đóng quiz'
					className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white transition hover:bg-gray-100'>
					<X className='h-5 w-5' strokeWidth={2.5} />
				</button>
				<div className='h-4 flex-1 overflow-hidden rounded-full bg-gray-200'>
					<div
						className='h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300'
						style={{ width: `${((index + (checked ? 1 : 0)) / total) * 100}%` }}
					/>
				</div>
				<span className='shrink-0 font-heading text-sm font-extrabold text-gray-500'>
					{index + 1}/{total}
				</span>
			</div>

			{/* Question */}
			<div className='mx-auto w-full max-w-3xl flex-1 px-4 overflow-y-auto min-h-0 pb-6'>
				<p className='font-heading text-xs font-extrabold uppercase tracking-widest text-gray-400'>
					{questionTypeLabel}
				</p>
				<h2 className='mt-1 font-heading text-2xl font-extrabold leading-snug'>
					{question.type === "word_bank_fill_blank" ? "" : question.content}
				</h2>
				{question.image && (
					<img
						src={question.image}
						alt=''
						className='mt-4 max-h-60 rounded-2xl border-2 border-black object-cover'
					/>
				)}
				<div className='mt-6'>{renderAnswerArea()}</div>
			</div>

			{/* Feedback + action bar */}
			<div
				className={[
					"shrink-0",
					checked
						? currentCorrect
							? "bg-green-100 text-green-800"
							: "bg-red-100 text-red-800"
						: "bg-white",
				].join(" ")}>
				<div className='mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between'>
					{checked ? (
						<div
							className={`flex gap-2 ${
								question.explanation ? "items-start" : "items-center"
							}`}>
							<span
								className={[
									"flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white",
								].join(" ")}>
								{currentCorrect ? (
									<Check className='h-5 w-5 text-green-700' strokeWidth={5} />
								) : (
									<X className='h-5 w-5 text-red-700' strokeWidth={5} />
								)}
							</span>
							<div>
								<p
									className={`font-heading font-extrabold ${
										question.explanation ? "" : "text-xl"
									}`}>
									{currentCorrect ? (
										question.type === "matching" ? (
											"Xuất sắc! Bạn đã ghép đúng tất cả các cặp."
										) : (
											"Chính xác!"
										)
									) : question.type === "fill_blank" ||
									  question.type === "word_bank_fill_blank" ? (
										<>
											Đáp án:{" "}
											<span
												className='font-extrabold'
												dangerouslySetInnerHTML={{
													__html: revealText(question),
												}}
											/>
										</>
									) : (
										"Chưa đúng"
									)}
								</p>
								{question.explanation && (
									<p
										className={`mt-1 flex items-start gap-1 text-sm font-medium ${
											currentCorrect ? "text-green-700" : "text-red-700"
										}`}>
										{question.explanation}
									</p>
								)}
							</div>
						</div>
					) : (
						<span className='hidden text-sm font-bold text-gray-400 sm:block'>
							{question.type === "matching"
								? "Chạm 1 ô bên trái rồi 1 ô bên phải để ghép"
								: "Chọn câu trả lời của bạn"}
						</span>
					)}

					{checked ? (
						<button
							type='button'
							onClick={handleContinue}
							disabled={submitting}
							className='inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-black px-6 py-3 font-heading text-base font-extrabold text-white shadow-[4px_4px_0_#555] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#555] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60'>
							{index < total - 1
								? "Tiếp tục"
								: submitting
									? "Đang nộp..."
									: "Xem kết quả"}
							<ArrowRight className='h-5 w-5' strokeWidth={2.5} />
						</button>
					) : question.type === "matching" ? null : (
						<button
							type='button'
							onClick={handleCheck}
							disabled={!answered}
							className='inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 py-3 font-heading text-base font-extrabold shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none'>
							Kiểm tra
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default QuizPlayPage;
