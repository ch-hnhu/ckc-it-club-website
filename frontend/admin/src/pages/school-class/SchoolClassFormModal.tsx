import { type FormEvent, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import majorService from "@/services/major.service";
import schoolClassService from "@/services/school-class.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { Major } from "@/types/major.type";
import type { SchoolClass } from "@/types/school-class.type";

type SchoolClassFormState = {
	label: string;
	value: string;
	major_id: string;
};

type FieldErrors = Partial<Record<keyof SchoolClassFormState, string>>;

const getInitialState = (): SchoolClassFormState => ({
	label: "",
	value: "",
	major_id: "",
});

interface SchoolClassFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	schoolClass?: SchoolClass | null;
	onSuccess?: () => void;
}

function SchoolClassFormModal({
	open,
	onOpenChange,
	schoolClass,
	onSuccess,
}: SchoolClassFormModalProps) {
	const [form, setForm] = useState<SchoolClassFormState>(getInitialState);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [submitting, setSubmitting] = useState(false);
	const [majors, setMajors] = useState<Major[]>([]);
	const [loadingOptions, setLoadingOptions] = useState(false);

	useEffect(() => {
		if (!open) return;

		setForm({
			label: schoolClass?.label ?? "",
			value: schoolClass?.value ?? "",
			major_id: schoolClass?.major_id ? String(schoolClass.major_id) : "",
		});
		setFieldErrors({});
	}, [open, schoolClass]);

	useEffect(() => {
		if (!open) return;

		setLoadingOptions(true);
		majorService
			.getMajors({ per_page: 1000, sort: "label", order: "asc" })
			.then((response) => setMajors(response.data))
			.catch((error) => {
				console.error(error);
				toast.error("Không thể tải danh sách ngành.", { position: "top-right" });
			})
			.finally(() => setLoadingOptions(false));
	}, [open]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			setForm(getInitialState());
			setFieldErrors({});
		}
		onOpenChange(nextOpen);
	};

	const updateField =
		(field: keyof Omit<SchoolClassFormState, "major_id">) =>
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setFieldErrors((prev) => {
				if (!prev[field]) return prev;
				const next = { ...prev };
				delete next[field];
				return next;
			});
			setForm((prev) => ({ ...prev, [field]: event.target.value }));
		};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const errors: FieldErrors = {};
		if (!form.label.trim()) errors.label = "Vui lòng nhập tên lớp.";
		if (!form.value.trim()) errors.value = "Vui lòng nhập mã lớp.";
		if (!form.major_id) errors.major_id = "Vui lòng chọn ngành.";

		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			return;
		}

		setSubmitting(true);
		setFieldErrors({});

		try {
			const payload = {
				label: form.label.trim(),
				value: form.value.trim(),
				major_id: Number(form.major_id),
			};

			if (schoolClass) {
				await schoolClassService.updateSchoolClass(schoolClass.id, payload);
				toast.success("Cập nhật lớp thành công.", { position: "top-right" });
			} else {
				await schoolClassService.createSchoolClass(payload);
				toast.success("Tạo lớp thành công.", { position: "top-right" });
			}

			handleOpenChange(false);
			onSuccess?.();
		} catch (error) {
			const axiosError = error as AxiosError<ApiErrorResponse>;
			const responseData = axiosError.response?.data;

			if (responseData?.errors) {
				const serverErrors: FieldErrors = {};
				Object.entries(responseData.errors).forEach(([key, messages]) => {
					if (!Array.isArray(messages) || messages.length === 0) return;
					if (key === "label") serverErrors.label = messages[0];
					if (key === "value") serverErrors.value = messages[0];
					if (key === "major_id") serverErrors.major_id = messages[0];
				});

				if (Object.keys(serverErrors).length > 0) {
					setFieldErrors(serverErrors);
					return;
				}
			}

			toast.error(responseData?.message ?? "Không thể lưu lớp.", {
				position: "top-right",
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>{schoolClass ? "Cập nhật lớp" : "Thêm lớp mới"}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='flex flex-col gap-6'>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label>
								Ngành <span className='text-red-500'>*</span>
							</Label>
							<Select
								value={form.major_id}
								onValueChange={(value) => {
									setForm((prev) => ({ ...prev, major_id: value }));
									setFieldErrors((prev) => {
										const next = { ...prev };
										delete next.major_id;
										return next;
									});
								}}
								disabled={loadingOptions || submitting}>
								<SelectTrigger>
									<SelectValue placeholder='Chọn ngành' />
								</SelectTrigger>
								<SelectContent>
									{majors.map((major) => (
										<SelectItem key={major.id} value={String(major.id)}>
											{major.faculty?.label ? `${major.faculty.label} - ` : ""}
											{major.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{fieldErrors.major_id ? (
								<p className='text-sm text-destructive'>{fieldErrors.major_id}</p>
							) : null}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='school_class_label'>
								Tên lớp <span className='text-red-500'>*</span>
							</Label>
							<Input
								id='school_class_label'
								placeholder='Ví dụ: QTM 24'
								value={form.label}
								onChange={updateField("label")}
							/>
							{fieldErrors.label ? (
								<p className='text-sm text-destructive'>{fieldErrors.label}</p>
							) : null}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='school_class_value'>
								Mã lớp <span className='text-red-500'>*</span>
							</Label>
							<Input
								id='school_class_value'
								placeholder='Ví dụ: qtm-24'
								value={form.value}
								onChange={updateField("value")}
							/>
							{fieldErrors.value ? (
								<p className='text-sm text-destructive'>{fieldErrors.value}</p>
							) : null}
						</div>
					</div>

					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => handleOpenChange(false)}
							disabled={submitting}>
							Hủy
						</Button>
						<Button type='submit' disabled={submitting || loadingOptions}>
							{submitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
							Lưu
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default SchoolClassFormModal;
