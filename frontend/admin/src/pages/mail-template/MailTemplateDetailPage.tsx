import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	ArrowUpDown,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	MoreHorizontal,
	Plus,
	SquarePen,
	Trash2,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import mailTemplateService from "@/services/mail-template.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type {
	CreateMailTemplatePayload,
	MailTemplate,
	MailTemplateType,
} from "@/types/mail-template";

type SortKey = "id" | "name" | "subject" | "is_default" | "created_at" | "updated_at";

type TemplateFormState = {
	name: string;
	subject: string;
	body: string;
	is_default: boolean;
};

type TemplateFieldErrors = Partial<Record<keyof TemplateFormState, string>>;

const getInitialForm = (): TemplateFormState => ({
	name: "",
	subject: "",
	body: "",
	is_default: true,
});

const getFormFromRecord = (t: MailTemplate): TemplateFormState => ({
	name: t.name,
	subject: t.subject,
	body: t.body,
	is_default: t.is_default,
});

function formatText(value?: string | null) {
	return value?.trim() || "--";
}

function getErrorMessage(error: unknown, fallback: string) {
	if (axios.isAxiosError(error)) {
		const msg = (error.response?.data as { message?: string } | undefined)?.message;
		if (msg) return msg;
	}
	if (error instanceof Error && error.message) return error.message;
	return fallback;
}

function getFieldErrors(error: unknown): Record<string, string[]> {
	if (axios.isAxiosError(error)) {
		return (error.response?.data as ApiErrorResponse | undefined)?.errors ?? {};
	}
	return {};
}

function MailTemplateDetailPage() {
	const { id } = useParams<{ id: string }>();
	const typeId = Number(id);

	const [type, setType] = useState<MailTemplateType | null>(null);
	const [templates, setTemplates] = useState<MailTemplate[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sortConfig, setSortConfig] = useState<{
		key: SortKey | null;
		order: "asc" | "desc" | null;
	}>({
		key: "created_at",
		order: "desc",
	});
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });

	// Dialogs
	const [addOpen, setAddOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<MailTemplate | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<MailTemplate | null>(null);

	// Form
	const [form, setForm] = useState<TemplateFormState>(getInitialForm());
	const [fieldErrors, setFieldErrors] = useState<TemplateFieldErrors>({});
	const [submitting, setSubmitting] = useState(false);

	const breadcrumb = useMemo(
		() => [
			{ title: "Dashboard", link: "/" },
			{ title: "Tuyển thành viên", link: "/requests" },
			{ title: "Mail template", link: "/mail-templates" },
			{ title: type?.label ?? "Chi tiết" },
		],
		[type],
	);
	useBreadcrumb(breadcrumb);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, sortConfig]);

	const fetchTemplates = (page = meta.current_page) => {
		setLoading(true);
		mailTemplateService
			.getType(typeId, {
				page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				sort: sortConfig.key || undefined,
				order: sortConfig.order || undefined,
			})
			.then((res) => {
				setTemplates(res.data ?? []);
				if (res.meta) {
					setMeta({
						current_page: res.meta.current_page,
						last_page: res.meta.last_page,
						per_page: res.meta.per_page,
						total: res.meta.total,
					});
				}
			})
			.catch(() => toast.error("Không thể tải danh sách template."))
			.finally(() => setLoading(false));
	};

	// Separate initial type load
	useEffect(() => {
		mailTemplateService
			.getTypes()
			.then((res) => {
				const found = res.data?.find((t) => t.id === typeId);
				if (found) setType(found);
			})
			.catch(() => {});
	}, [typeId]);

	useEffect(() => {
		fetchTemplates(meta.current_page);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [typeId, debouncedSearch, sortConfig, meta.current_page, meta.per_page]);

	const handleSort = (key: SortKey) => {
		let order: "asc" | "desc" | null = "asc";

		if (sortConfig.key === key) {
			order = sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}

		setSortConfig({ key: order ? key : "created_at", order: order ?? "desc" });
	};

	const getSortIcon = (key: SortKey) =>
		sortConfig.key !== key ? (
			<ArrowUpDown className='ml-2 h-4 w-4' />
		) : sortConfig.order === "asc" ? (
			<ArrowUp className='ml-2 h-4 w-4' />
		) : sortConfig.order === "desc" ? (
			<ArrowDown className='ml-2 h-4 w-4' />
		) : (
			<ArrowUpDown className='ml-2 h-4 w-4' />
		);

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		templates.map((t) => t.id),
	);

	// -------------------------------------------------------------------------
	// Add / Edit submit
	// -------------------------------------------------------------------------
	const openAdd = () => {
		setForm(getInitialForm());
		setFieldErrors({});
		setAddOpen(true);
	};

	const openEdit = (t: MailTemplate) => {
		setEditTarget(t);
		setForm(getFormFromRecord(t));
		setFieldErrors({});
	};

	const handleSubmit = async () => {
		const errors: TemplateFieldErrors = {};
		if (!form.name.trim()) errors.name = "Tên template không được để trống.";
		if (!form.subject.trim()) errors.subject = "Tiêu đề không được để trống.";
		if (!form.body.trim()) errors.body = "Nội dung không được để trống.";
		if (Object.keys(errors).length) {
			setFieldErrors(errors);
			return;
		}
		setFieldErrors({});

		const payload: CreateMailTemplatePayload = {
			name: form.name.trim(),
			subject: form.subject.trim(),
			body: form.body,
			is_default: form.is_default,
		};

		setSubmitting(true);
		try {
			if (editTarget) {
				const res = await mailTemplateService.updateTemplate(typeId, editTarget.id, payload);
				setTemplates((prev) => prev.map((t) => (t.id === editTarget.id ? res.data : t)));
				if (payload.is_default) {
					setTemplates((prev) =>
						prev.map((t) => ({
							...t,
							is_default: t.id === editTarget.id,
						})),
					);
				}
				toast.success("Cập nhật template thành công.");
				setEditTarget(null);
			} else {
				await mailTemplateService.createTemplate(typeId, payload);
				toast.success("Thêm template thành công.");
				setAddOpen(false);
				fetchTemplates(1);
			}
		} catch (err) {
			const fe = getFieldErrors(err);
			if (Object.keys(fe).length) {
				const mapped: TemplateFieldErrors = {};
				if (fe.name) mapped.name = fe.name[0];
				if (fe.subject) mapped.subject = fe.subject[0];
				if (fe.body) mapped.body = fe.body[0];
				if (fe.is_default) mapped.is_default = fe.is_default[0];
				setFieldErrors(mapped);
			} else {
				toast.error(getErrorMessage(err, "Thao tác thất bại."));
			}
		} finally {
			setSubmitting(false);
		}
	};

	// -------------------------------------------------------------------------
	// Set default
	// -------------------------------------------------------------------------
	const handleSetDefault = async (t: MailTemplate) => {
		if (t.is_default) return;
		try {
			await mailTemplateService.setDefaultTemplate(typeId, t.id);
			setTemplates((prev) => prev.map((item) => ({ ...item, is_default: item.id === t.id })));
			toast.success("Đặt template mặc định thành công.");
		} catch (err) {
			toast.error(getErrorMessage(err, "Thao tác thất bại."));
		}
	};

	// -------------------------------------------------------------------------
	// Delete
	// -------------------------------------------------------------------------
	const handleDelete = async () => {
		if (!deleteTarget) return;
		setSubmitting(true);
		try {
			await mailTemplateService.deleteTemplate(typeId, deleteTarget.id);
			toast.success("Xóa template thành công.");
			setDeleteTarget(null);
			fetchTemplates(meta.current_page);
		} catch (err) {
			toast.error(getErrorMessage(err, "Xóa thất bại."));
		} finally {
			setSubmitting(false);
		}
	};

	// -------------------------------------------------------------------------
	// Render
	// -------------------------------------------------------------------------
	const templateForm = (
		<div className='space-y-4 py-2'>
			<div className='space-y-1'>
				<Label htmlFor='t-name'>
					Tên template <span className='text-destructive'>*</span>
				</Label>
				<Input
					id='t-name'
					value={form.name}
					onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
					placeholder='Ví dụ: Template mặc định'
				/>
				{fieldErrors.name && <p className='text-destructive text-xs'>{fieldErrors.name}</p>}
			</div>
			<div className='space-y-1'>
				<Label htmlFor='t-subject'>
					Tiêu đề email <span className='text-destructive'>*</span>
				</Label>
				<Input
					id='t-subject'
					value={form.subject}
					onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
					placeholder='Ví dụ: [CKC IT CLUB] Kết quả xét tuyển'
				/>
				{fieldErrors.subject && (
					<p className='text-destructive text-xs'>{fieldErrors.subject}</p>
				)}
			</div>
			<div className='space-y-1'>
				<Label htmlFor='t-body'>
					Nội dung <span className='text-destructive'>*</span>
				</Label>
				<p className='text-muted-foreground text-xs'>
					Hỗ trợ HTML. Biến:{" "}
					<code className='bg-muted rounded px-1 text-xs'>{"{{applicant_name}}"}</code>{" "}
					<code className='bg-muted rounded px-1 text-xs'>{"{{club_name}}"}</code>{" "}
					<code className='bg-muted rounded px-1 text-xs'>{"{{status_label}}"}</code>
				</p>
				<Textarea
					id='t-body'
					value={form.body}
					onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
					className='min-h-48 resize-y font-mono text-sm'
					placeholder='<p>Xin chào {{applicant_name}},</p>'
				/>
				{fieldErrors.body && <p className='text-destructive text-xs'>{fieldErrors.body}</p>}
			</div>
			<div className='flex items-center gap-2'>
				<Checkbox
					id='t-default'
					checked={form.is_default}
					onCheckedChange={(v) => setForm((p) => ({ ...p, is_default: !!v }))}
				/>
				<Label htmlFor='t-default' className='cursor-pointer'>
					Đặt làm template mặc định
				</Label>
				{fieldErrors.is_default && (
					<p className='text-destructive text-xs'>{fieldErrors.is_default}</p>
				)}
			</div>
		</div>
	);

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<Button asChild variant='outline' className='w-fit'>
				<Link to='/mail-templates'>
					<ArrowLeft className='h-4 w-4' />
					Quay lại
				</Link>
			</Button>

			<Card className='shadow-sm'>
				<CardHeader className='pb-2'>
					{loading && !type ? (
						<Skeleton className='h-7 w-48' />
					) : (
						<CardTitle className='text-lg leading-snug'>{type?.label}</CardTitle>
					)}
					<CardDescription>{type?.description || "Quản lý template email"}</CardDescription>
				</CardHeader>
			</Card>

			<div className='flex flex-col gap-4'>
				<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
					<div className='flex flex-1 items-center justify-between gap-2'>
						<Input
							placeholder='Tìm kiếm theo tên, tiêu đề...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='h-8 w-full sm:max-w-sm'
						/>
						<Button size='sm' className='h-8' onClick={openAdd}>
							<Plus className='h-4 w-4' />
							Thêm template
						</Button>
					</div>
				</div>

				<div className='overflow-hidden rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-[50px]'>
									<Checkbox
										aria-label='Select all'
										checked={allSelected}
										onCheckedChange={(checked) => toggleAll(checked === true)}
									/>
								</TableHead>
								<TableHead className='w-[80px]'>
									<Button
										variant='ghost'
										onClick={() => handleSort("id")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										ID
										{getSortIcon("id")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("name")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Tên
										{getSortIcon("name")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("subject")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Tiêu đề
										{getSortIcon("subject")}
									</Button>
								</TableHead>
								<TableHead className='w-[140px] text-center'>
									<Button
										variant='ghost'
										onClick={() => handleSort("is_default")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Mặc định
										{getSortIcon("is_default")}
									</Button>
								</TableHead>
								<TableHead className='w-[140px]'>
									<Button
										variant='ghost'
										onClick={() => handleSort("created_at")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Ngày tạo
										{getSortIcon("created_at")}
									</Button>
								</TableHead>
								<TableHead className='w-[140px]'>
									<Button
										variant='ghost'
										onClick={() => handleSort("updated_at")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Cập nhật
										{getSortIcon("updated_at")}
									</Button>
								</TableHead>
								<TableHead className='w-12' />
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: 3 }).map((_, i) => (
									<TableRow key={i}>
										{Array.from({ length: 8 }).map((_, j) => (
											<TableCell key={j}>
												<Skeleton className='h-4 w-full' />
											</TableCell>
										))}
									</TableRow>
								))
							) : templates.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8} className='h-24 text-center'>
										Chưa có template nào.
									</TableCell>
								</TableRow>
							) : (
								templates.map((t) => (
									<TableRow key={t.id}>
										<TableCell>
											<Checkbox
												aria-label={`Select template ${t.id}`}
												checked={isSelected(t.id)}
												onCheckedChange={(checked) => toggleOne(t.id, checked === true)}
											/>
										</TableCell>
										<TableCell className='font-medium'>{t.id}</TableCell>
										<TableCell className='font-medium'>{t.name}</TableCell>
										<TableCell className='text-muted-foreground max-w-xs truncate text-sm'>
											{t.subject}
										</TableCell>
										<TableCell className='text-center'>
											{t.is_default && (
												<CheckCircle2 className='inline h-4 w-4 text-emerald-500' />
											)}
										</TableCell>
										<TableCell className='text-muted-foreground text-sm'>
											{formatText(t.created_at)}
										</TableCell>
										<TableCell className='text-muted-foreground text-sm'>
											{formatText(t.updated_at)}
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant='ghost'
														className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
														<MoreHorizontal className='h-4 w-4' />
														<span className='sr-only'>Open menu</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end' className='w-[190px]'>
													<DropdownMenuItem onClick={() => openEdit(t)}>
														<SquarePen className='h-4 w-4' />
														Chỉnh sửa
													</DropdownMenuItem>
													{!t.is_default && (
														<DropdownMenuItem onClick={() => handleSetDefault(t)}>
															<CheckCircle2 className='h-4 w-4' />
															Đặt làm mặc định
														</DropdownMenuItem>
													)}
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className='text-destructive focus:bg-destructive/10 focus:text-destructive'
														onClick={() => setDeleteTarget(t)}
														disabled={t.is_default}>
														<Trash2 className='text-destructive h-4 w-4' />
														Xóa
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
						<TableFooter className='bg-transparent'>
							<TableRow>
								<TableCell colSpan={8}>
									<div className='flex items-center justify-between px-2'>
										<div className='flex-1 text-sm text-muted-foreground'>
											Đang hiện {templates.length} trên tổng {meta.total} dòng.
										</div>
										<div className='flex items-center space-x-6 lg:space-x-8'>
											<div className='flex items-center space-x-2'>
												<p className='text-sm font-medium'>Rows per page</p>
												<Select
													value={`${meta.per_page}`}
													onValueChange={(value) =>
														setMeta((prev) => ({
															...prev,
															per_page: Number(value),
															current_page: 1,
														}))
													}>
													<SelectTrigger className='h-8 w-[70px]'>
														<SelectValue placeholder={`${meta.per_page}`} />
													</SelectTrigger>
													<SelectContent side='top'>
														{[10, 20, 25, 30, 40, 50].map((pageSize) => (
															<SelectItem key={pageSize} value={`${pageSize}`}>
																{pageSize}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className='flex w-[100px] items-center justify-center text-sm font-medium'>
												Page {meta.current_page} of {meta.last_page}
											</div>
											<div className='flex items-center space-x-2'>
												<Button
													variant='outline'
													className='hidden h-8 w-8 p-0 lg:flex'
													onClick={() =>
														setMeta((prev) => ({ ...prev, current_page: 1 }))
													}
													disabled={loading || meta.current_page === 1}>
													<span className='sr-only'>Đi đến trang đầu</span>
													<ChevronsLeft className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='h-8 w-8 p-0'
													onClick={() =>
														setMeta((prev) => ({
															...prev,
															current_page: prev.current_page - 1,
														}))
													}
													disabled={loading || meta.current_page === 1}>
													<span className='sr-only'>Quay lại trang trước</span>
													<ChevronLeft className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='h-8 w-8 p-0'
													onClick={() =>
														setMeta((prev) => ({
															...prev,
															current_page: prev.current_page + 1,
														}))
													}
													disabled={loading || meta.current_page >= meta.last_page}>
													<span className='sr-only'>Đi đến trang tiếp theo</span>
													<ChevronRight className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='hidden h-8 w-8 p-0 lg:flex'
													onClick={() =>
														setMeta((prev) => ({
															...prev,
															current_page: meta.last_page,
														}))
													}
													disabled={loading || meta.current_page >= meta.last_page}>
													<span className='sr-only'>Đi đến trang cuối</span>
													<ChevronsRight className='h-4 w-4' />
												</Button>
											</div>
										</div>
									</div>
								</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</div>
			</div>

			{/* Add dialog */}
			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Thêm template mới</DialogTitle>
					</DialogHeader>
					{templateForm}
					<DialogFooter>
						<Button variant='outline' onClick={() => setAddOpen(false)} disabled={submitting}>
							Hủy
						</Button>
						<Button onClick={handleSubmit} disabled={submitting}>
							{submitting ? "Đang lưu..." : "Lưu"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit dialog */}
			<Dialog
				open={!!editTarget}
				onOpenChange={(open) => {
					if (!open) setEditTarget(null);
				}}>
				<DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>Chỉnh sửa template</DialogTitle>
					</DialogHeader>
					{templateForm}
					<DialogFooter>
						<Button variant='outline' onClick={() => setEditTarget(null)} disabled={submitting}>
							Hủy
						</Button>
						<Button onClick={handleSubmit} disabled={submitting}>
							{submitting ? "Đang lưu..." : "Lưu"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xác nhận xóa template</AlertDialogTitle>
						<AlertDialogDescription>
							Bạn có chắc chắn muốn xóa template <strong>"{deleteTarget?.name}"</strong>? Hành
							động này không thể hoàn tác.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={submitting}>Hủy</AlertDialogCancel>
						<Button variant='destructive' onClick={handleDelete} disabled={submitting}>
							{submitting ? "Đang xóa..." : "Xóa"}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default MailTemplateDetailPage;
