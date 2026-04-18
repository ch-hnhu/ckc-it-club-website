import { useEffect, useMemo, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	MoreHorizontal,
	Settings2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import applicationService from "@/services/application.service";
import type {
	ApplicationStatus,
	ClubApplicationRecord,
	UpdateApplicationStatusPayload,
} from "@/types/application.type";
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
import { Textarea } from "@/components/ui/textarea";
import {
	formatDate,
	getApplicantName,
	getNextStatuses,
	getStatusBadge,
	getStatusConfig,
} from "./application-detail-shared";
import { getBreadcrumbsFromNavigation } from "@/config/navigation";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";

const statusOptions: Array<{ value: ApplicationStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "pending", label: "Chờ duyệt" },
	{ value: "processing", label: "Đang xử lý" },
	{ value: "interview", label: "Phỏng vấn" },
	{ value: "passed", label: "Đạt" },
	{ value: "failed", label: "Không đạt" },
];

type SortKey =
	| "id"
	| "full_name"
	| "email"
	| "student_code"
	| "status"
	| "created_at"
	| "updated_at";

function getSortValue(application: ClubApplicationRecord, key: SortKey) {
	switch (key) {
		case "id":
			return application.id;
		case "full_name":
			return getApplicantName(application);
		case "email":
			return application.applicant?.email || "";
		case "student_code":
			return application.applicant?.student_code || "";
		case "status":
			return getStatusConfig(application.status).label;
		case "created_at":
			return application.created_at || "";
		case "updated_at":
			return application.updated_at || "";
	}
}

function ApplicationRequestsPage() {
	const breadcrumb = useMemo(() => getBreadcrumbsFromNavigation("/requests"), []);

	useBreadcrumb(breadcrumb);

	const navigate = useNavigate();
	const [applications, setApplications] = useState<ClubApplicationRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
	const [statusDialogApplication, setStatusDialogApplication] =
		useState<ClubApplicationRecord | null>(null);
	const [statusNote, setStatusNote] = useState("");
	const [nextStatus, setNextStatus] =
		useState<UpdateApplicationStatusPayload["status"]>("processing");
	const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
	const [pagination, setPagination] = useState({ currentPage: 1, perPage: 10 });
	const [sortConfig, setSortConfig] = useState<{
		key: SortKey | null;
		order: "asc" | "desc" | null;
	}>({ key: "updated_at", order: "desc" });

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search.trim().toLowerCase());
			setPagination((prev) => ({ ...prev, currentPage: 1 }));
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		let mounted = true;
		applicationService
			.getApplications()
			.then((data) => mounted && setApplications(data))
			.finally(() => mounted && setLoading(false));
		return () => {
			mounted = false;
		};
	}, []);

	const filteredApplications = useMemo(
		() =>
			applications.filter((application) => {
				if (statusFilter !== "all" && application.status !== statusFilter) return false;
				if (!debouncedSearch) return true;

				const haystack = [
					application.id,
					application.status,
					application.note,
					application.created_by,
					application.updated_by,
					application.applicant?.full_name,
					application.applicant?.email,
					application.applicant?.student_code,
					application.applicant?.faculty,
					application.applicant?.major,
					application.applicant?.class_name,
					...application.answers.map((answer) => answer.question_label),
					...application.answers.map((answer) => answer.answer_value),
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();

				return haystack.includes(debouncedSearch);
			}),
		[applications, debouncedSearch, statusFilter],
	);

	const sortedApplications = useMemo(() => {
		if (!sortConfig.key || !sortConfig.order) return filteredApplications;
		const sortKey = sortConfig.key;
		const sorted = [...filteredApplications].sort((left, right) => {
			const leftValue = getSortValue(left, sortKey);
			const rightValue = getSortValue(right, sortKey);

			if (typeof leftValue === "number" && typeof rightValue === "number") {
				return leftValue - rightValue;
			}

			return String(leftValue).localeCompare(String(rightValue), "vi", {
				numeric: true,
				sensitivity: "base",
			});
		});

		return sortConfig.order === "asc" ? sorted : sorted.reverse();
	}, [filteredApplications, sortConfig]);

	const totalPages = Math.max(1, Math.ceil(sortedApplications.length / pagination.perPage));
	const currentPage = Math.min(pagination.currentPage, totalPages);
	const paginatedApplications = sortedApplications.slice(
		(currentPage - 1) * pagination.perPage,
		currentPage * pagination.perPage,
	);
	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		paginatedApplications.map((application) => application.id),
	);

	const handleSort = (key: SortKey) => {
		let order: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key) {
			order =
				sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}
		setSortConfig({ key: order ? key : null, order });
		setPagination((prev) => ({ ...prev, currentPage: 1 }));
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

	const openStatusDialog = (application: ClubApplicationRecord) => {
		const availableStatuses = getNextStatuses(application.status);
		if (!availableStatuses.length) return;
		setStatusDialogApplication(application);
		setNextStatus(availableStatuses[0] as UpdateApplicationStatusPayload["status"]);
		setStatusNote(application.note || "");
	};

	const applyUpdatedApplication = (updatedApplication: ClubApplicationRecord) => {
		setApplications((prev) =>
			prev.map((application) =>
				application.id === updatedApplication.id ? updatedApplication : application,
			),
		);
	};

	const handleSubmitStatusUpdate = async () => {
		if (!statusDialogApplication) return;
		setIsSubmittingStatus(true);
		try {
			const updatedApplication = await applicationService.updateApplicationStatus(
				statusDialogApplication.id,
				{
					status: nextStatus,
					note: statusNote.trim() ? statusNote.trim() : null,
				},
			);
			applyUpdatedApplication(updatedApplication);
			setStatusDialogApplication(null);
			setStatusNote("");
			toast.success("Đã cập nhật trạng thái đơn ứng tuyển.");
		} catch (error) {
			console.error(error);
			toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
		} finally {
			setIsSubmittingStatus(false);
		}
	};

	return (
		<div className='h-full flex-1 flex-col'>
			<div className='flex items-center p-4 md:p-6 lg:p-8'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>Quản lý đơn ứng tuyển</h2>
					<p className='text-muted-foreground'>
						Đây là danh sách tất cả đơn ứng tuyển trong hệ thống.
					</p>
				</div>
			</div>
			<div className='flex flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0 lg:p-8 lg:pt-0'>
				<div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
					<div className='flex flex-1 items-center gap-2'>
						<Input
							placeholder='Lọc theo ứng viên, email, MSSV, ghi chú...'
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className='h-8 w-full sm:w-64 md:w-72 lg:w-80'
						/>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline' size='sm' className='h-8'>
								<Settings2 className='h-4 w-4' />
								Xem theo trạng thái
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' className='w-[220px]'>
							<DropdownMenuLabel>Trạng thái hồ sơ</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{statusOptions.map((option) => (
								<DropdownMenuItem
									key={option.value}
									onClick={() => {
										setStatusFilter(option.value);
										setPagination((prev) => ({ ...prev, currentPage: 1 }));
									}}
									className={
										statusFilter === option.value ? "bg-muted font-medium" : ""
									}>
									{option.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className='overflow-hidden rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-[50px]'>
									<Checkbox
										aria-label='Select all applications'
										checked={allSelected}
										onCheckedChange={(checked) => toggleAll(checked === true)}
									/>
								</TableHead>
								<TableHead className='w-[120px]'>
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
										onClick={() => handleSort("full_name")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Ứng viên
										{getSortIcon("full_name")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("email")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Email
										{getSortIcon("email")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("student_code")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										MSSV
										{getSortIcon("student_code")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("status")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Trạng thái
										{getSortIcon("status")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("created_at")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Ngày nộp
										{getSortIcon("created_at")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("updated_at")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Cập nhật
										{getSortIcon("updated_at")}
									</Button>
								</TableHead>
								<TableHead className='w-[80px] text-right'>Hành động</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: pagination.perPage }).map((_, index) => (
									<TableRow key={`skeleton-${index}`}>
										<TableCell>
											<Skeleton className='h-4 w-4' />
										</TableCell>
										<TableCell colSpan={8}>
											<Skeleton className='h-4 w-full' />
										</TableCell>
									</TableRow>
								))
							) : paginatedApplications.length > 0 ? (
								paginatedApplications.map((application) => {
									const availableStatuses = getNextStatuses(application.status);
									return (
										<TableRow key={application.id}>
											<TableCell>
												<Checkbox
													aria-label={`Select application ${application.id}`}
													checked={isSelected(application.id)}
													onCheckedChange={(checked) =>
														toggleOne(application.id, checked === true)
													}
												/>
											</TableCell>
											<TableCell className='font-medium'>
												APP-{application.id}
											</TableCell>
											<TableCell>
												<div className='space-y-1'>
													<p className='font-medium'>
														{getApplicantName(application)}
													</p>
													<p className='text-sm text-muted-foreground'>
														{application.applicant?.class_name ||
															"Chưa có lớp"}
													</p>
												</div>
											</TableCell>
											<TableCell>
												{application.applicant?.email || "--"}
											</TableCell>
											<TableCell>
												{application.applicant?.student_code || "--"}
											</TableCell>
											<TableCell>
												{getStatusBadge(application.status)}
											</TableCell>
											<TableCell>
												{formatDate(application.created_at)}
											</TableCell>
											<TableCell>
												{formatDate(application.updated_at)}
											</TableCell>
											<TableCell className='text-right'>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant='ghost'
															className='ml-auto flex h-8 w-8 p-0 data-[state=open]:bg-muted'
															aria-label={`Mở hành động hồ sơ ${application.id}`}>
															<MoreHorizontal className='h-4 w-4' />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align='end'
														className='w-[190px]'>
														<DropdownMenuItem
															onClick={() =>
																navigate(
																	`/requests/${application.id}`,
																)
															}>
															Xem chi tiết
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																openStatusDialog(application)
															}
															disabled={
																availableStatuses.length === 0
															}>
															Cập nhật trạng thái
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})
							) : (
								<TableRow>
									<TableCell colSpan={9} className='h-24 text-center'>
										Không tìm thấy đơn ứng tuyển nào.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						<TableFooter className='bg-transparent'>
							<TableRow>
								<TableCell colSpan={9}>
									<div className='flex items-center justify-between px-2'>
										<div className='flex-1 text-sm text-muted-foreground'>
											{paginatedApplications.length} of{" "}
											{sortedApplications.length} row(s) displayed.
										</div>
										<div className='flex items-center space-x-6 lg:space-x-8'>
											<div className='flex items-center space-x-2'>
												<p className='text-sm font-medium'>Rows per page</p>
												<Select
													value={`${pagination.perPage}`}
													onValueChange={(value) =>
														setPagination({
															currentPage: 1,
															perPage: Number(value),
														})
													}>
													<SelectTrigger className='h-8 w-[70px]'>
														<SelectValue
															placeholder={pagination.perPage}
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
											<div className='flex w-[110px] items-center justify-center text-sm font-medium'>
												Page {currentPage} of {totalPages}
											</div>
											<div className='flex items-center space-x-2'>
												<Button
													variant='outline'
													className='hidden h-8 w-8 p-0 lg:flex'
													onClick={() =>
														setPagination((prev) => ({
															...prev,
															currentPage: 1,
														}))
													}
													disabled={currentPage === 1}>
													<span className='sr-only'>
														Go to first page
													</span>
													<ChevronsLeft className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='h-8 w-8 p-0'
													onClick={() =>
														setPagination((prev) => ({
															...prev,
															currentPage: Math.max(
																1,
																prev.currentPage - 1,
															),
														}))
													}
													disabled={currentPage === 1}>
													<span className='sr-only'>
														Quay lại trang trước
													</span>
													<ChevronLeft className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='h-8 w-8 p-0'
													onClick={() =>
														setPagination((prev) => ({
															...prev,
															currentPage: Math.min(
																totalPages,
																prev.currentPage + 1,
															),
														}))
													}
													disabled={currentPage === totalPages}>
													<span className='sr-only'>
														Đi đến trang tiếp theo
													</span>
													<ChevronRight className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='hidden h-8 w-8 p-0 lg:flex'
													onClick={() =>
														setPagination((prev) => ({
															...prev,
															currentPage: totalPages,
														}))
													}
													disabled={currentPage === totalPages}>
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

			<Dialog
				open={Boolean(statusDialogApplication)}
				onOpenChange={(open) => {
					if (!open) {
						setStatusDialogApplication(null);
						setStatusNote("");
					}
				}}>
				<DialogContent className='sm:max-w-[560px]'>
					{statusDialogApplication ? (
						<>
							<DialogHeader>
								<DialogTitle>Cập nhật trạng thái đơn ứng tuyển</DialogTitle>
							</DialogHeader>
							<div className='space-y-4'>
								<div className='grid gap-2'>
									<p className='text-sm font-medium'>Ứng viên</p>
									<p className='text-sm text-muted-foreground'>
										{getApplicantName(statusDialogApplication)}
									</p>
								</div>
								<div className='grid gap-2'>
									<p className='text-sm font-medium'>Trạng thái hiện tại</p>
									<div>{getStatusBadge(statusDialogApplication.status)}</div>
								</div>
								<div className='grid gap-2'>
									<label className='text-sm font-medium' htmlFor='next-status'>
										Trạng thái tiếp theo
									</label>
									<div className='flex flex-wrap gap-2' id='next-status'>
										{getNextStatuses(statusDialogApplication.status).map(
											(status) => {
												const isActive = nextStatus === status;
												const config = getStatusConfig(status);
												return (
													<Button
														key={status}
														type='button'
														variant='outline'
														onClick={() =>
															setNextStatus(
																status as UpdateApplicationStatusPayload["status"],
															)
														}
														className={
															isActive
																? `${config.className} border-current`
																: ""
														}>
														{config.label}
													</Button>
												);
											},
										)}
									</div>
								</div>
								<div className='grid gap-2'>
									<label
										className='text-sm font-medium'
										htmlFor='application-note'>
										Ghi chú
									</label>
									<Textarea
										id='application-note'
										value={statusNote}
										onChange={(event) => setStatusNote(event.target.value)}
										placeholder='Thêm ghi chú xét duyệt để lưu vào hệ thống'
										maxLength={255}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant='outline'
									onClick={() => setStatusDialogApplication(null)}
									disabled={isSubmittingStatus}>
									Hủy
								</Button>
								<Button
									onClick={handleSubmitStatusUpdate}
									disabled={isSubmittingStatus}>
									{isSubmittingStatus ? "Đang cập nhật..." : "Lưu thay đổi"}
								</Button>
							</DialogFooter>
						</>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default ApplicationRequestsPage;
