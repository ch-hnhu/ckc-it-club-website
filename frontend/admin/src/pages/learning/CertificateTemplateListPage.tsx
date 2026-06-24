import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Award,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Eye,
	ImageIcon,
	MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import certificateTemplateService from "@/services/certificate-template.service";
import type {
	CertificateTemplate,
	CertificateTemplateSortKey,
} from "@/types/certificate-template.type";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

// ─── Component ───────────────────────────────────────────────────────────────

function CertificateTemplateListPage() {
	useBreadcrumb([{ title: "Khoá học", link: "/courses" }, { title: "Giấy chứng nhận" }]);

	const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
	const [sortConfig, setSortConfig] = useState<{
		key: CertificateTemplateSortKey | null;
		order: "asc" | "desc" | null;
	}>({ key: "created_at", order: "desc" });

	const { allSelected, isSelected, selectedIds, toggleAll, toggleOne } = useTableSelection(
		templates.map((t) => t.id),
	);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(t);
	}, [search]);

	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch, sortConfig]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		certificateTemplateService
			.getTemplates({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				sort: sortConfig.key,
				order: sortConfig.order,
			})
			.then((res) => {
				if (cancelled) return;
				setTemplates(res.data);
				setMeta((p) => ({ ...p, last_page: res.meta.last_page, total: res.meta.total }));
			})
			.catch(() => {
				if (!cancelled) toast.error("Không thể tải danh sách mẫu giấy chứng nhận.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [debouncedSearch, meta.current_page, meta.per_page, sortConfig]);

	const handleSort = (key: CertificateTemplateSortKey) => {
		let order: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key) {
			order =
				sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}
		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: CertificateTemplateSortKey) =>
		sortConfig.key !== key ? (
			<ArrowUpDown className='ml-2 h-4 w-4' />
		) : sortConfig.order === "asc" ? (
			<ArrowUp className='ml-2 h-4 w-4' />
		) : sortConfig.order === "desc" ? (
			<ArrowDown className='ml-2 h-4 w-4' />
		) : (
			<ArrowUpDown className='ml-2 h-4 w-4' />
		);

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8'>
				{/* Header */}
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold tracking-tight'>Giấy chứng nhận</h2>
					<p className='text-muted-foreground'>
						Quản lý danh sách template chứng nhận dùng để cấp cho học viên hoàn thành
						khóa học của CLB.
					</p>
				</div>

				{/* Filter + Table */}
				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-3 md:flex-row md:items-center'>
						<Input
							placeholder='Tìm theo tên mẫu giấy chứng nhận...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='h-8 min-w-0 flex-1 md:max-w-80'
						/>
					</div>

					<div className='overflow-hidden rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='w-[44px]'>
										<Checkbox
											aria-label='Chọn tất cả'
											checked={allSelected}
											onCheckedChange={(c) => toggleAll(c === true)}
										/>
									</TableHead>
									<TableHead className='w-[90px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("id")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											ID {getSortIcon("id")}
										</Button>
									</TableHead>
									<TableHead className='min-w-[320px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("name")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Template {getSortIcon("name")}
										</Button>
									</TableHead>
									<TableHead className='w-[140px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("is_default")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Mặc định {getSortIcon("is_default")}
										</Button>
									</TableHead>
									<TableHead className='min-w-[170px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("creator")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Người tạo {getSortIcon("creator")}
										</Button>
									</TableHead>
									<TableHead className='w-[150px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("created_at")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Ngày tạo {getSortIcon("created_at")}
										</Button>
									</TableHead>
									<TableHead className='w-[52px]' />
								</TableRow>
							</TableHeader>

							<TableBody>
								{loading ? (
									Array.from({ length: meta.per_page }).map((_, i) => (
										<TableRow key={i}>
											<TableCell>
												<Skeleton className='h-4 w-4' />
											</TableCell>
											<TableCell colSpan={6}>
												<Skeleton className='h-4 w-full' />
											</TableCell>
										</TableRow>
									))
								) : templates.length > 0 ? (
									templates.map((template) => (
										<TableRow key={template.id}>
											<TableCell>
												<Checkbox
													checked={isSelected(template.id)}
													onCheckedChange={(c) =>
														toggleOne(template.id, c === true)
													}
												/>
											</TableCell>
											<TableCell className='font-medium text-muted-foreground'>
												MCC-{template.id}
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-3'>
													<div className='flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted'>
														{template.thumbnail ? (
															<img
																src={template.thumbnail}
																alt=''
																className='h-full w-full object-cover'
															/>
														) : (
															<ImageIcon className='h-4 w-4 text-muted-foreground' />
														)}
													</div>
													<span className='block max-w-[360px] truncate text-sm font-medium'>
														{template.name}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<Checkbox
													aria-label={`Template ${template.id} is default`}
													checked={Boolean(template.is_default)}
												/>
											</TableCell>
											<TableCell>
												{template.creator ? (
													<div className='flex items-center gap-2.5'>
														<Avatar className='h-7 w-7'>
															<AvatarImage
																src={
																	template.creator.avatar ??
																	undefined
																}
															/>
															<AvatarFallback className='text-xs'>
																{(template.creator.full_name ?? "?")
																	.charAt(0)
																	.toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<p className='truncate text-sm font-medium leading-none'>
															{template.creator.full_name ??
																"Ẩn danh"}
														</p>
													</div>
												) : (
													<span className='text-sm text-muted-foreground'>
														--
													</span>
												)}
											</TableCell>
											<TableCell>
												<p className='text-sm text-muted-foreground'>
													{formatDate(template.created_at)}
												</p>
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
															onClick={() =>
																toast.info(
																	"Tính năng xem chi tiết mẫu giấy chứng nhận đang được phát triển.",
																)
															}>
															<Eye className='h-4 w-4' />
															Xem chi tiết
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={7}
											className='h-32 text-center text-muted-foreground'>
											<div className='flex flex-col items-center justify-center gap-2'>
												<Award className='h-8 w-8 text-muted-foreground/50' />
												Chưa có mẫu giấy chứng nhận nào.
											</div>
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className='bg-transparent'>
								<TableRow>
									<TableCell colSpan={7}>
										<div className='flex items-center justify-between px-2'>
											<div className='flex flex-1 items-center gap-3 text-sm text-muted-foreground'>
												Đang hiển thị {templates.length} trên tổng{" "}
												{meta.total} mẫu giấy chứng nhận.
												{selectedIds.length > 0 && (
													<>
														<span className='text-border'>|</span>
														<span className='font-medium text-foreground'>
															{selectedIds.length} mẫu được chọn
														</span>
													</>
												)}
											</div>
											<div className='flex items-center space-x-6 lg:space-x-8'>
												<div className='flex items-center space-x-2'>
													<p className='text-sm font-medium'>
														Số hàng mỗi trang
													</p>
													<Select
														value={`${meta.per_page}`}
														onValueChange={(v) =>
															setMeta((p) => ({
																...p,
																per_page: Number(v),
																current_page: 1,
															}))
														}>
														<SelectTrigger className='h-8 w-[70px]'>
															<SelectValue />
														</SelectTrigger>
														<SelectContent side='top'>
															{[10, 20, 25, 50].map((s) => (
																<SelectItem key={s} value={`${s}`}>
																	{s}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div className='flex w-[110px] items-center justify-center text-sm font-medium'>
													Trang {meta.current_page} / {meta.last_page}
												</div>
												<div className='flex items-center space-x-2'>
													<Button
														variant='outline'
														className='hidden h-8 w-8 p-0 lg:flex'
														onClick={() =>
															setMeta((p) => ({
																...p,
																current_page: 1,
															}))
														}
														disabled={meta.current_page === 1}>
														<ChevronsLeft className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='h-8 w-8 p-0'
														onClick={() =>
															setMeta((p) => ({
																...p,
																current_page: Math.max(
																	1,
																	p.current_page - 1,
																),
															}))
														}
														disabled={meta.current_page === 1}>
														<ChevronLeft className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='h-8 w-8 p-0'
														onClick={() =>
															setMeta((p) => ({
																...p,
																current_page: Math.min(
																	p.last_page,
																	p.current_page + 1,
																),
															}))
														}
														disabled={
															meta.current_page === meta.last_page
														}>
														<ChevronRight className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='hidden h-8 w-8 p-0 lg:flex'
														onClick={() =>
															setMeta((p) => ({
																...p,
																current_page: p.last_page,
															}))
														}
														disabled={
															meta.current_page === meta.last_page
														}>
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
			</div>
		</div>
	);
}

export default CertificateTemplateListPage;
