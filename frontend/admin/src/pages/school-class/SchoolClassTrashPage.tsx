import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	ArrowUpDown,
	BookOpen,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	MoreHorizontal,
	RotateCcw,
	Trash2,
} from "lucide-react";

import schoolClassService from "@/services/school-class.service";
import type { SchoolClass } from "@/types/school-class.type";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
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
import { Button } from "@/components/ui/button";
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

const breadcrumbItems = [
	{ title: "Dashboard", link: "/" },
	{ title: "Quản lý đơn vị" },
	{ title: "Lớp", link: "/classes" },
	{ title: "Thùng rác" },
];

const getDisplayName = (item?: { label?: string | null; value?: string | null } | null) =>
	item?.label?.trim() || item?.value?.trim() || "N/A";

function SchoolClassTrashPage() {
	useBreadcrumb(breadcrumbItems);
	const navigate = useNavigate();

	const [classes, setClasses] = useState<SchoolClass[]>([]);
	const [meta, setMeta] = useState({
		current_page: 1,
		last_page: 1,
		per_page: 10,
		total: 0,
	});
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [busyClass, setBusyClass] = useState<SchoolClass | null>(null);
	const [forceDeleteClass, setForceDeleteClass] = useState<SchoolClass | null>(null);
	const [sortConfig, setSortConfig] = useState<{
		key: string | null;
		order: "asc" | "desc" | null;
	}>({
		key: "deleted_at",
		order: "desc",
	});

	useEffect(() => {
		const handler = window.setTimeout(() => setDebouncedSearch(search), 500);
		return () => window.clearTimeout(handler);
	}, [search]);

	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, sortConfig]);

	const fetchDeletedClasses = async () => {
		try {
			const response = await schoolClassService.getDeletedSchoolClasses({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch,
				sort: sortConfig.key || undefined,
				order: sortConfig.order || undefined,
			});

			setClasses(response.data);
			setMeta({
				current_page: response.meta.current_page,
				last_page: response.meta.last_page,
				per_page: response.meta.per_page,
				total: response.meta.total,
			});
		} catch (error) {
			console.error("Không thể tải thùng rác lớp:", error);
			toast.error("Không thể tải thùng rác lớp.", { position: "top-right" });
		}
	};

	useEffect(() => {
		void fetchDeletedClasses();
	}, [meta.current_page, meta.per_page, debouncedSearch, sortConfig]);

	const handleSort = (key: string) => {
		let order: "asc" | "desc" | null = "asc";

		if (sortConfig.key === key) {
			if (sortConfig.order === "asc") order = "desc";
			else if (sortConfig.order === "desc") order = null;
		}

		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: string) => {
		if (sortConfig.key !== key) return <ArrowUpDown className='ml-2 h-4 w-4' />;
		if (sortConfig.order === "asc") return <ArrowUp className='ml-2 h-4 w-4' />;
		if (sortConfig.order === "desc") return <ArrowDown className='ml-2 h-4 w-4' />;
		return <ArrowUpDown className='ml-2 h-4 w-4' />;
	};

	const formatDate = (value: string | null | undefined) => {
		if (!value) return "N/A";
		return new Date(value).toLocaleDateString("vi-VN");
	};

	const handleRestore = async (schoolClass: SchoolClass) => {
		setBusyClass(schoolClass);

		try {
			await schoolClassService.restoreSchoolClass(schoolClass.id);
			toast.success("Khôi phục lớp thành công.", { position: "top-right" });
			await fetchDeletedClasses();
		} catch (error) {
			console.error("Không thể khôi phục lớp:", error);
			toast.error("Không thể khôi phục lớp.", { position: "top-right" });
		} finally {
			setBusyClass(null);
		}
	};

	const handleForceDelete = async () => {
		if (!forceDeleteClass) return;

		setBusyClass(forceDeleteClass);

		try {
			await schoolClassService.forceDeleteSchoolClass(forceDeleteClass.id);
			toast.success("Xóa vĩnh viễn lớp thành công.", { position: "top-right" });
			setForceDeleteClass(null);
			await fetchDeletedClasses();
		} catch (error) {
			console.error("Không thể xóa vĩnh viễn lớp:", error);
			toast.error("Không thể xóa vĩnh viễn lớp.", { position: "top-right" });
		} finally {
			setBusyClass(null);
		}
	};

	return (
		<div className='h-full flex-1 flex-col'>
			<div className='flex items-center justify-between gap-3 p-4 md:p-6 lg:p-8'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>Thùng rác lớp</h2>
					<p className='text-muted-foreground'>
						Danh sách các lớp đã xóa mềm và có thể khôi phục.
					</p>
				</div>
				<Button
					type='button'
					size='sm'
					variant='outline'
					onClick={() => navigate("/classes")}
					className='h-8'>
					<ArrowLeft className='h-4 w-4' />
					Quay lại
				</Button>
			</div>

			<div className='flex flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0 lg:p-8 lg:pt-0'>
				<Input
					placeholder='Tìm theo tên lớp, ngành hoặc khoa...'
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					className='h-8 w-full sm:w-64 md:w-72 lg:w-80'
				/>

				<div className='overflow-hidden rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-[100px]'>
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
										onClick={() => handleSort("label")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Tên lớp
										{getSortIcon("label")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("major_label")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Tên ngành
										{getSortIcon("major_label")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("faculty_label")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Tên khoa
										{getSortIcon("faculty_label")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("deleted_at")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Ngày xóa
										{getSortIcon("deleted_at")}
									</Button>
								</TableHead>
								<TableHead className='w-[50px]'></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{classes.map((schoolClass) => (
								<TableRow key={schoolClass.id}>
									<TableCell className='font-medium'>CLS-{schoolClass.id}</TableCell>
									<TableCell>
										<div className='flex items-center gap-3'>
											<div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
												<BookOpen className='h-4 w-4' />
											</div>
											<div className='flex min-w-0 flex-col'>
												<span className='font-medium'>{schoolClass.label}</span>
												<span className='max-w-[420px] truncate text-xs text-muted-foreground'>
													{schoolClass.value}
												</span>
											</div>
										</div>
									</TableCell>
									<TableCell>{getDisplayName(schoolClass.major)}</TableCell>
									<TableCell>{getDisplayName(schoolClass.major?.faculty)}</TableCell>
									<TableCell>{formatDate(schoolClass.deleted_at)}</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant='ghost'
													className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
													<MoreHorizontal className='h-4 w-4' />
													<span className='sr-only'>Mở thao tác</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end' className='w-[180px]'>
												<DropdownMenuItem
													disabled={busyClass?.id === schoolClass.id}
													onClick={() => void handleRestore(schoolClass)}>
													<RotateCcw className='h-4 w-4' />
													Khôi phục
												</DropdownMenuItem>
												<DropdownMenuItem
													className='text-destructive focus:text-destructive'
													disabled={busyClass?.id === schoolClass.id}
													onClick={() => setForceDeleteClass(schoolClass)}>
													<Trash2 className='h-4 w-4 text-destructive' />
													Xóa vĩnh viễn
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
							{classes.length === 0 && (
								<TableRow>
									<TableCell colSpan={6} className='h-24 text-center'>
										Không có lớp nào trong thùng rác.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						<TableFooter className='bg-transparent'>
							<TableRow>
								<TableCell colSpan={6}>
									<div className='flex items-center justify-between px-2'>
										<div className='text-sm text-muted-foreground'>
											Hiển thị {classes.length} / {meta.total} lớp đã xóa.
										</div>
										<div className='flex items-center space-x-6 lg:space-x-8'>
											<div className='flex items-center space-x-2'>
												<p className='text-sm font-medium'>Số hàng mỗi trang</p>
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
														<SelectValue placeholder={meta.per_page} />
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
											<div className='flex w-[120px] items-center justify-center text-sm font-medium'>
												Trang {meta.current_page} / {meta.last_page}
											</div>
											<div className='flex items-center space-x-2'>
												<Button
													variant='outline'
													className='hidden h-8 w-8 p-0 lg:flex'
													onClick={() =>
														setMeta((prev) => ({ ...prev, current_page: 1 }))
													}
													disabled={meta.current_page === 1}>
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
													disabled={meta.current_page === 1}>
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
													disabled={meta.current_page === meta.last_page}>
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

			<AlertDialog
				open={Boolean(forceDeleteClass)}
				onOpenChange={(open) => {
					if (!open) setForceDeleteClass(null);
				}}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xóa vĩnh viễn lớp?</AlertDialogTitle>
						<AlertDialogDescription>
							Lớp sẽ bị xóa khỏi thùng rác và không thể khôi phục.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={Boolean(busyClass)}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(event) => {
								event.preventDefault();
								void handleForceDelete();
							}}
							disabled={Boolean(busyClass)}
							className='bg-destructive text-white hover:bg-destructive/90'>
							Xóa vĩnh viễn
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default SchoolClassTrashPage;
