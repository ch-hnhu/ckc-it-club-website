import { useEffect, useState } from "react";
import majorService from "@/services/major.service";
import type { Major } from "@/types/major.type";
import { useMemo } from "react";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableFooter,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	FolderTree,
	MoreHorizontal,
	Plus,
	Settings2,
} from "lucide-react";
import { getBreadcrumbsFromNavigation } from "@/config/navigation";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";

const getDisplayName = (item?: { label?: string | null; value?: string | null } | null) =>
	item?.label?.trim() || item?.value?.trim() || "N/A";

function MajorList() {
	const breadcrumb = useMemo(() => getBreadcrumbsFromNavigation("/majors"), []);

	useBreadcrumb(breadcrumb);

	const [majors, setMajors] = useState<Major[]>([]);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sortConfig, setSortConfig] = useState<{ key: string | null; order: "asc" | "desc" | null }>({ key: "created_at", order: "desc" });
	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		majors.map((major) => major.id),
	);

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedSearch(search), 500);
		return () => clearTimeout(handler);
	}, [search]);

	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, sortConfig]);

	useEffect(() => {
		const fetchMajors = async () => {
			try {
				const response = await majorService.getMajors({
					page: meta.current_page,
					per_page: meta.per_page,
					search: debouncedSearch,
					sort: sortConfig.key || undefined,
					order: sortConfig.order || undefined,
				});
				setMajors(response.data);
				setMeta({
					current_page: response.meta.current_page,
					last_page: response.meta.last_page,
					per_page: response.meta.per_page,
					total: response.meta.total,
				});
			} catch (error) {
				console.error("Đã có lỗi xảy ra:", error);
			}
		};

		fetchMajors();
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

	const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("vi-VN") : "N/A");

	return (
		<div className='h-full flex-1 flex-col'>
			<div className='flex items-center p-4 md:p-6 lg:p-8'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>Major Management</h2>
					<p className='text-muted-foreground'>Danh sách tất cả ngành trong hệ thống.</p>
				</div>
			</div>
			<div className='flex flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0 lg:p-8 lg:pt-0'>
				<div className='flex items-center justify-between'>
					<div className='flex flex-1 items-center gap-2'>
						<Input placeholder='Tìm kiếm theo tên ngành...' value={search} onChange={(e) => setSearch(e.target.value)} className='h-8 sm:w-64 md:w-72 lg:w-80 w-11/12' />
					</div>
					<div className='flex items-center gap-2'>
						<Button variant='outline' size='sm' className='h-8 lg:flex'><Settings2 className='h-4 w-4' />View</Button>
						<Button size='sm' className='h-8 bg-foreground text-background hover:bg-foreground/90'><Plus className='h-4 w-4' />Thêm ngành</Button>
					</div>
				</div>
				<div className='overflow-hidden rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-[50px]'><Checkbox aria-label='Select all' checked={allSelected} onCheckedChange={(checked) => toggleAll(checked === true)} /></TableHead>
								<TableHead className='w-[100px]'><Button variant='ghost' onClick={() => handleSort("id")} className='-ml-4 h-8 hover:bg-muted-foreground/10'>ID{getSortIcon("id")}</Button></TableHead>
								<TableHead><Button variant='ghost' onClick={() => handleSort("label")} className='-ml-4 h-8 hover:bg-muted-foreground/10'> Tên ngành{getSortIcon("label")}</Button></TableHead>
								<TableHead><Button variant='ghost' onClick={() => handleSort("faculty_label")} className='-ml-4 h-8 hover:bg-muted-foreground/10'>Tên khoa{getSortIcon("faculty_label")}</Button></TableHead>
								
								<TableHead><Button variant='ghost' onClick={() => handleSort("school_classes_count")} className='-ml-4 h-8 hover:bg-muted-foreground/10'>Số lượng lớp{getSortIcon("school_classes_count")}</Button></TableHead>
								<TableHead><Button variant='ghost' onClick={() => handleSort("created_at")} className='-ml-4 h-8 hover:bg-muted-foreground/10'>Ngày tạo{getSortIcon("created_at")}</Button></TableHead>
								<TableHead><Button variant='ghost' onClick={() => handleSort("updated_at")} className='-ml-4 h-8 hover:bg-muted-foreground/10'>Ngày cập nhật{getSortIcon("updated_at")}</Button></TableHead>
								<TableHead className='w-[50px]'></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{majors.map((major) => (
								<TableRow key={major.id}>
									<TableCell><Checkbox aria-label={`Select major ${major.id}`} checked={isSelected(major.id)} onCheckedChange={(checked) => toggleOne(major.id, checked === true)} /></TableCell>
									<TableCell className='font-medium'>MAJ-{major.id}</TableCell>
									<TableCell><div className='flex items-center gap-3'><div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'><FolderTree className='h-4 w-4' /></div><div className='flex flex-col'><span className='font-medium'>{major.label}</span><span className='text-xs text-muted-foreground'>{major.value}</span></div></div></TableCell>
									<TableCell>{getDisplayName(major.faculty)}</TableCell>
									<TableCell>{major.school_classes_count}</TableCell>
									<TableCell>{formatDate(major.created_at)}</TableCell>
									<TableCell>{formatDate(major.updated_at)}</TableCell>
									<TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'><MoreHorizontal className='h-4 w-4' /><span className='sr-only'>Open menu</span></Button></DropdownMenuTrigger><DropdownMenuContent align='end' className='w-[160px]'><DropdownMenuItem>Edit</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10'>Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
								</TableRow>
							))}
							{majors.length === 0 && <TableRow><TableCell colSpan={8} className='h-24 text-center'>No majors found.</TableCell></TableRow>}
						</TableBody>
						<TableFooter className='bg-transparent'><TableRow><TableCell colSpan={8}><div className='flex items-center justify-between px-2'><div className='flex-1 text-sm text-muted-foreground'>{majors.length} of {meta.total} row(s) displayed.</div><div className='flex items-center space-x-6 lg:space-x-8'><div className='flex items-center space-x-2'><p className='text-sm font-medium'>Rows per page</p><Select value={`${meta.per_page}`} onValueChange={(value) => setMeta((prev) => ({ ...prev, per_page: Number(value), current_page: 1 }))}><SelectTrigger className='h-8 w-[70px]'><SelectValue placeholder={meta.per_page} /></SelectTrigger><SelectContent side='top'>{[10, 20, 25, 30, 40, 50].map((pageSize) => <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>)}</SelectContent></Select></div><div className='flex w-[100px] items-center justify-center text-sm font-medium'>Page {meta.current_page} of {meta.last_page}</div><div className='flex items-center space-x-2'><Button variant='outline' className='hidden h-8 w-8 p-0 lg:flex' onClick={() => setMeta((prev) => ({ ...prev, current_page: 1 }))} disabled={meta.current_page === 1}><span className='sr-only'>Go to first page</span><ChevronsLeft className='h-4 w-4' /></Button><Button variant='outline' className='h-8 w-8 p-0' onClick={() => setMeta((prev) => ({ ...prev, current_page: prev.current_page - 1 }))} disabled={meta.current_page === 1}><span className='sr-only'>Go to previous page</span><ChevronLeft className='h-4 w-4' /></Button><Button variant='outline' className='h-8 w-8 p-0' onClick={() => setMeta((prev) => ({ ...prev, current_page: prev.current_page + 1 }))} disabled={meta.current_page === meta.last_page}><span className='sr-only'>Go to next page</span><ChevronRight className='h-4 w-4' /></Button><Button variant='outline' className='hidden h-8 w-8 p-0 lg:flex' onClick={() => setMeta((prev) => ({ ...prev, current_page: meta.last_page }))} disabled={meta.current_page === meta.last_page}><span className='sr-only'>Go to last page</span><ChevronsRight className='h-4 w-4' /></Button></div></div></div></TableCell></TableRow></TableFooter>
					</Table>
				</div>
			</div>
		</div>
	);
}

export default MajorList;
