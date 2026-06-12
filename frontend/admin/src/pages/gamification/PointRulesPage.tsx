import { useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import gamificationService from "@/services/gamification.service";
import type { PointRule, PointRulePayload } from "@/types/gamification.type";

interface FormState {
	key: string;
	name: string;
	description: string;
	points: number;
	max_per_day: string;
	max_per_week: string;
	is_active: boolean;
}

const emptyForm: FormState = {
	key: "",
	name: "",
	description: "",
	points: 0,
	max_per_day: "",
	max_per_week: "",
	is_active: true,
};

function toPayload(form: FormState): PointRulePayload {
	return {
		key: form.key.trim(),
		name: form.name.trim(),
		description: form.description.trim() || null,
		points: Number(form.points),
		max_per_day: form.max_per_day === "" ? null : Number(form.max_per_day),
		max_per_week: form.max_per_week === "" ? null : Number(form.max_per_week),
		is_active: form.is_active,
	};
}

function PointRulesPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Activity Point Rules" }]);

	const [rules, setRules] = useState<PointRule[]>([]);
	const [loading, setLoading] = useState(true);
	const [reloadToken, setReloadToken] = useState(0);

	const [formOpen, setFormOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<PointRule | null>(null);
	const [form, setForm] = useState<FormState>(emptyForm);
	const [isSaving, setIsSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<PointRule | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		gamificationService
			.getPointRules({ per_page: 100, sort: "created_at", order: "asc" })
			.then((res) => {
				if (!cancelled) setRules(res.data);
			})
			.catch(() => {
				if (!cancelled) toast.error("Không thể tải danh sách rule.");
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

	const openEdit = (rule: PointRule) => {
		setEditTarget(rule);
		setForm({
			key: rule.key,
			name: rule.name,
			description: rule.description ?? "",
			points: rule.points,
			max_per_day: rule.max_per_day?.toString() ?? "",
			max_per_week: rule.max_per_week?.toString() ?? "",
			is_active: rule.is_active,
		});
		setFormOpen(true);
	};

	const handleSave = async () => {
		if (!form.key.trim() || !form.name.trim()) {
			toast.error("Key và tên rule không được để trống.");
			return;
		}
		setIsSaving(true);
		try {
			if (editTarget) {
				await gamificationService.updatePointRule(editTarget.id, toPayload(form));
				toast.success("Đã cập nhật rule.");
			} else {
				await gamificationService.createPointRule(toPayload(form));
				toast.success("Đã tạo rule mới.");
			}
			setFormOpen(false);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể lưu rule. Kiểm tra key có bị trùng không.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await gamificationService.deletePointRule(deleteTarget.id);
			toast.success("Đã xóa rule.");
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể xóa rule.");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8'>
				<div className='flex items-start justify-between gap-4'>
					<div className='space-y-1'>
						<h2 className='text-2xl font-semibold tracking-tight'>
							Activity Point Rules
						</h2>
						<p className='text-muted-foreground text-sm'>
							Định nghĩa các quy tắc cộng điểm tự động. Điểm chỉ được cộng qua hành
							động thật — không cộng/trừ thủ công.
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
								<TableHead className='text-sm font-medium w-[200px]'>Key</TableHead>
								<TableHead>Tên</TableHead>
								<TableHead className='text-sm font-medium w-[90px] text-right'>
									Điểm
								</TableHead>
								<TableHead className='text-sm font-medium w-[100px] text-center'>
									Giới hạn/ngày
								</TableHead>
								<TableHead className='text-sm font-medium w-[100px] text-center'>
									Giới hạn/tuần
								</TableHead>
								<TableHead className='text-sm font-medium w-[110px] text-center'>
									Lượt cộng
								</TableHead>
								<TableHead className='text-sm font-medium w-[110px] text-center'>
									Trạng thái
								</TableHead>
								<TableHead className='text-sm font-medium w-[52px]' />
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={8}>
											<Skeleton className='h-4 w-full' />
										</TableCell>
									</TableRow>
								))
							) : rules.length > 0 ? (
								rules.map((rule) => (
									<TableRow key={rule.id}>
										<TableCell className='font-mono text-sm'>
											{rule.key}
										</TableCell>
										<TableCell>
											<div className='font-medium'>{rule.name}</div>
											{rule.description && (
												<div className='text-xs text-muted-foreground'>
													{rule.description}
												</div>
											)}
										</TableCell>
										<TableCell className='text-right font-semibold'>
											+{rule.points}
										</TableCell>
										<TableCell className='text-center text-sm text-muted-foreground'>
											{rule.max_per_day ?? "—"}
										</TableCell>
										<TableCell className='text-center text-sm text-muted-foreground'>
											{rule.max_per_week ?? "—"}
										</TableCell>
										<TableCell className='text-center text-sm text-muted-foreground'>
											{rule.transactions_count ?? 0}
										</TableCell>
										<TableCell className='text-center'>
											<Badge
												variant='outline'
												className={
													rule.is_active
														? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
														: "border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400"
												}>
												{rule.is_active ? "Đang bật" : "Đã tắt"}
											</Badge>
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
													className='w-[180px]'>
													<DropdownMenuItem
														onClick={() => openEdit(rule)}>
														<Pencil className='h-4 w-4' />
														Sửa
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className='text-destructive focus:bg-destructive/10 focus:text-destructive'
														onClick={() => setDeleteTarget(rule)}>
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
										colSpan={8}
										className='h-32 text-center text-muted-foreground'>
										Chưa có rule nào. Hãy thêm rule đầu tiên!
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			{/* Create / Edit dialog */}
			<Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
				<DialogContent className='sm:max-w-[520px]'>
					<DialogHeader>
						<DialogTitle>{editTarget ? "Sửa rule" : "Thêm rule mới"}</DialogTitle>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='rule-key'>
									Key <span className='text-destructive'>*</span>
								</Label>
								<Input
									id='rule-key'
									placeholder='vd: blog.published'
									value={form.key}
									onChange={(e) =>
										setForm((p) => ({ ...p, key: e.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='rule-points'>
									Điểm <span className='text-destructive'>*</span>
								</Label>
								<Input
									id='rule-points'
									type='number'
									value={form.points}
									onChange={(e) =>
										setForm((p) => ({ ...p, points: Number(e.target.value) }))
									}
								/>
							</div>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='rule-name'>
								Tên <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='rule-name'
								placeholder='vd: Xuất bản blog'
								value={form.name}
								onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='rule-description'>Mô tả</Label>
							<Textarea
								id='rule-description'
								rows={2}
								value={form.description}
								onChange={(e) =>
									setForm((p) => ({ ...p, description: e.target.value }))
								}
							/>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='rule-max-day'>Giới hạn / ngày</Label>
								<Input
									id='rule-max-day'
									type='number'
									min={1}
									placeholder='Không giới hạn'
									value={form.max_per_day}
									onChange={(e) =>
										setForm((p) => ({ ...p, max_per_day: e.target.value }))
									}
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='rule-max-week'>Giới hạn / tuần</Label>
								<Input
									id='rule-max-week'
									type='number'
									min={1}
									placeholder='Không giới hạn'
									value={form.max_per_week}
									onChange={(e) =>
										setForm((p) => ({ ...p, max_per_week: e.target.value }))
									}
								/>
							</div>
						</div>
						<div className='flex items-center justify-between rounded-md border px-3 py-2'>
							<Label htmlFor='rule-active' className='cursor-pointer'>
								Kích hoạt
							</Label>
							<Switch
								id='rule-active'
								checked={form.is_active}
								onCheckedChange={(c) => setForm((p) => ({ ...p, is_active: c }))}
							/>
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
								<DialogTitle>Xác nhận xóa rule</DialogTitle>
							</DialogHeader>
							<div className='space-y-3 text-sm text-muted-foreground'>
								<p>
									Bạn sắp xóa rule{" "}
									<span className='font-medium text-foreground'>
										{deleteTarget.name}
									</span>{" "}
									(<span className='font-mono'>{deleteTarget.key}</span>).
								</p>
								{(deleteTarget.transactions_count ?? 0) > 0 && (
									<p className='rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-400'>
										Luật này đã có {deleteTarget.transactions_count} giao dịch
										điểm. Xóa sẽ xóa kèm toàn bộ lịch sử điểm liên quan.
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
									{isDeleting ? "Đang xóa..." : "Xóa"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default PointRulesPage;
