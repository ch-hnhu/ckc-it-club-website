import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getBreadcrumbsFromNavigation } from "@/config/navigation";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import aboutPageService from "@/services/about-page.service";
import homePageService from "@/services/home-page.service";
import { ABOUT_BG_OPTIONS } from "@/types/about";
import type { AboutAward } from "@/types/about";
import type {
	HomeContent,
	HomeQuickAction,
	HomeStat,
	HomeValue,
} from "@/types/home";
import {
	AreaField,
	BgField,
	getErrorMessage,
	IconField,
	ImageField,
	ListItemCard,
	move,
	replaceAt,
	TextField,
} from "../about-page/config-fields";

/**
 * Trình chỉnh sửa nội dung tĩnh của trang chủ. Quản lý toàn bộ các khối chữ/thẻ
 * tĩnh (Hero, Khám phá, Về CLB, tiêu đề các khối động, Kêu gọi đóng góp, CTA)
 * qua config `home-*`, cùng khối "Giải thưởng & Thành tích" (dùng chung config
 * trang About — slug `about-awards`).
 */
function LandingPageEditor() {
	const [content, setContent] = useState<HomeContent | null>(null);
	const [awards, setAwards] = useState<AboutAward[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const breadcrumb = useMemo(() => getBreadcrumbsFromNavigation("/landing-page"), []);
	useBreadcrumb(breadcrumb);

	useEffect(() => {
		let mounted = true;
		Promise.all([homePageService.getHomeContent(), aboutPageService.getAboutContent()])
			.then(([home, about]) => {
				if (!mounted) return;
				setContent(home);
				setAwards(about.awards ?? []);
			})
			.catch((err) => {
				toast.error(getErrorMessage(err, "Không thể tải nội dung trang chủ."), {
					position: "top-right",
				});
			})
			.finally(() => mounted && setLoading(false));
		return () => {
			mounted = false;
		};
	}, []);

	const handleSave = async () => {
		if (!content) return;
		setSaving(true);
		try {
			const [home] = await Promise.all([
				homePageService.updateHomeContent(content),
				aboutPageService.updateAboutContent({ awards }),
			]);
			setContent(home);
			toast.success("Đã lưu nội dung trang chủ.", { position: "top-right" });
		} catch (err) {
			toast.error(getErrorMessage(err, "Không thể lưu nội dung."), { position: "top-right" });
		} finally {
			setSaving(false);
		}
	};

	if (loading || !content) {
		return (
			<div className='flex items-center justify-center py-20 text-muted-foreground'>
				<Loader2 className='mr-2 h-5 w-5 animate-spin' /> Đang tải nội dung...
			</div>
		);
	}

	// Helper cập nhật từng nhánh của content
	const patch = <K extends keyof HomeContent>(key: K, value: HomeContent[K]) =>
		setContent((prev) => (prev ? { ...prev, [key]: value } : prev));

	const { hero, quick_actions, about, headers, contribution, cta } = content;

	return (
		<div className='flex flex-col gap-6 p-4 pb-24 md:p-6 lg:p-8'>
			<div className='sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 py-3 backdrop-blur'>
				<div>
					<h1 className='text-xl font-bold'>Trang chủ</h1>
					<p className='text-sm text-muted-foreground'>
						Chỉnh sửa các khối nội dung tĩnh hiển thị ở trang chủ.
					</p>
				</div>
				<Button onClick={handleSave} disabled={saving}>
					{saving ? (
						<Loader2 className='mr-2 h-4 w-4 animate-spin' />
					) : (
						<Save className='mr-2 h-4 w-4' />
					)}
					Lưu thay đổi
				</Button>
			</div>

			<Accordion type='multiple' defaultValue={["hero"]} className='space-y-3'>
				{/* HERO */}
				<AccordionItem value='hero' className='rounded-lg border px-4'>
					<AccordionTrigger>1. Hero (đầu trang)</AccordionTrigger>
					<AccordionContent className='space-y-4'>
						<TextField
							label='Badge'
							value={hero.badge}
							onChange={(v) => patch("hero", { ...hero, badge: v })}
						/>
						<div className='grid gap-4 sm:grid-cols-2'>
							<TextField
								label='Tiêu đề — dòng 1'
								value={hero.title_line1}
								onChange={(v) => patch("hero", { ...hero, title_line1: v })}
							/>
							<TextField
								label='Tiêu đề — dòng 2'
								value={hero.title_line2}
								onChange={(v) => patch("hero", { ...hero, title_line2: v })}
							/>
						</div>
						<TextField
							label='Từ nhấn mạnh (ô nổi bật)'
							value={hero.highlight}
							onChange={(v) => patch("hero", { ...hero, highlight: v })}
						/>
						<AreaField
							label='Mô tả (HTML: dùng <strong> để in đậm)'
							value={hero.lead_html}
							onChange={(v) => patch("hero", { ...hero, lead_html: v })}
							hint='Có thể dùng thẻ <strong> để in đậm chữ.'
						/>
						<div className='space-y-3'>
							<Label>Con số nổi bật</Label>
							{hero.stats.map((stat, i) => (
								<ListItemCard
									key={i}
									index={i}
									total={hero.stats.length}
									title={`Con số ${i + 1}`}
									onMoveUp={() => patch("hero", { ...hero, stats: move(hero.stats, i, -1) })}
									onMoveDown={() => patch("hero", { ...hero, stats: move(hero.stats, i, 1) })}
									onRemove={() =>
										patch("hero", {
											...hero,
											stats: hero.stats.filter((_, idx) => idx !== i),
										})
									}>
									<div className='grid gap-3 sm:grid-cols-2'>
										<TextField
											label='Giá trị'
											value={stat.value}
											onChange={(v) =>
												patch("hero", {
													...hero,
													stats: replaceAt(hero.stats, i, { value: v } as Partial<HomeStat>),
												})
											}
										/>
										<TextField
											label='Nhãn'
											value={stat.label}
											onChange={(v) =>
												patch("hero", {
													...hero,
													stats: replaceAt(hero.stats, i, { label: v } as Partial<HomeStat>),
												})
											}
										/>
									</div>
								</ListItemCard>
							))}
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() =>
									patch("hero", { ...hero, stats: [...hero.stats, { value: "", label: "" }] })
								}>
								<Plus className='mr-2 h-4 w-4' /> Thêm con số
							</Button>
						</div>
						<div className='grid gap-4 sm:grid-cols-2'>
							<TextField
								label='Nút chính — nhãn'
								value={hero.primary_label}
								onChange={(v) => patch("hero", { ...hero, primary_label: v })}
							/>
							<TextField
								label='Nút chính — đường dẫn (hỗ trợ #neo)'
								value={hero.primary_link}
								onChange={(v) => patch("hero", { ...hero, primary_link: v })}
							/>
							<TextField
								label='Nút phụ — nhãn'
								value={hero.secondary_label}
								onChange={(v) => patch("hero", { ...hero, secondary_label: v })}
							/>
							<TextField
								label='Nút phụ — đường dẫn'
								value={hero.secondary_link}
								onChange={(v) => patch("hero", { ...hero, secondary_link: v })}
							/>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* QUICK ACTIONS */}
				<AccordionItem value='quick_actions' className='rounded-lg border px-4'>
					<AccordionTrigger>2. Khám phá (thẻ điều hướng nhanh)</AccordionTrigger>
					<AccordionContent className='space-y-4'>
						<TextField
							label='Tiêu đề'
							value={quick_actions.heading}
							onChange={(v) => patch("quick_actions", { ...quick_actions, heading: v })}
						/>
						<AreaField
							label='Mô tả'
							value={quick_actions.subheading}
							onChange={(v) => patch("quick_actions", { ...quick_actions, subheading: v })}
						/>
						<div className='space-y-3'>
							<Label>Các thẻ</Label>
							{quick_actions.items.map((item, i) => (
								<ListItemCard
									key={i}
									index={i}
									total={quick_actions.items.length}
									title={item.title || `Thẻ ${i + 1}`}
									onMoveUp={() =>
										patch("quick_actions", {
											...quick_actions,
											items: move(quick_actions.items, i, -1),
										})
									}
									onMoveDown={() =>
										patch("quick_actions", {
											...quick_actions,
											items: move(quick_actions.items, i, 1),
										})
									}
									onRemove={() =>
										patch("quick_actions", {
											...quick_actions,
											items: quick_actions.items.filter((_, idx) => idx !== i),
										})
									}>
									<div className='grid gap-3 sm:grid-cols-2'>
										<TextField
											label='Emoji'
											value={item.emoji}
											onChange={(v) =>
												patch("quick_actions", {
													...quick_actions,
													items: replaceAt(quick_actions.items, i, {
														emoji: v,
													} as Partial<HomeQuickAction>),
												})
											}
										/>
										<TextField
											label='Tiêu đề'
											value={item.title}
											onChange={(v) =>
												patch("quick_actions", {
													...quick_actions,
													items: replaceAt(quick_actions.items, i, {
														title: v,
													} as Partial<HomeQuickAction>),
												})
											}
										/>
										<TextField
											label='Đường dẫn'
											value={item.link}
											onChange={(v) =>
												patch("quick_actions", {
													...quick_actions,
													items: replaceAt(quick_actions.items, i, {
														link: v,
													} as Partial<HomeQuickAction>),
												})
											}
										/>
										<BgField
											value={item.bg}
											onChange={(v) =>
												patch("quick_actions", {
													...quick_actions,
													items: replaceAt(quick_actions.items, i, {
														bg: v,
													} as Partial<HomeQuickAction>),
												})
											}
										/>
									</div>
									<AreaField
										label='Mô tả'
										value={item.desc}
										onChange={(v) =>
											patch("quick_actions", {
												...quick_actions,
												items: replaceAt(quick_actions.items, i, {
													desc: v,
												} as Partial<HomeQuickAction>),
											})
										}
									/>
									<label className='flex items-center gap-2 text-sm'>
										<input
											type='checkbox'
											checked={item.requireAuth}
											onChange={(e) =>
												patch("quick_actions", {
													...quick_actions,
													items: replaceAt(quick_actions.items, i, {
														requireAuth: e.target.checked,
													} as Partial<HomeQuickAction>),
												})
											}
										/>
										Yêu cầu đăng nhập (chưa đăng nhập sẽ chuyển tới trang đăng nhập)
									</label>
								</ListItemCard>
							))}
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() =>
									patch("quick_actions", {
										...quick_actions,
										items: [
											...quick_actions.items,
											{
												emoji: "✨",
												title: "",
												desc: "",
												link: "/",
												bg: ABOUT_BG_OPTIONS[0].value,
												requireAuth: false,
											},
										],
									})
								}>
								<Plus className='mr-2 h-4 w-4' /> Thêm thẻ
							</Button>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* ABOUT */}
				<AccordionItem value='about' className='rounded-lg border px-4'>
					<AccordionTrigger>3. Về CLB (giới thiệu ngắn)</AccordionTrigger>
					<AccordionContent className='space-y-4'>
						<TextField
							label='Tiêu đề'
							value={about.heading}
							onChange={(v) => patch("about", { ...about, heading: v })}
						/>
						<div className='space-y-3'>
							<Label>Các đoạn văn (HTML: &lt;strong&gt;, &lt;mark&gt; để nhấn)</Label>
							{about.paragraphs_html.map((para, i) => (
								<ListItemCard
									key={i}
									index={i}
									total={about.paragraphs_html.length}
									title={`Đoạn ${i + 1}`}
									onMoveUp={() =>
										patch("about", {
											...about,
											paragraphs_html: move(about.paragraphs_html, i, -1),
										})
									}
									onMoveDown={() =>
										patch("about", {
											...about,
											paragraphs_html: move(about.paragraphs_html, i, 1),
										})
									}
									onRemove={() =>
										patch("about", {
											...about,
											paragraphs_html: about.paragraphs_html.filter((_, idx) => idx !== i),
										})
									}>
									<Textarea
										rows={3}
										value={para}
										onChange={(e) =>
											patch("about", {
												...about,
												paragraphs_html: about.paragraphs_html.map((p, idx) =>
													idx === i ? e.target.value : p,
												),
											})
										}
									/>
								</ListItemCard>
							))}
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() =>
									patch("about", {
										...about,
										paragraphs_html: [...about.paragraphs_html, ""],
									})
								}>
								<Plus className='mr-2 h-4 w-4' /> Thêm đoạn
							</Button>
						</div>
						<div className='space-y-3'>
							<Label>Cột mốc</Label>
							{about.milestones.map((m, i) => (
								<ListItemCard
									key={i}
									index={i}
									total={about.milestones.length}
									title={`Cột mốc ${i + 1}`}
									onMoveUp={() =>
										patch("about", { ...about, milestones: move(about.milestones, i, -1) })
									}
									onMoveDown={() =>
										patch("about", { ...about, milestones: move(about.milestones, i, 1) })
									}
									onRemove={() =>
										patch("about", {
											...about,
											milestones: about.milestones.filter((_, idx) => idx !== i),
										})
									}>
									<div className='grid gap-3 sm:grid-cols-2'>
										<TextField
											label='Giá trị'
											value={m.value}
											onChange={(v) =>
												patch("about", {
													...about,
													milestones: replaceAt(about.milestones, i, {
														value: v,
													} as Partial<HomeStat>),
												})
											}
										/>
										<TextField
											label='Nhãn'
											value={m.label}
											onChange={(v) =>
												patch("about", {
													...about,
													milestones: replaceAt(about.milestones, i, {
														label: v,
													} as Partial<HomeStat>),
												})
											}
										/>
									</div>
								</ListItemCard>
							))}
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() =>
									patch("about", {
										...about,
										milestones: [...about.milestones, { value: "", label: "" }],
									})
								}>
								<Plus className='mr-2 h-4 w-4' /> Thêm cột mốc
							</Button>
						</div>
						<div className='grid gap-4 sm:grid-cols-2'>
							<TextField
								label='Nút — nhãn'
								value={about.button_label}
								onChange={(v) => patch("about", { ...about, button_label: v })}
							/>
							<TextField
								label='Nút — đường dẫn'
								value={about.button_link}
								onChange={(v) => patch("about", { ...about, button_link: v })}
							/>
						</div>
						<div className='space-y-3'>
							<Label>Thẻ giá trị cốt lõi</Label>
							{about.values.map((val, i) => (
								<ListItemCard
									key={i}
									index={i}
									total={about.values.length}
									title={val.title || `Giá trị ${i + 1}`}
									onMoveUp={() => patch("about", { ...about, values: move(about.values, i, -1) })}
									onMoveDown={() => patch("about", { ...about, values: move(about.values, i, 1) })}
									onRemove={() =>
										patch("about", {
											...about,
											values: about.values.filter((_, idx) => idx !== i),
										})
									}>
									<div className='grid gap-3 sm:grid-cols-2'>
										<TextField
											label='Emoji'
											value={val.emoji}
											onChange={(v) =>
												patch("about", {
													...about,
													values: replaceAt(about.values, i, { emoji: v } as Partial<HomeValue>),
												})
											}
										/>
										<BgField
											value={val.bg}
											onChange={(v) =>
												patch("about", {
													...about,
													values: replaceAt(about.values, i, { bg: v } as Partial<HomeValue>),
												})
											}
										/>
										<TextField
											label='Tiêu đề'
											value={val.title}
											onChange={(v) =>
												patch("about", {
													...about,
													values: replaceAt(about.values, i, { title: v } as Partial<HomeValue>),
												})
											}
										/>
										<TextField
											label='Phụ đề'
											value={val.subtitle}
											onChange={(v) =>
												patch("about", {
													...about,
													values: replaceAt(about.values, i, {
														subtitle: v,
													} as Partial<HomeValue>),
												})
											}
										/>
									</div>
									<AreaField
										label='Mô tả'
										value={val.desc}
										onChange={(v) =>
											patch("about", {
												...about,
												values: replaceAt(about.values, i, { desc: v } as Partial<HomeValue>),
											})
										}
									/>
								</ListItemCard>
							))}
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() =>
									patch("about", {
										...about,
										values: [
											...about.values,
											{
												emoji: "⭐",
												title: "",
												subtitle: "",
												desc: "",
												bg: ABOUT_BG_OPTIONS[0].value,
											},
										],
									})
								}>
								<Plus className='mr-2 h-4 w-4' /> Thêm giá trị
							</Button>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* HEADERS */}
				<AccordionItem value='headers' className='rounded-lg border px-4'>
					<AccordionTrigger>4. Tiêu đề các khối động</AccordionTrigger>
					<AccordionContent className='space-y-6'>
						<p className='text-sm text-muted-foreground'>
							Nội dung bên trong các khối này lấy tự động từ dữ liệu (thành viên, bài viết,
							bảng xếp hạng...). Ở đây chỉ chỉnh tiêu đề và mô tả.
						</p>
						<div className='space-y-3'>
							<p className='text-sm font-semibold'>Người thành lập</p>
							<TextField
								label='Tiêu đề'
								value={headers.mentor.title}
								onChange={(v) =>
									patch("headers", { ...headers, mentor: { ...headers.mentor, title: v } })
								}
							/>
							<AreaField
								label='Mô tả'
								value={headers.mentor.subtitle}
								onChange={(v) =>
									patch("headers", { ...headers, mentor: { ...headers.mentor, subtitle: v } })
								}
							/>
						</div>
						<div className='space-y-3'>
							<p className='text-sm font-semibold'>Ban Chủ Nhiệm</p>
							<TextField
								label='Tiêu đề'
								value={headers.board.title}
								onChange={(v) =>
									patch("headers", { ...headers, board: { ...headers.board, title: v } })
								}
							/>
							<AreaField
								label='Mô tả'
								value={headers.board.subtitle}
								onChange={(v) =>
									patch("headers", { ...headers, board: { ...headers.board, subtitle: v } })
								}
							/>
						</div>
						<div className='space-y-3'>
							<p className='text-sm font-semibold'>Nội dung nổi bật</p>
							<TextField
								label='Tiêu đề'
								value={headers.featured.title}
								onChange={(v) =>
									patch("headers", {
										...headers,
										featured: { ...headers.featured, title: v },
									})
								}
							/>
							<AreaField
								label='Mô tả'
								value={headers.featured.subtitle}
								onChange={(v) =>
									patch("headers", {
										...headers,
										featured: { ...headers.featured, subtitle: v },
									})
								}
							/>
							<div className='grid gap-3 sm:grid-cols-3'>
								<TextField
									label='Tiêu đề cột Bài viết'
									value={headers.featured.blog_title}
									onChange={(v) =>
										patch("headers", {
											...headers,
											featured: { ...headers.featured, blog_title: v },
										})
									}
								/>
								<TextField
									label='Tiêu đề cột Sự kiện'
									value={headers.featured.event_title}
									onChange={(v) =>
										patch("headers", {
											...headers,
											featured: { ...headers.featured, event_title: v },
										})
									}
								/>
								<TextField
									label='Tiêu đề cột Khóa học'
									value={headers.featured.course_title}
									onChange={(v) =>
										patch("headers", {
											...headers,
											featured: { ...headers.featured, course_title: v },
										})
									}
								/>
							</div>
						</div>
						<div className='space-y-3'>
							<p className='text-sm font-semibold'>Bảng Xếp Hạng</p>
							<div className='grid gap-3 sm:grid-cols-2'>
								<TextField
									label='Tiêu đề'
									value={headers.leaderboard.title}
									onChange={(v) =>
										patch("headers", {
											...headers,
											leaderboard: { ...headers.leaderboard, title: v },
										})
									}
								/>
								<TextField
									label='Nhãn nút "Xem đầy đủ"'
									value={headers.leaderboard.cta_label}
									onChange={(v) =>
										patch("headers", {
											...headers,
											leaderboard: { ...headers.leaderboard, cta_label: v },
										})
									}
								/>
							</div>
						</div>
						<div className='space-y-3'>
							<p className='text-sm font-semibold'>Giải thưởng & Thành tích (tiêu đề)</p>
							<TextField
								label='Tiêu đề'
								value={headers.awards.title}
								onChange={(v) =>
									patch("headers", { ...headers, awards: { ...headers.awards, title: v } })
								}
							/>
							<AreaField
								label='Mô tả'
								value={headers.awards.subtitle}
								onChange={(v) =>
									patch("headers", { ...headers, awards: { ...headers.awards, subtitle: v } })
								}
							/>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* AWARDS (dùng chung config trang About) */}
				<AccordionItem value='awards' className='rounded-lg border px-4'>
					<AccordionTrigger>5. Giải thưởng &amp; Thành tích (danh sách)</AccordionTrigger>
					<AccordionContent className='space-y-3'>
						<p className='text-sm text-muted-foreground'>
							Khối này hiển thị ở trang chủ, ngay dưới phần Ban chủ nhiệm.
						</p>
						{awards.map((award, i) => (
							<ListItemCard
								key={i}
								index={i}
								total={awards.length}
								title={award.title || `Giải thưởng ${i + 1}`}
								onMoveUp={() => setAwards(move(awards, i, -1))}
								onMoveDown={() => setAwards(move(awards, i, 1))}
								onRemove={() => setAwards(awards.filter((_, idx) => idx !== i))}>
								<div className='grid gap-3 sm:grid-cols-2'>
									<TextField
										label='Tên giải thưởng'
										value={award.title}
										onChange={(v) => setAwards(replaceAt(awards, i, { title: v } as Partial<AboutAward>))}
									/>
									<TextField
										label='Cuộc thi / Đơn vị trao'
										value={award.event}
										onChange={(v) => setAwards(replaceAt(awards, i, { event: v } as Partial<AboutAward>))}
									/>
									<TextField
										label='Năm'
										value={award.year}
										onChange={(v) => setAwards(replaceAt(awards, i, { year: v } as Partial<AboutAward>))}
									/>
									<IconField
										value={award.icon}
										onChange={(v) => setAwards(replaceAt(awards, i, { icon: v } as Partial<AboutAward>))}
									/>
									<BgField
										value={award.bg}
										onChange={(v) => setAwards(replaceAt(awards, i, { bg: v } as Partial<AboutAward>))}
									/>
								</div>
								<ImageField
									label='Ảnh banner (tuỳ chọn — có ảnh sẽ hiển thị thay cho icon)'
									value={award.image ?? ""}
									onChange={(v) => setAwards(replaceAt(awards, i, { image: v } as Partial<AboutAward>))}
								/>
								<AreaField
									label='Mô tả'
									value={award.desc}
									onChange={(v) => setAwards(replaceAt(awards, i, { desc: v } as Partial<AboutAward>))}
								/>
							</ListItemCard>
						))}
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={() =>
								setAwards([
									...awards,
									{ icon: "Trophy", title: "", event: "", year: "", desc: "", bg: ABOUT_BG_OPTIONS[0].value, image: "" },
								])
							}>
							<Plus className='mr-2 h-4 w-4' /> Thêm giải thưởng
						</Button>
					</AccordionContent>
				</AccordionItem>

				{/* CONTRIBUTION */}
				<AccordionItem value='contribution' className='rounded-lg border px-4'>
					<AccordionTrigger>6. Kêu gọi đóng góp</AccordionTrigger>
					<AccordionContent className='space-y-4'>
						<TextField
							label='Tiêu đề'
							value={contribution.heading}
							onChange={(v) => patch("contribution", { ...contribution, heading: v })}
						/>
						<AreaField
							label='Nội dung (HTML: dùng <strong> để in đậm)'
							value={contribution.body_html}
							onChange={(v) => patch("contribution", { ...contribution, body_html: v })}
							hint='Có thể dùng thẻ <strong> để in đậm chữ.'
						/>
						<TextField
							label='Nút — nhãn'
							value={contribution.button_label}
							onChange={(v) => patch("contribution", { ...contribution, button_label: v })}
						/>
					</AccordionContent>
				</AccordionItem>

				{/* CTA */}
				<AccordionItem value='cta' className='rounded-lg border px-4'>
					<AccordionTrigger>7. CTA cuối trang</AccordionTrigger>
					<AccordionContent className='space-y-4'>
						<TextField
							label='Badge'
							value={cta.badge}
							onChange={(v) => patch("cta", { ...cta, badge: v })}
						/>
						<div className='grid gap-4 sm:grid-cols-2'>
							<TextField
								label='Tiêu đề — phần trước'
								value={cta.title_prefix}
								onChange={(v) => patch("cta", { ...cta, title_prefix: v })}
							/>
							<TextField
								label='Tiêu đề — phần nhấn mạnh'
								value={cta.highlight}
								onChange={(v) => patch("cta", { ...cta, highlight: v })}
							/>
							<TextField
								label='Tiêu đề — phần sau'
								value={cta.title_suffix}
								onChange={(v) => patch("cta", { ...cta, title_suffix: v })}
							/>
						</div>
						<AreaField
							label='Mô tả'
							value={cta.subtext}
							onChange={(v) => patch("cta", { ...cta, subtext: v })}
						/>
						<div className='grid gap-4 sm:grid-cols-2'>
							<TextField
								label='Nút — nhãn'
								value={cta.button_label}
								onChange={(v) => patch("cta", { ...cta, button_label: v })}
							/>
							<TextField
								label='Nút — đường dẫn'
								value={cta.button_link}
								onChange={(v) => patch("cta", { ...cta, button_link: v })}
							/>
						</div>
						<TextField
							label='Dòng cam kết (trust text)'
							value={cta.trust_text}
							onChange={(v) => patch("cta", { ...cta, trust_text: v })}
						/>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

export default LandingPageEditor;
