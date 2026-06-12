import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ImagePlus, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { resolvePublicAssetUrl } from "@/lib/utils";
import gamificationService from "@/services/gamification.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { Level, LevelPayload } from "@/types/gamification.type";

interface FormState {
	name: string;
	min_points: number;
	badgeFile: File | null;
	badgePreview: string;
}

const emptyForm: FormState = { name: "", min_points: 0, badgeFile: null, badgePreview: "" };
const MAX_BADGE_SIZE = 2 * 1024 * 1024;

function toPayload(form: FormState): LevelPayload {
	return {
		name: form.name.trim(),
		min_points: Number(form.min_points),
		badge: form.badgeFile,
	};
}

function extractErrorMessage(error: unknown): string {
	if (!axios.isAxiosError<ApiErrorResponse>(error)) {
		return "Không thể lưu level.";
	}

	const responseData = error.response?.data;
	const firstFieldError = Object.values(responseData?.errors ?? {}).flat()[0];

	return firstFieldError ?? responseData?.message ?? "Không thể lưu level.";
}

function LevelsPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Level Rules" }]);

	const [levels, setLevels] = useState<Level[]>([]);
	const [loading, setLoading] = useState(true);
	const [reloadToken, setReloadToken] = useState(0);

	const [formOpen, setFormOpen] = useState(false);
	const badgeInputRef = useRef<HTMLInputElement>(null);
	const [editTarget, setEditTarget] = useState<Level | null>(null);
	const [form, setForm] = useState<FormState>(emptyForm);
	const [isSaving, setIsSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		gamificationService
			.getLevels()
			.then((res) => {
				if (!cancelled) setLevels(res.data);
			})
			.catch(() => {
				if (!cancelled) toast.error("Không thể tải danh sách level.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [reloadToken]);

	const openCreate = () => {
		setEditTarget(null);
		setForm(emptyForm);
		setFormOpen(true);
	};

	const openEdit = (level: Level) => {
		setEditTarget(level);
		setForm({
			name: level.name,
			min_points: level.min_points,
			badgeFile: null,
			badgePreview: level.badge ?? "",
		});
		setFormOpen(true);
	};

	const handleBadgeChange = (file: File | null) => {
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			toast.error("Badge phải là file ảnh.");
			return;
		}
		if (file.size > MAX_BADGE_SIZE) {
			toast.error("Badge tối đa 2MB. Hãy chọn ảnh nhỏ hơn hoặc nén GIF lại.");
			if (badgeInputRef.current) {
				badgeInputRef.current.value = "";
			}
			return;
		}

		setForm((p) => ({
			...p,
			badgeFile: file,
			badgePreview: URL.createObjectURL(file),
		}));
	};

	const clearSelectedBadge = () => {
		if (badgeInputRef.current) {
			badgeInputRef.current.value = "";
		}
		setForm((p) => ({
			...p,
			badgeFile: null,
			badgePreview: editTarget?.badge ?? "",
		}));
	};

	const handleSave = async () => {
		if (!form.name.trim()) {
			toast.error("Tên level không được để trống.");
			return;
		}
		setIsSaving(true);
		try {
			if (editTarget) {
				await gamificationService.updateLevel(editTarget.id, toPayload(form));
				toast.success("Đã cập nhật level. Chạy lệnh recompute-levels để đồng bộ user.");
			} else {
				await gamificationService.createLevel(toPayload(form));
				toast.success("Đã tạo level mới.");
			}
			setFormOpen(false);
			setReloadToken((p) => p + 1);
		} catch (error) {
			toast.error(extractErrorMessage(error));
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await gamificationService.deleteLevel(deleteTarget.id);
			toast.success("Đã xóa level.");
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể xóa level.");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8'>
				<div className='flex items-start justify-between gap-4'>
					<div className='space-y-1'>
						<h2 className='text-2xl font-semibold tracking-tight'>Level Rules</h2>
						<p className='text-muted-foreground text-sm'>
							Levels của thành viên tự cập nhật theo tổng điểm. Sau khi đổi mốc điểm,
							chạy{" "}
							<code className='rounded bg-muted px-1 py-0.5 text-xs'>
								php artisan gamification:recompute-levels
							</code>
							.
						</p>
					</div>
					<Button
						size='sm'
						onClick={openCreate}
						className='h-8 shrink-0 bg-foreground text-background hover:bg-foreground/90'>
						<Plus className='h-4 w-4' />
						Thêm
					</Button>
				</div>

				<div className='overflow-hidden rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='text-sm font-medium w-[80px] text-center'>
									Badge
								</TableHead>
								<TableHead className='text-sm font-medium '>Level</TableHead>
								<TableHead className='text-sm font-medium w-[140px] text-right'>
									Mốc điểm tối thiểu
								</TableHead>
								<TableHead className='max-w-[420px] text-sm font-medium'>
									Đường dẫn badge
								</TableHead>
								<TableHead className='text-sm font-medium w-[120px] text-center'>
									Thành viên
								</TableHead>
								<TableHead className='text-sm font-medium w-[52px]' />
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={6}>
											<Skeleton className='h-4 w-full' />
										</TableCell>
									</TableRow>
								))
							) : levels.length > 0 ? (
								levels.map((level) => (
									<TableRow key={level.id}>
										<TableCell className='text-center'>
											{level.badge ? (
												<img
													src={resolvePublicAssetUrl(level.badge)}
													alt={`Badge ${level.name}`}
													className='mx-auto h-10 w-10 object-contain'
												/>
											) : (
												<span className='text-sm text-muted-foreground'>
													—
												</span>
											)}
										</TableCell>
										<TableCell className='font-medium'>{level.name}</TableCell>
										<TableCell className='text-right font-semibold'>
											{level.min_points}
										</TableCell>
										<TableCell className='max-w-[420px]'>
											{level.badge ? (
												<a
													href={resolvePublicAssetUrl(level.badge)}
													target='_blank'
													rel='noreferrer'
													className='block truncate font-mono text-xs text-primary underline-offset-4 hover:underline'
													title={level.badge}>
													{level.badge}
												</a>
											) : (
												<span className='block font-mono text-xs text-muted-foreground'>
													—
												</span>
											)}
										</TableCell>
										<TableCell className='text-center text-sm text-muted-foreground'>
											{level.users_count ?? 0}
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant='ghost'
														className='h-8 w-8 p-0 data-[state=open]:bg-muted'>
														<MoreHorizontal className='h-4 w-4' />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent
													align='end'
													className='w-[170px]'>
													<DropdownMenuItem
														onClick={() => openEdit(level)}>
														<Pencil className='h-4 w-4' />
														Sửa
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className='text-destructive focus:bg-destructive/10 focus:text-destructive'
														onClick={() => setDeleteTarget(level)}>
														<Trash2 className='h-4 w-4 text-destructive' />
														Xóa
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={6}
										className='h-32 text-center text-muted-foreground'>
										Chưa có level nào. Hãy thêm level đầu tiên!
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Create / Edit dialog */}
			<Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
				<DialogContent className='sm:max-w-[480px]'>
					<DialogHeader>
						<DialogTitle>{editTarget ? "Sửa level" : "Thêm level mới"}</DialogTitle>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='level-name'>
								Level <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='level-name'
								placeholder='vd: Vàng'
								value={form.name}
								onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
							/>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='level-min'>
									Mốc điểm tối thiểu <span className='text-destructive'>*</span>
								</Label>
								<Input
									id='level-min'
									type='number'
									min={0}
									value={form.min_points}
									onChange={(e) =>
										setForm((p) => ({
											...p,
											min_points: Number(e.target.value),
										}))
									}
								/>
							</div>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='level-badge'>Badge image</Label>
							<div className='flex items-center gap-3'>
								<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted/30'>
									{form.badgePreview ? (
										<img
											src={resolvePublicAssetUrl(form.badgePreview)}
											alt='Badge preview'
											className='h-10 w-10 object-contain'
										/>
									) : (
										<span className='text-xs text-muted-foreground'>—</span>
									)}
								</div>
								<div className='min-w-0 flex-1'>
									<Input
										ref={badgeInputRef}
										id='level-badge'
										type='file'
										accept='image/*'
										className='hidden'
										onChange={(e) =>
											handleBadgeChange(e.target.files?.[0] ?? null)
										}
									/>
									<div className='flex items-center gap-2'>
										<Button
											type='button'
											variant='outline'
											onClick={() => badgeInputRef.current?.click()}>
											<ImagePlus className='h-4 w-4' />
											Chọn ảnh
										</Button>
										{form.badgeFile && (
											<Button
												type='button'
												variant='ghost'
												size='icon'
												onClick={clearSelectedBadge}>
												<X className='h-4 w-4' />
											</Button>
										)}
									</div>
									<p className='mt-1 truncate text-xs text-muted-foreground'>
										{form.badgeFile
											? form.badgeFile.name
											: editTarget?.badge
												? "Đang dùng ảnh hiện tại"
												: "JPG, PNG, WEBP hoặc GIF, tối đa 2MB"}
									</p>
								</div>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setFormOpen(false)}
							disabled={isSaving}>
							Hủy
						</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving ? "Đang lưu..." : editTarget ? "Lưu" : "Tạo"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent className='sm:max-w-[440px]'>
					{deleteTarget && (
						<>
							<DialogHeader>
								<DialogTitle>Xác nhận xóa level</DialogTitle>
							</DialogHeader>
							<div className='space-y-3 text-sm text-muted-foreground'>
								<p>
									Bạn sắp xóa level{" "}
									<span className='font-medium text-foreground'>
										{deleteTarget.name}
									</span>
									.
								</p>
								{(deleteTarget.users_count ?? 0) > 0 && (
									<p className='rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-400'>
										{deleteTarget.users_count} thành viên đang ở level này. Họ
										sẽ được hạ về level phù hợp sau khi recompute.
									</p>
								)}
								<p>Hành động này không thể hoàn tác.</p>
							</div>
							<DialogFooter>
								<Button
									variant='outline'
									onClick={() => setDeleteTarget(null)}
									disabled={isDeleting}>
									Hủy
								</Button>
								<Button
									variant='destructive'
									onClick={handleDelete}
									disabled={isDeleting}>
									{isDeleting ? "Đang xóa..." : "Xóa level"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default LevelsPage;
