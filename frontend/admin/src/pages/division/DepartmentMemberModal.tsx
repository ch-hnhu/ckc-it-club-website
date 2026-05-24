import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import userService from "@/services/user.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { Department } from "@/types/department.type";
import type { User } from "@/types/user.type";

interface DepartmentMemberModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	department?: Department | null;
	onSuccess?: () => void;
}

function DepartmentMemberModal({
	open,
	onOpenChange,
	department,
	onSuccess,
}: DepartmentMemberModalProps) {
	const [userId, setUserId] = useState("");
	const [users, setUsers] = useState<User[]>([]);
	const [loadingOptions, setLoadingOptions] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [userError, setUserError] = useState<string | undefined>();

	const userOptions = useMemo(
		() =>
			users.map((user) => ({
				value: String(user.id),
				label: `${user.full_name || user.email} (${user.email})`,
				keywords: [user.full_name, user.email].filter(Boolean) as string[],
			})),
		[users],
	);

	useEffect(() => {
		if (!open) return;

		setUserId("");
		setUserError(undefined);
		setLoadingOptions(true);

		userService
			.getUsers({ per_page: 100, sort: "full_name", order: "asc" })
			.then((response) => setUsers(response.data))
			.catch((error) => {
				console.error("Không thể tải danh sách người dùng:", error);
				toast.error("Không thể tải danh sách người dùng.", { position: "top-right" });
			})
			.finally(() => setLoadingOptions(false));
	}, [open]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			setUserId("");
			setUserError(undefined);
		}
		onOpenChange(nextOpen);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!department) return;

		if (!userId) {
			setUserError("Vui lòng chọn thành viên.");
			return;
		}

		setSubmitting(true);
		setUserError(undefined);

		try {
			await departmentService.addDepartmentUser(department.id, {
				user_id: Number(userId),
			});

			toast.success("Thêm thành viên vào ban thành công.", { position: "top-right" });
			handleOpenChange(false);
			onSuccess?.();
		} catch (error) {
			const axiosError = error as AxiosError<ApiErrorResponse>;
			const responseData = axiosError.response?.data;

			const serverUserError = responseData?.errors?.["user_id"]?.[0];
			if (serverUserError) {
				setUserError(serverUserError);
				return;
			}

			toast.error(responseData?.message ?? "Không thể thêm thành viên vào ban.", {
				position: "top-right",
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className='max-w-sm'
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					window.setTimeout(() => document.getElementById("department_member_user")?.focus(), 0);
				}}>
				<DialogHeader>
					<DialogTitle>Thêm thành viên</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='flex flex-col gap-6'>
					<div className='space-y-2'>
						<Label>
							Thành viên <span className='text-red-500'>*</span>
						</Label>
						<Combobox
							triggerId='department_member_user'
							autoFocus
							value={userId}
							onValueChange={(value) => {
								setUserId(value);
								setUserError(undefined);
							}}
							options={userOptions}
							placeholder={loadingOptions ? "Đang tải..." : "Chọn thành viên"}
							searchPlaceholder='Tìm thành viên...'
							disabled={loadingOptions}
							triggerClassName='h-9'
						/>
						{userError ? <p className='text-sm text-destructive'>{userError}</p> : null}
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
							Thêm
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default DepartmentMemberModal;
