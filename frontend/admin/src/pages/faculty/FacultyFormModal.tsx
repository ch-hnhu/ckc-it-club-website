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
import facultyService from "@/services/faculty.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { Faculty } from "@/types/faculty.type";

type FacultyFormState = {
	label: string;
	value: string;
};

type FieldErrors = Partial<Record<keyof FacultyFormState, string>>;

const getInitialState = (): FacultyFormState => ({
	label: "",
	value: "",
});

interface FacultyFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	faculty?: Faculty | null;
	onSuccess?: () => void;
}

function FacultyFormModal({
	open,
	onOpenChange,
	faculty,
	onSuccess,
}: FacultyFormModalProps) {
	const [form, setForm] = useState<FacultyFormState>(getInitialState);
	const [submitting, setSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	useEffect(() => {
		if (!open) return;

		setForm({
			label: faculty?.label ?? "",
			value: faculty?.value ?? "",
		});
		setFieldErrors({});
	}, [faculty, open]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			setForm(getInitialState());
			setFieldErrors({});
		}
		onOpenChange(nextOpen);
	};

	const updateField =
		(field: keyof FacultyFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
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
		if (!form.label.trim()) errors.label = "Vui lòng nhập tên khoa.";
		if (!form.value.trim()) errors.value = "Vui lòng nhập mã khoa.";

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
			};

			if (faculty) {
				await facultyService.updateFaculty(faculty.id, payload);
				toast.success("Cập nhật khoa thành công.", { position: "top-right" });
			} else {
				await facultyService.createFaculty(payload);
				toast.success("Tạo khoa thành công.", { position: "top-right" });
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
				});

				if (Object.keys(serverErrors).length > 0) {
					setFieldErrors(serverErrors);
					return;
				}
			}

			toast.error(responseData?.message ?? "Không thể lưu khoa.", {
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
					<DialogTitle>{faculty ? "Cập nhật khoa" : "Thêm khoa mới"}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='flex flex-col gap-6'>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='faculty_label'>
								Tên khoa <span className='text-red-500'>*</span>
							</Label>
							<Input
								id='faculty_label'
								placeholder='Ví dụ: Công nghệ thông tin'
								value={form.label}
								onChange={updateField("label")}
							/>
							{fieldErrors.label ? (
								<p className='text-sm text-destructive'>{fieldErrors.label}</p>
							) : null}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='faculty_value'>
								Mã khoa <span className='text-red-500'>*</span>
							</Label>
							<Input
								id='faculty_value'
								placeholder='Ví dụ: CNTT'
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
						<Button type='submit' disabled={submitting}>
							{submitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
							Lưu
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default FacultyFormModal;
