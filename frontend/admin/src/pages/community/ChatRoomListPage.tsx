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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import chatService from "@/services/chat.service";

export interface ChatRoomRecord {
	id: number;
	name: string | null;
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

function StatCard({
	label,
	value,
	loading,
	icon: Icon,
	accent,
}: {
	label: string;
	value: number;
	loading: boolean;
	icon: React.ElementType;
	accent: string;
}) {
	return (
		<Card className="border-border/80 shadow-sm">
			<CardContent className="pt-5">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 space-y-1">
						<p className="truncate text-sm text-muted-foreground">{label}</p>
						{loading ? (
							<Skeleton className="h-7 w-14" />
						) : (
							<p className="text-2xl font-bold tabular-nums">{value}</p>
						)}
					</div>
					<div className={cn("shrink-0 rounded-lg p-2.5", accent)}>
						<Icon className="h-5 w-5" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
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

	const [stats, setStats] = useState<ChatRoomStats>({ total: 0, system_events: 0 });
	const [loadingStats, setLoadingStats] = useState(true);
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
	const [isSavingRoom, setIsSavingRoom] = useState(false);
	const [deleteRoomTarget, setDeleteRoomTarget] = useState<ChatRoomRecord | null>(null);
	const [isDeletingRoom, setIsDeletingRoom] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, sortConfig]);

	useEffect(() => {
		setLoadingStats(true);
		chatService.getStats()
			.then((response) => {
				if (response.data) setStats(response.data);
			})
			.catch(() => {})
			.finally(() => setLoadingStats(false));
	}, [reloadToken]);

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

	const openCreateRoom = () => {
		setEditTarget(null);
		setRoomName("");
		setFormOpen(true);
	};

	const openEditRoom = (room: ChatRoomRecord) => {
		setEditTarget(room);
		setRoomName(room.name ?? "");
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
				const response = await chatService.updateRoom(editTarget.id, { name });
				setRooms((prev) => prev.map((room) => room.id === editTarget.id ? { ...room, ...response.data } : room));
				toast.success("Đã cập nhật phòng chat.");
			} else {
				await chatService.createRoom({ name });
				setMeta((prev) => ({ ...prev, current_page: 1 }));
				toast.success("Đã tạo phòng chat.");
			}

			setFormOpen(false);
			setEditTarget(null);
			setRoomName("");
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
				<section className="overflow-hidden rounded-[30px] border border-sky-500/15 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(248,252,255,0.96)_44%,rgba(252,254,255,0.98)_100%)] shadow-sm dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(8,14,18,0.96)_45%,rgba(5,9,12,0.98)_100%)]">
					<div className="px-6 py-7 md:px-8 md:py-9">
						<div className="max-w-3xl space-y-4">
							<Badge className="w-fit rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-800 hover:bg-sky-500/10 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
								Phòng chat
							</Badge>
							<div className="space-y-2">
								<h1 className="text-foreground text-[1.85rem] font-semibold leading-tight md:text-[2.4rem] md:leading-[1.1]">
									Quản lý phòng chat
								</h1>
								<p className="text-sm leading-7 text-sky-950/70 md:text-base dark:text-sky-50/65">
									Quản lý các phòng chat nhóm trong CLB, theo dõi số thành viên, tin nhắn và thời điểm hoạt động gần nhất.
								</p>
							</div>
						</div>
					</div>
				</section>

				<div className="grid gap-4 sm:grid-cols-2">
					<StatCard
						label="Tổng phòng chat"
						value={stats.total}
						loading={loadingStats}
						icon={MessagesSquare}
						accent="bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400"
					/>
					<StatCard
						label="Sự kiện hệ thống"
						value={stats.system_events}
						loading={loadingStats}
						icon={Users}
						accent="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
					/>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center gap-3">
						<Input
							placeholder="Tìm kiếm theo tên phòng..."
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className="h-8 w-full sm:w-64 md:w-80"
						/>
						<Button size="sm" className="ml-auto h-8 gap-1.5" onClick={openCreateRoom}>
							<Plus className="h-4 w-4" />
							Tạo phòng
						</Button>
					</div>

					<div className="overflow-hidden rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
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
											<TableCell colSpan={5}>
												<Skeleton className="h-4 w-full" />
											</TableCell>
										</TableRow>
									))
								) : rooms.length > 0 ? (
									rooms.map((room) => (
										<TableRow key={room.id}>
											<TableCell>
												<div className="flex items-center gap-2.5">
													<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-900/40">
														<Users className="h-4 w-4" />
													</div>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium">{roomDisplayName(room)}</p>
														<p className="text-xs text-muted-foreground">#{room.id}</p>
													</div>
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
										<TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
											Không có phòng chat nào.
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={5}>
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
						<AlertDialogAction
							onClick={handleDeleteRoom}
							disabled={isDeletingRoom}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeletingRoom ? "Đang xóa..." : "Xóa phòng"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default ChatRoomListPage;
