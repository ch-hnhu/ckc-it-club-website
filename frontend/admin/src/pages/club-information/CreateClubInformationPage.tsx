import { type FormEvent, useMemo, useState } from "react";
import axios from "axios";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getBreadcrumbsFromNavigation } from "@/config/navigation";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import clubInformationService from "@/services/club-information.service";
import type { ApiErrorResponse } from "@/types/api.types";
import { CLUB_INFORMATION_TYPES } from "@/types/club-information";

type FormState = {
	label: string;
	value: string;
	slug: string;
	type: string;
	description: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const getInitialForm = (): FormState => ({
	label: "",
	value: "",
	slug: "",
	type: "",
	description: "",
});

function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/đ/g, "d")
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

function CreateClubInformationPage() {
	const navigate = useNavigate();
	const [form, setForm] = useState<FormState>(getInitialForm);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [submitting, setSubmitting] = useState(false);

	const breadcrumb = useMemo(
		() => getBreadcrumbsFromNavigation("/club-informations", [{ title: "Thêm cấu hình" }]),
		[],
	);
	useBreadcrumb(breadcrumb);

	const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
		setForm((prev) => ({ ...prev, [key]: val }));
		setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleLabelChange = (val: string) => {
		setField("label", val);
		setField("slug", slugify(val));
	};

	const validate = (): boolean => {
		const errors: FieldErrors = {};
		if (!form.label.trim()) errors.label = "Vui lòng nhập tên cấu hình.";
		if (!form.value.trim()) errors.value = "Vui lòng nhập giá trị key.";
		if (!form.slug.trim()) errors.slug = "Vui lòng nhập slug.";
		if (!form.type) errors.type = "Vui lòng chọn kiểu dữ liệu.";
		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setSubmitting(true);
		try {
			await clubInformationService.createClubInformation({
				label: form.label.trim(),
				value: form.value.trim(),
				slug: form.slug.trim(),
				type: form.type,
				description: form.description.trim() || undefined,
			});
			toast.success("Tạo cấu hình thành công.", { position: "top-right" });
			navigate("/club-informations");
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const data = err.response?.data as ApiErrorResponse | undefined;
				if (data?.errors) {
					const mapped: FieldErrors = {};
					for (const [key, msgs] of Object.entries(data.errors)) {
						mapped[key as keyof FormState] = Array.isArray(msgs)
							? msgs[0]
							: String(msgs);
					}
					setFieldErrors(mapped);
					return;
				}
				toast.error(data?.message ?? "Có lỗi xảy ra.", { position: "top-right" });
			} else {
				toast.error("Có lỗi xảy ra.", { position: "top-right" });
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<Button asChild variant='outline' className='w-fit'>
				<Link to='/club-informations'>
					<ArrowLeft className='h-4 w-4' />
					Quay lại
				</Link>
			</Button>

			<form onSubmit={(e) => void handleSubmit(e)}>
				<Card className='shadow-sm'>
					<CardHeader>
						<CardTitle>Thêm cấu hình mới</CardTitle>
						<CardDescription>
							Tạo một cấu hình thông tin CLB. Chọn đúng kiểu dữ liệu để form nhập giá
							trị hiển thị phù hợp.
						</CardDescription>
					</CardHeader>

					<CardContent className='grid gap-6 sm:grid-cols-2'>
						{/* Label */}
						<div className='flex flex-col gap-2'>
							<Label htmlFor='label'>
								Tên cấu hình <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='label'
								placeholder='VD: Logo CLB'
								value={form.label}
								onChange={(e) => handleLabelChange(e.target.value)}
								disabled={submitting}
							/>
							{fieldErrors.label && (
								<p className='text-sm text-destructive'>{fieldErrors.label}</p>
							)}
						</div>

						{/* Value (key) */}
						<div className='flex flex-col gap-2'>
							<Label htmlFor='value'>
								Giá trị key <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='value'
								placeholder='VD: club_logo'
								value={form.value}
								onChange={(e) => setField("value", e.target.value)}
								disabled={submitting}
							/>
							{fieldErrors.value && (
								<p className='text-sm text-destructive'>{fieldErrors.value}</p>
							)}
						</div>

						{/* Slug */}
						<div className='flex flex-col gap-2'>
							<Label htmlFor='slug'>
								Slug <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='slug'
								placeholder='VD: club-logo'
								value={form.slug}
								onChange={(e) => setField("slug", e.target.value)}
								disabled={submitting}
							/>
							{fieldErrors.slug && (
								<p className='text-sm text-destructive'>{fieldErrors.slug}</p>
							)}
						</div>

						{/* Type */}
						<div className='flex flex-col gap-2'>
							<Label htmlFor='type'>
								Kiểu dữ liệu <span className='text-destructive'>*</span>
							</Label>
							<Select
								value={form.type}
								onValueChange={(v) => setField("type", v)}
								disabled={submitting}>
								<SelectTrigger id='type' className='w-full'>
									<SelectValue placeholder='Chọn kiểu dữ liệu' />
								</SelectTrigger>
								<SelectContent>
									{CLUB_INFORMATION_TYPES.map((t) => (
										<SelectItem key={t.value} value={t.value}>
											{t.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{form.type && (
								<p className='text-xs text-muted-foreground'>
									{form.type === "text" && "Văn bản ngắn."}
									{form.type === "longtext" && "Văn bản dài (thuần, không định dạng)."}
									{form.type === "html" && "Nội dung HTML có định dạng."}
									{form.type === "markdown" && "Nội dung Markdown dài."}
									{form.type === "url" && "Đường dẫn URL."}
									{form.type === "image" && "URL ảnh, hỗ trợ nhập alt text."}
									{form.type === "banner" &&
										"Ảnh banner với link, alt và vị trí."}
									{form.type === "boolean" && "Giá trị true/false."}
								</p>
							)}
							{fieldErrors.type && (
								<p className='text-sm text-destructive'>{fieldErrors.type}</p>
							)}
						</div>

						{/* Description */}
						<div className='flex flex-col gap-2 sm:col-span-2'>
							<Label htmlFor='description'>Mô tả</Label>
							<Textarea
								id='description'
								placeholder='Mô tả ngắn về cấu hình này...'
								value={form.description}
								onChange={(e) => setField("description", e.target.value)}
								disabled={submitting}
								rows={3}
							/>
							{fieldErrors.description && (
								<p className='text-sm text-destructive'>
									{fieldErrors.description}
								</p>
							)}
						</div>
					</CardContent>

					<CardFooter className='flex justify-end gap-3 border-t pt-6'>
						<Button
							type='button'
							variant='outline'
							onClick={() => navigate("/club-informations")}
							disabled={submitting}>
							Hủy
						</Button>
						<Button type='submit' disabled={submitting}>
							{submitting && <Loader2 className='h-4 w-4 animate-spin' />}
							Tạo cấu hình
						</Button>
					</CardFooter>
				</Card>
			</form>
		</div>
	);
}

export default CreateClubInformationPage;
