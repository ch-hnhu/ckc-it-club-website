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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import departmentService from "@/services/department.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { Department } from "@/types/department.type";

type DepartmentFormState = {
	name: string;
	description: string;
	is_active: boolean;
};

type FieldErrors = Partial<Record<keyof DepartmentFormState, string>>;

const getInitialState = (): DepartmentFormState => ({
	name: "",
	description: "",
	is_active: true,
});

interface DepartmentFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	department?: Department | null;
	onSuccess?: () => void;
}

function DepartmentFormModal({
	open,
	onOpenChange,
	department,
	onSuccess,
}: DepartmentFormModalProps) {
	const [form, setForm] = useState<DepartmentFormState>(getInitialState);
	const [submitting, setSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	useEffect(() => {
		if (!open) return;

		setForm({
			name: department?.name ?? "",
			description: department?.description ?? "",
			is_active: department?.is_active ?? true,
		});
		setFieldErrors({});
	}, [department, open]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			setForm(getInitialState());
			setFieldErrors({});
		}

		onOpenChange(nextOpen);
	};

	const updateField =
		(field: "name" | "description") =>
		(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
		if (!form.name.trim()) errors.name = "Vui lòng nhập tên ban.";
		if (form.description.trim().length > 1000) {
			errors.description = "Mô tả không được vượt quá 1000 ký tự.";
		}

		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			return;
		}

		setSubmitting(true);
		setFieldErrors({});

		try {
			const payload = {
				name: form.name.trim(),
				description: form.description.trim() || null,
				is_active: form.is_active,
			};

			if (department) {
				await departmentService.updateDepartment(department.id, payload);
				toast.success("Cập nhật ban thành công.", { position: "top-right" });
			} else {
				await departmentService.createDepartment(payload);
				toast.success("Tạo ban thành công.", { position: "top-right" });
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
					if (key === "name") serverErrors.name = messages[0];
					if (key === "description") serverErrors.description = messages[0];
					if (key === "is_active") serverErrors.is_active = messages[0];
				});

				if (Object.keys(serverErrors).length > 0) {
					setFieldErrors(serverErrors);
					return;
				}
			}

			toast.error(responseData?.message ?? "Không thể tạo ban.", {
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
					<DialogTitle>{department ? "Cập nhật ban" : "Thêm ban"}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='flex flex-col gap-6'>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='department_name'>
								Tên ban <span className='text-red-500'>*</span>
							</Label>
							<Input
								id='department_name'
								placeholder='Ví dụ: Ban Học thuật'
								value={form.name}
								onChange={updateField("name")}
							/>
							{fieldErrors.name ? (
								<p className='text-sm text-destructive'>{fieldErrors.name}</p>
							) : null}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='department_description'>Mô tả</Label>
							<Textarea
								id='department_description'
								placeholder='Nhập mô tả ngắn về phạm vi phụ trách của ban'
								value={form.description}
								onChange={updateField("description")}
								rows={4}
							/>
							{fieldErrors.description ? (
								<p className='text-sm text-destructive'>{fieldErrors.description}</p>
							) : null}
						</div>

						<div className='flex items-center justify-between rounded-md border px-3 py-2'>
							<div className='space-y-0.5'>
								<Label htmlFor='department_is_active'>Đang hoạt động</Label>
								<p className='text-xs text-muted-foreground'>
									Ban hoạt động sẽ hiển thị với trạng thái đang hoạt động.
								</p>
							</div>
							<Switch
								id='department_is_active'
								checked={form.is_active}
								onCheckedChange={(checked) =>
									setForm((prev) => ({ ...prev, is_active: checked }))
								}
							/>
						</div>
						{fieldErrors.is_active ? (
							<p className='text-sm text-destructive'>{fieldErrors.is_active}</p>
						) : null}
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

export default DepartmentFormModal;
