import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	FileText,
	Filter,
	HardDrive,
	Image,
	MoreHorizontal,
	RefreshCw,
	Trash2,
	Video,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
	DropdownMenuLabel,
	DropdownMenuSeparator,
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
import { cn } from "@/lib/utils";
import mediaService from "@/services/media.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FileType = "image" | "video" | "document" | "gif";
export type TargetType = "post" | "message" | "blog";

export interface MediaOwner {
	id: number;
	full_name: string | null;
	email: string;
	avatar: string | null;
}

export interface MediaFileRecord {
	id: number;
	owner: MediaOwner | null;
	url: string;
	file_type: FileType;
	size_kb: number;
	target_type: TargetType;
	target_id: number;
	created_at: string;
}

export interface MediaFileStats {
	total: number;
	image: number;
	video: number;
	document: number;
	gif: number;
	total_size_kb: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

function formatSize(kb: number): string {
	if (kb === 0) return "--";
	if (kb < 1024) return `${kb} KB`;
	const mb = kb / 1024;
	return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(2)} GB`;
}

function getOwnerInitials(owner: MediaOwner) {
	return (owner.full_name ?? owner.email).charAt(0).toUpperCase();
}

function getFileName(url: string): string {
	try {
		const parts = new URL(url).pathname.split("/");
		return decodeURIComponent(parts[parts.length - 1] || url);
	} catch {
		const parts = url.split("/");
		return parts[parts.length - 1] || url;
	}
}

// ─── Config maps ─────────────────────────────────────────────────────────────

const FILE_TYPE_MAP: Record<FileType, { label: string; className: string }> = {
	image:    { label: "Hình ảnh",  className: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300" },
	video:    { label: "Video",     className: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300" },
	document: { label: "Tài liệu", className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
	gif:      { label: "GIF",      className: "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300" },
};

const TARGET_TYPE_MAP: Record<TargetType, { label: string; className: string }> = {
	post:    { label: "Bài đăng", className: "border-violet-500/20 bg-violet-500/10 text-violet-700" },
	blog:    { label: "Blog",     className: "border-sky-500/20 bg-sky-500/10 text-sky-700" },
	message: { label: "Tin nhắn", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" },
};

type SortKey = "id" | "url" | "size_kb" | "created_at" | "file_type" | "target_type" | "owner_name";

const emptyStats: MediaFileStats = { total: 0, image: 0, video: 0, document: 0, gif: 0, total_size_kb: 0 };

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilePreview({ record }: { record: MediaFileRecord }) {
	if (record.file_type === "image" || record.file_type === "gif") {
		return (
			<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
				<img
					src={record.url}
					alt={getFileName(record.url)}
					className="h-full w-full object-cover"
					onError={(e) => {
						(e.currentTarget as HTMLImageElement).style.display = "none";
					}}
				/>
			</div>
		);
	}
	if (record.file_type === "video") {
		return (
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-violet-500/10 text-violet-600">
				<Video className="h-5 w-5" />
			</div>
		);
	}
	return (
		<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-amber-500/10 text-amber-600">
			<FileText className="h-5 w-5" />
		</div>
	);
}

// ─── Component ───────────────────────────────────────────────────────────────

function MediaListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Quản lý tài nguyên" }]);

	const [files, setFiles] = useState<MediaFileRecord[]>([]);
	const [stats, setStats] = useState<MediaFileStats>(emptyStats);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [fileTypeFilter, setFileTypeFilter] = useState<FileType | "all">("all");
	const [targetTypeFilter, setTargetTypeFilter] = useState<TargetType | "all">("all");
	const [deleteTarget, setDeleteTarget] = useState<MediaFileRecord | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [reloadToken, setReloadToken] = useState(0);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
	const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; order: "asc" | "desc" | null }>({
		key: "created_at", order: "desc",
	});

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(files.map((f) => f.id));

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(t);
	}, [search]);

	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch, fileTypeFilter, targetTypeFilter, sortConfig]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			mediaService.getMediaFiles({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				sort: sortConfig.key ?? undefined,
				order: sortConfig.order ?? undefined,
				file_type: fileTypeFilter !== "all" ? fileTypeFilter : undefined,
				target_type: targetTypeFilter !== "all" ? targetTypeFilter : undefined,
			}),
			mediaService.getStats(),
		]).then(([filesRes, statsRes]) => {
			if (cancelled) return;
			setFiles(filesRes.data);
			setMeta((p) => ({ ...p, last_page: filesRes.meta.last_page, total: filesRes.meta.total }));
			setStats(statsRes.data);
		}).catch(() => {
			if (!cancelled) toast.error("Không thể tải danh sách tài nguyên.");
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});

		return () => { cancelled = true; };
	}, [debouncedSearch, meta.current_page, meta.per_page, reloadToken, sortConfig, fileTypeFilter, targetTypeFilter]);

	const handleSort = (key: SortKey) => {
		let order: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key) {
			order = sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}
		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: SortKey) =>
		sortConfig.key !== key ? <ArrowUpDown className="ml-2 h-4 w-4" /> :
		sortConfig.order === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> :
		sortConfig.order === "desc" ? <ArrowDown className="ml-2 h-4 w-4" /> :
		<ArrowUpDown className="ml-2 h-4 w-4" />;

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await mediaService.deleteMediaFile(deleteTarget.id);
			setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
			toast.success("Đã xóa tài nguyên.");
		} catch {
			toast.error("Không thể xóa tài nguyên. Vui lòng thử lại.");
		} finally {
			setIsDeleting(false);
		}
	};

	const activeFilterCount =
		Number(Boolean(search.trim())) +
		Number(fileTypeFilter !== "all") +
		Number(targetTypeFilter !== "all");

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* Hero */}
				<section className="overflow-hidden rounded-[30px] border border-indigo-500/15 bg-[linear-gradient(135deg,rgba(99,102,241,0.13),rgba(248,250,255,0.96)_44%,rgba(252,252,255,0.98)_100%)] shadow-sm dark:bg-[linear-gradient(135deg,rgba(99,102,241,0.13),rgba(10,10,18,0.96)_45%,rgba(8,8,14,0.98)_100%)]">
					<div className="px-6 py-7 md:px-8 md:py-9">
						<div className="max-w-3xl space-y-4">
							<Badge className="w-fit rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-indigo-800 hover:bg-indigo-500/10 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
								Quản lý tài nguyên
							</Badge>
							<div className="space-y-2">
								<h1 className="text-foreground text-[1.85rem] font-semibold leading-tight md:text-[2.4rem] md:leading-[1.1]">
									Tài nguyên media cộng đồng
								</h1>
								<p className="text-sm leading-7 text-indigo-950/70 md:text-base dark:text-indigo-50/65">
									Theo dõi toàn bộ hình ảnh, video, tài liệu và GIF được tải lên bởi thành viên trong bài đăng, blog và tin nhắn.
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-3 pt-1">
								<Button
									variant="outline"
									className="h-10 rounded-2xl border-indigo-500/20 bg-background/80 px-4 text-indigo-800 shadow-sm hover:bg-indigo-500/10 dark:bg-background/70 dark:text-indigo-200"
									onClick={() => { setSearch(""); setFileTypeFilter("all"); setTargetTypeFilter("all"); }}>
									<RefreshCw className="size-4" />
									Đặt lại bộ lọc
								</Button>
								<div className="inline-flex h-10 items-center gap-2 rounded-2xl border border-indigo-500/20 bg-background/72 px-4 text-sm font-medium text-indigo-800 dark:text-indigo-200">
									<Filter className="size-4" />
									{activeFilterCount} điều kiện đang áp dụng
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Stats */}
				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{([
						{ label: "Tổng tài nguyên", value: stats.total,    color: "indigo", desc: "Tổng số file được tải lên hệ thống.", icon: HardDrive },
						{ label: "Hình ảnh & GIF",  value: stats.image + stats.gif, color: "blue",   desc: "Ảnh tĩnh và ảnh động.", icon: Image },
						{ label: "Video",           value: stats.video,   color: "violet", desc: "File video đính kèm.", icon: Video },
						{ label: "Tài liệu",        value: stats.document, color: "amber",  desc: "Tài liệu đính kèm.", icon: FileText },
						{ label: "Dung lượng",      value: formatSize(stats.total_size_kb), color: "teal", desc: "Tổng dung lượng tất cả file.", icon: HardDrive, isString: true },
					] as const).map(({ label, value, color, desc, icon: Icon, isString }) => (
						<div key={label} className={cn("rounded-2xl border p-5 shadow-sm",
							color === "indigo" && "border-indigo-500/15 bg-indigo-500/5",
							color === "blue"   && "border-blue-500/15 bg-blue-500/5",
							color === "violet" && "border-violet-500/15 bg-violet-500/5",
							color === "amber"  && "border-amber-500/15 bg-amber-500/5",
							color === "teal"   && "border-teal-500/15 bg-teal-500/5",
						)}>
							<div className="flex items-start justify-between">
								<p className="text-sm font-semibold text-foreground">{label}</p>
								<Icon className={cn("h-4 w-4 mt-0.5",
									color === "indigo" && "text-indigo-500",
									color === "blue"   && "text-blue-500",
									color === "violet" && "text-violet-500",
									color === "amber"  && "text-amber-500",
									color === "teal"   && "text-teal-500",
								)} />
							</div>
							<p className={cn("mt-1 font-semibold tracking-tight",
								isString ? "text-2xl" : "text-3xl",
								color === "indigo" && "text-indigo-700 dark:text-indigo-300",
								color === "blue"   && "text-blue-700 dark:text-blue-300",
								color === "violet" && "text-violet-700 dark:text-violet-300",
								color === "amber"  && "text-amber-700 dark:text-amber-300",
								color === "teal"   && "text-teal-700 dark:text-teal-300",
							)}>{value}</p>
							<p className="mt-1 text-xs text-muted-foreground">{desc}</p>
						</div>
					))}
				</section>

				{/* Filter + Table */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<Input
							placeholder="Tìm theo tên chủ sở hữu hoặc URL..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8 w-full sm:w-64 md:w-80"
						/>
						<div className="flex items-center gap-2">
							{/* File type filter */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="h-8">
										<Filter className="h-4 w-4" />
										{fileTypeFilter === "all" ? "Tất cả loại file" : FILE_TYPE_MAP[fileTypeFilter].label}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-[180px]">
									<DropdownMenuLabel>Loại file</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{(["all", "image", "video", "document", "gif"] as const).map((v) => (
										<DropdownMenuItem key={v} onClick={() => setFileTypeFilter(v)}
											className={fileTypeFilter === v ? "bg-muted font-medium" : ""}>
											{v === "all" ? "Tất cả loại file" : FILE_TYPE_MAP[v].label}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							{/* Target type filter */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="h-8">
										<HardDrive className="h-4 w-4" />
										{targetTypeFilter === "all" ? "Tất cả nguồn" : TARGET_TYPE_MAP[targetTypeFilter].label}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-[160px]">
									<DropdownMenuLabel>Nguồn đính kèm</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{(["all", "post", "blog", "message"] as const).map((v) => (
										<DropdownMenuItem key={v} onClick={() => setTargetTypeFilter(v as TargetType | "all")}
											className={targetTypeFilter === v ? "bg-muted font-medium" : ""}>
											{v === "all" ? "Tất cả nguồn" : TARGET_TYPE_MAP[v as TargetType].label}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					<div className="overflow-hidden rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[44px]">
										<Checkbox aria-label="Chọn tất cả" checked={allSelected}
											onCheckedChange={(c) => toggleAll(c === true)} />
									</TableHead>
									<TableHead className="w-[90px]">
										<Button variant="ghost" onClick={() => handleSort("id")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											ID {getSortIcon("id")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[160px]">
										<Button variant="ghost" onClick={() => handleSort("owner_name")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Chủ sở hữu {getSortIcon("owner_name")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[220px]">
										<Button variant="ghost" onClick={() => handleSort("url")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Tài nguyên {getSortIcon("url")}
										</Button>
									</TableHead>
									<TableHead className="w-[120px]">
										<Button variant="ghost" onClick={() => handleSort("file_type")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Loại file {getSortIcon("file_type")}
										</Button>
									</TableHead>
									<TableHead className="w-[110px]">
										<Button variant="ghost" onClick={() => handleSort("size_kb")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Kích thước {getSortIcon("size_kb")}
										</Button>
									</TableHead>
									<TableHead className="w-[140px]">
										<Button variant="ghost" onClick={() => handleSort("target_type")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Thuộc về {getSortIcon("target_type")}
										</Button>
									</TableHead>
									<TableHead className="w-[150px]">
										<Button variant="ghost" onClick={() => handleSort("created_at")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Ngày tải lên {getSortIcon("created_at")}
										</Button>
									</TableHead>
									<TableHead className="w-[52px]" />
								</TableRow>
							</TableHeader>

							<TableBody>
								{loading ? (
									Array.from({ length: meta.per_page > 10 ? 10 : meta.per_page }).map((_, i) => (
										<TableRow key={i}>
											<TableCell><Skeleton className="h-4 w-4" /></TableCell>
											<TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell>
										</TableRow>
									))
								) : files.length > 0 ? (
									files.map((file) => (
										<TableRow key={file.id}>
											<TableCell>
												<Checkbox checked={isSelected(file.id)}
													onCheckedChange={(c) => toggleOne(file.id, c === true)} />
											</TableCell>

											<TableCell className="font-medium text-muted-foreground">
												#{file.id}
											</TableCell>

											{/* Owner */}
											<TableCell>
												{file.owner ? (
													<div className="flex items-center gap-2.5">
														<Avatar className="h-7 w-7">
															<AvatarImage src={file.owner.avatar ?? undefined} />
															<AvatarFallback className="text-xs">{getOwnerInitials(file.owner)}</AvatarFallback>
														</Avatar>
														<div className="min-w-0">
															<p className="truncate text-sm font-medium leading-none">
																{file.owner.full_name ?? "Ẩn danh"}
															</p>
															<p className="mt-0.5 truncate text-xs text-muted-foreground">
																{file.owner.email}
															</p>
														</div>
													</div>
												) : (
													<span className="text-muted-foreground/40 text-sm">—</span>
												)}
											</TableCell>

											{/* Preview + filename */}
											<TableCell>
												<div className="flex items-center gap-2.5">
													<FilePreview record={file} />
													<div className="min-w-0">
														<p className="truncate text-sm text-foreground max-w-[160px]">
															{getFileName(file.url)}
														</p>
														<a
															href={file.url}
															target="_blank"
															rel="noopener noreferrer"
															className="truncate text-xs text-muted-foreground hover:underline max-w-[160px] block">
															Xem tệp ↗
														</a>
													</div>
												</div>
											</TableCell>

											{/* File type */}
											<TableCell>
												<Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-xs", FILE_TYPE_MAP[file.file_type].className)}>
													{FILE_TYPE_MAP[file.file_type].label}
												</Badge>
											</TableCell>

											{/* Size */}
											<TableCell className="text-sm text-muted-foreground">
												{formatSize(file.size_kb)}
											</TableCell>

											{/* Target */}
											<TableCell>
												<Badge variant="outline" className={cn("rounded-full px-2 py-0.5 text-xs", TARGET_TYPE_MAP[file.target_type].className)}>
													{TARGET_TYPE_MAP[file.target_type].label} #{file.target_id}
												</Badge>
											</TableCell>

											{/* Date */}
											<TableCell className="text-sm text-muted-foreground">
												{formatDate(file.created_at)}
											</TableCell>

											{/* Actions */}
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-[160px]">
														<DropdownMenuItem asChild>
															<a href={file.url} target="_blank" rel="noopener noreferrer">
																<Image className="h-4 w-4" />
																Xem tệp
															</a>
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:bg-destructive/10 focus:text-destructive"
															onClick={() => setDeleteTarget(file)}>
															<Trash2 className="h-4 w-4 text-destructive" />
															Xóa tài nguyên
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
											Không tìm thấy tài nguyên nào phù hợp.
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={9}>
										<div className="flex items-center justify-between px-2">
											<p className="flex-1 text-sm text-muted-foreground">
												Đang hiển thị {files.length} trên tổng {meta.total} tài nguyên.
											</p>
											<div className="flex items-center space-x-6 lg:space-x-8">
												<div className="flex items-center space-x-2">
													<p className="text-sm font-medium">Rows per page</p>
													<Select value={`${meta.per_page}`}
														onValueChange={(v) => setMeta((p) => ({ ...p, per_page: Number(v), current_page: 1 }))}>
														<SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
														<SelectContent side="top">
															{[10, 20, 25, 50].map((s) => <SelectItem key={s} value={`${s}`}>{s}</SelectItem>)}
														</SelectContent>
													</Select>
												</div>
												<div className="flex w-[110px] items-center justify-center text-sm font-medium">
													Trang {meta.current_page} / {meta.last_page}
												</div>
												<div className="flex items-center space-x-2">
													<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
														onClick={() => setMeta((p) => ({ ...p, current_page: 1 }))} disabled={meta.current_page === 1}>
														<ChevronsLeft className="h-4 w-4" />
													</Button>
													<Button variant="outline" className="h-8 w-8 p-0"
														onClick={() => setMeta((p) => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))} disabled={meta.current_page === 1}>
														<ChevronLeft className="h-4 w-4" />
													</Button>
													<Button variant="outline" className="h-8 w-8 p-0"
														onClick={() => setMeta((p) => ({ ...p, current_page: Math.min(p.last_page, p.current_page + 1) }))} disabled={meta.current_page === meta.last_page}>
														<ChevronRight className="h-4 w-4" />
													</Button>
													<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
														onClick={() => setMeta((p) => ({ ...p, current_page: p.last_page }))} disabled={meta.current_page === meta.last_page}>
														<ChevronsRight className="h-4 w-4" />
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

			{/* Delete confirm */}
			<Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-[440px]">
					{deleteTarget && (
						<>
							<DialogHeader><DialogTitle>Xác nhận xóa tài nguyên</DialogTitle></DialogHeader>
							<div className="space-y-3 text-sm text-muted-foreground">
								<p>
									Bạn sắp xóa tài nguyên{" "}
									<span className="font-semibold text-foreground">#{deleteTarget.id}</span>{" "}
									({FILE_TYPE_MAP[deleteTarget.file_type].label}) của{" "}
									<span className="font-semibold text-foreground">
										{deleteTarget.owner?.full_name ?? deleteTarget.owner?.email ?? "Ẩn danh"}
									</span>.
								</p>
								<p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-700 text-xs">
									File sẽ bị xóa khỏi hệ thống. Nội dung đang sử dụng file này có thể bị ảnh hưởng.
								</p>
								<p>Hành động này không thể hoàn tác.</p>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Hủy</Button>
								<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
									{isDeleting ? "Đang xóa..." : "Xóa tài nguyên"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default MediaListPage;
