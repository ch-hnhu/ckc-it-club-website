import React, { useEffect, useRef, useState } from "react";
import {
	Mail,
	NotepadText,
	Send,
	UserRound,
	MapPin,
	Phone,
	Clock,
	MessageCircle,
	Github,
	Facebook,
	ArrowRight,
	CheckCircle2,
	HelpCircle,
} from "lucide-react";

const CONTACT_METHODS = [
	{
		icon: Mail,
		title: "Email",
		value: "ckcitclub@caothang.edu.vn",
		desc: "Phản hồi trong 24h",
		bg: "var(--color-pastel-blue)",
		emoji: "📧",
	},
	{
		icon: Phone,
		title: "Hotline",
		value: "(+84) 123 456 789",
		desc: "8:00 - 17:00, T2-T6",
		bg: "var(--color-pastel-green)",
		emoji: "📞",
	},
	{
		icon: MapPin,
		title: "Địa chỉ",
		value: "Phòng IT-01, Tòa A",
		desc: "Trường CĐ Kỹ thuật Cao Thắng",
		bg: "var(--color-pastel-yellow)",
		emoji: "📍",
	},
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
		a: "Hoàn toàn miễn phí! Chúng mình hoạt động phi lợi nhuận với mục tiêu chia sẻ kiến thức IT.",
	},
	{
		q: "Mình không học IT có tham gia được không?",
		a: "Tất nhiên! CLB chào đón tất cả sinh viên quan tâm đến công nghệ, không phân biệt ngành học.",
	},
];

const ContactPage: React.FC = () => {
	const [formState, setFormState] = useState({
		name: "",
		email: "",
		subject: "",
		message: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [openFaq, setOpenFaq] = useState<number | null>(0);

	const heroRef = useRef<HTMLDivElement>(null);
	const sectionRef = useRef<HTMLElement>(null);
	const faqRef = useRef<HTMLElement>(null);

	useEffect(() => {
		// Observe all fade-in-up elements across sections
		const allItems = document.querySelectorAll(".fade-in-up");
		const observer = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
			{ threshold: 0.1 },
		);
		allItems.forEach((item) => observer.observe(item));
		return () => observer.disconnect();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1500));
		setIsSubmitting(false);
		setIsSubmitted(true);
		setFormState({ name: "", email: "", subject: "", message: "" });
		setTimeout(() => setIsSubmitted(false), 5000);
	};

	return (
		<>
			{/* Hero Section with floating decorations */}
			<section
				ref={heroRef}
				className='relative lg:min-h-[50vh] min-h-[40vh] flex items-center overflow-hidden bg-white pt-20 pb-10'>
				<div className='neo-container px-6 relative z-10'>
					<div className='max-w-3xl mx-auto text-center'>
						<div
							className='fade-in-up inline-flex items-center px-3 py-1 rounded-full border-2 border-black text-xs font-semibold'
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
							className='fade-in-up mt-3 text-base text-gray-600 md:text-lg max-w-xl mx-auto'
							style={{ transitionDelay: "0.2s" }}>
							Nếu bạn có câu hỏi về hoạt động CLB, tài nguyên học tập hoặc muốn hợp
							tác, hãy để lại thông tin bên dưới.
						</p>
					</div>
				</div>
			</section>

			{/* Contact Form & Info Section */}
			<section
				ref={sectionRef}
				className='neo-section'
				style={{ background: "var(--color-surface)" }}>
				<div className='neo-container px-6 py-10 md:py-14'>
					<div className='grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto'>
						{/* Contact Form - 3 cols */}
						<div className='lg:col-span-3 fade-in-up'>
							<div
								className='neo-card neo-card-static p-6 md:p-8 relative'
								style={{ background: "white" }}>
								{/* Quote decoration - sticky to form */}
								<img
									src='/assets/img/13.png'
									alt=''
									className='absolute -top-5 right-3 md:-top-5 md:right-3 w-12 h-12 md:w-16 md:h-16 pointer-events-none'
								/>
								<div className='flex items-center gap-3 mb-6'>
									<div>
										<h2 className='text-xl font-bold text-black'>
											Gửi liên hệ
										</h2>
										<p className='text-sm text-gray-500'>
											Chúng mình sẽ phản hồi sớm nhất có thể
										</p>
									</div>
								</div>

								{isSubmitted ? (
									<div className='flex flex-col items-center justify-center py-12 text-center'>
										<div
											className='w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 border-black'
											style={{
												background: "var(--color-pastel-green)",
												boxShadow: "3px 3px 0px #111",
											}}>
											<CheckCircle2 className='w-8 h-8 text-black' />
										</div>
										<h3 className='text-lg font-bold text-black mb-2'>
											Gửi thành công!
										</h3>
										<p className='text-sm text-gray-600'>
											Cảm ơn bạn đã liên hệ. Chúng mình sẽ phản hồi trong thời
											gian sớm nhất.
										</p>
									</div>
								) : (
									<form onSubmit={handleSubmit} className='space-y-5'>
										<div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
											<div>
												<label
													htmlFor='name'
													className='mb-2 flex items-center gap-2 text-sm font-semibold text-black'>
													<UserRound className='h-4 w-4' />
													Tên
												</label>
												<input
													id='name'
													name='name'
													type='text'
													placeholder='Nhập tên của bạn'
													required
													value={formState.name}
													onChange={(e) =>
														setFormState({
															...formState,
															name: e.target.value,
														})
													}
													className='w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_#A3E635] transition-all'
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
													onChange={(e) =>
														setFormState({
															...formState,
															email: e.target.value,
														})
													}
													className='w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_#A3E635] transition-all'
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
												onChange={(e) =>
													setFormState({
														...formState,
														subject: e.target.value,
													})
												}
												className='w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_#A3E635] transition-all appearance-none cursor-pointer'>
												<option value=''>Chọn chủ đề...</option>
												<option value='join'>Muốn tham gia CLB</option>
												<option value='collab'>Hợp tác/Đối tác</option>
												<option value='resource'>
													Đóng góp tài nguyên
												</option>
												<option value='question'>
													Hỏi đáp về hoạt động
												</option>
												<option value='other'>Khác</option>
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
												onChange={(e) =>
													setFormState({
														...formState,
														message: e.target.value,
													})
												}
												className='w-full resize-y rounded-xl border-2 border-black bg-white px-4 py-3 text-sm focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_#A3E635] transition-all'
											/>
										</div>

										<button
											type='submit'
											disabled={isSubmitting}
											className='neo-btn neo-btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed'>
											{isSubmitting ? (
												<>
													<span className='animate-spin inline-block mr-2'>
														⏳
													</span>
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
								)}
							</div>
						</div>

						{/* Contact Info - 2 cols */}
						<div
							className='lg:col-span-2 space-y-4 fade-in-up'
							style={{ transitionDelay: "0.1s" }}>
							{CONTACT_METHODS.map((method) => (
								<div
									key={method.title}
									className='neo-card neo-card-static p-5 group'
									style={{ background: method.bg }}>
									<div className='flex items-start gap-4'>
										<div
											className='w-12 h-12 rounded-xl flex items-center justify-center text-xl border-2 border-black bg-white shrink-0'
											style={{ boxShadow: "2px 2px 0px #111" }}>
											{method.emoji}
										</div>
										<div className='flex-1 min-w-0'>
											<h3 className='text-sm font-bold text-black uppercase tracking-wider mb-1'>
												{method.title}
											</h3>
											<p className='text-base font-semibold text-black truncate'>
												{method.value}
											</p>
											<p className='text-xs text-gray-600 mt-1'>
												{method.desc}
											</p>
										</div>
									</div>
								</div>
							))}

							{/* Social Links Card */}
							<div
								className='neo-card neo-card-static p-5'
								style={{ background: "var(--color-pastel-pink)" }}>
								<h3 className='text-sm font-bold text-black uppercase tracking-wider mb-4 flex items-center gap-2'>
									<span className='text-lg'>🌐</span>
									Theo dõi chúng mình
								</h3>
								<div className='flex flex-wrap gap-3'>
									{SOCIAL_LINKS.map((social) => (
										<a
											key={social.label}
											href={social.href}
											className='flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-black bg-white hover:shadow-[3px_3px_0_#111] transition-all'
											style={{ boxShadow: "2px 2px 0px #111" }}
											target='_blank'
											rel='noopener noreferrer'>
											<social.icon
												className='w-4 h-4'
												style={{ color: social.color }}
											/>
											<span className='text-sm font-semibold text-black'>
												{social.label}
											</span>
										</a>
									))}
								</div>
							</div>

							{/* Working Hours */}
							<div
								className='neo-card neo-card-static p-5'
								style={{ background: "var(--color-pastel-purple)" }}>
								<div className='flex items-center gap-3 mb-3'>
									<Clock className='w-5 h-5 text-black' />
									<h3 className='text-sm font-bold text-black uppercase tracking-wider'>
										Giờ hoạt động
									</h3>
								</div>
								<div className='space-y-2 text-sm'>
									<div className='flex justify-between items-center py-2 border-b border-black/10'>
										<span className='text-gray-700'>Thứ 2 - Thứ 6</span>
										<span className='font-semibold text-black'>
											8:00 - 17:00
										</span>
									</div>
									<div className='flex justify-between items-center py-2 border-b border-black/10'>
										<span className='text-gray-700'>Thứ 7</span>
										<span className='font-semibold text-black'>
											8:00 - 12:00
										</span>
									</div>
									<div className='flex justify-between items-center py-2'>
										<span className='text-gray-700'>Chủ nhật</span>
										<span className='font-semibold text-gray-500'>Nghỉ</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section ref={faqRef} className='neo-section bg-white'>
				<div className='neo-container px-6 md:py-14 py-12'>
					<div className='max-w-3xl mx-auto'>
						<div className='text-center mb-10 fade-in-up'>
							<div className='section-divider mx-auto' />
							<h2 className='text-2xl md:text-3xl font-extrabold text-black mt-4'>
								Câu hỏi thường gặp
							</h2>
							<p className='text-gray-500 mt-2'>
								Những điều bạn có thể thắc mắc về CLB
							</p>
						</div>

						<div className='space-y-4 fade-in-up' style={{ transitionDelay: "0.1s" }}>
							{FAQS.map((faq, idx) => (
								<div
									key={idx}
									className='neo-card neo-card-static overflow-hidden'
									style={{ background: "var(--color-surface)" }}>
									<button
										onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
										className='w-full flex items-center justify-between p-5 text-left hover:bg-black/5 transition-colors'>
										<span className='font-bold text-black pr-4'>{faq.q}</span>
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
										<div className='px-5 pb-5 border-t-2 border-black/10 pt-4'>
											<p className='text-sm text-gray-600 leading-relaxed'>
												{faq.a}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* CTA */}
						<div
							className='mt-10 text-center fade-in-up'
							style={{ transitionDelay: "0.2s" }}>
							<p className='text-gray-600 mb-4'>
								Không tìm thấy câu trả lời bạn cần?
							</p>
							<a
								href='#contact'
								className='neo-btn neo-btn-secondary inline-flex'
								onClick={(e) => {
									e.preventDefault();
									window.scrollTo({ top: 0, behavior: "smooth" });
								}}>
								Gửi câu hỏi ngay
								<ArrowRight className='w-4 h-4' />
							</a>
						</div>
					</div>
				</div>
			</section>
		</>
	);
};

export default ContactPage;
