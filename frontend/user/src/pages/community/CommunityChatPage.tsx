import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

// ── chatscope ──────────────────────────────────────────────────────────────
import { MessageList } from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import "./CommunityChatPage.css";

// ── emoji-mart ─────────────────────────────────────────────────────────────
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

// ── gif-picker (GIPHY) ──────────────────────────────────────────────────────
import GiphyPicker from "@/components/chat/GiphyPicker";

// ── project ────────────────────────────────────────────────────────────────
import {
	Hash,
	Image as ImageIcon,
	List,
	Loader2,
	Lock,
	MessageSquare,
	Plus,
	Reply,
	Send,
	Smile,
	Users,
	X,
} from "lucide-react";
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

const GIF_PATTERN =
	/^https?:\/\/(media\.giphy\.com|media[0-9]*\.giphy\.com|i\.giphy\.com|media\.tenor\.com|c\.tenor\.com)\//i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRoomColor = (i: number) => ROOM_COLORS[i % ROOM_COLORS.length];
const isGifUrl = (s: string) => GIF_PATTERN.test(s.trim());

// ─── Types ────────────────────────────────────────────────────────────────────

interface MessageGroup {
	senderId: number | null;
	senderName: string;
	senderAvatar: string;
	senderHandle: string;
	firstTime: string;
	lastTime: string;
	messages: ChatMessage[];
}

// ─── Grouping ─────────────────────────────────────────────────────────────────

const groupMessages = (messages: ChatMessage[]): MessageGroup[] => {
	const groups: MessageGroup[] = [];
	for (const msg of messages) {
		const sender = msg.created_by;
		const last = groups[groups.length - 1];
		if (last && last.senderId === (sender?.id ?? null)) {
			last.messages.push(msg);
			last.lastTime = msg.created_at;
		} else {
			groups.push({
				senderId: sender?.id ?? null,
				senderName: sender?.full_name ?? "Thành viên",
				senderAvatar: buildAvatar(sender?.full_name, sender?.avatar),
				senderHandle: sender ? getHandle(sender.username, sender.email) : "",
				firstTime: msg.created_at,
				lastTime: msg.created_at,
				messages: [msg],
			});
		}
	}
	return groups;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── RoomItem ─────────────────────────────────────────────────────────────────

const RoomItem: React.FC<{
	room: ChatRoom;
	index: number;
	active: boolean;
	onClick: () => void;
}> = ({ room, index, active, onClick }) => (
	<button
		onClick={onClick}
		className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
			active
				? "border-black bg-[var(--color-primary)] shadow-[2px_2px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
				: "border-transparent text-gray-700 hover:bg-gray-50"
		}`}>
		{room.image ? (
			<img
				src={room.image}
				alt={room.name}
				className='h-8 w-8 shrink-0 rounded-lg border-2 border-black object-cover'
			/>
		) : (
			<div
				className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-black ${getRoomColor(index)}`}>
				<Hash className='h-3.5 w-3.5 text-black' />
			</div>
		)}
		<div className='min-w-0 flex-1'>
			<p
				className={`truncate text-[13px] font-extrabold ${active ? "text-black" : "text-gray-800"}`}>
				{room.name}
			</p>
		</div>
	</button>
);

// ─── Bubble radius helper ─────────────────────────────────────────────────────

function bubbleRadius(isOwn: boolean, isFirst: boolean, isLast: boolean): string {
	const single = isFirst && isLast;
	if (single) return "rounded-2xl";
	if (isOwn) {
		if (isFirst) return "rounded-2xl rounded-br-md";
		if (isLast) return "rounded-2xl rounded-tr-md";
		return "rounded-l-2xl rounded-r-md";
	} else {
		if (isFirst) return "rounded-2xl rounded-bl-md";
		if (isLast) return "rounded-2xl rounded-tl-md";
		return "rounded-r-2xl rounded-l-md";
	}
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

const MessageBubble: React.FC<{
	msg: ChatMessage;
	isOwn: boolean;
	isFirst: boolean;
	isLast: boolean;
	onReply: (msg: ChatMessage) => void;
}> = ({ msg, isOwn, isFirst, isLast, onReply }) => (
	<div
		className={`group/bbl relative my-[2px] flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
		{/* Reply quick-action */}
		<button
			onClick={() => onReply(msg)}
			className={`absolute top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/bbl:opacity-100 transition-opacity
				flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:border-black
				${isOwn ? "-left-7" : "-right-7"}`}
			title='Trả lời'>
			<Reply className='h-3 w-3 text-gray-500' />
		</button>

		{/* Bubble */}
		<div
			className={
				isGifUrl(msg.content)
					? "max-w-[85%] sm:max-w-[75%]"
					: `
			relative min-w-[3.5rem] max-w-[85%] sm:max-w-[75%]
			${bubbleRadius(isOwn, isFirst, isLast)}
			border-2 border-black shadow-[2px_2px_0_#111]
			${isOwn ? "bg-[var(--color-primary)]" : "bg-white"}
		`
			}>
			{/* Reply preview */}
			{msg.reply_to && (
				<div
					className={`border-b-2 border-black/10 px-3 pt-2 pb-1.5 text-xs ${isOwn ? "text-black/60" : "text-gray-500"}`}>
					<span className='font-bold'>{msg.reply_to.full_name} </span>
					<span className='line-clamp-1 italic'>
						{isGifUrl(msg.reply_to.content) ? "🖼 GIF" : msg.reply_to.content}
					</span>
				</div>
			)}

			{/* Content */}
			{isGifUrl(msg.content) ? (
				<div className='relative rounded-2xl'>
					<img
						src={msg.content}
						alt='GIF'
						className='max-h-52 max-w-full rounded-xl border-2 border-black shadow-[2px_2px_0_#111] bg-[var(--color-primary)]'
						loading='lazy'
					/>
					{/* Timestamp overlay trên GIF */}
					<span className='absolute bottom-2 right-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white'>
						{formatRelativeTime(msg.created_at)}
					</span>
				</div>
			) : (
				<div className='px-3.5 pb-2 pt-2'>
					<p
						className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${isOwn ? "text-black" : "text-gray-800"}`}>
						{msg.content}
					</p>
					{/* Timestamp bên trong bubble, căn phải */}
					<p
						className={`mt-0.5 text-right text-[10px] leading-none ${isOwn ? "text-black/50" : "text-gray-400"}`}>
						{formatRelativeTime(msg.created_at)}
					</p>
				</div>
			)}
		</div>
	</div>
);

// ─── MessageGroupItem ─────────────────────────────────────────────────────────

const MessageGroupItem: React.FC<{
	group: MessageGroup;
	isOwn: boolean;
	onReply: (msg: ChatMessage) => void;
}> = ({ group, isOwn, onReply }) => (
	<div
		className={`flex items-end gap-2 px-4 py-1.5 hover:bg-black/[0.015] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
		{/* Avatar — cố định ở bottom của nhóm */}
		<img
			src={group.senderAvatar}
			alt={group.senderName}
			className='h-8 w-8 shrink-0 self-end rounded-full border-2 border-black object-cover'
		/>

		{/* Bubbles column — chiếm hết phần còn lại, tối đa 72% */}
		<div
			className={`flex min-w-0 flex-1 flex-col gap-0 max-w-[85%] sm:max-w-[72%] ${isOwn ? "items-end" : "items-start"}`}>
			{/* Header */}
			<div
				className={`mb-1.5 flex flex-wrap items-baseline gap-x-1.5 ${isOwn ? "flex-row-reverse" : ""}`}>
				<span
					className={`text-[13px] font-extrabold leading-none ${isOwn ? "text-[var(--color-text-primary)]" : "text-gray-900"}`}>
					{isOwn ? "Bạn" : group.senderName}
				</span>
				{group.senderHandle && (
					<span className='text-[11px] text-gray-400'>{group.senderHandle}</span>
				)}
			</div>

			{/* Bubbles — w-full để max-w-[75%] hoạt động chính xác */}
			<div className='flex w-full flex-col gap-0'>
				{group.messages.map((msg, i) => (
					<MessageBubble
						key={msg.id}
						msg={msg}
						isOwn={isOwn}
						isFirst={i === 0}
						isLast={i === group.messages.length - 1}
						onReply={onReply}
					/>
				))}
			</div>
		</div>
	</div>
);

// ─── Static states ────────────────────────────────────────────────────────────

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
		<div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-300'>
			<Lock strokeWidth={3} className='h-7 w-7 text-white' />
		</div>
		<div>
			<p className='font-heading text-xl font-extrabold text-black'>Đăng nhập để chat</p>
			<p className='mt-1 text-sm text-gray-500'>Kết nối cùng các thành viên CKC IT CLUB.</p>
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
			} else setError("Không thể tạo phòng. Vui lòng thử lại.");
		} catch (err: unknown) {
			const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
				?.message;
			setError(msg ?? "Không thể tạo phòng. Vui lòng thử lại.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
			<div className='absolute inset-0 bg-black/40' onClick={onClose} />
			<div className='relative w-full max-w-sm rounded-2xl border-2 border-black bg-white p-6 shadow-[6px_6px_0_#111]'>
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
								className='w-full rounded-xl border-2 border-black py-2.5 pl-9 pr-4 text-sm font-medium text-black outline-none placeholder:text-gray-400 focus:shadow-[0_0_0_3px_#A3E635]'
							/>
						</div>
						{error && (
							<p className='mt-1.5 text-xs font-semibold text-red-500'>{error}</p>
						)}
						<p className='mt-1 text-right text-[10px] text-gray-400'>
							{name.trim().length}/50
						</p>
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

	// ── Room state ─────────────────────────────────────────────────────────────
	const [rooms, setRooms] = useState<ChatRoom[]>([]);
	const [roomsLoading, setRoomsLoading] = useState(true);
	const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
	const [activeRoomIdx, setActiveRoomIdx] = useState(0);
	const [showCreate, setShowCreate] = useState(false);

	// ── Message state ──────────────────────────────────────────────────────────
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [messagesLoading, setMessagesLoading] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	// ── Input state ────────────────────────────────────────────────────────────
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [showGifPicker, setShowGifPicker] = useState(false);
	const [showMobileSidebar, setShowMobileSidebar] = useState(false);

	// ── Refs ───────────────────────────────────────────────────────────────────
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const emojiRef = useRef<HTMLDivElement>(null);
	const gifRef = useRef<HTMLDivElement>(null);
	const isComposingRef = useRef(false);
	const joinedRoomsRef = useRef<Set<number>>(new Set());
	const msgListRef = useRef<HTMLDivElement>(null);
	const loadingMoreRef = useRef(false);
	const loadCooldownRef = useRef(false);

	// ── Helpers ────────────────────────────────────────────────────────────────
	const userId = user?.id;
	const msgGroups = groupMessages(messages);

	// ── Click-outside: close pickers ──────────────────────────────────────────
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (emojiRef.current && !emojiRef.current.contains(e.target as Node))
				setShowEmojiPicker(false);
			if (gifRef.current && !gifRef.current.contains(e.target as Node))
				setShowGifPicker(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	// ── Load rooms ─────────────────────────────────────────────────────────────
	useEffect(() => {
		chatService
			.getRooms()
			.then((res) => {
				const list = Array.isArray(res.data) ? res.data.filter((r) => r?.id) : [];
				setRooms(list);
				if (list.length > 0) {
					setActiveRoom(list[0]);
					setActiveRoomIdx(0);
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
		setReplyTo(null);
		setHasMore(false);
		setLoadingMore(false);
		loadingMoreRef.current = false;
		loadCooldownRef.current = false;

		chatService
			.getMessages(activeRoom.id, { per_page: 30 })
			.then((res) => {
				setMessages(res.data);
				setHasMore(res.data.length === 30);
				if (userId && res.data.some((m) => m.created_by?.id?.toString() === userId))
					joinedRoomsRef.current.add(activeRoom.id);
			})
			.catch(() => setMessages([]))
			.finally(() => setMessagesLoading(false));
	}, [activeRoom, user]);

	// ── Realtime (Reverb / WebSocket) ─────────────────────────────────────────
	useEffect(() => {
		if (!activeRoom || !echo) return;
		const activeEcho = echo;
		const channelName = `chat.${activeRoom.id}`;
		const roomId = activeRoom.id;
		const channel = activeEcho.channel(channelName);

		channel.listen(".message.sent", (data: ChatMessage) => {
			setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
			const senderId = data.created_by?.id?.toString();
			if (senderId !== userId) {
				setRooms((prev) =>
					prev.map((r) =>
						r.id === roomId
							? {
									...r,
									message_count: r.message_count + 1,
									last_message_at: data.created_at,
								}
							: r,
					),
				);
			}
		});

		return () => {
			channel.stopListening(".message.sent");
			activeEcho.leaveChannel(channelName);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeRoom?.id]);

	// ── Load older messages (scroll-up pagination) ────────────────────────────
	const loadMoreMessages = async () => {
		if (
			!activeRoom ||
			loadingMoreRef.current ||
			loadCooldownRef.current ||
			!hasMore ||
			messages.length === 0
		)
			return;

		loadingMoreRef.current = true;
		setLoadingMore(true);

		const scrollWrapper = msgListRef.current?.querySelector<HTMLElement>(
			".cs-message-list__scroll-wrapper",
		);
		const oldScrollHeight = scrollWrapper?.scrollHeight ?? 0;
		const oldest = messages[0];

		try {
			const res = await chatService.getMessages(activeRoom.id, {
				per_page: 30,
				before: oldest.created_at,
				before_id: oldest.id,
			});

			if (res.data.length === 0) {
				setHasMore(false);
				return;
			}

			flushSync(() => {
				setMessages((prev) => {
					const existingIds = new Set(prev.map((m) => m.id));
					const newMsgs = res.data.filter((m) => !existingIds.has(m.id));
					return [...newMsgs, ...prev];
				});
			});

			// Preserve scroll position after prepend
			if (scrollWrapper && oldScrollHeight > 0) {
				const delta = scrollWrapper.scrollHeight - oldScrollHeight;
				if (delta > 0) scrollWrapper.scrollTop = delta;
			}

			setHasMore(res.data.length === 30);
		} catch {
			// silent
		} finally {
			loadingMoreRef.current = false;
			setLoadingMore(false);
			loadCooldownRef.current = true;
			setTimeout(() => {
				loadCooldownRef.current = false;
			}, 1500);
		}
	};

	// ── Send text ──────────────────────────────────────────────────────────────
	const handleSend = async () => {
		if (!input.trim() || sending || !activeRoom || !user) return;
		const text = input.trim();

		// flushSync ép React commit ngay — DOM textarea cleared trước khi reset height/scroll
		flushSync(() => {
			setSending(true);
			setInput("");
		});

		if (inputRef.current) {
			inputRef.current.style.height = "auto";
			inputRef.current.scrollTop = 0;
		}
		try {
			const res = await chatService.sendMessage(activeRoom.id, text, replyTo?.id);
			setMessages((prev) =>
				prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data],
			);
			setReplyTo(null);
			const isNew = !joinedRoomsRef.current.has(activeRoom.id);
			if (isNew) joinedRoomsRef.current.add(activeRoom.id);
			setRooms((prev) =>
				prev.map((r) =>
					r.id === activeRoom.id
						? {
								...r,
								message_count: r.message_count + 1,
								last_message_at: res.data.created_at,
								...(isNew ? { member_count: r.member_count + 1 } : {}),
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

	// ── Send GIF ───────────────────────────────────────────────────────────────
	const handleSendGif = async (gifUrl: string) => {
		if (!activeRoom || !user || sending) return;
		setShowGifPicker(false);
		setSending(true);
		try {
			const res = await chatService.sendMessage(activeRoom.id, gifUrl, replyTo?.id);
			setMessages((prev) =>
				prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data],
			);
			setReplyTo(null);
			const isNew = !joinedRoomsRef.current.has(activeRoom.id);
			if (isNew) joinedRoomsRef.current.add(activeRoom.id);
			setRooms((prev) =>
				prev.map((r) =>
					r.id === activeRoom.id
						? {
								...r,
								message_count: r.message_count + 1,
								last_message_at: res.data.created_at,
								...(isNew ? { member_count: r.member_count + 1 } : {}),
							}
						: r,
				),
			);
		} catch {
			/* silent */
		} finally {
			setSending(false);
		}
	};

	// ── Room created ───────────────────────────────────────────────────────────
	const handleRoomCreated = (room: ChatRoom) => {
		if (!room?.id) return;
		setRooms((prev) => [room, ...prev.filter((r) => r?.id)]);
		setActiveRoom(room);
		setActiveRoomIdx(0);
	};

	// ── Render ─────────────────────────────────────────────────────────────────
	return (
		<div className='flex h-[calc(100dvh-4rem)] w-full overflow-hidden'>
			{/* ── Create room modal ──────────────────────────────────────── */}
			{showCreate && (
				<CreateRoomModal
					onClose={() => setShowCreate(false)}
					onCreate={handleRoomCreated}
				/>
			)}

			{/* ═══════════════ MOBILE SIDEBAR OVERLAY ══════════════════ */}
			{showMobileSidebar && (
				<div className='fixed inset-0 z-50 md:hidden'>
					<button
						className='absolute inset-0 h-full w-full bg-black/50'
						onClick={() => setShowMobileSidebar(false)}
						aria-label='Đóng danh sách phòng'
					/>
					<aside className='relative flex h-full w-[min(80vw,16rem)] flex-col border-r-2 border-black bg-white shadow-[4px_0_0_#111]'>
						<div className='flex h-14 items-center gap-2.5 border-b-2 border-black px-4'>
							<MessageSquare
								className='h-4 w-4 shrink-0 text-[var(--color-text-primary)]'
								strokeWidth={2.5}
							/>
							<span className='flex-1 font-heading text-sm font-extrabold uppercase tracking-wide text-black'>
								Phòng chat
							</span>
							{user?.permissions?.includes("community.chat.manage") && (
								<button
									onClick={() => {
										setShowCreate(true);
										setShowMobileSidebar(false);
									}}
									title='Tạo phòng mới'
									className='inline-flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[var(--color-primary)] hover:shadow-none'>
									<Plus className='h-3.5 w-3.5' />
								</button>
							)}
						</div>
						<div className='no-scrollbar flex-1 overflow-y-auto p-2'>
							{roomsLoading ? (
								<RoomSkeleton />
							) : rooms.length === 0 ? (
								<div className='py-10 text-center'>
									<Hash className='mx-auto h-8 w-8 text-gray-300' />
									<p className='mt-2 text-xs font-bold text-gray-400'>
										Chưa có phòng nào
									</p>
								</div>
							) : (
								<nav className='space-y-0.5'>
									{rooms
										.filter((r) => r?.id)
										.map((room, i) => (
											<RoomItem
												key={room.id}
												room={room}
												index={i}
												active={activeRoom?.id === room.id}
												onClick={() => {
													setActiveRoom(room);
													setActiveRoomIdx(i);
													setShowMobileSidebar(false);
												}}
											/>
										))}
								</nav>
							)}
						</div>
					</aside>
				</div>
			)}

			{/* ═══════════════════ SIDEBAR (desktop) ══════════════════════ */}
			<aside className='hidden md:flex w-64 shrink-0 flex-col border-r-2 border-black bg-white'>
				{/* Header */}
				<div className='flex h-14 items-center gap-2.5 border-b-2 border-black px-4'>
					<MessageSquare
						className='h-4 w-4 shrink-0 text-[var(--color-text-primary)]'
						strokeWidth={2.5}
					/>
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
							<p className='mt-2 text-xs font-bold text-gray-400'>
								Chưa có phòng nào
							</p>
						</div>
					) : (
						<nav className='space-y-0.5'>
							{rooms
								.filter((r) => r?.id)
								.map((room, i) => (
									<RoomItem
										key={room.id}
										room={room}
										index={i}
										active={activeRoom?.id === room.id}
										onClick={() => {
											setActiveRoom(room);
											setActiveRoomIdx(i);
										}}
									/>
								))}
						</nav>
					)}
				</div>
			</aside>

			{/* ═══════════════════ CHAT AREA ═════════════════════════════ */}
			<div className='flex min-w-0 flex-1 flex-col bg-[#fafafa]'>
				{/* ── Channel header ──────────────────────────────────── */}
				<div className='flex h-14 shrink-0 items-center gap-2 sm:gap-3 border-b-2 border-black bg-white px-3 sm:px-5'>
					{/* Mobile room list toggle */}
					<button
						className='md:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-gray-100'
						onClick={() => setShowMobileSidebar(true)}
						aria-label='Danh sách phòng chat'>
						<List className='h-5 w-5' />
					</button>

					{activeRoom ? (
						<>
							{activeRoom.image ? (
								<img
									src={activeRoom.image}
									alt={activeRoom.name}
									className='h-8 w-8 shrink-0 rounded-lg border-2 border-black object-cover'
								/>
							) : (
								<div
									className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-black ${getRoomColor(activeRoomIdx)}`}>
									<Hash className='h-3.5 w-3.5 text-black' />
								</div>
							)}
							<div className='min-w-0 flex-1'>
								<p className='truncate font-heading text-sm font-extrabold leading-none text-black'>
									{activeRoom.name}
								</p>
							</div>
							<div className='flex items-center gap-1.5 rounded-lg border-2 border-black bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-500'>
								<Users className='h-3.5 w-3.5' />
								{activeRoom.member_count}
							</div>
						</>
					) : (
						<div className='flex-1' />
					)}
				</div>

				{/* ── Message list (chatscope) ────────────────────────── */}
				<div className='csc-wrap relative min-h-0 flex-1' ref={msgListRef}>
					<MessageList
						loading={messagesLoading}
						autoScrollToBottom={true}
						scrollBehavior='smooth'
						className='!h-full !bg-[#fafafa]'
						onYReachStart={() => {
							void loadMoreMessages();
						}}>
						{!user ? (
							<GuestWall />
						) : msgGroups.length === 0 && activeRoom && !messagesLoading ? (
							<EmptyChat roomName={activeRoom.name ?? ""} />
						) : (
							<div className='py-2'>
								{loadingMore && (
									<div className='flex items-center justify-center py-3'>
										<Loader2 className='h-4 w-4 animate-spin text-gray-400' />
									</div>
								)}
								{msgGroups.map((group) => (
									<MessageGroupItem
										key={group.messages[0].id}
										group={group}
										isOwn={group.senderId?.toString() === userId}
										onReply={user ? setReplyTo : () => {}}
									/>
								))}
							</div>
						)}
					</MessageList>
				</div>

				{/* ── Input area ──────────────────────────────────────── */}
				{user && activeRoom && (
					<div className='relative shrink-0 border-t-2 border-black bg-white'>
						{/* Reply preview bar */}
						{replyTo && (
							<div className='flex items-center gap-2 border-b-2 border-black/10 bg-gray-50 px-4 py-2'>
								<Reply className='h-3.5 w-3.5 shrink-0 text-[var(--color-text-primary)]' />
								<div className='min-w-0 flex-1 text-xs text-gray-500'>
									<span className='font-bold text-gray-700'>
										{replyTo.created_by?.full_name ?? "Người dùng"}:{" "}
									</span>
									<span className='line-clamp-1'>
										{isGifUrl(replyTo.content) ? "🖼 GIF" : replyTo.content}
									</span>
								</div>
								<button
									onClick={() => setReplyTo(null)}
									className='shrink-0 rounded p-0.5 hover:bg-gray-200'>
									<X className='h-3.5 w-3.5 text-gray-400' />
								</button>
							</div>
						)}

						{/* Emoji picker popup */}
						{showEmojiPicker && (
							<div
								ref={emojiRef}
								className='absolute bottom-full left-0 sm:left-4 z-50 mb-2'>
								<Picker
									data={data}
									locale='vi'
									theme='light'
									previewPosition='none'
									onEmojiSelect={(emoji: { native: string }) => {
										setInput((prev) => prev + emoji.native);
										inputRef.current?.focus();
									}}
								/>
							</div>
						)}

						{/* GIF picker popup (GIPHY) */}
						{showGifPicker && (
							<div
								ref={gifRef}
								className='absolute bottom-full left-0 sm:left-14 z-50 mb-2'>
								<GiphyPicker
									onSelect={(url) => void handleSendGif(url)}
									width={Math.min(
										340,
										typeof window !== "undefined"
											? window.innerWidth - 16
											: 340,
									)}
								/>
							</div>
						)}

						{/* Input row */}
						<div className='flex gap-2 px-4 py-3'>
							{/* User avatar */}
							<img
								src={buildAvatar(user.name, user.picture)}
								alt={user.name ?? "Bạn"}
								className='h-10 w-10 shrink-0 rounded-full border-2 border-black object-cover'
							/>

							{/* Textarea + action buttons */}
							<div className='flex min-w-0 flex-1 items-center gap-1.5 rounded-2xl border-2 border-black bg-white px-3 focus-within:shadow-[0_0_0_3px_#A3E635]'>
								<textarea
									ref={inputRef}
									rows={1}
									value={input}
									onChange={(e) => {
										setInput(e.target.value);
										e.target.style.height = "auto";
										e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
									}}
									onCompositionStart={() => {
										isComposingRef.current = true;
									}}
									onCompositionEnd={() => {
										isComposingRef.current = false;
									}}
									onKeyDown={(e) => {
										if (
											e.key === "Enter" &&
											!e.shiftKey &&
											!isComposingRef.current
										) {
											e.preventDefault();
											void handleSend();
										}
									}}
									placeholder={`Nhắn vào #${activeRoom.name}...`}
									className='no-scrollbar max-h-[120px] min-h-0 flex-1 resize-none bg-transparent py-[10px] text-sm font-medium text-black outline-none placeholder:text-gray-400'
								/>

								{/* Emoji button */}
								<button
									type='button'
									onClick={() => {
										setShowEmojiPicker((v) => !v);
										setShowGifPicker(false);
									}}
									className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition
										${
											showEmojiPicker
												? "border-2 border-black bg-[var(--color-primary)] shadow-[1px_1px_0_#111]"
												: "text-gray-400 hover:text-gray-700"
										}`}
									title='Emoji'>
									<Smile className='h-4 w-4' />
								</button>

								{/* GIF button */}
								<button
									type='button'
									onClick={() => {
										setShowGifPicker((v) => !v);
										setShowEmojiPicker(false);
									}}
									className={`inline-flex h-7 items-center justify-center rounded-lg px-1.5 text-[11px] font-extrabold transition
										${
											showGifPicker
												? "border-2 border-black bg-[var(--color-primary)] text-black shadow-[1px_1px_0_#111]"
												: "text-gray-400 hover:text-gray-700"
										}`}
									title='GIF'>
									<ImageIcon className='mr-0.5 h-3.5 w-3.5' />
									GIF
								</button>
							</div>

							{/* Send button */}
							<button
								onClick={() => void handleSend()}
								disabled={!input.trim() || sending}
								className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[var(--color-primary)] shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50'>
								{sending ? (
									<Loader2 className='h-4 w-4 animate-spin' />
								) : (
									<Send className='h-4 w-4' />
								)}
							</button>
						</div>

						<p className='pb-1.5 pl-4 sm:pl-[4.5rem] text-[10px] text-gray-400 hidden sm:block'>
							Enter để gửi · Shift+Enter xuống dòng
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default CommunityChatPage;
