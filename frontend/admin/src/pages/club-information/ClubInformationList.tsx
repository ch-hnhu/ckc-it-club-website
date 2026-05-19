import { useEffect, useMemo, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Eye,
	MoreHorizontal,
	Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
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
import clubInformationService from "@/services/club-information.service";
import type { ClubInformation } from "@/types/club-information";
import { CompactBadgeList } from "@/components/ui/compact-badge-list";
import { Checkbox } from "@/components/ui/checkbox";
import { useTableSelection } from "@/hooks/useTableSelection";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortKey = "id" | "label" | "type" | "is_active" | "description" | "created_at";

function formatText(value?: string | null) {
	return value?.trim() || "--";
}

function toBadgeItems(value?: string | null) {
	const label = value?.trim();

	return label ? [{ key: label, label }] : [];
}

function ClubInformationList() {
	const navigate = useNavigate();
	const breadcrumb = useMemo(
		() => [{ title: "Dashboard", link: "/" }, { title: "Quản lý thông tin CLB" }],
		[],
	);

	useBreadcrumb(breadcrumb);

	const [clubInformations, setClubInformations] = useState<ClubInformation[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [meta, setMeta] = useState({
		current_page: 1,
		last_page: 1,
		per_page: 10,
		total: 0,
	});
	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		clubInformations.map((info) => info.id),
	);
	const [sortConfig, setSortConfig] = useState<{
		key: SortKey | null;
		order: "asc" | "desc" | null;
	}>({
		key: "created_at",
		order: "desc",
	});

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search.trim());
		}, 400);

		return () => clearTimeout(handler);
	}, [search]);

	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, sortConfig]);

	useEffect(() => {
		let cancelled = false;

		const fetchClubInformations = async () => {
			setLoading(true);

			try {
				const response = await clubInformationService.getClubInformations({
					page: meta.current_page,
					per_page: meta.per_page,
					search: debouncedSearch || undefined,
					sort: sortConfig.key || undefined,
					order: sortConfig.order || undefined,
				});

				if (cancelled) return;

				setClubInformations(response.data);
				setMeta({
					current_page: response.meta.current_page,
					last_page: response.meta.last_page,
					per_page: response.meta.per_page,
					total: response.meta.total,
				});
			} catch (error) {
				if (!cancelled) {
					console.error(error);
					toast.error("Không thể tải danh sách thông tin CLB.", {
						position: "top-right",
					});
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void fetchClubInformations();

		return () => {
			cancelled = true;
		};
	}, [debouncedSearch, meta.current_page, meta.per_page, sortConfig]);

	const handleSort = (key: SortKey) => {
		let order: "asc" | "desc" | null = "asc";

		if (sortConfig.key === key) {
			order =
				sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}

		setSortConfig({ key: order ? key : null, order });
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

	return (
		<div className='h-full flex-1 flex-col'>
			<div className='flex items-center p-4 md:p-6 lg:p-8'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>Quản lý thông tin CLB</h2>
					<p className='text-muted-foreground'>
						Danh sách tất cả cấu hình và thông tin của CLB.
					</p>
				</div>
			</div>

			<div className='flex flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0 lg:p-8 lg:pt-0'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
					<div className='flex flex-1 items-center gap-2 justify-between'>
						<Input
							placeholder='Tìm kiếm theo tên, kiểu dữ liệu hoặc mô tả...'
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className='h-8 w-full sm:max-w-sm'
						/>
						<div className='flex items-center gap-2'>
							<Button
								size='sm'
								onClick={() => navigate("/users/create")}
								className='h-8 bg-foreground text-background hover:bg-foreground/90'>
								<Plus className='h-4 w-4' />
								Thêm
							</Button>
						</div>
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
								<TableHead>
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
										Tên cấu hình
										{getSortIcon("label")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("type")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Kiểu dữ liệu
										{getSortIcon("type")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("description")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Mô tả
										{getSortIcon("description")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("description")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Trạng thái
										{getSortIcon("is_active")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("created_at")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Ngày tạo
										{getSortIcon("created_at")}
									</Button>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{clubInformations.length > 0 ? (
								clubInformations.map((item) => (
									<TableRow key={item.id}>
										<TableCell>
											<Checkbox
												aria-label={`Select club information ${item.id}`}
												checked={isSelected(item.id)}
												onCheckedChange={(checked) =>
													toggleOne(item.id, checked === true)
												}
											/>
										</TableCell>
										<TableCell className='font-medium'>{item.id}</TableCell>
										<TableCell>
											<div className='flex flex-col'>
												<span className='font-medium'>{item.label}</span>
												<span className='text-xs text-muted-foreground'>
													{formatText(item.value)}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<CompactBadgeList
												items={toBadgeItems(item.type)}
												maxVisibleItems={1}
												emptyLabel='--'
												badgeClassName='border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10'
											/>
										</TableCell>
										<TableCell className='max-w-[360px] truncate'>
											{formatText(item.description)}
										</TableCell>
										<TableCell>
											<CompactBadgeList
												items={[
													{
														key:
															item.is_active === false
																? "inactive"
																: "active",
														label:
															item.is_active === false
																? "Tạm ẩn"
																: "Đang dùng",
														className:
															item.is_active === false
																? "border-muted-foreground/20 bg-muted text-muted-foreground hover:bg-muted"
																: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
													},
												]}
												maxVisibleItems={1}
											/>
										</TableCell>
										<TableCell>{formatText(item.created_at)}</TableCell>
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
												<DropdownMenuContent
													align='end'
													className='w-[160px]'>
													<DropdownMenuItem
														onClick={() =>
															navigate(
																`/club-informations/${item.id}`,
															)
														}>
														<Eye className='h-4 w-4' />
														Chi tiết
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={8} className='h-24 text-center'>
										Không tìm thấy kết quả phù hợp.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						<TableFooter className='bg-transparent'>
							<TableRow>
								<TableCell colSpan={8}>
									<div className='flex items-center justify-between px-2'>
										<div className='flex-1 text-sm text-muted-foreground'>
											Đang hiện {clubInformations.length} trên tổng{" "}
											{meta.total} dòng.
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
														<SelectValue
															placeholder={`${meta.per_page}`}
														/>
													</SelectTrigger>
													<SelectContent side='top'>
														{[10, 20, 25, 30, 40, 50].map(
															(pageSize) => (
																<SelectItem
																	key={pageSize}
																	value={`${pageSize}`}>
																	{pageSize}
																</SelectItem>
															),
														)}
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
														setMeta((prev) => ({
															...prev,
															current_page: 1,
														}))
													}
													disabled={loading || meta.current_page === 1}>
													<span className='sr-only'>
														Đi đến trang đầu
													</span>
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
													<span className='sr-only'>
														Quay lại trang trước
													</span>
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
													disabled={
														loading ||
														meta.current_page >= meta.last_page
													}>
													<span className='sr-only'>
														Đi đến trang tiếp theo
													</span>
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
													disabled={
														loading ||
														meta.current_page >= meta.last_page
													}>
													<span className='sr-only'>
														Đi đến trang cuối
													</span>
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
	);
}

export default ClubInformationList;
