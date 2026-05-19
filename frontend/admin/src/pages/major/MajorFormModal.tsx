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
import facultyService from "@/services/faculty.service";
import majorService from "@/services/major.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { Faculty } from "@/types/faculty.type";
import type { Major } from "@/types/major.type";

type MajorFormState = {
	label: string;
	value: string;
	faculty_id: string;
};

type FieldErrors = Partial<Record<keyof MajorFormState, string>>;

const getInitialState = (): MajorFormState => ({
	label: "",
	value: "",
	faculty_id: "",
});

interface MajorFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	major?: Major | null;
	onSuccess?: () => void;
}

function MajorFormModal({ open, onOpenChange, major, onSuccess }: MajorFormModalProps) {
	const [form, setForm] = useState<MajorFormState>(getInitialState);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [submitting, setSubmitting] = useState(false);
	const [faculties, setFaculties] = useState<Faculty[]>([]);
	const [loadingOptions, setLoadingOptions] = useState(false);

	useEffect(() => {
		if (!open) return;

		setForm({
			label: major?.label ?? "",
			value: major?.value ?? "",
			faculty_id: major?.faculty_id ? String(major.faculty_id) : "",
		});
		setFieldErrors({});
	}, [major, open]);

	useEffect(() => {
		if (!open) return;

		setLoadingOptions(true);
		facultyService
			.getFaculties({ per_page: 1000, sort: "label", order: "asc" })
			.then((response) => setFaculties(response.data))
			.catch((error) => {
				console.error(error);
				toast.error("Không thể tải danh sách khoa.", { position: "top-right" });
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
		(field: keyof Omit<MajorFormState, "faculty_id">) =>
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
		if (!form.label.trim()) errors.label = "Vui lòng nhập tên ngành.";
		if (!form.value.trim()) errors.value = "Vui lòng nhập mã ngành.";
		if (!form.faculty_id) errors.faculty_id = "Vui lòng chọn khoa.";

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
				faculty_id: Number(form.faculty_id),
			};

			if (major) {
				await majorService.updateMajor(major.id, payload);
				toast.success("Cập nhật ngành thành công.", { position: "top-right" });
			} else {
				await majorService.createMajor(payload);
				toast.success("Tạo ngành thành công.", { position: "top-right" });
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
					if (key === "faculty_id") serverErrors.faculty_id = messages[0];
				});

				if (Object.keys(serverErrors).length > 0) {
					setFieldErrors(serverErrors);
					return;
				}
			}

			toast.error(responseData?.message ?? "Không thể lưu ngành.", {
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
					<DialogTitle>{major ? "Cập nhật ngành" : "Thêm ngành mới"}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='flex flex-col gap-6'>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label>
								Khoa <span className='text-red-500'>*</span>
							</Label>
							<Select
								value={form.faculty_id}
								onValueChange={(value) => {
									setForm((prev) => ({ ...prev, faculty_id: value }));
									setFieldErrors((prev) => {
										const next = { ...prev };
										delete next.faculty_id;
										return next;
									});
								}}
								disabled={loadingOptions || submitting}>
								<SelectTrigger>
									<SelectValue placeholder='Chọn khoa' />
								</SelectTrigger>
								<SelectContent>
									{faculties.map((faculty) => (
										<SelectItem key={faculty.id} value={String(faculty.id)}>
											{faculty.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{fieldErrors.faculty_id ? (
								<p className='text-sm text-destructive'>{fieldErrors.faculty_id}</p>
							) : null}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='major_label'>
								Tên ngành <span className='text-red-500'>*</span>
							</Label>
							<Input
								id='major_label'
								placeholder='Ví dụ: Quản trị mạng'
								value={form.label}
								onChange={updateField("label")}
							/>
							{fieldErrors.label ? (
								<p className='text-sm text-destructive'>{fieldErrors.label}</p>
							) : null}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='major_value'>
								Mã ngành <span className='text-red-500'>*</span>
							</Label>
							<Input
								id='major_value'
								placeholder='Ví dụ: QTM'
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

export default MajorFormModal;
