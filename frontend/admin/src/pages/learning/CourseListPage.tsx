import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	BookOpen,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Eye,
	Filter,
	ImageIcon,
	MoreHorizontal,
	Pencil,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import {
	COURSE_LEVEL_MAP,
	COURSE_STATUS_MAP,
	type CourseLevel,
	type CourseStatus,
} from "@/pages/learning/course-meta";
import courseService from "@/services/course.service";
import type { AdminCourse, CourseOfflineFilter, CourseSortKey } from "@/pages/learning/course-mock";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

function getStatusBadge(status: CourseStatus) {
	const { label, className } = COURSE_STATUS_MAP[status];
	return (
		<Badge variant='outline' className={cn("rounded-full px-3 py-1", className)}>
			{label}
		</Badge>
	);
}

function getLevelBadge(level: CourseLevel) {
	const { label, className } = COURSE_LEVEL_MAP[level];
	return (
		<Badge variant='outline' className={cn("rounded-full px-3 py-1", className)}>
			{label}
		</Badge>
	);
}

const levelOptions: Array<{ value: CourseLevel | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trình độ" },
	{ value: "beginner", label: "Cơ bản" },
	{ value: "intermediate", label: "Trung cấp" },
	{ value: "advanced", label: "Nâng cao" },
];

const offlineOptions: Array<{ value: CourseOfflineFilter; label: string }> = [
	{ value: "all", label: "Tất cả khóa" },
	{ value: "has_offline", label: "Có lớp offline" },
	{ value: "online_only", label: "Chỉ online" },
];

// ─── Component ───────────────────────────────────────────────────────────────

function CourseListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Khóa học" }]);

	const navigate = useNavigate();

	const [courses, setCourses] = useState<AdminCourse[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [levelFilter, setLevelFilter] = useState<CourseLevel | "all">("all");
	const [offlineFilter, setOfflineFilter] = useState<CourseOfflineFilter>("all");
	const [deleteTarget, setDeleteTarget] = useState<AdminCourse | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
	const [bulkDeleting, setBulkDeleting] = useState(false);
	const [reloadToken, setReloadToken] = useState(0);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
	const [sortConfig, setSortConfig] = useState<{
		key: CourseSortKey | null;
		order: "asc" | "desc" | null;
	}>({ key: "created_at", order: "desc" });

	const { allSelected, isSelected, selectedIds, toggleAll, toggleOne } = useTableSelection(
		courses.map((c) => c.id),
	);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(t);
	}, [search]);

	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch, levelFilter, offlineFilter, sortConfig]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		courseService
			.getCourses({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				level: levelFilter,
				offline: offlineFilter,
				sort: sortConfig.key,
				order: sortConfig.order,
			})
			.then((res) => {
				if (cancelled) return;
				setCourses(res.data);
				setMeta((p) => ({ ...p, last_page: res.meta.last_page, total: res.meta.total }));
			})
			.catch(() => {
				if (!cancelled) toast.error("Không thể tải danh sách khóa học.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [
		debouncedSearch,
		meta.current_page,
		meta.per_page,
		reloadToken,
		sortConfig,
		levelFilter,
		offlineFilter,
	]);

	const handleSort = (key: CourseSortKey) => {
		let order: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key) {
			order =
				sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}
		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: CourseSortKey) =>
		sortConfig.key !== key ? (
			<ArrowUpDown className='ml-2 h-4 w-4' />
		) : sortConfig.order === "asc" ? (
			<ArrowUp className='ml-2 h-4 w-4' />
		) : sortConfig.order === "desc" ? (
			<ArrowDown className='ml-2 h-4 w-4' />
		) : (
			<ArrowUpDown className='ml-2 h-4 w-4' />
		);

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await courseService.deleteCourse(deleteTarget.slug);
			toggleOne(deleteTarget.id, false);
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
			toast.success("Đã chuyển khóa học vào thùng rác.");
		} catch {
			toast.error("Không thể xóa khóa học. Vui lòng thử lại.");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleBulkDelete = async () => {
		if (selectedIds.length === 0) return;
		const targets = courses.filter((c) => selectedIds.includes(c.id));
		setBulkDeleting(true);
		try {
			await Promise.all(targets.map((c) => courseService.deleteCourse(c.slug)));
			toast.success(`Đã chuyển ${targets.length} khóa học vào thùng rác.`);
			setBulkDeleteOpen(false);
			toggleAll(false);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể xóa các khóa học đã chọn.");
		} finally {
			setBulkDeleting(false);
		}
	};

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8'>
				{/* Header */}
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold tracking-tight'>Quản lý khóa học</h2>
					<p className='text-muted-foreground'>
						Tạo và quản lý các khóa học của Trung tâm đào tạo CLB — nội dung buổi học,
						ghi danh và chứng chỉ.
					</p>
				</div>

				{/* Filter + Table */}
				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-3 md:flex-row md:items-center'>
						<Input
							placeholder='Tìm theo tên khóa học...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='h-8 min-w-0 flex-1 md:max-w-80'
						/>
						<div className='flex flex-wrap items-center gap-2 md:ml-auto'>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant='outline' size='sm' className='h-8'>
										<Filter className='h-4 w-4' />
										{
											offlineOptions.find((o) => o.value === offlineFilter)
												?.label
										}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' className='w-[180px]'>
									<DropdownMenuLabel>Lớp offline</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{offlineOptions.map((opt) => (
										<DropdownMenuItem
											key={opt.value}
											onClick={() => setOfflineFilter(opt.value)}
											className={
												offlineFilter === opt.value
													? "bg-muted font-medium"
													: ""
											}>
											{opt.label}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant='outline' size='sm' className='h-8'>
										<Filter className='h-4 w-4' />
										{levelOptions.find((o) => o.value === levelFilter)?.label}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end' className='w-[180px]'>
									<DropdownMenuLabel>Trình độ</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{levelOptions.map((opt) => (
										<DropdownMenuItem
											key={opt.value}
											onClick={() => setLevelFilter(opt.value)}
											className={
												levelFilter === opt.value
													? "bg-muted font-medium"
													: ""
											}>
											{opt.label}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							<Button
								size='sm'
								variant='outline'
								className='h-8'
								onClick={() => navigate("/courses/trash")}>
								<Trash2 className='h-4 w-4' />
								Thùng rác
							</Button>

							<Button
								size='sm'
								className='h-8 bg-foreground text-background hover:bg-foreground/90'
								onClick={() => navigate("/courses/create")}>
								<Plus className='h-4 w-4' />
								Thêm khóa học
							</Button>
						</div>
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
									<TableHead className='min-w-[280px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("title")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Khóa học {getSortIcon("title")}
										</Button>
									</TableHead>
									<TableHead className='w-[120px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("level")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Trình độ {getSortIcon("level")}
										</Button>
									</TableHead>
									<TableHead className='w-[120px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("max_offline_slots")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Lớp offline {getSortIcon("max_offline_slots")}
										</Button>
									</TableHead>
									<TableHead className='w-[110px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("lessons_count")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Buổi học {getSortIcon("lessons_count")}
										</Button>
									</TableHead>
									<TableHead className='w-[140px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("enrollments_count")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Học viên {getSortIcon("enrollments_count")}
										</Button>
									</TableHead>
									<TableHead className='w-[150px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("enrollment_deadline")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Hạn ghi danh {getSortIcon("enrollment_deadline")}
										</Button>
									</TableHead>
									<TableHead className='w-[140px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("status")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Trạng thái {getSortIcon("status")}
										</Button>
									</TableHead>
									<TableHead className='min-w-[150px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("creator")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Người tạo {getSortIcon("creator")}
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
											<TableCell colSpan={10}>
												<Skeleton className='h-4 w-full' />
											</TableCell>
										</TableRow>
									))
								) : courses.length > 0 ? (
									courses.map((course) => (
										<TableRow key={course.id}>
											<TableCell>
												<Checkbox
													checked={isSelected(course.id)}
													onCheckedChange={(c) =>
														toggleOne(course.id, c === true)
													}
												/>
											</TableCell>
											<TableCell className='font-medium text-muted-foreground'>
												KH-{course.id}
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-3'>
													<div className='flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted'>
														{course.thumbnail ? (
															<img
																src={course.thumbnail}
																alt=''
																className='h-full w-full object-cover'
															/>
														) : (
															<ImageIcon className='h-4 w-4 text-muted-foreground' />
														)}
													</div>
													<div className='min-w-0 space-y-1'>
														<button
															type='button'
															onClick={() =>
																navigate(`/courses/${course.slug}`)
															}
															className='block max-w-[320px] truncate text-left text-sm font-medium hover:underline'>
															{course.title}
														</button>
														<div className='flex flex-wrap items-center gap-1'>
															{course.categories.map((cat) => (
																<span
																	key={cat.id}
																	className='rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground'>
																	{cat.name}
																</span>
															))}
														</div>
													</div>
												</div>
											</TableCell>
											<TableCell>{getLevelBadge(course.level)}</TableCell>
											<TableCell>
												{course.max_offline_slots !== null ? (
													<div className='space-y-0.5 text-sm'>
														<span
															className={cn(
																"font-medium",
																course.offline_enrollments_count >=
																	course.max_offline_slots &&
																	"text-rose-600",
															)}>
															{course.offline_enrollments_count}/
															{course.max_offline_slots}
														</span>
														<p className='text-xs text-muted-foreground'>
															slot
														</p>
													</div>
												) : (
													<span className='text-xs text-muted-foreground'>
														Chỉ online
													</span>
												)}
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-1.5 text-sm'>
													<BookOpen className='h-3.5 w-3.5 text-muted-foreground' />
													{course.lessons_count}
												</div>
											</TableCell>
											<TableCell>
												<div className='space-y-0.5 text-sm'>
													<div className='flex items-center gap-1.5'>
														<Users className='h-3.5 w-3.5 text-muted-foreground' />
														{course.enrollments_count.toLocaleString(
															"vi-VN",
														)}
													</div>
													{course.enrollments_count > 0 && (
														<p className='text-xs text-muted-foreground'>
															{course.offline_enrollments_count}{" "}
															offline ·{" "}
															{course.online_enrollments_count} online
														</p>
													)}
												</div>
											</TableCell>
											<TableCell>
												<p className='text-sm text-muted-foreground'>
													{formatDate(course.enrollment_deadline)}
												</p>
											</TableCell>
											<TableCell>{getStatusBadge(course.status)}</TableCell>
											<TableCell>
												{course.creator ? (
													<div className='flex items-center gap-2.5'>
														<Avatar className='h-7 w-7'>
															<AvatarImage
																src={
																	course.creator.avatar ??
																	undefined
																}
															/>
															<AvatarFallback className='text-xs'>
																{(course.creator.full_name ?? "?")
																	.charAt(0)
																	.toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<p className='truncate text-sm font-medium leading-none'>
															{course.creator.full_name ?? "Ẩn danh"}
														</p>
													</div>
												) : (
													<span className='text-sm text-muted-foreground'>
														--
													</span>
												)}
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
														className='w-[200px]'>
														<DropdownMenuItem
															onClick={() =>
																navigate(`/courses/${course.slug}`)
															}>
															<Eye className='h-4 w-4' />
															Xem chi tiết
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																navigate(
																	`/courses/${course.slug}/edit`,
																)
															}>
															<Pencil className='h-4 w-4' />
															Chỉnh sửa
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className='text-destructive focus:bg-destructive/10 focus:text-destructive'
															onClick={() => setDeleteTarget(course)}>
															<Trash2 className='h-4 w-4 text-destructive' />
															Xóa khóa học
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={11}
											className='h-32 text-center text-muted-foreground'>
											Không tìm thấy khóa học nào phù hợp.
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className='bg-transparent'>
								<TableRow>
									<TableCell colSpan={11}>
										<div className='flex items-center justify-between px-2'>
											<div className='flex flex-1 items-center gap-3 text-sm text-muted-foreground'>
												Đang hiển thị {courses.length} trên tổng{" "}
												{meta.total} khóa học.
												{selectedIds.length > 0 && (
													<>
														<span className='text-border'>|</span>
														<span className='font-medium text-foreground'>
															{selectedIds.length} khóa được chọn
														</span>
														<Button
															size='sm'
															variant='destructive'
															disabled={bulkDeleting}
															onClick={() => setBulkDeleteOpen(true)}
															className='h-7'>
															<Trash2 className='h-3.5 w-3.5' />
															{bulkDeleting
																? "Đang xóa..."
																: "Xóa đã chọn"}
														</Button>
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

			{/* Delete confirm */}
			<Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent className='sm:max-w-[440px]'>
					{deleteTarget && (
						<>
							<DialogHeader>
								<DialogTitle>Xác nhận xóa khóa học</DialogTitle>
							</DialogHeader>
							<div className='space-y-2 text-sm text-muted-foreground'>
								<p>
									Bạn sắp xóa khóa học{" "}
									<span className='font-semibold text-foreground'>
										"{deleteTarget.title}"
									</span>
									.
								</p>
								<p>
									Khóa học sẽ được chuyển vào thùng rác. Học viên sẽ không còn
									truy cập được nội dung khóa học này.
								</p>
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
									{isDeleting ? "Đang xóa..." : "Xóa khóa học"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			{/* Bulk delete confirm */}
			<Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
				<DialogContent className='sm:max-w-[440px]'>
					<DialogHeader>
						<DialogTitle>Xóa các khóa học đã chọn?</DialogTitle>
					</DialogHeader>
					<p className='text-sm text-muted-foreground'>
						Bạn có chắc chắn muốn xóa {selectedIds.length} khóa học đã chọn không?
					</p>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setBulkDeleteOpen(false)}
							disabled={bulkDeleting}>
							Hủy
						</Button>
						<Button
							variant='destructive'
							onClick={handleBulkDelete}
							disabled={bulkDeleting}>
							{bulkDeleting ? "Đang xóa..." : "Xóa đã chọn"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default CourseListPage;
