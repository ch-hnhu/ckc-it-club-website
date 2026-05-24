import { type FormEvent, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import departmentService from "@/services/department.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { Department, DepartmentUser } from "@/types/department.type";

type FieldErrors = {
	is_head?: string;
};

const roleOptions = [
	{ value: "head", label: "Trưởng ban" },
	{ value: "member", label: "Thành viên" },
];

interface DepartmentMemberRoleModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	department?: Department | null;
	member?: DepartmentUser | null;
	currentHead?: DepartmentUser | null;
	onSuccess?: () => void;
}

function DepartmentMemberRoleModal({
	open,
	onOpenChange,
	department,
	member,
	currentHead,
	onSuccess,
}: DepartmentMemberRoleModalProps) {
	const [roleValue, setRoleValue] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [confirmHeadChangeOpen, setConfirmHeadChangeOpen] = useState(false);

	useEffect(() => {
		if (!open) return;

		setRoleValue(member?.is_head ? "head" : "member");
		setFieldErrors({});
		setConfirmHeadChangeOpen(false);
	}, [open, member]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			setRoleValue("");
			setFieldErrors({});
			setConfirmHeadChangeOpen(false);
		}

		onOpenChange(nextOpen);
	};

	const submitRoleChange = async () => {
		if (!department || !member) return;

		setSubmitting(true);
		setFieldErrors({});

		try {
			await departmentService.updateDepartmentUserRole(department.id, member.id, {
				is_head: roleValue === "head",
			});

			toast.success("Cập nhật chức vụ thành viên thành công.", { position: "top-right" });
			setConfirmHeadChangeOpen(false);
			handleOpenChange(false);
			onSuccess?.();
		} catch (error) {
			const axiosError = error as AxiosError<ApiErrorResponse>;
			const responseData = axiosError.response?.data;

			if (responseData?.errors?.is_head?.[0]) {
				setFieldErrors({ is_head: responseData.errors.is_head[0] });
				setConfirmHeadChangeOpen(false);
				return;
			}

			toast.error(responseData?.message ?? "Không thể cập nhật chức vụ thành viên.", {
				position: "top-right",
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!department || !member) return;

		if (!roleValue) {
			setFieldErrors({ is_head: "Vui lòng chọn chức vụ trong ban." });
			return;
		}

		if (roleValue === "head" && currentHead && currentHead.id !== member.id) {
			setConfirmHeadChangeOpen(true);
			return;
		}

		await submitRoleChange();
	};

	return (
		<>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent
					className='max-w-sm'
					onOpenAutoFocus={(event) => {
						event.preventDefault();
						window.setTimeout(() => document.getElementById("department_member_role")?.focus(), 0);
					}}>
					<DialogHeader>
						<DialogTitle>Đổi chức vụ</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSubmit} className='flex flex-col gap-6'>
						<div className='space-y-2'>
							<Label>
								Chức vụ trong ban <span className='text-red-500'>*</span>
							</Label>
							<Combobox
								triggerId='department_member_role'
								autoFocus
								value={roleValue}
								onValueChange={(value) => {
									setRoleValue(value);
									setFieldErrors({});
								}}
								options={roleOptions}
								placeholder='Chọn chức vụ'
								searchPlaceholder='Tìm chức vụ...'
								triggerClassName='h-9'
							/>
							{fieldErrors.is_head ? (
								<p className='text-sm text-destructive'>{fieldErrors.is_head}</p>
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
								Cập nhật
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog open={confirmHeadChangeOpen} onOpenChange={setConfirmHeadChangeOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Đổi trưởng ban?</AlertDialogTitle>
						<AlertDialogDescription>
							Ban hiện đã có trưởng ban là {currentHead?.full_name}. Bạn có muốn đổi trưởng ban
							mới sang {member?.full_name} không?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={submitting}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							disabled={submitting}
							onClick={(event) => {
								event.preventDefault();
								void submitRoleChange();
							}}>
							{submitting ? "Đang cập nhật..." : "Đổi trưởng ban"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export default DepartmentMemberRoleModal;
