import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ImageIcon,
	MoreHorizontal,
	RotateCcw,
	Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import { COURSE_LEVEL_MAP } from "@/pages/learning/course-meta";
import courseService from "@/services/course.service";
import type { AdminCourse, CourseSortKey } from "@/pages/learning/course-mock";

const dateFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

function formatDate(value: string | null | undefined) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFmt.format(d);
}

function CourseTrashPage() {
	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Khóa học", link: "/courses" },
		{ title: "Thùng rác" },
	]);

	const navigate = useNavigate();

	const [courses, setCourses] = useState<AdminCourse[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [reloadToken, setReloadToken] = useState(0);
	const [restoringId, setRestoringId] = useState<number | null>(null);
	const [forceTarget, setForceTarget] = useState<AdminCourse | null>(null);
	const [forcing, setForcing] = useState(false);
	const [bulkRestoring, setBulkRestoring] = useState(false);
	const [bulkForceOpen, setBulkForceOpen] = useState(false);
	const [bulkForcing, setBulkForcing] = useState(false);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
	const { allSelected, isSelected, selectedIds, toggleAll, toggleOne } = useTableSelection(
		courses.map((c) => c.id),
	);
	const [sortConfig, setSortConfig] = useState<{
		key: CourseSortKey | null;
		order: "asc" | "desc" | null;
	}>({ key: "deleted_at", order: "desc" });

	const handleSort = (key: CourseSortKey) => {
		let order: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key) {
			order = sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
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

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(t);
	}, [search]);

	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		courseService
			.getDeletedCourses({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				sort: sortConfig.key,
				order: sortConfig.order,
			})
			.then((res) => {
				if (cancelled) return;
				setCourses(res.data);
				setMeta((p) => ({ ...p, last_page: res.meta.last_page, total: res.meta.total }));
			})
			.catch(() => {
				if (!cancelled) toast.error("Không thể tải thùng rác.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [debouncedSearch, meta.current_page, meta.per_page, reloadToken, sortConfig]);

	const handleRestore = async (course: AdminCourse) => {
		setRestoringId(course.id);
		try {
			await courseService.restoreCourse(course.id);
			toast.success("Đã khôi phục khóa học.");
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể khôi phục khóa học.");
		} finally {
			setRestoringId(null);
		}
	};

	const handleForceDelete = async () => {
		if (!forceTarget) return;
		setForcing(true);
		try {
			await courseService.forceDeleteCourse(forceTarget.id);
			toast.success("Đã xóa vĩnh viễn khóa học.");
			setForceTarget(null);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể xóa vĩnh viễn khóa học.");
		} finally {
			setForcing(false);
		}
	};

	const handleBulkRestore = async () => {
		if (selectedIds.length === 0) return;
		setBulkRestoring(true);
		try {
			await Promise.all(selectedIds.map((id) => courseService.restoreCourse(id)));
			toast.success(`Đã khôi phục ${selectedIds.length} khóa học.`);
			toggleAll(false);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể khôi phục các khóa học đã chọn.");
		} finally {
			setBulkRestoring(false);
		}
	};

	const handleBulkForceDelete = async () => {
		if (selectedIds.length === 0) return;
		setBulkForcing(true);
		try {
			await Promise.all(selectedIds.map((id) => courseService.forceDeleteCourse(id)));
			toast.success(`Đã xóa vĩnh viễn ${selectedIds.length} khóa học.`);
			setBulkForceOpen(false);
			toggleAll(false);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể xóa vĩnh viễn các khóa học đã chọn.");
		} finally {
			setBulkForcing(false);
		}
	};

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8'>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
					<div className='space-y-2'>
						<h2 className='text-2xl font-semibold tracking-tight'>Thùng rác khóa học</h2>
						<p className='text-muted-foreground'>
							Khôi phục hoặc xóa vĩnh viễn các khóa học đã xóa.
						</p>
					</div>
					<Button variant='outline' size='sm' className='h-8 w-fit' onClick={() => navigate("/courses")}>
						<ArrowLeft className='h-4 w-4' />
						Về danh sách
					</Button>
				</div>

				<div className='flex flex-col gap-4'>
					<Input
						placeholder='Tìm theo tên khóa học...'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className='h-8 w-full sm:max-w-80'
					/>

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
											onClick={() => handleSort("enrollments_count")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Học viên {getSortIcon("enrollments_count")}
										</Button>
									</TableHead>
									<TableHead className='w-[180px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("deleted_at")}
											className='-ml-2.5 h-8 hover:bg-muted-foreground/10'>
											Ngày xóa {getSortIcon("deleted_at")}
										</Button>
									</TableHead>
									<TableHead className='w-[52px]' />
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									Array.from({ length: meta.per_page }).map((_, i) => (
										<TableRow key={i}>
											<TableCell colSpan={7}>
												<Skeleton className='h-4 w-full' />
											</TableCell>
										</TableRow>
									))
								) : courses.length > 0 ? (
									courses.map((course) => (
										<TableRow key={course.id} data-state={isSelected(course.id) ? "selected" : undefined}>
											<TableCell>
												<Checkbox
													aria-label={`Chọn khóa ${course.title}`}
													checked={isSelected(course.id)}
													onCheckedChange={(c) => toggleOne(course.id, c === true)}
												/>
											</TableCell>
											<TableCell className='font-medium text-muted-foreground'>
												KH-{course.id}
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-3'>
													<div className='flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted'>
														{course.thumbnail ? (
															<img src={course.thumbnail} alt='' className='h-full w-full object-cover' />
														) : (
															<ImageIcon className='h-4 w-4 text-muted-foreground' />
														)}
													</div>
													<span className='max-w-[320px] truncate text-sm font-medium'>
														{course.title}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant='outline'
													className={cn(
														"rounded-full px-3 py-1",
														COURSE_LEVEL_MAP[course.level].className,
													)}>
													{COURSE_LEVEL_MAP[course.level].label}
												</Badge>
											</TableCell>
											<TableCell className='text-sm'>{course.enrollments_count}</TableCell>
											<TableCell className='text-sm text-muted-foreground'>
												{formatDate(course.deleted_at)}
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant='ghost'
															className='h-8 w-8 p-0 data-[state=open]:bg-muted'
															disabled={restoringId === course.id}>
															<MoreHorizontal className='h-4 w-4' />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align='end' className='w-[180px]'>
														<DropdownMenuItem onClick={() => void handleRestore(course)}>
															<RotateCcw className='h-4 w-4' />
															Khôi phục
														</DropdownMenuItem>
														<DropdownMenuItem
															className='text-destructive focus:bg-destructive/10 focus:text-destructive'
															onClick={() => setForceTarget(course)}>
															<Trash2 className='h-4 w-4 text-destructive' />
															Xóa vĩnh viễn
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={7} className='h-32 text-center text-muted-foreground'>
											Thùng rác trống.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
							<TableFooter className='bg-transparent'>
								<TableRow>
									<TableCell colSpan={7}>
										<div className='flex items-center justify-between px-2'>
											<div className='flex flex-1 items-center gap-3 text-sm text-muted-foreground'>
												Đang hiển thị {courses.length} trên tổng {meta.total} khóa học.
												{selectedIds.length > 0 && (
													<>
														<span className='text-border'>|</span>
														<span className='font-medium text-foreground'>
															{selectedIds.length} khóa được chọn
														</span>
														<Button
															size='sm'
															variant='outline'
															disabled={bulkRestoring || bulkForcing}
															onClick={() => void handleBulkRestore()}
															className='h-7'>
															<RotateCcw className='h-3.5 w-3.5' />
															{bulkRestoring ? "Đang khôi phục..." : "Khôi phục đã chọn"}
														</Button>
														<Button
															size='sm'
															variant='destructive'
															disabled={bulkRestoring || bulkForcing}
															onClick={() => setBulkForceOpen(true)}
															className='h-7'>
															<Trash2 className='h-3.5 w-3.5' />
															{bulkForcing ? "Đang xóa..." : "Xóa vĩnh viễn"}
														</Button>
													</>
												)}
											</div>
											<div className='flex items-center space-x-6 lg:space-x-8'>
												<div className='flex items-center space-x-2'>
													<p className='text-sm font-medium'>Số hàng mỗi trang</p>
													<Select
														value={`${meta.per_page}`}
														onValueChange={(v) =>
															setMeta((p) => ({ ...p, per_page: Number(v), current_page: 1 }))
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
														onClick={() => setMeta((p) => ({ ...p, current_page: 1 }))}
														disabled={meta.current_page === 1}>
														<ChevronsLeft className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='h-8 w-8 p-0'
														onClick={() =>
															setMeta((p) => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))
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
																current_page: Math.min(p.last_page, p.current_page + 1),
															}))
														}
														disabled={meta.current_page === meta.last_page}>
														<ChevronRight className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='hidden h-8 w-8 p-0 lg:flex'
														onClick={() => setMeta((p) => ({ ...p, current_page: p.last_page }))}
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
				</div>
			</div>

			<AlertDialog open={Boolean(forceTarget)} onOpenChange={(o) => !o && setForceTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xóa vĩnh viễn khóa học?</AlertDialogTitle>
						<AlertDialogDescription>
							{forceTarget
								? `Khóa học "${forceTarget.title}" và toàn bộ dữ liệu liên quan sẽ bị xóa vĩnh viễn, không thể khôi phục.`
								: ""}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={forcing}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								void handleForceDelete();
							}}
							disabled={forcing}
							className='bg-destructive text-white hover:bg-destructive/90'>
							{forcing ? "Đang xóa..." : "Xóa vĩnh viễn"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={bulkForceOpen} onOpenChange={(o) => !bulkForcing && setBulkForceOpen(o)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xóa vĩnh viễn {selectedIds.length} khóa học?</AlertDialogTitle>
						<AlertDialogDescription>
							{selectedIds.length} khóa học đã chọn và toàn bộ dữ liệu liên quan sẽ bị xóa vĩnh
							viễn, không thể khôi phục.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={bulkForcing}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								void handleBulkForceDelete();
							}}
							disabled={bulkForcing}
							className='bg-destructive text-white hover:bg-destructive/90'>
							{bulkForcing ? "Đang xóa..." : "Xóa vĩnh viễn"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default CourseTrashPage;
