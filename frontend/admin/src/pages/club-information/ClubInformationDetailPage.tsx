import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	ArrowUpDown,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Eye,
	FileText,
	Hash,
	Info,
	MoreHorizontal,
	Plus,
	Tag,
	ToggleLeft,
	Type,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import clubInformationService from "@/services/club-information.service";
import type { ClubInformation } from "@/types/club-information";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CompactBadgeList, type CompactBadgeItem } from "@/components/ui/compact-badge-list";
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
import { getBreadcrumbsFromNavigation } from "@/config/navigation";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ValSortKey = "id" | "value" | "is_active" | "created_at" | "updated_at";

function formatDate(dateString: string | null) {
	return dateString?.trim() || "--";
}

function getErrorMessage(error: unknown, fallback: string) {
	if (axios.isAxiosError(error)) {
		const responseMessage = (error.response?.data as { message?: string } | undefined)?.message;
		if (responseMessage) return responseMessage;
	}
	if (error instanceof Error && error.message) return error.message;
	return fallback;
}

function InfoRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
	return (
		<div className='flex flex-col gap-1'>
			<p className='text-sm font-medium text-muted-foreground'>{label}</p>
			<div className='text-sm font-semibold break-words'>{value}</div>
		</div>
	);
}

function getStatusBadgeItems(isActive?: boolean): CompactBadgeItem[] {
	return [
		{
			key: isActive === false ? "inactive" : "active",
			label: isActive === false ? "Tạm ẩn" : "Đang dùng",
			className:
				isActive === false
					? "border-muted-foreground/20 bg-muted text-muted-foreground hover:bg-muted"
					: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
		},
	];
}

function getTypeBadgeItems(type: string | null): CompactBadgeItem[] {
	if (!type) return [];

	return [
		{
			key: type,
			label: type,
			className: "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10",
		},
	];
}

function getSlugBadgeItems(slug: string): CompactBadgeItem[] {
	if (!slug) return [];

	return [
		{
			key: slug,
			label: slug,
			className:
				"border-muted-foreground/20 bg-muted font-mono text-muted-foreground hover:bg-muted",
		},
	];
}

function ClubInformationDetailPage() {
	const navigate = useNavigate();
	const { id } = useParams();
	const [info, setInfo] = useState<ClubInformation | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [valSearch, setValSearch] = useState("");
	const [valDebouncedSearch, setValDebouncedSearch] = useState("");

	const [valSortConfig, setValSortConfig] = useState<{
		key: ValSortKey | null;
		order: "asc" | "desc" | null;
	}>({ key: null, order: null });
	const [valCurrentPage, setValCurrentPage] = useState(1);
	const [valPerPage, setValPerPage] = useState(10);

	const breadcrumb = useMemo(
		() => [
			{ title: "Dashboard", link: "/" },
			{ title: "Quản lý thông tin CLB", link: "/club-informations" },
			{ title: `Cấu hình #${id}` },
		],
		[],
	);

	useBreadcrumb(breadcrumb);

	useEffect(() => {
		const handler = window.setTimeout(() => {
			setValDebouncedSearch(valSearch.trim());
		}, 500);

		return () => window.clearTimeout(handler);
	}, [valSearch]);

	useEffect(() => {
		setValCurrentPage(1);
	}, [valDebouncedSearch]);

	useEffect(() => {
		let mounted = true;

		const fetchInfo = async () => {
			if (!id) {
				setLoading(false);
				setError("Thiếu mã cấu hình.");
				return;
			}

			try {
				const response = await clubInformationService.getClubInformation(Number(id), {
					search: valDebouncedSearch || undefined,
					sort: valSortConfig.key || undefined,
					order: valSortConfig.order || undefined,
				});
				if (!mounted) return;
				setInfo(response.data);
				setError(null);
			} catch (fetchError) {
				if (!mounted) return;
				setInfo(null);
				setError(getErrorMessage(fetchError, "Không thể tải chi tiết cấu hình."));
			} finally {
				if (mounted) setLoading(false);
			}
		};

		void fetchInfo();

		return () => {
			mounted = false;
		};
	}, [id, valDebouncedSearch, valSortConfig]);

	const values = useMemo(() => info?.club_information_values ?? [], [info]);
	const sortedValues = values;

	const valLastPage = Math.max(1, Math.ceil(sortedValues.length / valPerPage));

	const paginatedValues = useMemo(() => {
		const start = (valCurrentPage - 1) * valPerPage;
		return sortedValues.slice(start, start + valPerPage);
	}, [sortedValues, valCurrentPage, valPerPage]);

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		paginatedValues.map((v) => v.id),
	);

	const handleValSort = (key: ValSortKey) => {
		setValCurrentPage(1);
		setValSortConfig((prev) => {
			if (prev.key !== key) return { key, order: "asc" };
			if (prev.order === "asc") return { key, order: "desc" };
			if (prev.order === "desc") return { key: null, order: null };
			return { key, order: "asc" };
		});
	};

	const getValSortIcon = (key: ValSortKey) => {
		if (valSortConfig.key !== key) return <ArrowUpDown className='ml-2 h-4 w-4' />;
		if (valSortConfig.order === "asc") return <ArrowUp className='ml-2 h-4 w-4' />;
		if (valSortConfig.order === "desc") return <ArrowDown className='ml-2 h-4 w-4' />;
		return <ArrowUpDown className='ml-2 h-4 w-4' />;
	};

	if (loading) {
		return (
			<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
				<Skeleton className='h-10 w-48' />
				<div className='flex flex-col gap-6'>
					<Skeleton className='h-48 w-full' />
					<Skeleton className='h-96 w-full' />
				</div>
			</div>
		);
	}

	if (!info) {
		return (
			<div className='flex flex-col gap-4 p-4 md:p-6 lg:p-8'>
				<Button asChild variant='outline' className='w-fit'>
					<Link to='/club-informations'>
						<ArrowLeft className='h-4 w-4' />
						Quay lại danh sách
					</Link>
				</Button>
				<Card>
					<CardHeader>
						<CardTitle>Không tải được cấu hình</CardTitle>
						<CardDescription>
							{error ?? "Cấu hình này không tồn tại hoặc đã bị xóa."}
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<Button asChild variant='outline' className='w-fit'>
				<Link to='/club-informations'>
					<ArrowLeft className='h-4 w-4' />
					Quay lại danh sách
				</Link>
			</Button>

			<div className='flex flex-col gap-6'>
				<div>
					<Card className='shadow-sm'>
						<CardHeader className='pb-4'>
							<div className='mb-1 flex flex-wrap items-center gap-2'>
								<CompactBadgeList
									items={[
										{
											key: "id",
											label: `#${info.id}`,
											className:
												"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
										},
										...getStatusBadgeItems(info.is_active),
									]}
									maxVisibleItems={2}
								/>
							</div>
							<CardTitle className='text-lg leading-snug'>{info.label}</CardTitle>
							<CardDescription>Thông tin cấu hình CLB</CardDescription>
						</CardHeader>
						<CardContent className='grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4'>
							<InfoRow
								label={
									<span className='flex items-center gap-1.5'>
										<Tag className='h-3.5 w-3.5' />
										Nhãn
									</span>
								}
								value={info.label}
							/>
							<InfoRow
								label={
									<span className='flex items-center gap-1.5'>
										<Hash className='h-3.5 w-3.5' />
										Giá trị
									</span>
								}
								value={info.value || "--"}
							/>
							<InfoRow
								label={
									<span className='flex items-center gap-1.5'>
										<Info className='h-3.5 w-3.5' />
										Slug
									</span>
								}
								value={
									<CompactBadgeList
										items={getSlugBadgeItems(info.slug)}
										maxVisibleItems={1}
										emptyLabel='--'
									/>
								}
							/>
							<InfoRow
								label={
									<span className='flex items-center gap-1.5'>
										<Type className='h-3.5 w-3.5' />
										Kiểu dữ liệu
									</span>
								}
								value={
									<CompactBadgeList
										items={getTypeBadgeItems(info.type)}
										maxVisibleItems={1}
										emptyLabel='--'
									/>
								}
							/>
							<InfoRow
								label={
									<span className='flex items-center gap-1.5'>
										<FileText className='h-3.5 w-3.5' />
										Mô tả
									</span>
								}
								value={info.description || "--"}
							/>
							<InfoRow
								label={
									<span className='flex items-center gap-1.5'>
										<ToggleLeft className='h-3.5 w-3.5' />
										Trạng thái
									</span>
								}
								value={info.is_active === false ? "Tạm ẩn" : "Đang dùng"}
							/>
							<InfoRow
								label={
									<span className='flex items-center gap-1.5'>
										<CalendarDays className='h-3.5 w-3.5' />
										Ngày tạo
									</span>
								}
								value={formatDate(info.created_at)}
							/>
							<InfoRow
								label={
									<span className='flex items-center gap-1.5'>
										<CalendarDays className='h-3.5 w-3.5' />
										Cập nhật
									</span>
								}
								value={formatDate(info.updated_at)}
							/>
						</CardContent>
					</Card>
				</div>

				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
						<div className='flex flex-1 items-center justify-between gap-2'>
							<Input
								placeholder='Tìm kiếm...'
								value={valSearch}
								onChange={(event) => setValSearch(event.target.value)}
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

					<div className='flex flex-col gap-4'>
						<div className='overflow-hidden rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-[50px]'>
											<Checkbox
												aria-label='Select all'
												checked={allSelected}
												onCheckedChange={(checked) =>
													toggleAll(checked === true)
												}
											/>
										</TableHead>
										<TableHead className='w-[70px]'>
											<Button
												variant='ghost'
												onClick={() => handleValSort("id")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												ID
												{getValSortIcon("id")}
											</Button>
										</TableHead>
										<TableHead>
											<Button
												variant='ghost'
												onClick={() => handleValSort("value")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												Giá trị
												{getValSortIcon("value")}
											</Button>
										</TableHead>
										<TableHead>
											<Button
												variant='ghost'
												onClick={() => handleValSort("is_active")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												Trạng thái
												{getValSortIcon("is_active")}
											</Button>
										</TableHead>
										<TableHead>
											<Button
												variant='ghost'
												onClick={() => handleValSort("created_at")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												Ngày tạo
												{getValSortIcon("created_at")}
											</Button>
										</TableHead>
										<TableHead>
											<Button
												variant='ghost'
												onClick={() => handleValSort("updated_at")}
												className='-ml-4 h-8 hover:bg-muted-foreground/10'>
												Ngày cập nhật
												{getValSortIcon("updated_at")}
											</Button>
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedValues.length > 0 ? (
										paginatedValues.map((val) => (
											<TableRow key={val.id}>
												<TableCell>
													<Checkbox
														aria-label={`Select value ${val.id}`}
														checked={isSelected(val.id)}
														onCheckedChange={(checked) =>
															toggleOne(val.id, checked === true)
														}
													/>
												</TableCell>
												<TableCell className='font-medium'>
													{val.id}
												</TableCell>
												<TableCell>
													<div className='max-w-[360px] overflow-hidden'>
														<p className='truncate' title={val.value}>
															{val.value}
														</p>
													</div>
												</TableCell>
												<TableCell>
													<CompactBadgeList
														items={getStatusBadgeItems(val.is_active)}
														maxVisibleItems={1}
													/>
												</TableCell>
												<TableCell>{formatDate(val.created_at)}</TableCell>
												<TableCell>{formatDate(val.updated_at)}</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant='ghost'
																className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
																<MoreHorizontal className='h-4 w-4' />
																<span className='sr-only'>
																	Open menu
																</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent
															align='end'
															className='w-[160px]'>
															<DropdownMenuItem
																onClick={() =>
																	navigate(
																		`/club-informations/${val.id}`,
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
											<TableCell colSpan={6} className='h-24 text-center'>
												Không tìm thấy kết quả phù hợp.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								<TableFooter className='bg-transparent'>
									<TableRow>
										<TableCell colSpan={6}>
											<div className='flex items-center justify-between px-2'>
												<div className='flex-1 text-sm text-muted-foreground'>
													Đang hiện {paginatedValues.length} trên tổng{" "}
													{sortedValues.length} dòng.
												</div>
												<div className='flex items-center space-x-6 lg:space-x-8'>
													<div className='flex items-center space-x-2'>
														<p className='text-sm font-medium'>
															Rows per page
														</p>
														<Select
															value={`${valPerPage}`}
															onValueChange={(v) => {
																setValPerPage(Number(v));
																setValCurrentPage(1);
															}}>
															<SelectTrigger className='h-8 w-[70px]'>
																<SelectValue
																	placeholder={`${valPerPage}`}
																/>
															</SelectTrigger>
															<SelectContent side='top'>
																{[10, 20, 25, 30, 40, 50].map(
																	(s) => (
																		<SelectItem
																			key={s}
																			value={`${s}`}>
																			{s}
																		</SelectItem>
																	),
																)}
															</SelectContent>
														</Select>
													</div>
													<div className='flex w-[100px] items-center justify-center text-sm font-medium'>
														Page {valCurrentPage} of {valLastPage}
													</div>
													<div className='flex items-center space-x-2'>
														<Button
															variant='outline'
															className='hidden h-8 w-8 p-0 lg:flex'
															onClick={() => setValCurrentPage(1)}
															disabled={valCurrentPage === 1}>
															<span className='sr-only'>
																Đi đến trang đầu
															</span>
															<ChevronsLeft className='h-4 w-4' />
														</Button>
														<Button
															variant='outline'
															className='h-8 w-8 p-0'
															onClick={() =>
																setValCurrentPage((p) => p - 1)
															}
															disabled={valCurrentPage === 1}>
															<span className='sr-only'>
																Quay lại trang trước
															</span>
															<ChevronLeft className='h-4 w-4' />
														</Button>
														<Button
															variant='outline'
															className='h-8 w-8 p-0'
															onClick={() =>
																setValCurrentPage((p) => p + 1)
															}
															disabled={
																valCurrentPage >= valLastPage
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
																setValCurrentPage(valLastPage)
															}
															disabled={
																valCurrentPage >= valLastPage
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
			</div>
		</div>
	);
}

export default ClubInformationDetailPage;
