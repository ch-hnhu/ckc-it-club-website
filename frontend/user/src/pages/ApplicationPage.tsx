import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowRight, CheckCircle, ClipboardList, Loader2, AlertCircle, ShieldAlert, LogIn } from "lucide-react";
import { toast } from "sonner";
import type { AuthUser } from "@/services/auth.service";
import { applicationService } from "@/services/application.service";
import type {
	ApplicationQuestion,
	ApplicationStatus,
	ClubApplicationResponse,
} from "@/types/application.types";
import NeoSelect from "@/components/ui/NeoSelect";

type OutletContext = {
	user: AuthUser | null;
	loadingUser: boolean;
};

const STATUS_MAP: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
	pending: { label: "Chờ duyệt", color: "text-amber-700", bg: "bg-amber-50 border-amber-300" },
	processing: { label: "Đang xử lý", color: "text-sky-700", bg: "bg-sky-50 border-sky-300" },
	interview: {
		label: "Mời phỏng vấn",
		color: "text-violet-700",
		bg: "bg-violet-50 border-violet-300",
	},
	passed: {
		label: "Đã đạt — Chào mừng bạn!",
		color: "text-emerald-700",
		bg: "bg-emerald-50 border-emerald-300",
	},
	failed: { label: "Không đạt", color: "text-rose-700", bg: "bg-rose-50 border-rose-300" },
};

function QuestionField({
	question,
	value,
	onChange,
}: {
	question: ApplicationQuestion;
	value: string;
	onChange: (val: string) => void;
}) {
	const inputClass =
		"w-full px-4 py-3 border-2 border-black rounded-xl text-sm bg-white focus:outline-none focus:shadow-[0_0_0_3px_#A3E635] transition-shadow";

	if (question.type === "textarea") {
		return (
			<textarea
				rows={4}
				required={question.is_required}
				placeholder="Nhập câu trả lời của bạn..."
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={`${inputClass} resize-none`}
			/>
		);
	}

	if (question.type === "radio") {
		return (
			<div className="space-y-3">
				{question.options.map((option) => (
					<label
						key={option.id}
						className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
							value === option.value
								? "border-black bg-[var(--color-primary-100)] shadow-[2px_2px_0_#111]"
								: "border-gray-300 hover:border-gray-500 bg-white"
						}`}>
						<input
							type="radio"
							name={`question-${question.id}`}
							value={option.value}
							checked={value === option.value}
							onChange={() => onChange(option.value)}
							required={question.is_required && !value}
							className="sr-only"
						/>
						<span
							className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
								value === option.value ? "border-black bg-black" : "border-gray-400"
							}`}>
							{value === option.value && (
								<span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
							)}
						</span>
						<span className="text-sm font-medium text-gray-800">{option.label}</span>
					</label>
				))}
			</div>
		);
	}

	if (question.type === "select") {
		return (
			<NeoSelect
				value={value}
				onChange={onChange}
				placeholder="-- Chọn một đáp án --"
				options={question.options.map((opt) => ({ value: opt.value, label: opt.label }))}
			/>
		);
	}

	return (
		<input
			type="text"
			required={question.is_required}
			placeholder="Nhập câu trả lời của bạn..."
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className={inputClass}
		/>
	);
}

const ApplicationPage: React.FC = () => {
	const { user, loadingUser } = useOutletContext<OutletContext>();
	const navigate = useNavigate();
	const sectionRef = useRef<HTMLElement>(null);

	const [recruitmentEnabled, setRecruitmentEnabled] = useState<boolean | null>(null);
	const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
	const [loadingQuestions, setLoadingQuestions] = useState(true);
	const [existingApp, setExistingApp] = useState<ClubApplicationResponse | null>(null);
	const [checkingApp, setCheckingApp] = useState(false);
	const [answers, setAnswers] = useState<Record<number, string>>({});
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	useEffect(() => {
		const el = sectionRef.current;
		if (!el) return;
		const items = el.querySelectorAll(".fade-in-up");
		const observer = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
			{ threshold: 0.1 },
		);
		items.forEach((item) => observer.observe(item));
		return () => observer.disconnect();
	}, []);

	// Fetch recruitment config (no auth needed)
	useEffect(() => {
		applicationService.getRecruitmentEnabled().then(setRecruitmentEnabled);
	}, []);

	useEffect(() => {
		if (loadingUser || !user) return;
		// Don't load questions/existing-app while config is still loading or if form is closed
		if (recruitmentEnabled === null || recruitmentEnabled === false) {
			setLoadingQuestions(false);
			return;
		}
		if (user.roles?.includes("club-member") || !user.is_school_student) {
			setLoadingQuestions(false);
			return;
		}

		setCheckingApp(true);
		applicationService
			.getMyApplication()
			.then((app) => setExistingApp(app))
			.finally(() => setCheckingApp(false));

		applicationService
			.getQuestions()
			.then((data) => {
				const active = data
					.filter((q) => q.is_active)
					.sort((a, b) => a.order_index - b.order_index);
				setQuestions(active);
				const initial: Record<number, string> = {};
				active.forEach((q) => (initial[q.id] = ""));
				setAnswers(initial);
			})
			.catch(() => setFetchError("Không thể tải form ứng tuyển. Vui lòng thử lại sau."))
			.finally(() => setLoadingQuestions(false));
	}, [user, loadingUser, recruitmentEnabled]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const payload = questions
			.filter((q) => answers[q.id]?.trim())
			.map((q) => ({ question_id: q.id, answer_value: answers[q.id].trim() }));

		const missing = questions.filter((q) => q.is_required && !answers[q.id]?.trim());
		if (missing.length > 0) {
			toast.error(`Vui lòng điền đầy đủ ${missing.length} câu hỏi bắt buộc.`);
			return;
		}

		try {
			setSubmitting(true);
			await applicationService.submitApplication({ answers: payload });
			setSubmitted(true);
			window.scrollTo({ top: 0, behavior: "smooth" });
		} catch {
			toast.error("Gửi đơn thất bại. Vui lòng kiểm tra lại và thử lại.");
		} finally {
			setSubmitting(false);
		}
	};

	const isClubMember = user?.roles?.includes("club-member") ?? false;
	const isSchoolStudent = user?.is_school_student ?? false;
	const isLoading =
		recruitmentEnabled === null ||
		loadingUser ||
		(!!user && !isClubMember && isSchoolStudent && recruitmentEnabled && (loadingQuestions || checkingApp));

	return (
		<section
			ref={sectionRef}
			className="min-h-screen bg-white pt-16">
			<div className="neo-container px-6 py-14">
				{/* Loading */}
				{isLoading && (
					<div className="flex flex-col items-center justify-center py-24 gap-4">
						<Loader2 className="w-10 h-10 animate-spin text-gray-400" />
						<p className="text-gray-500 font-medium">Đang tải...</p>
					</div>
				)}

				{/* Not logged in — hiển thị tiêu đề form + yêu cầu đăng nhập */}
				{!isLoading && !user && (
					<div className="max-w-2xl mx-auto">
						<div
							className="rounded-2xl border-2 border-black overflow-hidden"
							style={{ boxShadow: "var(--neo-shadow)" }}>
							{/* Form header */}
							<div
								className="px-8 py-6 border-b-2 border-black"
								style={{ background: "var(--color-primary)" }}>
								<h2
									className="text-2xl font-extrabold text-black"
									style={{ fontFamily: "var(--font-heading)" }}>
									Form ứng tuyển thành viên
								</h2>
							</div>

							<div className="px-8 py-14 text-center">
								<LogIn className="w-12 h-12 text-gray-400 mx-auto mb-4" />
								<p className="font-bold text-gray-700 text-lg">
									Vui lòng đăng nhập để ứng tuyển
								</p>
								<p className="text-sm text-gray-500 mt-1 mb-6">
									Bạn cần đăng nhập bằng tài khoản sinh viên Cao Thắng để nộp đơn
									ứng tuyển thành viên CLB.
								</p>
								<Link
									to="/login"
									state={{ from: "/ung-tuyen" }}
									className="neo-btn neo-btn-primary text-sm px-6 py-3">
									<LogIn className="w-4 h-4" />
									Đăng nhập
								</Link>
							</div>
						</div>
					</div>
				)}

				{/* Submitted success */}
				{!isLoading && submitted && (
					<div
						className="max-w-lg mx-auto rounded-2xl border-2 border-black p-10 text-center"
						style={{ boxShadow: "var(--neo-shadow)", background: "var(--color-primary)" }}>
						<CheckCircle className="w-14 h-14 mx-auto mb-5 text-black" />
						<h2
							className="text-3xl font-extrabold text-black mb-3"
							style={{ fontFamily: "var(--font-heading)" }}>
							Đã gửi đơn thành công!
						</h2>
						<p className="text-gray-800 mb-7 leading-relaxed">
							Cảm ơn bạn đã ứng tuyển. Ban Nhân sự CKC IT CLUB sẽ xem xét hồ sơ và liên
							hệ với bạn trong thời gian sớm nhất.
						</p>
						<button
							onClick={() => navigate("/")}
							className="neo-btn neo-btn-secondary text-sm px-6 py-3">
							Về trang chủ
							<ArrowRight className="w-4 h-4" />
						</button>
					</div>
				)}

				{/* Already a club member */}
				{!isLoading && !submitted && isClubMember && (
					<div className="max-w-lg mx-auto">
						<div
							className="rounded-2xl border-2 border-black p-8 text-center"
							style={{ boxShadow: "var(--neo-shadow)", background: "var(--color-primary)" }}>
							<CheckCircle className="w-12 h-12 mx-auto mb-4 text-black" />
							<h2
								className="text-2xl font-extrabold text-black mb-2"
								style={{ fontFamily: "var(--font-heading)" }}>
								Bạn đã là thành viên CLB!
							</h2>
							<p className="text-gray-800 mb-6">
								Chào mừng bạn đến với CKC IT CLUB. Hãy tham gia cộng đồng và khám phá
								các hoạt động của CLB.
							</p>
							<Link to="/cong-dong" className="neo-btn neo-btn-secondary text-sm px-6 py-3">
								Vào cộng đồng
								<ArrowRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				)}

				{/* Not a school student */}
				{!isLoading && !submitted && !isClubMember && user && !isSchoolStudent && (
					<div className="max-w-lg mx-auto">
						<div
							className="rounded-2xl border-2 border-black p-8 text-center"
							style={{ boxShadow: "var(--neo-shadow)" }}>
							<ShieldAlert className="w-12 h-12 mx-auto mb-4 text-amber-500" />
							<h2
								className="text-2xl font-extrabold text-black mb-2"
								style={{ fontFamily: "var(--font-heading)" }}>
								Chỉ dành cho sinh viên CKC
							</h2>
							<p className="text-gray-600 mb-6 leading-relaxed text-sm">
								Chức năng ứng tuyển chỉ dành cho sinh viên trường Cao Thắng với email
								có định dạng <span className="font-semibold">MSSV@caothang.edu.vn</span>.
								Tài khoản của bạn không thuộc trường.
							</p>
							<Link to="/" className="neo-btn neo-btn-secondary text-sm px-6 py-3">
								Về trang chủ
								<ArrowRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				)}

			{/* Recruitment closed */}
				{!isLoading && !submitted && user && !isClubMember && recruitmentEnabled === false && (
					<div className="max-w-lg mx-auto">
						<div
							className="rounded-2xl border-2 border-black p-8 text-center"
							style={{ boxShadow: "var(--neo-shadow)" }}>
							<ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-400" />
							<h2
								className="text-2xl font-extrabold text-black mb-2"
								style={{ fontFamily: "var(--font-heading)" }}>
								Form ứng tuyển đang đóng
							</h2>
							<p className="text-gray-600 mb-6 leading-relaxed text-sm">
								CLB hiện chưa mở đợt tuyển thành viên mới. Hãy theo dõi fanpage để
								cập nhật thông tin sớm nhất.
							</p>
							<Link to="/" className="neo-btn neo-btn-secondary text-sm px-6 py-3">
								Về trang chủ
								<ArrowRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				)}

			{/* Already applied */}
				{!isLoading && !submitted && !isClubMember && isSchoolStudent && existingApp && (
					<div className="max-w-lg mx-auto">
						<div
							className="rounded-2xl border-2 border-black p-8 text-center"
							style={{ boxShadow: "var(--neo-shadow)" }}>
							<CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
							<h2
								className="text-2xl font-extrabold text-black mb-2"
								style={{ fontFamily: "var(--font-heading)" }}>
								Bạn đã nộp đơn ứng tuyển
							</h2>
							<p className="text-gray-600 mb-6">
								Đơn ứng tuyển của bạn đang được xử lý.
								<br />Trạng thái hiện tại:
							</p>
							{(() => {
								const s = STATUS_MAP[existingApp.status];
								return (
									<span
										className={`inline-block px-5 py-2 rounded-full border-2 font-bold text-sm ${s.bg} ${s.color}`}>
										{s.label}
									</span>
								);
							})()}
							<p className="text-xs text-gray-400 mt-4">
								Mã đơn: APP-{existingApp.id}
								{existingApp.created_at &&
									` · Nộp lúc ${new Date(existingApp.created_at).toLocaleDateString("vi-VN")}`}
							</p>
						</div>
						<div className="mt-6 text-center">
							<Link to="/" className="neo-btn neo-btn-secondary text-sm px-5 py-2.5">
								Về trang chủ
							</Link>
						</div>
					</div>
				)}

				{/* Fetch error */}
				{!isLoading && !submitted && !isClubMember && recruitmentEnabled && isSchoolStudent && !existingApp && user && fetchError && (
					<div
						className="max-w-md mx-auto rounded-2xl border-2 border-red-300 bg-red-50 p-8 text-center"
						style={{ boxShadow: "4px 4px 0 #f87171" }}>
						<AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
						<p className="font-bold text-red-700 mb-2">Không thể tải form</p>
						<p className="text-red-600 text-sm">{fetchError}</p>
					</div>
				)}

				{/* Form */}
				{!isLoading && !submitted && !isClubMember && recruitmentEnabled && isSchoolStudent && !existingApp && user && !fetchError && (
					<div className="max-w-2xl mx-auto">
						<div
							className="rounded-2xl border-2 border-black overflow-hidden"
							style={{ boxShadow: "var(--neo-shadow)" }}>
							{/* Form header */}
							<div
								className="px-8 py-6 border-b-2 border-black"
								style={{ background: "var(--color-primary)" }}>
								<h2
									className="text-2xl font-extrabold text-black"
									style={{ fontFamily: "var(--font-heading)" }}>
									Form ứng tuyển thành viên
								</h2>
								<p className="text-sm text-gray-700 mt-1">
									Điền thông tin đầy đủ và trung thực. Câu có dấu{" "}
									<span className="text-red-500 font-bold">*</span> là bắt buộc.
								</p>
							</div>

							{questions.length === 0 ? (
								<div className="px-8 py-14 text-center">
									<ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
									<p className="font-bold text-gray-500">
										Form ứng tuyển chưa được mở.
									</p>
									<p className="text-sm text-gray-400 mt-1">
										Ban Nhân sự sẽ mở đơn ứng tuyển sớm. Hãy theo dõi fanpage để
										cập nhật.
									</p>
								</div>
							) : (
								<form onSubmit={(e) => void handleSubmit(e)} className="px-8 py-8 space-y-8">
									{questions.map((q, i) => (
										<div key={q.id} className="space-y-3">
											<label className="block">
												<span
													className="text-base font-extrabold text-black"
													style={{ fontFamily: "var(--font-heading)" }}>
													{i + 1}. {q.label}
													{q.is_required && (
														<span className="text-red-500 ml-1">*</span>
													)}
												</span>
											</label>
											<QuestionField
												question={q}
												value={answers[q.id] ?? ""}
												onChange={(val) =>
													setAnswers((prev) => ({ ...prev, [q.id]: val }))
												}
											/>
										</div>
									))}

									<div className="pt-4 border-t-2 border-dashed border-gray-200">
										<button
											type="submit"
											disabled={submitting}
											className="neo-btn neo-btn-primary w-full justify-center py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed">
											{submitting ? (
												<>
													<Loader2 className="w-5 h-5 animate-spin" />
													Đang gửi đơn...
												</>
											) : (
												<>
													Nộp đơn ứng tuyển
													<ArrowRight className="w-5 h-5" />
												</>
											)}
										</button>
										<p className="text-xs text-gray-500 text-center mt-3">
											Bằng cách nộp đơn, bạn đồng ý để CLB liên hệ qua email tài
											khoản của bạn.
										</p>
									</div>
								</form>
							)}
						</div>
					</div>
				)}
			</div>
		</section>
	);
};

export default ApplicationPage;
