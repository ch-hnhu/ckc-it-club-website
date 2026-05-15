import { type FormEvent, useState } from "react";
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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import roleService from "@/services/role.service";
import type { ApiErrorResponse } from "@/types/api.types";

type RoleFormState = {
	label: string;
	name: string;
	is_system: string; // 'true' | 'false'
};

type FieldErrors = Partial<Record<keyof RoleFormState, string>>;

const IS_SYSTEM_OPTIONS: ComboboxOption[] = [
	{ value: "true", label: "Có" },
	{ value: "false", label: "Không" },
];

const getInitialState = (): RoleFormState => ({
	label: "",
	name: "",
	is_system: "false",
});

interface CreateRoleModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

function CreateRoleModal({ open, onOpenChange, onSuccess }: CreateRoleModalProps) {
	const [form, setForm] = useState<RoleFormState>(getInitialState);
	const [submitting, setSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	const resetForm = () => {
		setForm(getInitialState());
		setFieldErrors({});
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) resetForm();
		onOpenChange(newOpen);
	};

	const updateField =
		(field: keyof RoleFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
			setFieldErrors((prev) => {
				if (!prev[field]) return prev;
				const next = { ...prev };
				delete next[field];
				return next;
			});
			setForm((prev) => ({ ...prev, [field]: e.target.value }));
		};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const errors: FieldErrors = {};
		if (!form.label.trim()) errors.label = "Vui lòng nhập tên vai trò.";
		if (!form.name.trim()) errors.name = "Vui lòng nhập giá trị vai trò.";
		// simple slug validation for name
		if (form.name && !/^[a-z-]+$/.test(form.name)) {
			errors.name = "Giá trị chỉ chứa chữ thường và '-'.";
		}
		if (form.is_system !== "true" && form.is_system !== "false")
			errors.is_system = "Vui lòng chọn loại vai trò.";

		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			return;
		}

		setFieldErrors({});
		setSubmitting(true);
		try {
			const payload = new FormData();
			payload.append("label", form.label.trim());
			payload.append("name", form.name.trim());
			payload.append("is_system", form.is_system === "true" ? "1" : "0");

			await roleService.createRole(payload);
			toast.success("Tạo vai trò thành công.", { position: "top-right" });
			resetForm();
			handleOpenChange(false);
			onSuccess?.();
		} catch (err) {
			const axiosError = err as AxiosError<ApiErrorResponse>;
			const responseData = axiosError.response?.data;

			if (responseData?.errors) {
				const serverErrors: FieldErrors = {};
				Object.entries(responseData.errors).forEach(([key, messages]) => {
					if (!Array.isArray(messages) || messages.length === 0) return;
					if (key === "label") serverErrors.label = messages[0];
					if (key === "name") serverErrors.name = messages[0];
					if (key === "is_system") serverErrors.is_system = messages[0];
				});

				if (Object.keys(serverErrors).length > 0) {
					setFieldErrors(serverErrors);
					return;
				}
			}

			toast.error(responseData?.message ?? "Không thể tạo vai trò.", {
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
					<DialogTitle>Tạo vai trò</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='flex flex-col gap-6'>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='role_label'>
								Tên vai trò <span className='text-red-500'>*</span>
							</Label>
							<Input
								id='role_label'
								placeholder='Ví dụ: Thành viên CLB'
								value={form.label}
								onChange={updateField("label")}
							/>
							{fieldErrors.label ? (
								<p className='text-sm text-destructive'>{fieldErrors.label}</p>
							) : null}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='role_value'>
								Giá trị <span className='text-red-500'>*</span>
							</Label>
							<Input
								id='role_value'
								placeholder='Ví dụ: club-member'
								value={form.name}
								onChange={updateField("name")}
							/>
							{fieldErrors.name ? (
								<p className='text-sm text-destructive'>{fieldErrors.name}</p>
							) : null}
						</div>

						<div className='space-y-2'>
							<Label>
								Là vai trò hệ thống? <span className='text-red-500'>*</span>
							</Label>
							<Combobox
								value={form.is_system}
								onValueChange={(v) => {
									setForm((p) => ({ ...p, is_system: v }));
									setFieldErrors((prev) => {
										const n = { ...prev };
										delete n.is_system;
										return n;
									});
								}}
								options={IS_SYSTEM_OPTIONS}
								searchable={false}
							/>
							{fieldErrors.is_system ? (
								<p className='text-sm text-destructive'>{fieldErrors.is_system}</p>
							) : null}
						</div>
					</div>

					<DialogFooter className='flex justify-between'>
						<div className='flex items-center gap-2'>
							<Button
								type='button'
								variant='outline'
								onClick={() => handleOpenChange(false)}
								disabled={submitting}>
								Hủy
							</Button>
							<Button type='submit' disabled={submitting}>
								{submitting ? (
									<Loader2 className='h-4 w-4 animate-spin mr-2' />
								) : null}
								Lưu
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default CreateRoleModal;
