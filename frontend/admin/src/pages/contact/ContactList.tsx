import { useEffect, useMemo, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Clock3,
	LoaderCircle,
	MailOpen,
	MoreHorizontal,
	Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getBreadcrumbsFromNavigation } from "@/config/navigation";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import contactService from "@/services/contact.service";
import type { ContactRecord, ContactStatus } from "@/types/contact.type";

const statusOptions: Array<{ value: ContactStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "pending", label: "Mới nhận" },
	{ value: "processing", label: "Đang xử lý" },
	{ value: "done", label: "Đã phản hồi" },
];

const updateStatusOptions: Array<{ value: ContactStatus; label: string }> = [
	{ value: "pending", label: "Mới nhận" },
	{ value: "processing", label: "Đang xử lý" },
	{ value: "done", label: "Đã phản hồi" },
];

type SortKey = "id" | "full_name" | "email" | "subject" | "status" | "created_at";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatDate(value: string | null) {
	if (!value) return "--";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "--";

	return dateFormatter.format(date);
}

function getStatusLabel(status: ContactStatus) {
	switch (status) {
		case "pending":
			return "Mới nhận";
		case "processing":
			return "Đang xử lý";
		case "done":
			return "Đã phản hồi";
	}
}

function getStatusBadge(status: ContactStatus) {
	const className =
		status === "pending"
			? "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10"
			: status === "processing"
				? "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10"
				: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10";

	return (
		<Badge variant='outline' className={`rounded-full px-3 py-1 ${className}`}>
			{getStatusLabel(status)}
		</Badge>
	);
}

function ContactList() {
	const breadcrumb = useMemo(() => getBreadcrumbsFromNavigation("/contacts"), []);

	useBreadcrumb(breadcrumb);

	const [contacts, setContacts] = useState<ContactRecord[]>([]);
	const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
	const [statusDialogContact, setStatusDialogContact] = useState<ContactRecord | null>(null);
	const [nextStatus, setNextStatus] = useState<ContactStatus>("processing");
	const [loading, setLoading] = useState(true);
	const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<ContactStatus | "all">("all");
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

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		contacts.map((contact) => contact.id),
	);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search.trim());
		}, 400);

		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, sortConfig, statusFilter]);

	useEffect(() => {
		let cancelled = false;

		const fetchContacts = async () => {
			setLoading(true);
			try {
				const response = await contactService.getContacts({
					page: meta.current_page,
					per_page: meta.per_page,
					search: debouncedSearch || undefined,
					status: statusFilter === "all" ? undefined : statusFilter,
					sort: sortConfig.key || undefined,
					order: sortConfig.order || undefined,
				});

				if (cancelled) return;

				setContacts(response.data);
				setMeta({
					current_page: response.meta.current_page,
					last_page: response.meta.last_page,
					per_page: response.meta.per_page,
					total: response.meta.total,
				});
			} catch (error) {
				if (!cancelled) {
					console.error(error);
					toast.error("Không thể tải danh sách liên hệ.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void fetchContacts();

		return () => {
			cancelled = true;
		};
	}, [debouncedSearch, meta.current_page, meta.per_page, sortConfig, statusFilter]);

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

	const openStatusDialog = (contact: ContactRecord) => {
		setStatusDialogContact(contact);
		setNextStatus(contact.status);
	};

	const handleStatusUpdate = async () => {
		if (!statusDialogContact) return;

		setIsSubmittingStatus(true);
		try {
			const updatedContact = await contactService.updateStatus(statusDialogContact.id, {
				status: nextStatus,
			});

			setContacts((prev) =>
				prev.map((contact) => (contact.id === updatedContact.id ? updatedContact : contact)),
			);
			setSelectedContact((prev) => (prev?.id === updatedContact.id ? updatedContact : prev));
			setStatusDialogContact(null);
			toast.success("Đã cập nhật trạng thái liên hệ.");
		} catch (error) {
			console.error(error);
			toast.error("Không thể cập nhật trạng thái liên hệ.");
		} finally {
			setIsSubmittingStatus(false);
		}
	};

	const pendingCount = contacts.filter((contact) => contact.status === "pending").length;
	const processingCount = contacts.filter((contact) => contact.status === "processing").length;
	const doneCount = contacts.filter((contact) => contact.status === "done").length;

	return (
		<div className='h-full flex-1 flex-col'>
			<div className='flex items-center p-4 md:p-6 lg:p-8'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>Quản lý liên hệ</h2>
					<p className='text-muted-foreground'>
						Theo dõi các yêu cầu liên hệ gửi từ website và cập nhật trạng thái xử lý.
					</p>
				</div>
			</div>

			<div className='flex flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0 lg:p-8 lg:pt-0'>
				{/* <div className='grid gap-4 md:grid-cols-3'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Tổng liên hệ</CardTitle>
							<MailOpen className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-semibold'>{meta.total}</div>
							<p className='text-sm text-muted-foreground'>Theo bộ lọc hiện tại.</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Đang hiển thị</CardTitle>
							<Clock3 className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-semibold'>{contacts.length}</div>
							<p className='text-sm text-muted-foreground'>
								{pendingCount} mới, {processingCount} đang xử lý, {doneCount} đã phản hồi.
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>Trang hiện tại</CardTitle>
							<LoaderCircle className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-semibold'>
								{meta.current_page}/{meta.last_page}
							</div>
							<p className='text-sm text-muted-foreground'>
								{loading ? "Đang tải dữ liệu..." : "Dữ liệu được đọc trực tiếp từ API."}
							</p>
						</CardContent>
					</Card>
				</div> */}

				<div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
					<div className='flex flex-1 items-center gap-2'>
						<Input
							placeholder='Lọc theo tên, email, chủ đề hoặc nội dung...'
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className='h-8 w-full sm:w-64 md:w-72 lg:w-80'
						/>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline' size='sm' className='h-8'>
								<Settings2 className='h-4 w-4' />
								Lọc theo trạng thái
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' className='w-[220px]'>
							<DropdownMenuLabel>Trạng thái liên hệ</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{statusOptions.map((option) => (
								<DropdownMenuItem
									key={option.value}
									onClick={() => setStatusFilter(option.value)}
									className={statusFilter === option.value ? "bg-muted font-medium" : ""}>
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
										aria-label='Select all contacts'
										checked={allSelected}
										onCheckedChange={(checked) => toggleAll(checked === true)}
									/>
								</TableHead>
								<TableHead className='w-[110px]'>
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
										Người gửi
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
										onClick={() => handleSort("subject")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Chủ đề
										{getSortIcon("subject")}
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
										Thời gian gửi
										{getSortIcon("created_at")}
									</Button>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: meta.per_page }).map((_, index) => (
									<TableRow key={`contact-skeleton-${index}`}>
										<TableCell>
											<Skeleton className='h-4 w-4' />
										</TableCell>
										<TableCell colSpan={7}>
											<Skeleton className='h-4 w-full' />
										</TableCell>
									</TableRow>
								))
							) : contacts.length > 0 ? (
								contacts.map((contact) => (
									<TableRow key={contact.id}>
										<TableCell>
											<Checkbox
												aria-label={`Select contact ${contact.id}`}
												checked={isSelected(contact.id)}
												onCheckedChange={(checked) =>
													toggleOne(contact.id, checked === true)
												}
											/>
										</TableCell>
										<TableCell className='font-medium'>CT-{contact.id}</TableCell>
										<TableCell>
											<div className='space-y-1'>
												<p className='font-medium'>
													{contact.full_name || "Ẩn danh"}
												</p>
												<p className='line-clamp-1 text-sm text-muted-foreground'>
													{contact.message}
												</p>
											</div>
										</TableCell>
										<TableCell>{contact.email}</TableCell>
										<TableCell>{contact.subject || "--"}</TableCell>
										<TableCell>{getStatusBadge(contact.status)}</TableCell>
										<TableCell>{formatDate(contact.created_at)}</TableCell>
										<TableCell className='text-right'>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant='ghost'
														className='ml-auto flex h-8 w-8 p-0 data-[state=open]:bg-muted'
														aria-label={`Mở hành động liên hệ ${contact.id}`}>
														<MoreHorizontal className='h-4 w-4' />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end' className='w-[200px]'>
													<DropdownMenuItem
														onClick={() => setSelectedContact(contact)}>
														Xem chi tiết
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => openStatusDialog(contact)}>
														Cập nhật trạng thái
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={8} className='h-24 text-center'>
										Không tìm thấy liên hệ nào phù hợp.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						<TableFooter className='bg-transparent'>
							<TableRow>
								<TableCell colSpan={8}>
									<div className='flex items-center justify-between px-2'>
										<div className='flex-1 text-sm text-muted-foreground'>
											Đang hiển thị {contacts.length} trên tổng {meta.total} liên hệ.
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
														<SelectValue placeholder={meta.per_page} />
													</SelectTrigger>
													<SelectContent side='top'>
														{[10, 20, 25, 30, 40, 50].map((pageSize) => (
															<SelectItem
																key={pageSize}
																value={`${pageSize}`}>
																{pageSize}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className='flex w-[110px] items-center justify-center text-sm font-medium'>
												Page {meta.current_page} of {meta.last_page}
											</div>
											<div className='flex items-center space-x-2'>
												<Button
													variant='outline'
													className='hidden h-8 w-8 p-0 lg:flex'
													onClick={() =>
														setMeta((prev) => ({ ...prev, current_page: 1 }))
													}
													disabled={meta.current_page === 1}>
													<span className='sr-only'>Go to first page</span>
													<ChevronsLeft className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='h-8 w-8 p-0'
													onClick={() =>
														setMeta((prev) => ({
															...prev,
															current_page: Math.max(
																1,
																prev.current_page - 1,
															),
														}))
													}
													disabled={meta.current_page === 1}>
													<span className='sr-only'>Quay lại trang trước</span>
													<ChevronLeft className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='h-8 w-8 p-0'
													onClick={() =>
														setMeta((prev) => ({
															...prev,
															current_page: Math.min(
																prev.last_page,
																prev.current_page + 1,
															),
														}))
													}
													disabled={meta.current_page === meta.last_page}>
													<span className='sr-only'>Đi đến trang tiếp theo</span>
													<ChevronRight className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='hidden h-8 w-8 p-0 lg:flex'
													onClick={() =>
														setMeta((prev) => ({
															...prev,
															current_page: prev.last_page,
														}))
													}
													disabled={meta.current_page === meta.last_page}>
													<span className='sr-only'>Đi đến trang cuối</span>
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

			<Dialog open={Boolean(selectedContact)} onOpenChange={(open) => !open && setSelectedContact(null)}>
				<DialogContent className='sm:max-w-[640px]'>
					{selectedContact ? (
						<>
							<DialogHeader>
								<DialogTitle>Chi tiết liên hệ #{selectedContact.id}</DialogTitle>
							</DialogHeader>
							<div className='grid gap-4'>
								<div className='grid gap-2 sm:grid-cols-2'>
									<div className='space-y-1'>
										<p className='text-sm font-medium'>Người gửi</p>
										<p className='text-sm text-muted-foreground'>
											{selectedContact.full_name || "Ẩn danh"}
										</p>
									</div>
									<div className='space-y-1'>
										<p className='text-sm font-medium'>Email</p>
										<p className='text-sm text-muted-foreground'>
											{selectedContact.email}
										</p>
									</div>
								</div>
								<div className='grid gap-2 sm:grid-cols-2'>
									<div className='space-y-1'>
										<p className='text-sm font-medium'>Chủ đề</p>
										<p className='text-sm text-muted-foreground'>
											{selectedContact.subject || "--"}
										</p>
									</div>
									<div className='space-y-1'>
										<p className='text-sm font-medium'>Trạng thái</p>
										<div>{getStatusBadge(selectedContact.status)}</div>
									</div>
								</div>
								<div className='space-y-1'>
									<p className='text-sm font-medium'>Thời gian gửi</p>
									<p className='text-sm text-muted-foreground'>
										{formatDate(selectedContact.created_at)}
									</p>
								</div>
								<div className='space-y-2'>
									<p className='text-sm font-medium'>Nội dung</p>
									<div className='max-h-[280px] overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm leading-6 whitespace-pre-wrap'>
										{selectedContact.message}
									</div>
								</div>
							</div>
							<DialogFooter>
								<Button variant='outline' onClick={() => setSelectedContact(null)}>
									Đóng
								</Button>
								<Button
									onClick={() => {
										setSelectedContact(null);
										openStatusDialog(selectedContact);
									}}>
									Cập nhật trạng thái
								</Button>
							</DialogFooter>
						</>
					) : null}
				</DialogContent>
			</Dialog>

			<Dialog
				open={Boolean(statusDialogContact)}
				onOpenChange={(open) => !open && setStatusDialogContact(null)}>
				<DialogContent className='sm:max-w-[520px]'>
					{statusDialogContact ? (
						<>
							<DialogHeader>
								<DialogTitle>Cập nhật trạng thái liên hệ</DialogTitle>
							</DialogHeader>
							<div className='space-y-4'>
								<div className='space-y-1'>
									<p className='text-sm font-medium'>Người gửi</p>
									<p className='text-sm text-muted-foreground'>
										{statusDialogContact.full_name || "Ẩn danh"} -{" "}
										{statusDialogContact.email}
									</p>
								</div>
								<div className='space-y-1'>
									<p className='text-sm font-medium'>Trạng thái hiện tại</p>
									<div>{getStatusBadge(statusDialogContact.status)}</div>
								</div>
								<div className='space-y-2'>
									<label className='text-sm font-medium' htmlFor='contact-status'>
										Trạng thái mới
									</label>
									<Select
										value={nextStatus}
										onValueChange={(value) => setNextStatus(value as ContactStatus)}>
										<SelectTrigger id='contact-status'>
											<SelectValue placeholder='Chọn trạng thái' />
										</SelectTrigger>
										<SelectContent>
											{updateStatusOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant='outline'
									onClick={() => setStatusDialogContact(null)}
									disabled={isSubmittingStatus}>
									Hủy
								</Button>
								<Button
									onClick={handleStatusUpdate}
									disabled={
										isSubmittingStatus || nextStatus === statusDialogContact.status
									}>
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

export default ContactList;
