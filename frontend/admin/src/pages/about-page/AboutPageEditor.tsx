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
import { ABOUT_BG_OPTIONS } from "@/types/about";
import type {
	AboutContent,
	AboutDepartment,
	AboutFaq,
	AboutStat,
	AboutTimelineItem,
	AboutValue,
} from "@/types/about";
import {
	AreaField,
	BgField,
	getErrorMessage,
	IconField,
	ListItemCard,
	move,
	replaceAt,
	TextField,
} from "./config-fields";

/* ---------- Main page ---------- */

function AboutPageEditor() {
	const [content, setContent] = useState<AboutContent | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const breadcrumb = useMemo(() => getBreadcrumbsFromNavigation("/about-page"), []);
	useBreadcrumb(breadcrumb);

	useEffect(() => {
		let mounted = true;
		aboutPageService
			.getAboutContent()
			.then((data) => {
				if (mounted) setContent(data);
			})
			.catch((err) => {
				toast.error(getErrorMessage(err, "Không thể tải nội dung trang giới thiệu."), {
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
			// Chỉ gửi các section thuộc trang giới thiệu — bỏ `awards` (thuộc trang chủ).
			const { hero, story, mission, vision, stats, values, timeline, departments, faqs, cta } =
				content;
			const updated = await aboutPageService.updateAboutContent({
				hero,
				story,
				mission,
				vision,
				stats,
				values,
				timeline,
				departments,
				faqs,
				cta,
			});
			setContent(updated);
			toast.success("Đã lưu nội dung trang Về chúng tôi.", { position: "top-right" });
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

	// Helpers cập nhật từng nhánh
	const patch = <K extends keyof AboutContent>(key: K, value: AboutContent[K]) =>
		setContent((prev) => (prev ? { ...prev, [key]: value } : prev));

	const { hero, story, mission, vision, stats, values, timeline, departments, faqs, cta } = content;

	return (
		<div className='flex flex-col gap-6 p-4 pb-24 md:p-6 lg:p-8'>
			<div className='sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 py-3 backdrop-blur'>
				<div>
					<h1 className='text-xl font-bold'>Trang Về chúng tôi</h1>
					<p className='text-sm text-muted-foreground'>
						Chỉnh sửa nội dung hiển thị ở trang giới thiệu câu lạc bộ.
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
						<TextField
							label='Tiêu đề (phần trước)'
							value={hero.title_prefix}
							onChange={(v) => patch("hero", { ...hero, title_prefix: v })}
						/>
						<TextField
							label='Tiêu đề (phần nhấn mạnh)'
							value={hero.highlight}
							onChange={(v) => patch("hero", { ...hero, highlight: v })}
						/>
						<AreaField
							label='Mô tả (HTML: dùng <strong> để in đậm)'
							value={hero.lead_html}
							onChange={(v) => patch("hero", { ...hero, lead_html: v })}
							hint='Có thể dùng thẻ <strong> để in đậm chữ.'
						/>
						<div className='grid gap-4 sm:grid-cols-2'>
							<TextField
								label='Nút chính — nhãn'
								value={hero.primary_label}
								onChange={(v) => patch("hero", { ...hero, primary_label: v })}
							/>
							<TextField
								label='Nút chính — đường dẫn'
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

				{/* STORY */}
				<AccordionItem value='story' className='rounded-lg border px-4'>
					<AccordionTrigger>2. Câu chuyện của chúng tôi</AccordionTrigger>
					<AccordionContent className='space-y-4'>
						<TextField
							label='Tiêu đề'
							value={story.heading}
							onChange={(v) => patch("story", { ...story, heading: v })}
						/>
						<TextField
							label='Đường dẫn ảnh'
							value={story.image}
							onChange={(v) => patch("story", { ...story, image: v })}
						/>
						<div className='space-y-3'>
							<Label>Các đoạn văn (HTML: &lt;strong&gt;, &lt;mark&gt; để nhấn)</Label>
							{story.paragraphs.map((para, i) => (
								<ListItemCard
									key={i}
									index={i}
									total={story.paragraphs.length}
									title={`Đoạn ${i + 1}`}
									onMoveUp={() =>
										patch("story", { ...story, paragraphs: move(story.paragraphs, i, -1) })
									}
									onMoveDown={() =>
										patch("story", { ...story, paragraphs: move(story.paragraphs, i, 1) })
									}
									onRemove={() =>
										patch("story", {
											...story,
											paragraphs: story.paragraphs.filter((_, idx) => idx !== i),
										})
									}>
									<Textarea
										rows={3}
										value={para}
										onChange={(e) =>
											patch("story", {
												...story,
												paragraphs: story.paragraphs.map((p, idx) =>
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
									patch("story", { ...story, paragraphs: [...story.paragraphs, ""] })
								}>
								<Plus className='mr-2 h-4 w-4' /> Thêm đoạn
							</Button>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* MISSION & VISION */}
				<AccordionItem value='mission' className='rounded-lg border px-4'>
					<AccordionTrigger>3. Sứ mệnh & Tầm nhìn</AccordionTrigger>
					<AccordionContent className='space-y-6'>
						<div className='space-y-3'>
							<p className='text-sm font-semibold'>Sứ mệnh</p>
							<TextField
								label='Tiêu đề'
								value={mission.title}
								onChange={(v) => patch("mission", { ...mission, title: v })}
							/>
							<AreaField
								label='Nội dung'
								value={mission.body}
								onChange={(v) => patch("mission", { ...mission, body: v })}
							/>
						</div>
						<div className='space-y-3'>
							<p className='text-sm font-semibold'>Tầm nhìn</p>
							<TextField
								label='Tiêu đề'
								value={vision.title}
								onChange={(v) => patch("vision", { ...vision, title: v })}
							/>
							<AreaField
								label='Nội dung'
								value={vision.body}
								onChange={(v) => patch("vision", { ...vision, body: v })}
							/>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* STATS */}
				<AccordionItem value='stats' className='rounded-lg border px-4'>
					<AccordionTrigger>4. Con số ấn tượng</AccordionTrigger>
					<AccordionContent className='space-y-3'>
						{stats.map((stat, i) => (
							<ListItemCard
								key={i}
								index={i}
								total={stats.length}
								title={`Con số ${i + 1}`}
								onMoveUp={() => patch("stats", move(stats, i, -1))}
								onMoveDown={() => patch("stats", move(stats, i, 1))}
								onRemove={() =>
									patch(
										"stats",
										stats.filter((_, idx) => idx !== i),
									)
								}>
								<div className='grid gap-3 sm:grid-cols-2'>
									<TextField
										label='Giá trị'
										value={stat.value}
										onChange={(v) => patch("stats", replaceAt(stats, i, { value: v } as Partial<AboutStat>))}
									/>
									<TextField
										label='Nhãn'
										value={stat.label}
										onChange={(v) => patch("stats", replaceAt(stats, i, { label: v } as Partial<AboutStat>))}
									/>
								</div>
							</ListItemCard>
						))}
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={() => patch("stats", [...stats, { value: "", label: "" }])}>
							<Plus className='mr-2 h-4 w-4' /> Thêm con số
						</Button>
					</AccordionContent>
				</AccordionItem>

				{/* VALUES */}
				<AccordionItem value='values' className='rounded-lg border px-4'>
					<AccordionTrigger>5. Giá trị cốt lõi</AccordionTrigger>
					<AccordionContent className='space-y-3'>
						{values.map((val, i) => (
							<ListItemCard
								key={i}
								index={i}
								total={values.length}
								title={val.title || `Giá trị ${i + 1}`}
								onMoveUp={() => patch("values", move(values, i, -1))}
								onMoveDown={() => patch("values", move(values, i, 1))}
								onRemove={() =>
									patch(
										"values",
										values.filter((_, idx) => idx !== i),
									)
								}>
								<div className='grid gap-3 sm:grid-cols-2'>
									<TextField
										label='Emoji'
										value={val.emoji}
										onChange={(v) => patch("values", replaceAt(values, i, { emoji: v } as Partial<AboutValue>))}
									/>
									<BgField
										value={val.bg}
										onChange={(v) => patch("values", replaceAt(values, i, { bg: v } as Partial<AboutValue>))}
									/>
									<TextField
										label='Tiêu đề'
										value={val.title}
										onChange={(v) => patch("values", replaceAt(values, i, { title: v } as Partial<AboutValue>))}
									/>
									<TextField
										label='Phụ đề'
										value={val.subtitle}
										onChange={(v) => patch("values", replaceAt(values, i, { subtitle: v } as Partial<AboutValue>))}
									/>
								</div>
								<AreaField
									label='Mô tả'
									value={val.desc}
									onChange={(v) => patch("values", replaceAt(values, i, { desc: v } as Partial<AboutValue>))}
								/>
							</ListItemCard>
						))}
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={() =>
								patch("values", [
									...values,
									{
										icon: "Star",
										emoji: "⭐",
										title: "",
										subtitle: "",
										desc: "",
										bg: ABOUT_BG_OPTIONS[0].value,
									},
								])
							}>
							<Plus className='mr-2 h-4 w-4' /> Thêm giá trị
						</Button>
					</AccordionContent>
				</AccordionItem>

				{/* TIMELINE */}
				<AccordionItem value='timeline' className='rounded-lg border px-4'>
					<AccordionTrigger>6. Hành trình phát triển</AccordionTrigger>
					<AccordionContent className='space-y-3'>
						{timeline.map((item, i) => (
							<ListItemCard
								key={i}
								index={i}
								total={timeline.length}
								title={item.title || `Cột mốc ${i + 1}`}
								onMoveUp={() => patch("timeline", move(timeline, i, -1))}
								onMoveDown={() => patch("timeline", move(timeline, i, 1))}
								onRemove={() =>
									patch(
										"timeline",
										timeline.filter((_, idx) => idx !== i),
									)
								}>
								<div className='grid gap-3 sm:grid-cols-2'>
									<TextField
										label='Mốc (năm)'
										value={item.year}
										onChange={(v) => patch("timeline", replaceAt(timeline, i, { year: v } as Partial<AboutTimelineItem>))}
									/>
									<TextField
										label='Tiêu đề'
										value={item.title}
										onChange={(v) => patch("timeline", replaceAt(timeline, i, { title: v } as Partial<AboutTimelineItem>))}
									/>
									<IconField
										value={item.icon}
										onChange={(v) => patch("timeline", replaceAt(timeline, i, { icon: v } as Partial<AboutTimelineItem>))}
									/>
									<BgField
										value={item.bg}
										onChange={(v) => patch("timeline", replaceAt(timeline, i, { bg: v } as Partial<AboutTimelineItem>))}
									/>
								</div>
								<AreaField
									label='Mô tả'
									value={item.desc}
									onChange={(v) => patch("timeline", replaceAt(timeline, i, { desc: v } as Partial<AboutTimelineItem>))}
								/>
							</ListItemCard>
						))}
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={() =>
								patch("timeline", [
									...timeline,
									{ year: "", title: "", desc: "", icon: "Star", bg: ABOUT_BG_OPTIONS[0].value },
								])
							}>
							<Plus className='mr-2 h-4 w-4' /> Thêm cột mốc
						</Button>
					</AccordionContent>
				</AccordionItem>

				{/* DEPARTMENTS */}
				<AccordionItem value='departments' className='rounded-lg border px-4'>
					<AccordionTrigger>7. Cơ cấu các ban</AccordionTrigger>
					<AccordionContent className='space-y-3'>
						{departments.map((dept, i) => (
							<ListItemCard
								key={i}
								index={i}
								total={departments.length}
								title={dept.title || `Ban ${i + 1}`}
								onMoveUp={() => patch("departments", move(departments, i, -1))}
								onMoveDown={() => patch("departments", move(departments, i, 1))}
								onRemove={() =>
									patch(
										"departments",
										departments.filter((_, idx) => idx !== i),
									)
								}>
								<div className='grid gap-3 sm:grid-cols-2'>
									<TextField
										label='Tên ban'
										value={dept.title}
										onChange={(v) => patch("departments", replaceAt(departments, i, { title: v } as Partial<AboutDepartment>))}
									/>
									<IconField
										value={dept.icon}
										onChange={(v) => patch("departments", replaceAt(departments, i, { icon: v } as Partial<AboutDepartment>))}
									/>
									<BgField
										value={dept.bg}
										onChange={(v) => patch("departments", replaceAt(departments, i, { bg: v } as Partial<AboutDepartment>))}
									/>
								</div>
								<AreaField
									label='Mô tả'
									value={dept.desc}
									onChange={(v) => patch("departments", replaceAt(departments, i, { desc: v } as Partial<AboutDepartment>))}
								/>
							</ListItemCard>
						))}
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={() =>
								patch("departments", [
									...departments,
									{ icon: "Star", title: "", desc: "", bg: ABOUT_BG_OPTIONS[0].value },
								])
							}>
							<Plus className='mr-2 h-4 w-4' /> Thêm ban
						</Button>
					</AccordionContent>
				</AccordionItem>

				{/* FAQS */}
				<AccordionItem value='faqs' className='rounded-lg border px-4'>
					<AccordionTrigger>8. Câu hỏi thường gặp</AccordionTrigger>
					<AccordionContent className='space-y-3'>
						{faqs.map((faq, i) => (
							<ListItemCard
								key={i}
								index={i}
								total={faqs.length}
								title={faq.q || `Câu hỏi ${i + 1}`}
								onMoveUp={() => patch("faqs", move(faqs, i, -1))}
								onMoveDown={() => patch("faqs", move(faqs, i, 1))}
								onRemove={() =>
									patch(
										"faqs",
										faqs.filter((_, idx) => idx !== i),
									)
								}>
								<TextField
									label='Câu hỏi'
									value={faq.q}
									onChange={(v) => patch("faqs", replaceAt(faqs, i, { q: v } as Partial<AboutFaq>))}
								/>
								<AreaField
									label='Câu trả lời'
									value={faq.a}
									onChange={(v) => patch("faqs", replaceAt(faqs, i, { a: v } as Partial<AboutFaq>))}
								/>
							</ListItemCard>
						))}
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={() => patch("faqs", [...faqs, { q: "", a: "" }])}>
							<Plus className='mr-2 h-4 w-4' /> Thêm câu hỏi
						</Button>
					</AccordionContent>
				</AccordionItem>

				{/* CTA */}
				<AccordionItem value='cta' className='rounded-lg border px-4'>
					<AccordionTrigger>9. CTA cuối trang</AccordionTrigger>
					<AccordionContent className='space-y-4'>
						<TextField
							label='Tiêu đề'
							value={cta.title}
							onChange={(v) => patch("cta", { ...cta, title: v })}
						/>
						<AreaField
							label='Nội dung (HTML)'
							value={cta.body_html}
							onChange={(v) => patch("cta", { ...cta, body_html: v })}
							hint='Có thể dùng thẻ <strong> để in đậm chữ.'
						/>
						<div className='grid gap-4 sm:grid-cols-2'>
							<TextField
								label='Nút chính — nhãn'
								value={cta.primary_label}
								onChange={(v) => patch("cta", { ...cta, primary_label: v })}
							/>
							<TextField
								label='Nút chính — đường dẫn'
								value={cta.primary_link}
								onChange={(v) => patch("cta", { ...cta, primary_link: v })}
							/>
							<TextField
								label='Nút phụ — nhãn'
								value={cta.secondary_label}
								onChange={(v) => patch("cta", { ...cta, secondary_label: v })}
							/>
							<TextField
								label='Nút phụ — đường dẫn'
								value={cta.secondary_link}
								onChange={(v) => patch("cta", { ...cta, secondary_link: v })}
							/>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

export default AboutPageEditor;
