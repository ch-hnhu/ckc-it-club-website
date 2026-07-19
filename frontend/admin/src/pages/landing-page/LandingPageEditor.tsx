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
import { getBreadcrumbsFromNavigation } from "@/config/navigation";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import aboutPageService from "@/services/about-page.service";
import { ABOUT_BG_OPTIONS } from "@/types/about";
import type { AboutAward } from "@/types/about";
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
 * Trình chỉnh sửa nội dung trang chủ. Hiện chỉ quản lý khối "Giải thưởng &
 * Thành tích" — khối duy nhất trên trang chủ được lấy từ config (slug
 * `about-awards`). Dùng chung endpoint /about-page nhưng chỉ gửi `awards` khi
 * lưu để không ảnh hưởng nội dung trang giới thiệu.
 */
function LandingPageEditor() {
	const [awards, setAwards] = useState<AboutAward[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const breadcrumb = useMemo(() => getBreadcrumbsFromNavigation("/landing-page"), []);
	useBreadcrumb(breadcrumb);

	useEffect(() => {
		let mounted = true;
		aboutPageService
			.getAboutContent()
			.then((data) => {
				if (mounted) setAwards(data.awards ?? []);
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
		if (!awards) return;
		setSaving(true);
		try {
			const updated = await aboutPageService.updateAboutContent({ awards });
			setAwards(updated.awards ?? []);
			toast.success("Đã lưu nội dung trang chủ.", { position: "top-right" });
		} catch (err) {
			toast.error(getErrorMessage(err, "Không thể lưu nội dung."), { position: "top-right" });
		} finally {
			setSaving(false);
		}
	};

	if (loading || !awards) {
		return (
			<div className='flex items-center justify-center py-20 text-muted-foreground'>
				<Loader2 className='mr-2 h-5 w-5 animate-spin' /> Đang tải nội dung...
			</div>
		);
	}

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

			<Accordion type='multiple' defaultValue={["awards"]} className='space-y-3'>
				{/* AWARDS */}
				<AccordionItem value='awards' className='rounded-lg border px-4'>
					<AccordionTrigger>Giải thưởng &amp; Thành tích</AccordionTrigger>
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
			</Accordion>
		</div>
	);
}

export default LandingPageEditor;
