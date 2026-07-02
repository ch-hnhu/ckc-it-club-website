import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import courseService, { type EnrollableUserDTO } from "@/services/course.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { EnrollmentTrack } from "@/pages/learning/course-detail.types";

interface EnrollStudentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	courseSlug: string;
	/** Gọi sau khi ghi danh thành công để parent refetch danh sách học viên. */
	onEnrolled: () => void;
}

function EnrollStudentDialog({
	open,
	onOpenChange,
	courseSlug,
	onEnrolled,
}: EnrollStudentDialogProps) {
	const [search, setSearch] = useState("");
	const [results, setResults] = useState<EnrollableUserDTO[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [track, setTrack] = useState<EnrollmentTrack>("offline");
	const [enrollingId, setEnrollingId] = useState<number | null>(null);

	useEffect(() => {
		if (!open) {
			setSearch("");
			setResults([]);
			setTrack("offline");
		}
	}, [open]);

	useEffect(() => {
		const term = search.trim();
		if (term.length < 2) {
			setResults([]);
			return;
		}

		let cancelled = false;
		setIsSearching(true);
		const timer = setTimeout(() => {
			courseService
				.searchEnrollableUsers(courseSlug, term)
				.then((res) => {
					if (!cancelled) setResults(res.data);
				})
				.catch(() => {
					if (!cancelled) setResults([]);
				})
				.finally(() => {
					if (!cancelled) setIsSearching(false);
				});
		}, 300);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [search, courseSlug]);

	const handleEnroll = useCallback(
		async (user: EnrollableUserDTO) => {
			setEnrollingId(user.id);
			try {
				await courseService.enrollStudent(courseSlug, user.id, track);
				toast.success(`Đã ghi danh ${user.full_name ?? user.email}.`);
				setResults((prev) => prev.filter((u) => u.id !== user.id));
				onEnrolled();
			} catch (err) {
				const message =
					isAxiosError(err) && (err.response?.data as ApiErrorResponse | undefined)?.message
						? String((err.response?.data as ApiErrorResponse).message)
						: "Không thể ghi danh học viên. Vui lòng thử lại.";
				toast.error(message);
			} finally {
				setEnrollingId(null);
			}
		},
		[courseSlug, track, onEnrolled],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[480px]'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<UserPlus className='h-5 w-5' />
						Ghi danh học viên
					</DialogTitle>
					<DialogDescription>
						Tìm học viên theo tên hoặc email và chọn hình thức học để ghi danh thay.
					</DialogDescription>
				</DialogHeader>

				<div className='flex flex-col gap-3'>
					<div className='flex gap-2'>
						<div className='relative flex-1'>
							<Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
							<Input
								placeholder='Tìm theo tên, email...'
								className='pl-8'
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<Select value={track} onValueChange={(v) => setTrack(v as EnrollmentTrack)}>
							<SelectTrigger className='w-[120px]'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='offline'>Offline</SelectItem>
								<SelectItem value='online'>Online</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className='flex min-h-[160px] flex-col gap-1.5'>
						{isSearching ? (
							<div className='flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground'>
								<Loader2 className='h-4 w-4 animate-spin' />
								Đang tìm...
							</div>
						) : search.trim().length < 2 ? (
							<p className='py-8 text-center text-sm text-muted-foreground'>
								Nhập tối thiểu 2 ký tự để tìm kiếm.
							</p>
						) : results.length === 0 ? (
							<p className='py-8 text-center text-sm text-muted-foreground'>
								Không tìm thấy học viên phù hợp (hoặc đã ghi danh).
							</p>
						) : (
							results.map((user) => (
								<div
									key={user.id}
									className='flex items-center gap-2.5 rounded-md border p-2'>
									<Avatar className='h-8 w-8'>
										<AvatarImage src={user.avatar ?? undefined} />
										<AvatarFallback className='text-xs'>
											{(user.full_name ?? "?").charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className='min-w-0 flex-1'>
										<p className='truncate text-sm font-medium leading-none'>
											{user.full_name}
										</p>
										<p className='truncate text-xs text-muted-foreground'>{user.email}</p>
									</div>
									<Button
										size='sm'
										className='h-8 shrink-0'
										disabled={enrollingId === user.id}
										onClick={() => handleEnroll(user)}>
										{enrollingId === user.id ? (
											<Loader2 className='h-3.5 w-3.5 animate-spin' />
										) : (
											"Ghi danh"
										)}
									</Button>
								</div>
							))
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default EnrollStudentDialog;
