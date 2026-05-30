import React, { useEffect, useRef, useState } from "react";
import { Hash, Loader2, Lock, MessageSquare, Plus, Send, Users, X } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { CommunityLayoutContext } from "./CommunityLayout";
import { chatService } from "@/services/chat.service";
import type { ChatMessage, ChatRoom } from "@/types/chat.types";
import { buildAvatar, formatRelativeTime, getHandle } from "@/lib/utils";
import echo from "@/config/echo";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_COLORS = [
	"bg-[var(--color-pastel-green)]",
	"bg-[var(--color-pastel-blue)]",
	"bg-[var(--color-pastel-yellow)]",
	"bg-[var(--color-pastel-pink)]",
	"bg-[var(--color-pastel-purple)]",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRoomColor = (index: number) => ROOM_COLORS[index % ROOM_COLORS.length];

interface MessageGroup {
	senderId: number | null;
	senderName: string;
	senderAvatar: string;
	senderHandle: string;
	firstTime: string;
	messages: ChatMessage[];
}

const groupMessages = (messages: ChatMessage[]): MessageGroup[] => {
	const groups: MessageGroup[] = [];
	for (const msg of messages) {
		const sender = msg.created_by;
		const last = groups[groups.length - 1];
		if (last && last.senderId === (sender?.id ?? null)) {
			last.messages.push(msg);
		} else {
			groups.push({
				senderId: sender?.id ?? null,
				senderName: sender?.full_name ?? "Thành viên",
				senderAvatar: buildAvatar(sender?.full_name, sender?.avatar),
				senderHandle: sender ? getHandle(sender.username, sender.email) : "",
				firstTime: msg.created_at,
				messages: [msg],
			});
		}
	}
	return groups;
};

// ─── Skeletons ────────────────────────────────────────────────────────────────

const RoomSkeleton: React.FC = () => (
	<div className='space-y-1 p-2'>
		{Array.from({ length: 5 }).map((_, i) => (
			<div key={i} className='flex animate-pulse items-center gap-3 rounded-xl px-3 py-2.5'>
				<div className='h-8 w-8 shrink-0 rounded-lg bg-gray-200' />
				<div className='flex-1 space-y-1.5'>
					<div className='h-3 w-3/4 rounded bg-gray-200' />
					<div className='h-2.5 w-1/3 rounded bg-gray-200' />
				</div>
			</div>
		))}
	</div>
);

const MessageGroupSkeleton: React.FC = () => (
	<div className='flex animate-pulse gap-3 px-5 py-2'>
		<div className='h-9 w-9 shrink-0 rounded-full bg-gray-200' />
		<div className='flex-1 space-y-2 pt-0.5'>
			<div className='flex items-center gap-2'>
				<div className='h-3 w-24 rounded bg-gray-200' />
				<div className='h-2.5 w-16 rounded bg-gray-200' />
			</div>
			<div className='h-3.5 w-2/3 rounded bg-gray-200' />
			<div className='h-3.5 w-1/2 rounded bg-gray-200' />
		</div>
	</div>
);

// ─── RoomItem ─────────────────────────────────────────────────────────────────

const RoomItem: React.FC<{
	room: ChatRoom;
	index: number;
	active: boolean;
	onClick: () => void;
}> = ({ room, index, active, onClick }) => (
	<button
		onClick={onClick}
		className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-150 ${
			active
				? "border-black bg-[var(--color-primary)] shadow-[2px_2px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
				: "border-transparent text-gray-700 hover:bg-gray-50"
		}`}>
		{/* Color badge */}
		<div
			className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-black ${getRoomColor(index)}`}>
			<Hash className='h-3.5 w-3.5 text-black' />
		</div>
		<div className='min-w-0 flex-1'>
			<p className={`truncate text-[13px] font-extrabold ${active ? "text-black" : "text-gray-800"}`}>
				{room.name}
			</p>
			<p className={`mt-0.5 text-[11px] font-medium ${active ? "text-black/60" : "text-gray-400"}`}>
				{room.member_count} thành viên
			</p>
		</div>
	</button>
);

// ─── MessageGroupItem ─────────────────────────────────────────────────────────

const MessageGroupItem: React.FC<{
	group: MessageGroup;
	isOwn: boolean;
}> = ({ group, isOwn }) => (
	<div className={`flex gap-3 px-5 py-1.5 transition-colors hover:bg-black/[0.02] ${isOwn ? "" : ""}`}>
		<div className='shrink-0 pt-0.5'>
			<img
				src={group.senderAvatar}
				alt={group.senderName}
				className='h-9 w-9 rounded-full border-2 border-black object-cover'
			/>
		</div>
		<div className='min-w-0 flex-1'>
			{/* Sender header */}
			<div className='mb-1 flex flex-wrap items-baseline gap-x-2'>
				<span className={`text-sm font-extrabold ${isOwn ? "text-[var(--color-text-primary)]" : "text-black"}`}>
					{isOwn ? "Bạn" : group.senderName}
				</span>
				{group.senderHandle && (
					<span className='text-[11px] text-gray-400'>{group.senderHandle}</span>
				)}
				<span className='text-[11px] text-gray-400'>{formatRelativeTime(group.firstTime)}</span>
			</div>

			{/* Messages */}
			<div className='space-y-1'>
				{group.messages.map((msg) => (
					<div key={msg.id}>
						{msg.reply_to && (
							<div className='mb-1.5 flex items-start gap-2 rounded-lg border-l-[3px] border-[var(--color-primary)] bg-gray-50 px-3 py-1.5 text-xs text-gray-500'>
								<div className='min-w-0'>
									<span className='font-bold text-gray-700'>{msg.reply_to.full_name} </span>
									<span className='line-clamp-1'>{msg.reply_to.content}</span>
								</div>
							</div>
						)}
						<p className='text-sm leading-relaxed text-gray-800'>{msg.content}</p>
					</div>
				))}
			</div>
		</div>
	</div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────

const EmptyChat: React.FC<{ roomName: string }> = ({ roomName }) => (
	<div className='flex h-full flex-col items-center justify-center gap-3 px-6 text-center'>
		<div className='flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-black bg-[var(--color-pastel-green)] shadow-[3px_3px_0_#111]'>
			<Hash className='h-7 w-7 text-black' />
		</div>
		<p className='font-heading text-lg font-extrabold text-black'>Chào mừng đến #{roomName}</p>
		<p className='max-w-xs text-sm text-gray-500'>
			Đây là khởi đầu của kênh này. Hãy là người đầu tiên nhắn tin!
		</p>
	</div>
);

const GuestWall: React.FC = () => (
	<div className='flex h-full flex-col items-center justify-center gap-5 px-6 text-center'>
		<div className='flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-black bg-[var(--color-pastel-blue)] shadow-[3px_3px_0_#111]'>
			<Lock className='h-7 w-7 text-black' />
		</div>
		<div>
			<p className='font-heading text-xl font-extrabold text-black'>Đăng nhập để chat</p>
			<p className='mt-1 text-sm text-gray-500'>Kết nối cùng các thành viên CKC IT Club.</p>
		</div>
		<Link
			to='/login'
			className='inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-6 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
			Đăng nhập
		</Link>
	</div>
);

// ─── CreateRoomModal ──────────────────────────────────────────────────────────

const CreateRoomModal: React.FC<{
	onClose: () => void;
	onCreate: (room: ChatRoom) => void;
}> = ({ onClose, onCreate }) => {
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setTimeout(() => inputRef.current?.focus(), 50);
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed || loading) return;
		setLoading(true);
		setError(null);
		try {
			const res = await chatService.createRoom(trimmed);
			if (res.data?.id) {
				onCreate(res.data);
				onClose();
			} else {
				setError("Không thể tạo phòng. Vui lòng thử lại.");
			}
		} catch (err: unknown) {
			const msg =
				(err as { response?: { data?: { message?: string } } })?.response?.data?.message;
			setError(msg ?? "Không thể tạo phòng. Vui lòng thử lại.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
			{/* Backdrop */}
			<div
				className='absolute inset-0 bg-black/40'
				onClick={onClose}
			/>

			{/* Modal */}
			<div className='relative w-full max-w-sm rounded-2xl border-2 border-black bg-white p-6 shadow-[6px_6px_0_#111]'>
				{/* Header */}
				<div className='mb-5 flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<div className='flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-[var(--color-primary)] shadow-[2px_2px_0_#111]'>
							<Hash className='h-4 w-4 text-black' />
						</div>
						<h2 className='font-heading text-lg font-extrabold text-black'>
							Tạo phòng chat
						</h2>
					</div>
					<button
						onClick={onClose}
						className='inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-transparent transition hover:border-black hover:bg-gray-100'>
						<X className='h-4 w-4' />
					</button>
				</div>

				<form onSubmit={(e) => void handleSubmit(e)} className='space-y-4'>
					<div>
						<label className='mb-1.5 block text-xs font-extrabold uppercase tracking-widest text-gray-500'>
							Tên phòng
						</label>
						<div className='relative'>
							<span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
								<Hash className='h-4 w-4' />
							</span>
							<input
								ref={inputRef}
								type='text'
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									setError(null);
								}}
								placeholder='vd: python-tips, web-dev...'
								maxLength={50}
								className='w-full rounded-xl border-2 border-black py-2.5 pl-9 pr-4 text-sm font-medium text-black outline-none transition placeholder:text-gray-400 focus:shadow-[0_0_0_3px_#A3E635]'
							/>
						</div>
						{error && (
							<p className='mt-1.5 text-xs font-semibold text-red-500'>{error}</p>
						)}
						<p className='mt-1 text-right text-[10px] text-gray-400'>{name.trim().length}/50</p>
					</div>

					<div className='flex gap-2 pt-1'>
						<button
							type='button'
							onClick={onClose}
							className='flex-1 rounded-xl border-2 border-black bg-white py-2.5 font-heading text-sm font-extrabold text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Hủy
						</button>
						<button
							type='submit'
							disabled={!name.trim() || loading}
							className='flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] py-2.5 font-heading text-sm font-extrabold text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50'>
							{loading ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								<Plus className='h-4 w-4' />
							)}
							{loading ? "Đang tạo..." : "Tạo phòng"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// ─── CommunityChatPage ────────────────────────────────────────────────────────

const CommunityChatPage: React.FC = () => {
	const { user } = useOutletContext<CommunityLayoutContext>();

	const [rooms, setRooms] = useState<ChatRoom[]>([]);
	const [roomsLoading, setRoomsLoading] = useState(true);
	const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
	const [activeRoomIndex, setActiveRoomIndex] = useState(0);
	const [showCreate, setShowCreate] = useState(false);

	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [messagesLoading, setMessagesLoading] = useState(false);

	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);

	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	// rooms the current user is already a member of (no need to increment member_count on send)
	const joinedRoomsRef = useRef<Set<number>>(new Set());

	const userId = (user as { id?: number } & typeof user)?.id;

	// ── Load rooms ─────────────────────────────────────────────────────────────
	useEffect(() => {
		chatService
			.getRooms()
			.then((res) => {
				const list = Array.isArray(res.data) ? res.data.filter((r) => r?.id) : [];
				setRooms(list);
				if (list.length > 0) {
					setActiveRoom(list[0]);
					setActiveRoomIndex(0);
				}
			})
			.catch(() => setRooms([]))
			.finally(() => setRoomsLoading(false));
	}, []);

	// ── Load messages on room change ───────────────────────────────────────────
	useEffect(() => {
		if (!activeRoom || !user) return;
		setMessages([]);
		setMessagesLoading(true);

		chatService
			.getMessages(activeRoom.id, { per_page: 50 })
			.then((res) => {
				setMessages(res.data);
				// if user already has a message here, they're already a member
				if (userId && res.data.some((m) => m.created_by?.id === userId)) {
					joinedRoomsRef.current.add(activeRoom.id);
				}
			})
			.catch(() => setMessages([]))
			.finally(() => setMessagesLoading(false));
	}, [activeRoom, user]);

	// ── Scroll to bottom ───────────────────────────────────────────────────────
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// ── Realtime (Reverb / WebSocket) ─────────────────────────────────────────
	useEffect(() => {
		if (!activeRoom) return;

		const channelName = `chat.${activeRoom.id}`;
		const roomId = activeRoom.id;
		const channel = echo.channel(channelName);

		channel.listen('.message.sent', (data: ChatMessage) => {
			// deduplicate — sender already added via handleSend response
			setMessages((prev) => prev.some((m) => m.id === data.id) ? prev : [...prev, data]);

			// receivers: update room stats in sidebar
			const senderId = data.created_by?.id?.toString();
			if (senderId !== user?.id) {
				setRooms((prev) =>
					prev.map((r) =>
						r.id === roomId
							? { ...r, message_count: r.message_count + 1, last_message_at: data.created_at }
							: r,
					),
				);
			}
		});

		return () => {
			channel.stopListening('.message.sent');
			echo.leaveChannel(channelName);
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeRoom?.id]);

	// ── Send ───────────────────────────────────────────────────────────────────
	const handleSend = async () => {
		if (!input.trim() || sending || !activeRoom || !user) return;
		const text = input.trim();
		setSending(true);
		setInput("");
		try {
			const res = await chatService.sendMessage(activeRoom.id, text);
			setMessages((prev) => prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]);
			const isNewMember = !joinedRoomsRef.current.has(activeRoom.id);
			if (isNewMember) joinedRoomsRef.current.add(activeRoom.id);
			setRooms((prev) =>
				prev.map((r) =>
					r.id === activeRoom.id
						? {
							...r,
							message_count: r.message_count + 1,
							last_message_at: res.data.created_at,
							...(isNewMember ? { member_count: r.member_count + 1 } : {}),
						}
						: r,
				),
			);
		} catch {
			setInput(text);
		} finally {
			setSending(false);
			inputRef.current?.focus();
		}
	};

	const handleRoomCreated = (room: ChatRoom) => {
		if (!room?.id) return;
		setRooms((prev) => [room, ...prev.filter((r) => r?.id)]);
		setActiveRoom(room);
		setActiveRoomIndex(0);
	};

	const messageGroups = groupMessages(messages);

	// ── Render ─────────────────────────────────────────────────────────────────
	return (
		<div className='flex h-[calc(100vh-4rem)] w-full overflow-hidden'>

			{/* ── Create room modal ────────────────────────────────────────── */}
			{showCreate && (
				<CreateRoomModal
					onClose={() => setShowCreate(false)}
					onCreate={handleRoomCreated}
				/>
			)}

			{/* ── Room sidebar ─────────────────────────────────────────────── */}
			<aside className='flex w-64 shrink-0 flex-col border-r-2 border-black bg-white'>
				{/* Sidebar header */}
				<div className='flex h-14 items-center gap-2.5 border-b-2 border-black px-4'>
					<MessageSquare className='h-4 w-4 shrink-0 text-[var(--color-text-primary)]' strokeWidth={2.5} />
					<span className='flex-1 font-heading text-sm font-extrabold uppercase tracking-wide text-black'>
						Phòng chat
					</span>
					{user?.permissions?.includes("community.chat.manage") && (
						<button
							onClick={() => setShowCreate(true)}
							title='Tạo phòng mới'
							className='inline-flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[var(--color-primary)] hover:shadow-none'>
							<Plus className='h-3.5 w-3.5' />
						</button>
					)}
				</div>

				{/* Room list */}
				<div className='no-scrollbar flex-1 overflow-y-auto p-2'>
					{roomsLoading ? (
						<RoomSkeleton />
					) : rooms.length === 0 ? (
						<div className='py-10 text-center'>
							<Hash className='mx-auto h-8 w-8 text-gray-300' />
							<p className='mt-2 text-xs font-bold text-gray-400'>Chưa có phòng nào</p>
						</div>
					) : (
						<nav className='space-y-0.5'>
							{rooms.filter((r) => r?.id).map((room, i) => (
								<RoomItem
									key={room.id}
									room={room}
									index={i}
									active={activeRoom?.id === room.id}
									onClick={() => { setActiveRoom(room); setActiveRoomIndex(i); }}
								/>
							))}
						</nav>
					)}
				</div>
			</aside>

			{/* ── Chat area ────────────────────────────────────────────────── */}
			<div className='flex min-w-0 flex-1 flex-col bg-white'>

				{/* Channel header */}
				{activeRoom ? (
					<div className='flex h-14 shrink-0 items-center gap-3 border-b-2 border-black px-5'>
						<div
							className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-black ${getRoomColor(activeRoomIndex)}`}>
							<Hash className='h-3.5 w-3.5 text-black' />
						</div>
						<div>
							<p className='font-heading text-sm font-extrabold leading-none text-black'>
								{activeRoom.name}
							</p>
						</div>
						<div className='ml-auto flex items-center gap-1.5 rounded-lg border-2 border-black bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-500'>
							<Users className='h-3.5 w-3.5' />
							{activeRoom.member_count}
						</div>
					</div>
				) : (
					<div className='h-14 shrink-0 border-b-2 border-black' />
				)}

				{/* Messages */}
				<div className='no-scrollbar flex-1 overflow-y-auto py-4'>
					{!user ? (
						<GuestWall />
					) : messagesLoading ? (
						<div className='space-y-4'>
							{Array.from({ length: 6 }).map((_, i) => (
								<MessageGroupSkeleton key={i} />
							))}
						</div>
					) : messageGroups.length === 0 && activeRoom ? (
						<EmptyChat roomName={activeRoom.name} />
					) : (
						<>
							{messageGroups.map((group, i) => (
								<MessageGroupItem
									key={i}
									group={group}
									isOwn={group.senderId === userId}
								/>
							))}
							<div ref={bottomRef} />
						</>
					)}
				</div>

				{/* Divider */}
				{user && activeRoom && (
					<div className='shrink-0 border-t-2 border-black bg-white px-4 py-3'>
						<div className='flex items-end gap-3'>
							<img
								src={buildAvatar(user.name, user.picture)}
								alt={user.name ?? "Bạn"}
								className='h-9 w-9 shrink-0 rounded-full border-2 border-black object-cover'
							/>
							<div className='flex min-w-0 flex-1 items-end gap-2 rounded-xl border-2 border-black bg-white px-3 py-2 focus-within:shadow-[0_0_0_3px_#A3E635]'>
								<textarea
									ref={inputRef}
									rows={1}
									value={input}
									onChange={(e) => {
										setInput(e.target.value);
										e.target.style.height = "auto";
										e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											void handleSend();
										}
									}}
									placeholder={`Nhắn vào #${activeRoom.name}...`}
									className='no-scrollbar max-h-[120px] min-h-[28px] flex-1 resize-none bg-transparent text-sm font-medium text-black outline-none placeholder:text-gray-400'
								/>
								<button
									onClick={() => void handleSend()}
									disabled={!input.trim() || sending}
									className='mb-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[var(--color-primary)] shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50'>
									{sending ? (
										<Loader2 className='h-3.5 w-3.5 animate-spin' />
									) : (
										<Send className='h-3.5 w-3.5' />
									)}
								</button>
							</div>
						</div>
						<p className='mt-1.5 pl-12 text-[10px] text-gray-400'>
							Enter để gửi · Shift+Enter xuống dòng
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default CommunityChatPage;
