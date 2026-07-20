import { useEffect, useMemo, useState } from "react";

import AcademicStructureImportDialog from "@/components/academic-structure/AcademicStructureImportDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { downloadAcademicStructureTemplate } from "@/lib/academic-structure-template";
import { cn } from "@/lib/utils";
import academicStructureService from "@/services/academic-structure.service";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type {
	AcademicStructureImportFileType,
	AcademicStructureImportRecord,
	AcademicStructureImportStats,
	AcademicStructureImportStatus,
} from "@/types/academic-structure.type";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	CircleAlert,
	Download,
	Eye,
	FileArchive,
	FileSpreadsheet,
	FileText,
	Files,
	Loader2,
	MoreHorizontal,
	Search,
	TriangleAlert,
	XCircle,
} from "lucide-react";

type SortKey =
	| "original_file_name"
	| "file_type"
	| "file_size_bytes"
	| "uploaded_by_name"
	| "created_at"
	| "status";

const statusOptions: Array<{ value: string; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "completed", label: "Thành công" },
	{ value: "failed", label: "Thất bại" },
];

const fileTypeOptions: Array<{ value: string; label: string }> = [
	{ value: "all", label: "Tất cả loại file" },
	{ value: "Excel", label: "Excel" },
	{ value: "CSV", label: "CSV" },
];

const statusMeta: Record<
	AcademicStructureImportStatus,
	{ label: string; className: string; icon: typeof CheckCircle2 }
> = {
	completed: {
		label: "Thành công",
		className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
		icon: CheckCircle2,
	},
	failed: {
		label: "Thất bại",
		className: "border-rose-500/20 bg-rose-500/10 text-rose-700",
		icon: XCircle,
	},
};


const typeMeta: Record<AcademicStructureImportFileType, { className: string }> = {
	Excel: {
		className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
	},
	CSV: {
		className: "border-slate-500/20 bg-slate-500/10 text-slate-700",
	},
	ZIP: {
		className: "border-violet-500/20 bg-violet-500/10 text-violet-700",
	},
	Other: {
		className: "border-rose-500/20 bg-rose-500/10 text-rose-700",
	},
};

function formatFileSize(bytes: number) {
	if (bytes <= 0) return "0 KB";

	const inKb = bytes / 1024;

	return `${inKb.toFixed(inKb >= 10 ? 0 : 1)} KB`;
}

function formatDateTime(dateTime: string | null) {
	if (!dateTime) return "N/A";

	return new Intl.DateTimeFormat("vi-VN", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(dateTime));
}

function OrganizationImportListPage() {
	const [records, setRecords] = useState<AcademicStructureImportRecord[]>([]);
	const [stats, setStats] = useState<AcademicStructureImportStats | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");
	const [meta, setMeta] = useState({
		current_page: 1,
		last_page: 1,
		per_page: 10,
		total: 0,
	});
	const [sortConfig, setSortConfig] = useState<{
		key: SortKey | null;
		order: "asc" | "desc" | null;
	}>({
		key: "created_at",
		order: "desc",
	});
	const [downloadingId, setDownloadingId] = useState<number | null>(null);
	const [detailItem, setDetailItem] = useState<AcademicStructureImportRecord | null>(null);

	const breadcrumb = useMemo(
		() => [
			{ title: "Dashboard", link: "/" },
			{ title: "Quản lý File import đơn vị" },
		],
		[],
	);

	useBreadcrumb(breadcrumb);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search.trim());
		}, 400);

		return () => clearTimeout(handler);
	}, [search]);

	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, statusFilter, typeFilter, sortConfig]);

	const fetchImportStats = async () => {
		try {
			const response = await academicStructureService.getImportStats();
			setStats(response.data);
		} catch (error) {
			console.error("Failed to fetch import stats", error);
		}
	};

	const fetchImportHistories = async (overrides?: {
		page?: number;
		per_page?: number;
		search?: string;
		status?: string;
		type?: string;
		sort?: string;
		order?: "asc" | "desc";
	}) => {
		setIsLoading(true);

		try {
			const response = await academicStructureService.getImportHistories({
				page: overrides?.page ?? meta.current_page,
				per_page: overrides?.per_page ?? meta.per_page,
				search:
					overrides?.search ?? (debouncedSearch !== "" ? debouncedSearch : undefined),
				status:
					overrides?.status ??
					(statusFilter !== "all" ? statusFilter : undefined),
				type: overrides?.type ?? (typeFilter !== "all" ? typeFilter : undefined),
				sort: overrides?.sort ?? sortConfig.key ?? undefined,
				order: overrides?.order ?? sortConfig.order ?? undefined,
			});

			setRecords(response.data);
			setMeta({
				current_page: response.meta.current_page,
				last_page: response.meta.last_page,
				per_page: response.meta.per_page,
				total: response.meta.total,
			});
		} catch (error) {
			console.error("Failed to fetch import history", error);
			toast.error("Không thể tải danh sách file import.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchImportStats();
	}, []);

	useEffect(() => {
		void fetchImportHistories();
	}, [
		meta.current_page,
		meta.per_page,
		debouncedSearch,
		statusFilter,
		typeFilter,
		sortConfig,
	]);

	const handleImported = async () => {
		const needsManualRefresh =
			meta.current_page === 1 &&
			debouncedSearch === "" &&
			statusFilter === "all" &&
			typeFilter === "all";

		setSearch("");
		setDebouncedSearch("");
		setStatusFilter("all");
		setTypeFilter("all");
		setMeta((prev) => ({
			...prev,
			current_page: 1,
		}));

		await fetchImportStats();

		if (needsManualRefresh) {
			await fetchImportHistories({
				page: 1,
				per_page: meta.per_page,
			});
		}
	};

	const handleSort = (key: SortKey) => {
		let order: "asc" | "desc" | null = "asc";

		if (sortConfig.key === key) {
			if (sortConfig.order === "asc") {
				order = "desc";
			} else if (sortConfig.order === "desc") {
				order = null;
			}
		}

		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: SortKey) => {
		if (sortConfig.key !== key) return <ArrowUpDown className='ml-2 h-4 w-4' />;
		if (sortConfig.order === "asc") return <ArrowUp className='ml-2 h-4 w-4' />;
		if (sortConfig.order === "desc") return <ArrowDown className='ml-2 h-4 w-4' />;
		return <ArrowUpDown className='ml-2 h-4 w-4' />;
	};

	const handleDownload = async (item: AcademicStructureImportRecord) => {
		if (downloadingId !== null) return;
		setDownloadingId(item.id);
		try {
			const blob = await academicStructureService.downloadImportFile(item.id);
			const blobUrl = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = item.file_name;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
			toast.success(`Đã tải file "${item.file_name}".`);
		} catch (error) {
			console.error("Failed to download import file", error);
			toast.error("Không thể tải lại file đã upload.");
		} finally {
			setDownloadingId(null);
		}
	};

	const showDetails = (item: AcademicStructureImportRecord) => {
		setDetailItem(item);
	};

	return (
		<>
		<div className='min-h-full overflow-x-hidden bg-muted/30'>
			<div className='min-w-0 space-y-6 p-4 md:p-6 lg:p-8'>
				<Card className='overflow-hidden border-none bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl'>
					<CardContent className='grid gap-6 p-6 md:p-8 xl:grid-cols-[1.4fr_0.8fr]'>
						<div className='space-y-5'>
							<Badge className='bg-white/10 text-white hover:bg-white/10'>
								Quản lý file import đơn vị
							</Badge>
							<div className='space-y-3'>
								<h1 className='max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl'>
									Theo dõi lịch sử import dữ liệu đơn vị bằng API thật
								</h1>
								<p className='max-w-2xl text-sm leading-6 text-slate-300 md:text-base'>
									Tải file mẫu, upload file import và theo dõi lịch sử xử lý ngay
									trên cùng một màn hình. Danh sách bên dưới được lấy trực tiếp từ
									backend sau mỗi lần import.
								</p>
							</div>
							<div className='flex flex-wrap gap-3'>
								<AcademicStructureImportDialog
									onImported={handleImported}
									triggerLabel='Tải file mới'
									triggerSize='lg'
									triggerVariant='default'
									triggerClassName='bg-white text-slate-950 hover:bg-white/90'
								/>
								<Button
									size='lg'
									variant='outline'
									onClick={downloadAcademicStructureTemplate}
									className='border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white'>
									<Download className='h-4 w-4' />
									Tải file mẫu
								</Button>
							</div>
						</div>

						<div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-1'>
							<div className='rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur'>
								<div className='text-sm text-slate-300'>Tổng dung lượng đã tải</div>
								<div className='mt-2 text-3xl font-semibold'>
									{formatFileSize(stats?.total_size_bytes ?? 0)}
								</div>
								<div className='mt-1 text-xs text-slate-400'>
									Tính trên {stats?.total ?? 0} file import đã được ghi nhận
								</div>
							</div>
							<div className='rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur'>
								<div className='text-sm text-slate-300'>File có dòng lỗi</div>
								<div className='mt-2 text-3xl font-semibold'>
									{stats?.with_errors ?? 0}
								</div>
								<div className='mt-1 text-xs text-slate-400'>
									Những file import thành công nhưng vẫn có dòng cần kiểm tra
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
					<Card className='border-border/70'>
						<CardContent className='flex items-center justify-between p-5'>
							<div className='space-y-1'>
								<p className='text-sm text-muted-foreground'>Tổng file</p>
								<p className='text-2xl font-semibold'>{stats?.total ?? 0}</p>
							</div>
							<div className='rounded-2xl bg-slate-900 p-3 text-white'>
								<Files className='h-5 w-5' />
							</div>
						</CardContent>
					</Card>

					<Card className='border-border/70'>
						<CardContent className='flex items-center justify-between p-5'>
							<div className='space-y-1'>
								<p className='text-sm text-muted-foreground'>Thành công</p>
								<p className='text-2xl font-semibold'>{stats?.completed ?? 0}</p>
							</div>
							<div className='rounded-2xl bg-emerald-500/10 p-3 text-emerald-700'>
								<CheckCircle2 className='h-5 w-5' />
							</div>
						</CardContent>
					</Card>

					<Card className='border-border/70'>
						<CardContent className='flex items-center justify-between p-5'>
							<div className='space-y-1'>
								<p className='text-sm text-muted-foreground'>Có dòng lỗi</p>
								<p className='text-2xl font-semibold'>{stats?.with_errors ?? 0}</p>
							</div>
							<div className='rounded-2xl bg-amber-500/10 p-3 text-amber-700'>
								<CircleAlert className='h-5 w-5' />
							</div>
						</CardContent>
					</Card>

					<Card className='border-border/70'>
						<CardContent className='flex items-center justify-between p-5'>
							<div className='space-y-1'>
								<p className='text-sm text-muted-foreground'>Thất bại</p>
								<p className='text-2xl font-semibold'>{stats?.failed ?? 0}</p>
							</div>
							<div className='rounded-2xl bg-rose-500/10 p-3 text-rose-700'>
								<TriangleAlert className='h-5 w-5' />
							</div>
						</CardContent>
					</Card>
				</div>

				<Card className='min-w-0 gap-0 overflow-hidden border-border/70 py-0'>
					<CardHeader className='gap-3 border-b px-4 py-4 md:px-6'>
						<div className='flex min-w-0 flex-col gap-4'>
							<div className='min-w-0 space-y-1.5'>
								<CardTitle className='text-xl'>Danh sách file import đơn vị</CardTitle>
								<CardDescription className='max-w-full'>
									Lịch sử upload được lấy trực tiếp từ backend và tự refetch sau
									mỗi lần import thành công.
								</CardDescription>
							</div>
							<div className='grid w-full min-w-0 gap-3 md:grid-cols-[minmax(200px,280px)_1fr_minmax(160px,220px)_minmax(160px,220px)]'>
								<div className='relative min-w-0'>
									<Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
									<Input
										value={search}
										onChange={(event) => setSearch(event.target.value)}
										placeholder='Tìm theo tên file, người upload hoặc lỗi'
										className='w-full pl-9'
									/>
								</div>
								<div className='hidden md:block' aria-hidden='true' />
								<Select value={typeFilter} onValueChange={setTypeFilter}>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Loại file' />
									</SelectTrigger>
									<SelectContent>
										{fileTypeOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Trạng thái' />
									</SelectTrigger>
									<SelectContent>
										{statusOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardHeader>

					<CardContent className='p-0'>
						<div className='min-w-0 overflow-x-auto'>
							<Table className='min-w-[980px]'>
								<TableHeader>
									<TableRow>
										<TableHead className='min-w-[260px]'>
											<Button
												variant='ghost'
												onClick={() => handleSort("original_file_name")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												File
												{getSortIcon("original_file_name")}
											</Button>
										</TableHead>
										<TableHead className='w-[120px]'>
											<Button
												variant='ghost'
												onClick={() => handleSort("file_type")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												Loại
												{getSortIcon("file_type")}
											</Button>
										</TableHead>
										<TableHead className='w-[120px]'>
											<Button
												variant='ghost'
												onClick={() => handleSort("file_size_bytes")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												Kích thước
												{getSortIcon("file_size_bytes")}
											</Button>
										</TableHead>
										<TableHead className='w-[180px]'>
											<Button
												variant='ghost'
												onClick={() => handleSort("uploaded_by_name")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												Người upload
												{getSortIcon("uploaded_by_name")}
											</Button>
										</TableHead>
										<TableHead className='w-[170px]'>
											<Button
												variant='ghost'
												onClick={() => handleSort("created_at")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												Thời gian
												{getSortIcon("created_at")}
											</Button>
										</TableHead>
										<TableHead className='w-[150px]'>
											<Button
												variant='ghost'
												onClick={() => handleSort("status")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												Trạng thái
												{getSortIcon("status")}
											</Button>
										</TableHead>
									</TableRow>
								</TableHeader>

								<TableBody>
									{records.map((item) => {
										const StatusIcon = statusMeta[item.status].icon;
										const FileIcon =
											item.file_type === "Excel"
												? FileSpreadsheet
												: item.file_type === "ZIP"
													? FileArchive
													: FileText;

										return (
											<TableRow key={item.id}>
												<TableCell>
													<div className='flex items-start gap-3'>
														<div className='mt-0.5 rounded-2xl border bg-muted/40 p-2'>
															<FileIcon className='h-4 w-4 text-foreground' />
														</div>
														<div className='min-w-0 space-y-1'>
															<div className='truncate font-medium text-foreground'>
																{item.file_name}
															</div>
															<p className='line-clamp-2 text-sm text-muted-foreground'>
																{item.description}
															</p>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														variant='outline'
														className={typeMeta[item.file_type].className}>
														{item.file_type}
													</Badge>
												</TableCell>
												<TableCell className='font-medium'>
													{formatFileSize(item.file_size_bytes)}
												</TableCell>
												<TableCell>{item.uploaded_by_name}</TableCell>
												<TableCell className='text-sm text-muted-foreground'>
													{formatDateTime(item.uploaded_at)}
												</TableCell>
												<TableCell>
													<Badge
														variant='outline'
														className={cn(
															"gap-1.5",
															statusMeta[item.status].className,
														)}>
														<StatusIcon className='h-3.5 w-3.5' />
														{statusMeta[item.status].label}
													</Badge>
												</TableCell>
												<TableCell className='text-right'>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant='ghost'
																size='icon-sm'
																className='ml-auto'>
																<MoreHorizontal className='h-4 w-4' />
																<span className='sr-only'>
																	Mở menu thao tác
																</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align='end' className='w-48'>
															<DropdownMenuItem onClick={() => showDetails(item)}>
																<Eye className='h-4 w-4' />
																Xem chi tiết
															</DropdownMenuItem>
															<DropdownMenuItem
																disabled={downloadingId === item.id}
																onClick={() => void handleDownload(item)}>
																{downloadingId === item.id ? (
																	<Loader2 className='h-4 w-4 animate-spin' />
																) : (
																	<Download className='h-4 w-4' />
																)}
																{downloadingId === item.id ? "Đang tải..." : "Tải file gốc"}
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										);
									})}

									{!isLoading && records.length === 0 ? (
										<TableRow>
											<TableCell colSpan={7} className='h-24 text-center'>
												<div className='space-y-2'>
													<p className='font-medium'>
														Chưa có file import phù hợp.
													</p>
													<p className='text-sm text-muted-foreground'>
														Hãy tải file mới hoặc điều chỉnh lại bộ lọc tìm kiếm.
													</p>
												</div>
											</TableCell>
										</TableRow>
									) : null}

									{isLoading ? (
										<TableRow>
											<TableCell colSpan={7} className='h-20 text-center text-muted-foreground'>
												Đang tải dữ liệu...
											</TableCell>
										</TableRow>
									) : null}
								</TableBody>

								<TableFooter className='bg-transparent'>
									<TableRow>
										<TableCell colSpan={7} className='py-3'>
											<div className='flex flex-col gap-4 px-2 py-1 md:flex-row md:items-center md:justify-between'>
												<div className='text-sm text-muted-foreground'>
													Hiển thị {records.length} trên tổng {meta.total} file.
												</div>
												<div className='flex flex-wrap items-center gap-3 md:gap-6'>
													<div className='flex items-center gap-2'>
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
															<SelectTrigger className='h-8 w-[76px]'>
																<SelectValue placeholder={meta.per_page} />
															</SelectTrigger>
															<SelectContent side='top'>
																{[5, 10, 20, 30].map((size) => (
																	<SelectItem
																		key={size}
																		value={`${size}`}>
																		{size}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
													<div className='flex w-[110px] items-center justify-center text-sm font-medium'>
														Page {meta.current_page} of {meta.last_page}
													</div>
													<div className='flex items-center gap-2'>
														<Button
															variant='outline'
															size='icon-sm'
															className='hidden lg:flex'
															onClick={() =>
																setMeta((prev) => ({
																	...prev,
																	current_page: 1,
																}))
															}
															disabled={meta.current_page === 1}>
															<ChevronsLeft className='h-4 w-4' />
														</Button>
														<Button
															variant='outline'
															size='icon-sm'
															onClick={() =>
																setMeta((prev) => ({
																	...prev,
																	current_page: prev.current_page - 1,
																}))
															}
															disabled={meta.current_page === 1}>
															<ChevronLeft className='h-4 w-4' />
														</Button>
														<Button
															variant='outline'
															size='icon-sm'
															onClick={() =>
																setMeta((prev) => ({
																	...prev,
																	current_page: prev.current_page + 1,
																}))
															}
															disabled={meta.current_page === meta.last_page}>
															<ChevronRight className='h-4 w-4' />
														</Button>
														<Button
															variant='outline'
															size='icon-sm'
															className='hidden lg:flex'
															onClick={() =>
																setMeta((prev) => ({
																	...prev,
																	current_page: meta.last_page,
																}))
															}
															disabled={meta.current_page === meta.last_page}>
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
					</CardContent>
				</Card>
			</div>
		</div>

		<Sheet open={!!detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null); }}>
			<SheetContent side='right' className='flex flex-col gap-0 overflow-hidden p-0 sm:max-w-lg'>
				{detailItem && (
					<>
						<SheetHeader className='border-b px-6 py-5'>
							<div className='flex items-start gap-3 pr-6'>
								<div className='min-w-0 flex-1 space-y-1'>
									<SheetTitle className='truncate text-base leading-snug'>
										{detailItem.file_name}
									</SheetTitle>
									<SheetDescription className='line-clamp-2 text-xs'>
										{detailItem.description}
									</SheetDescription>
								</div>
								<Badge
									variant='outline'
									className={cn(
										"mt-0.5 shrink-0 gap-1.5",
										statusMeta[detailItem.status].className,
									)}>
									{(() => {
										const Icon = statusMeta[detailItem.status].icon;
										return <Icon className='h-3 w-3' />;
									})()}
									{statusMeta[detailItem.status].label}
								</Badge>
							</div>
						</SheetHeader>

						<div className='flex-1 overflow-y-auto'>
							{/* Thông tin file */}
							<div className='space-y-3 px-6 py-4'>
								<p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
									Thông tin file
								</p>
								<div className='grid grid-cols-2 gap-x-6 gap-y-3 text-sm'>
									<div className='space-y-0.5'>
										<p className='text-xs text-muted-foreground'>Loại file</p>
										<Badge variant='outline' className={typeMeta[detailItem.file_type].className}>
											{detailItem.file_type}
										</Badge>
									</div>
									<div className='space-y-0.5'>
										<p className='text-xs text-muted-foreground'>Kích thước</p>
										<p className='font-medium'>{formatFileSize(detailItem.file_size_bytes)}</p>
									</div>
									<div className='space-y-0.5'>
										<p className='text-xs text-muted-foreground'>Người upload</p>
										<p className='font-medium'>{detailItem.uploaded_by_name}</p>
									</div>
									<div className='space-y-0.5'>
										<p className='text-xs text-muted-foreground'>Thời gian</p>
										<p className='font-medium'>{formatDateTime(detailItem.uploaded_at)}</p>
									</div>
								</div>
							</div>

							<Separator />

							{/* Kết quả xử lý */}
							<div className='space-y-4 px-6 py-4'>
								<p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
									Kết quả xử lý
								</p>
								<div className='grid grid-cols-3 gap-2'>
									<div className='rounded-lg border bg-muted/30 p-3 text-center'>
										<p className='text-2xl font-bold'>{detailItem.processed_rows}</p>
										<p className='mt-0.5 text-[11px] text-muted-foreground'>Tổng dòng</p>
									</div>
									<div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center'>
										<p className='text-2xl font-bold text-emerald-700'>
											{detailItem.processed_rows - detailItem.errors_count}
										</p>
										<p className='mt-0.5 text-[11px] text-emerald-600'>Thành công</p>
									</div>
									<div className='rounded-lg border border-rose-200 bg-rose-50 p-3 text-center'>
										<p className='text-2xl font-bold text-rose-700'>
											{detailItem.errors_count}
										</p>
										<p className='mt-0.5 text-[11px] text-rose-600'>Lỗi</p>
									</div>
								</div>

								<div className='space-y-2'>
									<p className='text-xs font-medium text-muted-foreground'>Đã tạo mới</p>
									<div className='grid grid-cols-3 gap-2'>
										{(
											[
												{ label: "Khoa", value: detailItem.created_faculties },
												{ label: "Ngành", value: detailItem.created_majors },
												{ label: "Lớp", value: detailItem.created_school_classes },
											] as const
										).map(({ label, value }) => (
											<div key={label} className='rounded-md border px-3 py-2 text-center'>
												<p className='text-lg font-semibold'>{value}</p>
												<p className='text-[11px] text-muted-foreground'>{label}</p>
											</div>
										))}
									</div>
								</div>

								<div className='space-y-2'>
									<p className='text-xs font-medium text-muted-foreground'>Đã tồn tại (bỏ qua)</p>
									<div className='grid grid-cols-3 gap-2'>
										{(
											[
												{ label: "Khoa", value: detailItem.existing_faculties },
												{ label: "Ngành", value: detailItem.existing_majors },
												{ label: "Lớp", value: detailItem.existing_school_classes },
											] as const
										).map(({ label, value }) => (
											<div key={label} className='rounded-md border bg-muted/20 px-3 py-2 text-center'>
												<p className='text-lg font-semibold text-muted-foreground'>{value}</p>
												<p className='text-[11px] text-muted-foreground'>{label}</p>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Chi tiết lỗi từng dòng */}
							{(detailItem.error_details?.length ?? 0) > 0 && (
								<>
									<Separator />
									<div className='space-y-3 px-6 py-4'>
										<p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
											Chi tiết lỗi ({detailItem.errors_count} dòng)
										</p>
										<div className='space-y-1.5'>
											{detailItem.error_details!.map((err, idx) => (
												<div
													key={idx}
													className='flex gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm'>
													<span className='shrink-0 font-semibold text-rose-700'>
														Dòng {err.row}
													</span>
													<span className='text-rose-600'>{err.message}</span>
												</div>
											))}
										</div>
									</div>
								</>
							)}

							{/* Lý do thất bại hoàn toàn */}
							{detailItem.error_message && (detailItem.error_details?.length ?? 0) === 0 && (
								<>
									<Separator />
									<div className='space-y-3 px-6 py-4'>
										<p className='text-[11px] font-semibold uppercase tracking-widest text-muted-foreground'>
											Lý do thất bại
										</p>
										<div className='rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700'>
											{detailItem.error_message}
										</div>
									</div>
								</>
							)}
						</div>

						<div className='border-t p-4'>
							<Button
								variant='outline'
								className='w-full'
								disabled={downloadingId === detailItem.id}
								onClick={() => void handleDownload(detailItem)}>
								{downloadingId === detailItem.id ? (
									<Loader2 className='h-4 w-4 animate-spin' />
								) : (
									<Download className='h-4 w-4' />
								)}
								{downloadingId === detailItem.id ? "Đang tải..." : "Tải file gốc"}
							</Button>
						</div>
					</>
				)}
			</SheetContent>
		</Sheet>
		</>
	);
}

export default OrganizationImportListPage;
