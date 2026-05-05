import React, { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import {
	ArrowRight,
	CheckCircle2,
	Clock,
	Facebook,
	Github,
	HelpCircle,
	Mail,
	MessageCircle,
	NotepadText,
	Send,
	UserRound,
} from "lucide-react";

import { contactService } from "@/services/contact.service";
import type { ApiErrorResponse } from "@/types/api.types";

const CONTACT_METHODS = [
	{
		title: "Email",
		value: "ckcitclub@caothang.edu.vn",
		desc: "Phản hồi trong 24h",
		bg: "var(--color-pastel-blue)",
		emoji: "📧",
	},
	{
		title: "Hotline",
		value: "(+84) 123 456 789",
		desc: "8:00 - 17:00, T2-T6",
		bg: "var(--color-pastel-green)",
		emoji: "📞",
	},
	{
		title: "Địa chỉ",
		value: "Phòng IT-01, Tòa A",
		desc: "Trường CĐ Kỹ thuật Cao Thắng",
		bg: "var(--color-pastel-yellow)",
		emoji: "📍",
	},
];

const CONTACT_SUBJECTS = [
	"Muốn tham gia CLB",
	"Hợp tác/Đối tác",
	"Đóng góp tài nguyên",
	"Hỏi đáp về hoạt động",
	"Khác",
];

const SOCIAL_LINKS = [
	{ icon: Facebook, label: "Facebook", href: "#", color: "#1877F2" },
	{ icon: Github, label: "GitHub", href: "#", color: "#111" },
	{ icon: MessageCircle, label: "Discord", href: "#", color: "#5865F2" },
];

const FAQS = [
	{
		q: "Làm sao để tham gia CLB?",
		a: "Bạn có thể đăng ký trực tiếp qua form này hoặc đến phòng IT-01 vào các buổi chiều thứ 2, 4, 6.",
	},
	{
		q: "CLB có thu phí thành viên không?",
		a: "Hoàn toàn miễn phí. CLB hoạt động phi lợi nhuận với mục tiêu chia sẻ kiến thức IT.",
	},
	{
		q: "Mình không học IT có tham gia được không?",
		a: "Có. CLB chào đón tất cả sinh viên quan tâm đến công nghệ, không phân biệt ngành học.",
	},
];

const INITIAL_FORM_STATE = {
	name: "",
	email: "",
	subject: "",
	message: "",
};

type ContactFormState = typeof INITIAL_FORM_STATE;

type FeedbackState =
	| {
			type: "success" | "error";
			message: string;
	  }
	| null;

function getErrorMessage(error: unknown) {
	if (isAxiosError<ApiErrorResponse>(error)) {
		const response = error.response?.data;
		const firstError = response?.errors
			? Object.values(response.errors).find((messages) => messages?.length)?.[0]
			: null;

		return firstError ?? response?.message ?? "Không thể gửi liên hệ lúc này.";
	}

	return "Không thể gửi liên hệ lúc này.";
}

const ContactPage: React.FC = () => {
	const [formState, setFormState] = useState<ContactFormState>(INITIAL_FORM_STATE);
	const [feedback, setFeedback] = useState<FeedbackState>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [openFaq, setOpenFaq] = useState<number | null>(0);

	const heroRef = useRef<HTMLDivElement>(null);
	const sectionRef = useRef<HTMLElement>(null);
	const faqRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const allItems = document.querySelectorAll(".fade-in-up");
		const observer = new IntersectionObserver(
			(entries) =>
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("visible");
					}
				}),
			{ threshold: 0.1 },
		);

		allItems.forEach((item) => observer.observe(item));

		return () => observer.disconnect();
	}, []);

	const handleChange =
		(field: keyof ContactFormState) =>
		(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
			setFormState((prev) => ({
				...prev,
				[field]: event.target.value,
			}));

			if (feedback?.type === "error") {
				setFeedback(null);
			}
		};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmitting(true);
		setFeedback(null);

		try {
			const response = await contactService.submit({
				full_name: formState.name.trim(),
				email: formState.email.trim(),
				subject: formState.subject,
				message: formState.message.trim(),
			});

			setFormState(INITIAL_FORM_STATE);
			setFeedback({
				type: "success",
				message: response.message || "Gửi liên hệ thành công.",
			});
			sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		} catch (error) {
			setFeedback({
				type: "error",
				message: getErrorMessage(error),
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<section
				ref={heroRef}
				className='relative flex min-h-[40vh] items-center overflow-hidden bg-white pt-20 pb-10 lg:min-h-[50vh]'>
				<div className='neo-container relative z-10 px-6'>
					<div className='mx-auto max-w-3xl text-center'>
						<div
							className='fade-in-up inline-flex items-center rounded-full border-2 border-black px-3 py-1 text-xs font-semibold'
							style={{
								background: "var(--color-pastel-amber)",
								border: "2px solid #111",
								boxShadow: "2px 2px 0px #111",
							}}>
							Liên hệ CKC IT CLUB
						</div>

						<h1
							className='fade-in-up mt-4 text-3xl font-extrabold leading-tight text-black md:text-5xl'
							style={{ transitionDelay: "0.1s" }}>
							Gửi tin nhắn cho{" "}
							<span
								style={{
									background: "var(--color-primary)",
									padding: "0 0.2em",
									border: "2px solid #111",
									borderRadius: "8px",
									boxShadow: "3px 3px 0px #111",
								}}>
								tụi mình
							</span>
						</h1>
						<p
							className='fade-in-up mx-auto mt-3 max-w-xl text-base text-gray-600 md:text-lg'
							style={{ transitionDelay: "0.2s" }}>
							Nếu bạn có câu hỏi về hoạt động CLB, tài nguyên học tập hoặc muốn hợp
							tác, hãy để lại thông tin bên dưới.
						</p>
					</div>
				</div>
			</section>

			<section
				ref={sectionRef}
				className='neo-section'
				style={{ background: "var(--color-surface)" }}>
				<div className='neo-container px-6 py-10 md:py-14'>
					<div className='mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-5'>
						<div className='fade-in-up lg:col-span-3'>
							<div
								className='neo-card neo-card-static relative p-6 md:p-8'
								style={{ background: "white" }}>
								<img
									src='/assets/img/13.png'
									alt=''
									className='pointer-events-none absolute -top-5 right-3 h-12 w-12 md:h-16 md:w-16'
								/>

								<div className='mb-6 flex items-center gap-3'>
									<div>
										<h2 className='text-xl font-bold text-black'>Gửi liên hệ</h2>
										<p className='text-sm text-gray-500'>
											Dữ liệu sẽ được lưu trực tiếp vào hệ thống và tụi mình sẽ phản
											hồi sớm nhất có thể.
										</p>
									</div>
								</div>

								{feedback ? (
									<div
										className='mb-5 rounded-2xl border-2 border-black px-4 py-3'
										style={{
											background:
												feedback.type === "success"
													? "var(--color-pastel-green)"
													: "var(--color-pastel-pink)",
											boxShadow: "3px 3px 0px #111",
										}}>
										<div className='flex items-start gap-3'>
											{feedback.type === "success" ? (
												<CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-black' />
											) : (
												<HelpCircle className='mt-0.5 h-5 w-5 shrink-0 text-black' />
											)}
											<div>
												<p className='text-sm font-bold text-black'>
													{feedback.type === "success"
														? "Gửi thành công"
														: "Gửi thất bại"}
												</p>
												<p className='text-sm text-black/75'>{feedback.message}</p>
											</div>
										</div>
									</div>
								) : null}

								<form onSubmit={handleSubmit} className='space-y-5'>
									<div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
										<div>
											<label
												htmlFor='name'
												className='mb-2 flex items-center gap-2 text-sm font-semibold text-black'>
												<UserRound className='h-4 w-4' />
												Họ và tên
											</label>
											<input
												id='name'
												name='name'
												type='text'
												placeholder='Nhập họ và tên của bạn'
												required
												value={formState.name}
												onChange={handleChange("name")}
												className='w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm transition-all focus:border-black focus:outline-none focus:shadow-[0_0_0_3px_#A3E635]'
											/>
										</div>
										<div>
											<label
												htmlFor='email'
												className='mb-2 flex items-center gap-2 text-sm font-semibold text-black'>
												<Mail className='h-4 w-4' />
												Email
											</label>
											<input
												id='email'
												name='email'
												type='email'
												placeholder='Nhập email của bạn'
												required
												value={formState.email}
												onChange={handleChange("email")}
												className='w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm transition-all focus:border-black focus:outline-none focus:shadow-[0_0_0_3px_#A3E635]'
											/>
										</div>
									</div>

									<div>
										<label
											htmlFor='subject'
											className='mb-2 flex items-center gap-2 text-sm font-semibold text-black'>
											<HelpCircle className='h-4 w-4' />
											Chủ đề
										</label>
										<select
											id='subject'
											name='subject'
											required
											value={formState.subject}
											onChange={handleChange("subject")}
											className='w-full cursor-pointer appearance-none rounded-xl border-2 border-black bg-white px-4 py-3 text-sm transition-all focus:border-black focus:outline-none focus:shadow-[0_0_0_3px_#A3E635]'>
											<option value=''>Chọn chủ đề...</option>
											{CONTACT_SUBJECTS.map((subject) => (
												<option key={subject} value={subject}>
													{subject}
												</option>
											))}
										</select>
									</div>

									<div>
										<label
											htmlFor='message'
											className='mb-2 flex items-center gap-2 text-sm font-semibold text-black'>
											<NotepadText className='h-4 w-4' />
											Nội dung
										</label>
										<textarea
											id='message'
											name='message'
											placeholder='Bạn muốn nhắn gì cho CKC IT CLUB?'
											required
											rows={5}
											value={formState.message}
											onChange={handleChange("message")}
											className='w-full resize-y rounded-xl border-2 border-black bg-white px-4 py-3 text-sm transition-all focus:border-black focus:outline-none focus:shadow-[0_0_0_3px_#A3E635]'
										/>
									</div>

									<button
										type='submit'
										disabled={isSubmitting}
										className='neo-btn neo-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto'>
										{isSubmitting ? (
											<>
												<span className='mr-2 inline-block animate-spin'>⏳</span>
												Đang gửi...
											</>
										) : (
											<>
												Gửi liên hệ
												<Send className='h-4 w-4' />
											</>
										)}
									</button>
								</form>
							</div>
						</div>

						<div
							className='fade-in-up space-y-4 lg:col-span-2'
							style={{ transitionDelay: "0.1s" }}>
							{CONTACT_METHODS.map((method) => (
								<div
									key={method.title}
									className='neo-card neo-card-static group p-5'
									style={{ background: method.bg }}>
									<div className='flex items-start gap-4'>
										<div
											className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-white text-xl'
											style={{ boxShadow: "2px 2px 0px #111" }}>
											{method.emoji}
										</div>
										<div className='min-w-0 flex-1'>
											<h3 className='mb-1 text-sm font-bold uppercase tracking-wider text-black'>
												{method.title}
											</h3>
											<p className='truncate text-base font-semibold text-black'>
												{method.value}
											</p>
											<p className='mt-1 text-xs text-gray-600'>{method.desc}</p>
										</div>
									</div>
								</div>
							))}

							<div
								className='neo-card neo-card-static p-5'
								style={{ background: "var(--color-pastel-pink)" }}>
								<h3 className='mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-black'>
									<span className='text-lg'>🌐</span>
									Theo dõi chúng mình
								</h3>
								<div className='flex flex-wrap gap-3'>
									{SOCIAL_LINKS.map((social) => (
										<a
											key={social.label}
											href={social.href}
											className='flex items-center gap-2 rounded-lg border-2 border-black bg-white px-3 py-2 transition-all hover:shadow-[3px_3px_0_#111]'
											style={{ boxShadow: "2px 2px 0px #111" }}
											target='_blank'
											rel='noopener noreferrer'>
											<social.icon
												className='h-4 w-4'
												style={{ color: social.color }}
											/>
											<span className='text-sm font-semibold text-black'>
												{social.label}
											</span>
										</a>
									))}
								</div>
							</div>

							<div
								className='neo-card neo-card-static p-5'
								style={{ background: "var(--color-pastel-purple)" }}>
								<div className='mb-3 flex items-center gap-3'>
									<Clock className='h-5 w-5 text-black' />
									<h3 className='text-sm font-bold uppercase tracking-wider text-black'>
										Giờ hoạt động
									</h3>
								</div>
								<div className='space-y-2 text-sm'>
									<div className='flex items-center justify-between border-b border-black/10 py-2'>
										<span className='text-gray-700'>Thứ 2 - Thứ 6</span>
										<span className='font-semibold text-black'>8:00 - 17:00</span>
									</div>
									<div className='flex items-center justify-between border-b border-black/10 py-2'>
										<span className='text-gray-700'>Thứ 7</span>
										<span className='font-semibold text-black'>8:00 - 12:00</span>
									</div>
									<div className='flex items-center justify-between py-2'>
										<span className='text-gray-700'>Chủ nhật</span>
										<span className='font-semibold text-gray-500'>Nghỉ</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section ref={faqRef} className='neo-section bg-white'>
				<div className='neo-container px-6 py-12 md:py-14'>
					<div className='mx-auto max-w-3xl'>
						<div className='fade-in-up mb-10 text-center'>
							<div className='section-divider mx-auto' />
							<h2 className='mt-4 text-2xl font-extrabold text-black md:text-3xl'>
								Câu hỏi thường gặp
							</h2>
							<p className='mt-2 text-gray-500'>
								Những điều bạn có thể thắc mắc về CLB
							</p>
						</div>

						<div className='fade-in-up space-y-4' style={{ transitionDelay: "0.1s" }}>
							{FAQS.map((faq, idx) => (
								<div
									key={faq.q}
									className='neo-card neo-card-static overflow-hidden'
									style={{ background: "var(--color-surface)" }}>
									<button
										onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
										className='flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-black/5'>
										<span className='pr-4 font-bold text-black'>{faq.q}</span>
										<span
											className={`text-lg transition-transform duration-300 ${
												openFaq === idx ? "rotate-180" : ""
											}`}>
											▼
										</span>
									</button>
									<div
										className={`overflow-hidden transition-all duration-300 ${
											openFaq === idx ? "max-h-48" : "max-h-0"
										}`}>
										<div className='border-t-2 border-black/10 px-5 pt-4 pb-5'>
											<p className='text-sm leading-relaxed text-gray-600'>
												{faq.a}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>

						<div
							className='fade-in-up mt-10 text-center'
							style={{ transitionDelay: "0.2s" }}>
							<p className='mb-4 text-gray-600'>
								Không tìm thấy câu trả lời bạn cần?
							</p>
							<a
								href='#contact'
								className='neo-btn neo-btn-secondary inline-flex'
								onClick={(event) => {
									event.preventDefault();
									window.scrollTo({ top: 0, behavior: "smooth" });
								}}>
								Gửi câu hỏi ngay
								<ArrowRight className='h-4 w-4' />
							</a>
						</div>
					</div>
				</div>
			</section>
		</>
	);
};

export default ContactPage;
