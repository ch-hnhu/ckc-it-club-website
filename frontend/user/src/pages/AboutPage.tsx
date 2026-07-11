import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
	ArrowRight,
	BookOpen,
	Heart,
	Trophy,
	Sprout,
	Target,
	Telescope,
	Code2,
	Palette,
	Megaphone,
	CalendarDays,
	PenLine,
	Users,
	ChevronDown,
	Flag,
	Rocket,
	Sparkles,
	GraduationCap,
} from "lucide-react";
import BoardSection from "@/components/landing-page/BoardSection";

/* ============================================================
   Dữ liệu tĩnh — chỉnh sửa trực tiếp tại đây
   ============================================================ */

const VALUES = [
	{
		icon: BookOpen,
		emoji: "📚",
		title: "Học hỏi",
		subtitle: "Học không ngừng",
		desc: "Tiếp cận tài nguyên, khóa học và kiến thức thực chiến từ mentor đi trước. Chúng tôi tin học tập là hành trình cả đời.",
		bg: "var(--color-pastel-green)",
	},
	{
		icon: Heart,
		emoji: "🤝",
		title: "Chia sẻ",
		subtitle: "Cho đi là còn mãi",
		desc: "Văn hóa open-source: chia sẻ code, tài liệu, kinh nghiệm với cả cộng đồng — không giữ riêng cho mình.",
		bg: "var(--color-pastel-blue)",
	},
	{
		icon: Trophy,
		emoji: "🏆",
		title: "Bứt phá",
		subtitle: "Cạnh tranh lành mạnh",
		desc: "Tham gia hackathon, leaderboard và những thử thách để vượt qua giới hạn của chính mình mỗi ngày.",
		bg: "var(--color-pastel-yellow)",
	},
	{
		icon: Sprout,
		emoji: "🌱",
		title: "Trưởng thành",
		subtitle: "Phát triển toàn diện",
		desc: "Xây dựng portfolio, kỹ năng mềm và mạng lưới chuyên nghiệp ngay từ khi còn ngồi trên ghế nhà trường.",
		bg: "var(--color-pastel-purple)",
	},
];

const STATS = [
	{ value: "1000+", label: "Thành viên" },
	{ value: "2018", label: "Năm thành lập" },
	{ value: "50+", label: "Workshop & Sự kiện" },
	{ value: "95%", label: "Có việc sau khi học" },
];

const TIMELINE = [
	{
		year: "2018",
		title: "Ngày đầu thành lập",
		desc: "CKC IT CLUB ra đời từ nhóm nhỏ sinh viên đam mê lập trình, với ước mơ tạo ra một sân chơi công nghệ cho sinh viên Cao Thắng.",
		icon: Flag,
		bg: "var(--color-pastel-green)",
	},
	{
		year: "2020",
		title: "Mở rộng cộng đồng",
		desc: "Chuỗi workshop, seminar và các buổi chia sẻ định kỳ thu hút hàng trăm thành viên. Câu lạc bộ hình thành các ban chuyên môn.",
		icon: Users,
		bg: "var(--color-pastel-blue)",
	},
	{
		year: "2022",
		title: "Vươn tầm sự kiện",
		desc: "Tổ chức hackathon, cuộc thi lập trình và kết nối doanh nghiệp, mở ra cơ hội thực tập và việc làm cho thành viên.",
		icon: Rocket,
		bg: "var(--color-pastel-yellow)",
	},
	{
		year: "2024",
		title: "Chuyển đổi số",
		desc: "Xây dựng nền tảng cộng đồng trực tuyến: tài nguyên, blog, khóa học và hệ thống điểm thưởng gamification cho thành viên.",
		icon: Sparkles,
		bg: "var(--color-pastel-purple)",
	},
	{
		year: "Hôm nay",
		title: "Ngôi nhà thứ hai",
		desc: "Hơn 1000+ thành viên cùng học, chia sẻ và phát triển. Chúng tôi vẫn đang viết tiếp câu chuyện của mình mỗi ngày.",
		icon: Heart,
		bg: "var(--color-pastel-pink)",
	},
];

const DEPARTMENTS = [
	{
		icon: Code2,
		title: "Ban Kỹ thuật",
		desc: "Phụ trách chuyên môn, workshop lập trình, mentor kỹ thuật và xây dựng các sản phẩm công nghệ của câu lạc bộ.",
		bg: "var(--color-pastel-green)",
	},
	{
		icon: Palette,
		title: "Ban Thiết kế",
		desc: "Sáng tạo bộ nhận diện, ấn phẩm truyền thông và trải nghiệm hình ảnh cho mọi hoạt động, sự kiện.",
		bg: "var(--color-pastel-purple2)",
	},
	{
		icon: Megaphone,
		title: "Ban Truyền thông",
		desc: "Lan tỏa hình ảnh câu lạc bộ, quản lý các kênh mạng xã hội và kết nối với cộng đồng sinh viên.",
		bg: "var(--color-pastel-blue)",
	},
	{
		icon: CalendarDays,
		title: "Ban Sự kiện",
		desc: "Lên ý tưởng và tổ chức workshop, hackathon, talkshow — nơi những trải nghiệm đáng nhớ được tạo ra.",
		bg: "var(--color-pastel-orange)",
	},
	{
		icon: PenLine,
		title: "Ban Nội dung",
		desc: "Biên soạn tài liệu, bài viết blog và các khóa học chất lượng, xây dựng kho tri thức chung.",
		bg: "var(--color-pastel-yellow)",
	},
	{
		icon: Users,
		title: "Ban Nhân sự",
		desc: "Chăm lo đời sống thành viên, gắn kết nội bộ và phát triển văn hóa cộng đồng CKC IT CLUB.",
		bg: "var(--color-pastel-pink)",
	},
];

const FAQS = [
	{
		q: "Ai có thể tham gia CKC IT CLUB?",
		a: "Tất cả sinh viên Trường Cao đẳng Kỹ thuật Cao Thắng yêu thích công nghệ đều có thể tham gia — dù bạn là người mới bắt đầu hay đã có kinh nghiệm. Chúng tôi chào đón mọi đam mê!",
	},
	{
		q: "Tôi cần biết lập trình trước khi tham gia không?",
		a: "Không bắt buộc. Câu lạc bộ có lộ trình, tài nguyên và mentor hỗ trợ người mới. Điều quan trọng nhất là tinh thần ham học hỏi và sẵn sàng chia sẻ.",
	},
	{
		q: "Tham gia CLB có mất phí không?",
		a: "Hoàn toàn miễn phí. CKC IT CLUB là cộng đồng phi lợi nhuận, hoạt động dựa trên tinh thần tự nguyện và văn hóa chia sẻ của các thành viên.",
	},
	{
		q: "Làm sao để đăng ký tham gia?",
		a: 'Bạn chỉ cần nhấn nút "Ứng tuyển" trên trang web, điền thông tin và chờ ban chủ nhiệm liên hệ. Chúng tôi sẽ hướng dẫn bạn những bước tiếp theo.',
	},
	{
		q: "Các hoạt động chính của CLB là gì?",
		a: "Workshop chuyên môn, hackathon, cuộc thi lập trình, chia sẻ tài nguyên, khóa học trực tuyến, cộng đồng thảo luận và nhiều sự kiện kết nối doanh nghiệp.",
	},
];

/* ============================================================
   Trang Về chúng tôi
   ============================================================ */

const AboutPage: React.FC = () => {
	const pageRef = useRef<HTMLDivElement>(null);
	const [openFaq, setOpenFaq] = useState<number | null>(0);

	// Observer chung cấp trang cho mọi phần tử .fade-in-up
	useEffect(() => {
		const el = pageRef.current;
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

	return (
		<div ref={pageRef}>
			{/* ============ 1. HERO ============ */}
			<section className='relative flex items-center overflow-x-hidden bg-white pt-28 pb-20'>
				<div className='neo-container px-6 relative z-10'>
					<div className='flex flex-col items-center justify-center space-y-6 text-center'>
						<div
							className='fade-in-up inline-flex items-center px-3 py-1 rounded-full border-2 border-black text-xs font-semibold'
							style={{ background: "white", boxShadow: "2px 2px 0px #111" }}>
							Trường Cao đẳng Kỹ thuật Cao Thắng
						</div>

						<h1
							className='fade-in-up text-[2.5rem] sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.3] tracking-tight text-black max-w-3xl'
							style={{ fontFamily: "var(--font-heading)", transitionDelay: "0.1s" }}>
							Không chỉ là câu lạc bộ,
							<br />
							đây là{" "}
							<span
								className='inline-block'
								style={{
									background: "var(--color-primary)",
									padding: "0 0.2em",
									border: "2px solid #111",
									borderRadius: "8px",
									boxShadow: "3px 3px 0px #111",
								}}>
								ngôi nhà thứ hai
							</span>
						</h1>

						<p
							className='fade-in-up text-lg text-gray-600 max-w-2xl leading-relaxed'
							style={{ fontFamily: "var(--font-body)", transitionDelay: "0.2s" }}>
							CKC IT CLUB là nơi những sinh viên IT năng động cùng nhau{" "}
							<strong className='text-black'>học hỏi</strong>,{" "}
							<strong className='text-black'>chia sẻ</strong> và{" "}
							<strong className='text-black'>phát triển</strong> — biến đam mê công nghệ
							thành hành trình sự nghiệp thực sự.
						</p>

						<div
							className='fade-in-up flex flex-wrap justify-center gap-4'
							style={{ transitionDelay: "0.3s" }}>
							<Link to='/ung-tuyen' className='neo-btn neo-btn-primary text-base px-6 py-3'>
								<Users className='w-5 h-5' />
								Tham gia CLB
							</Link>
							<Link to='/lien-he' className='neo-btn neo-btn-secondary text-base px-6 py-3'>
								Liên hệ với chúng tôi
								<ArrowRight className='w-5 h-5' />
							</Link>
						</div>
					</div>
				</div>

				{/* SVG trang trí nổi */}
				<div className='absolute inset-0 pointer-events-none overflow-hidden' style={{ zIndex: 1 }}>
					<img
						src='/assets/svg/20.svg'
						className='absolute top-[20%] left-[4%] w-24 md:w-36 opacity-70 animate-float'
						style={{ animationDelay: "0s" }}
					/>
					<img
						src='/assets/svg/23.svg'
						className='absolute top-[18%] right-[5%] w-28 md:w-40 opacity-70 animate-float'
						style={{ animationDelay: "1.5s" }}
					/>
					<img
						src='/assets/svg/25.svg'
						className='absolute bottom-[10%] right-[10%] w-20 md:w-28 opacity-80 animate-float'
						style={{ animationDelay: "3s" }}
					/>
					<img
						src='/assets/svg/22.svg'
						className='absolute bottom-[8%] left-[8%] w-20 md:w-28 opacity-80 animate-float'
						style={{ animationDelay: "4s" }}
					/>
				</div>
				<div className='absolute bottom-0 left-0 right-0 h-1 bg-black' />
			</section>

			{/* ============ 2. CÂU CHUYỆN CỦA CHÚNG TÔI ============ */}
			<section className='neo-section' style={{ background: "var(--color-surface)" }}>
				<div className='neo-container'>
					<div className='grid lg:grid-cols-2 gap-14 items-center'>
						<div className='fade-in-up space-y-6'>
							<div className='section-divider' style={{ margin: "0 0 1rem" }} />
							<h2
								className='text-3xl sm:text-4xl font-extrabold text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								Câu chuyện của chúng tôi
							</h2>
							<p className='text-gray-600 text-lg leading-relaxed'>
								Mọi thứ bắt đầu từ năm{" "}
								<strong className='text-black'>2018</strong>, khi một nhóm nhỏ sinh viên
								đam mê công nghệ tại{" "}
								<strong className='text-black'>Trường Cao đẳng Kỹ thuật Cao Thắng</strong>{" "}
								cùng chung một khát khao: tạo ra một sân chơi nơi ai cũng có thể học,
								chia sẻ và cùng nhau lớn lên.
							</p>
							<p className='text-gray-600 leading-relaxed'>
								Từ những buổi họp nhóm nhỏ, CKC IT CLUB đã trở thành cộng đồng hàng
								nghìn sinh viên IT. Chúng tôi tin rằng{" "}
								<span
									className='font-bold px-1 rounded text-black'
									style={{
										background: "var(--color-primary)",
										border: "1px solid #111",
									}}>
									mọi sinh viên đều có tiềm năng to lớn
								</span>{" "}
								khi được trao đúng cơ hội và sự hỗ trợ.
							</p>
							<p className='text-gray-600 leading-relaxed'>
								Hôm nay, chúng tôi tiếp tục kết nối sinh viên với tài nguyên, mentor và
								cơ hội việc làm thực tế — vun đắp một cộng đồng công nghệ tử tế và bền
								vững.
							</p>
						</div>

						<div className='fade-in-up' style={{ transitionDelay: "0.15s" }}>
							<div
								className='neo-card neo-card-static overflow-hidden'
								style={{ background: "white", padding: 0 }}>
								<img
									src='/assets/img/ckc-event-title.png'
									alt='CKC IT CLUB'
									className='w-full h-full object-cover'
									onError={(e) => {
										(e.target as HTMLImageElement).style.display = "none";
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ============ 3. SỨ MỆNH & TẦM NHÌN ============ */}
			<section className='neo-section'>
				<div className='neo-container'>
					<div className='text-center mb-14 fade-in-up'>
						<div className='section-divider' />
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
							style={{ fontFamily: "var(--font-heading)" }}>
							Sứ mệnh & Tầm nhìn
						</h2>
						<p className='text-gray-500 mt-3'>Điều dẫn lối cho mọi việc chúng tôi làm</p>
					</div>

					<div className='grid md:grid-cols-2 gap-8'>
						<div
							className='fade-in-up neo-card p-8 space-y-4'
							style={{ background: "var(--color-pastel-green)" }}>
							<div
								className='w-14 h-14 rounded-xl flex items-center justify-center border-2 border-black'
								style={{ background: "white", boxShadow: "3px 3px 0 #111" }}>
								<Target className='w-7 h-7 text-black' />
							</div>
							<h3
								className='text-2xl font-extrabold text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								Sứ mệnh
							</h3>
							<p className='text-gray-700 leading-relaxed'>
								Trao cho mỗi sinh viên IT cơ hội tiếp cận tri thức, môi trường thực hành
								và cộng đồng hỗ trợ — để không ai bị bỏ lại phía sau trên hành trình
								chinh phục công nghệ.
							</p>
						</div>

						<div
							className='fade-in-up neo-card p-8 space-y-4'
							style={{ background: "var(--color-pastel-blue)", transitionDelay: "0.15s" }}>
							<div
								className='w-14 h-14 rounded-xl flex items-center justify-center border-2 border-black'
								style={{ background: "white", boxShadow: "3px 3px 0 #111" }}>
								<Telescope className='w-7 h-7 text-black' />
							</div>
							<h3
								className='text-2xl font-extrabold text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								Tầm nhìn
							</h3>
							<p className='text-gray-700 leading-relaxed'>
								Trở thành cộng đồng công nghệ sinh viên hàng đầu — nơi ươm mầm những lập
								trình viên, nhà thiết kế và người dẫn dắt tương lai, mang giá trị tích
								cực cho xã hội.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ============ 4. GIÁ TRỊ CỐT LÕI ============ */}
			<section
				className='neo-section'
				style={{ background: "var(--color-surface)" }}>
				<div className='neo-container'>
					<div className='text-center mb-14 fade-in-up'>
						<div className='section-divider' />
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
							style={{ fontFamily: "var(--font-heading)" }}>
							Giá trị cốt lõi
						</h2>
						<p className='text-gray-500 mt-3'>Bốn điều làm nên tinh thần CKC IT CLUB</p>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
						{VALUES.map((val, i) => (
							<div
								key={val.title}
								className='fade-in-up neo-card p-6 flex flex-col gap-3'
								style={{ background: val.bg, transitionDelay: `${i * 0.1}s` }}>
								<div className='text-4xl'>{val.emoji}</div>
								<div>
									<h3
										className='font-extrabold text-lg text-black'
										style={{ fontFamily: "var(--font-heading)" }}>
										{val.title}
									</h3>
									<p className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
										{val.subtitle}
									</p>
								</div>
								<p className='text-sm text-gray-700 leading-relaxed'>{val.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ============ 5. CON SỐ ẤN TƯỢNG ============ */}
			<section className='neo-section'>
				<div className='neo-container'>
					<div
						className='fade-in-up neo-card neo-card-static p-10'
						style={{ background: "var(--color-primary)" }}>
						<div className='grid grid-cols-2 lg:grid-cols-4 gap-8'>
							{STATS.map((stat) => (
								<div key={stat.label} className='text-center'>
									<div
										className='text-4xl sm:text-5xl font-extrabold text-white'
										style={{
											fontFamily: "var(--font-heading)",
											WebkitTextStroke: "1.5px #111",
										}}>
										{stat.value}
									</div>
									<div className='text-sm font-bold text-black mt-2 uppercase tracking-wide'>
										{stat.label}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ============ 6. HÀNH TRÌNH PHÁT TRIỂN (TIMELINE) ============ */}
			<section className='neo-section' style={{ background: "var(--color-surface)" }}>
				<div className='neo-container'>
					<div className='text-center mb-14 fade-in-up'>
						<div className='section-divider' />
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
							style={{ fontFamily: "var(--font-heading)" }}>
							Hành trình phát triển
						</h2>
						<p className='text-gray-500 mt-3'>Những cột mốc đáng nhớ của chúng tôi</p>
					</div>

					<div className='relative max-w-3xl mx-auto'>
						{/* Đường dọc timeline */}
						<div className='absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-black md:-translate-x-1/2' />

						<div className='space-y-8'>
							{TIMELINE.map((item, i) => {
								const Icon = item.icon;
								const isLeft = i % 2 === 0;
								return (
									<div
										key={item.year}
										className={`fade-in-up relative flex items-start gap-6 md:gap-0 ${
											isLeft ? "md:flex-row" : "md:flex-row-reverse"
										}`}
										style={{ transitionDelay: `${i * 0.05}s` }}>
										{/* Chấm mốc + icon */}
										<div
											className='relative z-10 shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 border-black md:absolute md:left-1/2 md:-translate-x-1/2'
											style={{ background: item.bg, boxShadow: "2px 2px 0 #111" }}>
											<Icon className='w-5 h-5 text-black' />
										</div>

										{/* Nội dung */}
										<div
											className={`neo-card p-5 flex-1 md:w-[calc(50%-2.5rem)] md:flex-none ${
												isLeft ? "md:mr-auto" : "md:ml-auto"
											}`}
											style={{ background: "white" }}>
											<span
												className='neo-tag'
												style={{ background: item.bg }}>
												{item.year}
											</span>
											<h3
												className='font-extrabold text-lg text-black mt-3'
												style={{ fontFamily: "var(--font-heading)" }}>
												{item.title}
											</h3>
											<p className='text-sm text-gray-600 leading-relaxed mt-1.5'>
												{item.desc}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			{/* ============ 7. CƠ CẤU CÁC BAN ============ */}
			<section className='neo-section'>
				<div className='neo-container'>
					<div className='text-center mb-14 fade-in-up'>
						<div className='section-divider' />
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
							style={{ fontFamily: "var(--font-heading)" }}>
							Cơ cấu các ban
						</h2>
						<p className='text-gray-500 mt-3'>
							Mỗi ban là một mảnh ghép tạo nên CKC IT CLUB
						</p>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
						{DEPARTMENTS.map((dept, i) => {
							const Icon = dept.icon;
							return (
								<div
									key={dept.title}
									className='fade-in-up neo-card p-6 space-y-4'
									style={{ background: dept.bg, transitionDelay: `${(i % 3) * 0.1}s` }}>
									<div
										className='w-12 h-12 rounded-xl flex items-center justify-center border-2 border-black'
										style={{ background: "white", boxShadow: "2px 2px 0 #111" }}>
										<Icon className='w-6 h-6 text-black' />
									</div>
									<h3
										className='font-extrabold text-lg text-black'
										style={{ fontFamily: "var(--font-heading)" }}>
										{dept.title}
									</h3>
									<p className='text-sm text-gray-700 leading-relaxed'>{dept.desc}</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* ============ 8. BAN CHỦ NHIỆM (tái dùng component landing) ============ */}
			<BoardSection />

			{/* ============ 9. FAQ ============ */}
			<section className='neo-section'>
				<div className='neo-container'>
					<div className='text-center mb-14 fade-in-up'>
						<div className='section-divider' />
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
							style={{ fontFamily: "var(--font-heading)" }}>
							Câu hỏi thường gặp
						</h2>
						<p className='text-gray-500 mt-3'>Những điều bạn có thể đang thắc mắc</p>
					</div>

					<div className='max-w-3xl mx-auto space-y-4'>
						{FAQS.map((faq, i) => {
							const isOpen = openFaq === i;
							return (
								<div
									key={i}
									className='fade-in-up neo-card neo-card-static overflow-hidden'
									style={{ background: "white", padding: 0 }}>
									<button
										type='button'
										onClick={() => setOpenFaq(isOpen ? null : i)}
										className='flex w-full items-center justify-between gap-4 p-5 text-left'>
										<span
											className='font-bold text-black'
											style={{ fontFamily: "var(--font-heading)" }}>
											{faq.q}
										</span>
										<ChevronDown
											className={`w-5 h-5 shrink-0 text-black transition-transform duration-200 ${
												isOpen ? "rotate-180" : ""
											}`}
										/>
									</button>
									{isOpen && (
										<div className='px-5 pb-5 -mt-1'>
											<div className='border-t-2 border-black/10 pt-3 text-sm text-gray-600 leading-relaxed'>
												{faq.a}
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* ============ 10. CTA CUỐI ============ */}
			<section className='neo-section' style={{ background: "var(--color-surface)" }}>
				<div className='neo-container'>
					<div
						className='fade-in-up neo-card neo-card-static p-12 text-center flex flex-col items-center gap-6'
						style={{ background: "var(--color-pastel-green)" }}>
						<div
							className='w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-black'
							style={{ background: "white", boxShadow: "4px 4px 0 #111" }}>
							<GraduationCap className='w-8 h-8 text-black' />
						</div>
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black max-w-2xl'
							style={{ fontFamily: "var(--font-heading)" }}>
							Sẵn sàng viết tiếp câu chuyện cùng chúng tôi?
						</h2>
						<p className='text-gray-700 max-w-xl'>
							Trở thành một phần của cộng đồng hơn{" "}
							<strong>1000+ sinh viên IT</strong> — nơi bạn được học, được chia sẻ và
							được là chính mình.
						</p>
						<div className='flex flex-wrap justify-center gap-4'>
							<Link to='/ung-tuyen' className='neo-btn neo-btn-primary text-base px-8 py-4'>
								<Users className='w-5 h-5' />
								Tham gia ngay
							</Link>
							<Link to='/cong-dong' className='neo-btn neo-btn-secondary text-base px-8 py-4'>
								Khám phá cộng đồng
								<ArrowRight className='w-5 h-5' />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default AboutPage;
