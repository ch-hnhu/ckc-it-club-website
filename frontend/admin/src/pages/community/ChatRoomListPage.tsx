import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	MessagesSquare,
	MoreHorizontal,
	Pencil,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import chatService from "@/services/chat.service";

export interface ChatRoomRecord {
	id: number;
	name: string | null;
	image: string | null;
	member_count: number;
	message_count: number;
	last_message_at: string | null;
	created_at: string;
}

export interface ChatRoomStats {
	total: number;
	system_events: number;
}

export interface ChatSystemMessageRecord {
	id: number;
	event_type: string | null;
	content: string | null;
	created_at: string;
	creator: {
		id: number;
		full_name: string;
		email: string;
		avatar: string | null;
	} | null;
}

type RoomSortKey = "id" | "name" | "member_count" | "message_count" | "last_message_at" | "created_at";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatDate(value: string | null | undefined) {
	if (!value) return "--";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "--" : dateFormatter.format(date);
}

function PaginationFooter({
	meta,
	onPageChange,
	onPerPageChange,
	label,
}: {
	meta: { current_page: number; last_page: number; per_page: number; total: number };
	onPageChange: (page: number) => void;
	onPerPageChange: (perPage: number) => void;
	label: string;
}) {
	return (
		<div className="flex items-center justify-between px-2">
			<p className="flex-1 text-sm text-muted-foreground">
				Tổng {meta.total} {label}.
			</p>
			<div className="flex items-center space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">Rows per page</p>
					<Select value={`${meta.per_page}`} onValueChange={(value) => onPerPageChange(Number(value))}>
						<SelectTrigger className="h-8 w-[70px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 25, 50].map((size) => (
								<SelectItem key={size} value={`${size}`}>{size}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[110px] items-center justify-center text-sm font-medium">
					Trang {meta.current_page} / {meta.last_page}
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => onPageChange(1)}
						disabled={meta.current_page === 1}
					>
						<ChevronsLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={() => onPageChange(Math.max(1, meta.current_page - 1))}
						disabled={meta.current_page === 1}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={() => onPageChange(Math.min(meta.last_page, meta.current_page + 1))}
						disabled={meta.current_page === meta.last_page}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => onPageChange(meta.last_page)}
						disabled={meta.current_page === meta.last_page}
					>
						<ChevronsRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function ChatRoomListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Phòng chat" }]);

	const [rooms, setRooms] = useState<ChatRoomRecord[]>([]);
	const [loadingRooms, setLoadingRooms] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sortConfig, setSortConfig] = useState<{ key: RoomSortKey | null; order: "asc" | "desc" | null }>({
		key: "last_message_at",
		order: "desc",
	});
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
	const [reloadToken, setReloadToken] = useState(0);

	const [formOpen, setFormOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<ChatRoomRecord | null>(null);
	const [roomName, setRoomName] = useState("");
	const [roomImage, setRoomImage] = useState<File | null>(null);
	const [roomImagePreview, setRoomImagePreview] = useState("");
	const [isSavingRoom, setIsSavingRoom] = useState(false);
	const [deleteRoomTarget, setDeleteRoomTarget] = useState<ChatRoomRecord | null>(null);
	const [isDeletingRoom, setIsDeletingRoom] = useState(false);

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(rooms.map((r) => r.id));

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, sortConfig]);

	useEffect(() => {
		let cancelled = false;
		setLoadingRooms(true);

		chatService.getRooms({
			page: meta.current_page,
			per_page: meta.per_page,
			search: debouncedSearch || undefined,
			sort: sortConfig.key ?? undefined,
			order: sortConfig.order ?? undefined,
		})
			.then((response) => {
				if (cancelled) return;
				setRooms(response.data ?? []);
				if (response.meta) {
					setMeta((prev) => ({
						...prev,
						last_page: response.meta.last_page,
						total: response.meta.total,
					}));
				}
			})
			.catch(() => {
				if (!cancelled) toast.error("Không thể tải danh sách phòng chat.");
			})
			.finally(() => {
				if (!cancelled) setLoadingRooms(false);
			});

		return () => {
			cancelled = true;
		};
	}, [meta.current_page, meta.per_page, debouncedSearch, sortConfig, reloadToken]);

	const handleSort = (key: RoomSortKey) => {
		let order: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key) {
			order = sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}
		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: RoomSortKey) =>
		sortConfig.key !== key ? <ArrowUpDown className="ml-2 h-4 w-4" /> :
		sortConfig.order === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> :
		sortConfig.order === "desc" ? <ArrowDown className="ml-2 h-4 w-4" /> :
		<ArrowUpDown className="ml-2 h-4 w-4" />;

	const roomDisplayName = (room: ChatRoomRecord) => room.name ?? `Phòng #${room.id}`;

	const handleImageChange = (file: File | null) => {
		if (!file) {
			setRoomImage(null);
			setRoomImagePreview(editTarget?.image ?? "");
			return;
		}
		if (!file.type.startsWith("image/")) {
			toast.error("Vui lòng chọn file ảnh hợp lệ.");
			return;
		}
		setRoomImage(file);
		setRoomImagePreview(URL.createObjectURL(file));
	};

	const openCreateRoom = () => {
		setEditTarget(null);
		setRoomName("");
		setRoomImage(null);
		setRoomImagePreview("");
		setFormOpen(true);
	};

	const openEditRoom = (room: ChatRoomRecord) => {
		setEditTarget(room);
		setRoomName(room.name ?? "");
		setRoomImage(null);
		setRoomImagePreview(room.image ?? "");
		setFormOpen(true);
	};

	const handleSaveRoom = async () => {
		const name = roomName.trim();
		if (name.length < 2) {
			toast.error("Tên phòng chat phải có ít nhất 2 ký tự.");
			return;
		}

		setIsSavingRoom(true);
		try {
			if (editTarget) {
				const response = await chatService.updateRoom(editTarget.id, { name, image: roomImage });
				setRooms((prev) => prev.map((room) => room.id === editTarget.id ? { ...room, ...response.data } : room));
				toast.success("Đã cập nhật phòng chat.");
			} else {
				await chatService.createRoom({ name, image: roomImage });
				setMeta((prev) => ({ ...prev, current_page: 1 }));
				toast.success("Đã tạo phòng chat.");
			}

			setFormOpen(false);
			setEditTarget(null);
			setRoomName("");
			setRoomImage(null);
			setRoomImagePreview("");
			setReloadToken((token) => token + 1);
		} catch {
			toast.error(editTarget ? "Không thể cập nhật phòng chat." : "Không thể tạo phòng chat.");
		} finally {
			setIsSavingRoom(false);
		}
	};

	const handleDeleteRoom = async () => {
		if (!deleteRoomTarget) return;
		setIsDeletingRoom(true);
		try {
			await chatService.deleteRoom(deleteRoomTarget.id);
			toast.success("Đã xóa phòng chat.");
			setDeleteRoomTarget(null);
			setReloadToken((token) => token + 1);
		} catch {
			toast.error("Không thể xóa phòng chat.");
		} finally {
			setIsDeletingRoom(false);
		}
	};

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">
				{/* Header */}
				<div className="space-y-2">
					<h2 className="text-2xl font-semibold tracking-tight">
						Quản lý phòng chat
					</h2>
					<p className="text-muted-foreground">
						Quản lý các phòng chat nhóm trong CLB, theo dõi số thành viên, tin nhắn và thời điểm hoạt động gần nhất.
					</p>
				</div>

<div className="flex flex-col gap-4">
					<div className="flex flex-row items-center gap-3">
						<Input
							placeholder="Tìm kiếm theo tên phòng..."
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className="h-8 min-w-0 flex-1 max-w-80"
						/>
						<Button size="sm" className="ml-auto h-8 shrink-0 gap-1.5" onClick={openCreateRoom}>
							<Plus className="h-4 w-4" />
							Tạo phòng
						</Button>
					</div>

					<div className="overflow-hidden rounded-md border">
						<Table>
							<TableHeader>
							<TableRow>
								<TableHead className="w-[44px]">
									<Checkbox
										aria-label="Chọn tất cả"
										checked={allSelected}
										onCheckedChange={(c) => toggleAll(c === true)}
									/>
								</TableHead>
								<TableHead className="min-w-[200px]">
										<Button variant="ghost" onClick={() => handleSort("name")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Tên phòng {getSortIcon("name")}
										</Button>
									</TableHead>
									<TableHead className="w-[120px]">
										<Button variant="ghost" onClick={() => handleSort("member_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Thành viên {getSortIcon("member_count")}
										</Button>
									</TableHead>
									<TableHead className="w-[120px]">
										<Button variant="ghost" onClick={() => handleSort("message_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Tin nhắn {getSortIcon("message_count")}
										</Button>
									</TableHead>
									<TableHead className="w-[170px]">
										<Button variant="ghost" onClick={() => handleSort("last_message_at")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Hoạt động cuối {getSortIcon("last_message_at")}
										</Button>
									</TableHead>
									<TableHead className="w-[56px]" />
								</TableRow>
							</TableHeader>

							<TableBody>
								{loadingRooms ? (
									Array.from({ length: 6 }).map((_, index) => (
										<TableRow key={index}>
											<TableCell colSpan={6}>
												<Skeleton className="h-4 w-full" />
											</TableCell>
										</TableRow>
									))
								) : rooms.length > 0 ? (
									rooms.map((room) => (
										<TableRow key={room.id}>
											<TableCell>
												<Checkbox
													checked={isSelected(room.id)}
													onCheckedChange={(c) => toggleOne(room.id, c === true)}
												/>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-8 w-8">
														<AvatarImage src={room.image ?? undefined} alt={roomDisplayName(room)} />
														<AvatarFallback className="bg-violet-500/10 text-sm font-semibold text-violet-600 dark:text-violet-400">
															{roomDisplayName(room).charAt(0).toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<span className="font-medium">{roomDisplayName(room)}</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
													<Users className="h-3.5 w-3.5" />
													{room.member_count}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
													<MessagesSquare className="h-3.5 w-3.5" />
													{room.message_count}
												</div>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{formatDate(room.last_message_at)}
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
															<MoreHorizontal className="h-4 w-4" />
															<span className="sr-only">Mở menu</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-40 p-1">
														<DropdownMenuItem className="gap-2 px-2 py-2 text-sm" onClick={() => openEditRoom(room)}>
															<Pencil className="h-4 w-4" />
															Sửa phòng
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															variant="destructive"
															className="gap-2 px-2 py-2 text-sm"
															onClick={() => setDeleteRoomTarget(room)}
														>
															<Trash2 className="h-4 w-4" />
															Xóa phòng
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
											Không có phòng chat nào.
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={6}>
										<PaginationFooter
											meta={meta}
											onPageChange={(page) => setMeta((prev) => ({ ...prev, current_page: page }))}
											onPerPageChange={(perPage) => setMeta((prev) => ({ ...prev, per_page: perPage, current_page: 1 }))}
											label="phòng chat"
										/>
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</div>
				</div>
			</div>

			<Dialog open={formOpen} onOpenChange={(open) => {
				if (!open && !isSavingRoom) {
					setFormOpen(false);
					setEditTarget(null);
					setRoomName("");
				}
			}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{editTarget ? "Cập nhật phòng chat" : "Tạo phòng chat"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="chat-room-name">Tên phòng</Label>
							<Input
								id="chat-room-name"
								value={roomName}
								onChange={(event) => setRoomName(event.target.value)}
								placeholder="Nhập tên phòng chat"
								maxLength={50}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										void handleSaveRoom();
									}
								}}
							/>
							<p className="text-xs text-muted-foreground">
								Tên phòng chat phải rõ ràng và không trùng với phòng đang có.
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="chat-room-image">Ảnh đại diện</Label>
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10 shrink-0">
									<AvatarImage src={roomImagePreview || undefined} alt="preview" />
									<AvatarFallback className="bg-violet-500/10 text-sm font-semibold text-violet-600 dark:text-violet-400">
										{roomName.charAt(0).toUpperCase() || <Users className="h-4 w-4" />}
									</AvatarFallback>
								</Avatar>
								<Input
									id="chat-room-image"
									type="file"
									accept="image/*"
									onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
								/>
							</div>
							<p className="text-xs text-muted-foreground">Chọn file JPG, PNG, WEBP hoặc GIF. Tối đa 2MB.</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setFormOpen(false)}
							disabled={isSavingRoom}
						>
							Hủy
						</Button>
						<Button type="button" onClick={handleSaveRoom} disabled={isSavingRoom}>
							{isSavingRoom ? "Đang lưu..." : editTarget ? "Cập nhật" : "Tạo phòng"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!deleteRoomTarget} onOpenChange={(open) => !open && setDeleteRoomTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xác nhận xóa phòng chat</AlertDialogTitle>
						<AlertDialogDescription>
							Phòng "{deleteRoomTarget ? roomDisplayName(deleteRoomTarget) : ""}" sẽ bị xóa cùng toàn bộ thành viên và tin nhắn liên quan. Hành động không thể hoàn tác.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeletingRoom}>Hủy</AlertDialogCancel>
						<AlertDialogAction asChild>
							<Button variant="destructive" onClick={handleDeleteRoom} disabled={isDeletingRoom}>
								{isDeletingRoom ? "Đang xóa..." : "Xóa phòng"}
							</Button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default ChatRoomListPage;
