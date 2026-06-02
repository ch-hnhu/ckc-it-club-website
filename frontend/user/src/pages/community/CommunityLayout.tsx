import React, { useEffect, useState } from "react";
import { Code2, Crown, Hash, Home, MessageSquare, Monitor, Trophy, X } from "lucide-react";
import { Link, Outlet, useLocation, useOutletContext, useParams } from "react-router-dom";
import type { AuthUser } from "@/services/auth.service";
import { communityService, type CommunityChannel } from "@/services/community.service";

// ─── Types ───────────────────────────────────────────────────────────────────

type MainLayoutOutletContext = {
	user: AuthUser | null;
};

export type ChannelItem = {
	id: string;
	label: string;
	count: number;
	description: string | null;
	image: string | null;
	slug: string;
};

export type CommunityLayoutContext = {
	user: AuthUser | null;
	channels: ChannelItem[];
	setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIMARY_NAV = [
	{ id: "home", label: "Trang chủ", icon: Home, to: "/cong-dong" },
	{ id: "chat", label: "Phòng chat", icon: MessageSquare, to: "/cong-dong/chat" },
	{ id: "leaderboard", label: "Bảng xếp hạng", icon: Trophy, to: "/cong-dong" },
	{ id: "showcase", label: "Showcase dự án", icon: Monitor, to: "/cong-dong" },
	{ id: "challenge", label: "Thử thách tháng", icon: Crown, to: "/cong-dong" },
	{ id: "code", label: "#30DaysOfCode", icon: Code2, to: "/cong-dong" },
];

const STATIC_CHANNELS = [
	{ id: "general", label: "Chung", count: 128 },
	{ id: "discussion", label: "Thảo luận", count: 42 },
	{ id: "qa", label: "Hỏi đáp", count: 35 },
	{ id: "project", label: "Dự án", count: 18 },
	{ id: "resources", label: "Tài nguyên", count: 23 },
	{ id: "events", label: "Sự kiện", count: 10 },
	{ id: "career", label: "Cơ hội nghề nghiệp", count: 12 },
	{ id: "bugs", label: "Báo lỗi", count: 7 },
];

const COMMUNITY_LOGO = "https://www.codedex.io/images/community/bouncer.gif";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildChannelItems = (sourceChannels: ChannelItem[]): ChannelItem[] => {
	const sorted = [...sourceChannels].sort((a, b) => b.count - a.count);
	const totalPostsCount = sorted.reduce((sum, ch) => sum + ch.count, 0);
	return [
		{
			id: "chung",
			label: "Kênh chung",
			count: totalPostsCount,
			description: "Tất cả bài viết từ mọi kênh trong cộng đồng 🌱✦",
			image: COMMUNITY_LOGO,
			slug: "chung",
		},
		...sorted,
	];
};

const buildFallbackChannels = (): ChannelItem[] =>
	buildChannelItems(
		STATIC_CHANNELS.map((ch) => ({
			id: ch.id,
			label: ch.label,
			count: ch.count,
			description: null,
			image: null,
			slug: ch.id,
		})),
	);

// ─── Component ───────────────────────────────────────────────────────────────

const CommunityLayout: React.FC = () => {
	const outletContext = useOutletContext<MainLayoutOutletContext | undefined>();
	const user = outletContext?.user ?? null;

	const { channelSlug } = useParams<{ channelSlug: string }>();
	const location = useLocation();

	const isChat = location.pathname.startsWith("/cong-dong/chat");
	const pageMode = channelSlug && !isChat ? "channel" : isChat ? "chat" : "home";
	const activeChannel = channelSlug ?? "";

	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [channels, setChannels] = useState<ChannelItem[]>(buildFallbackChannels());

	useEffect(() => {
		document.documentElement.classList.add("no-scrollbar");
		return () => {
			document.documentElement.classList.remove("no-scrollbar");
		};
	}, []);

	useEffect(() => {
		if (!isSidebarOpen) return;
		const prevBody = document.body.style.overflow;
		const prevHtml = document.documentElement.style.overflow;
		document.body.style.overflow = "hidden";
		document.documentElement.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prevBody;
			document.documentElement.style.overflow = prevHtml;
		};
	}, [isSidebarOpen]);

	useEffect(() => {
		let isMounted = true;
		const loadChannels = async () => {
			try {
				const response = await communityService.getChannels({
					per_page: 100,
					sort: "posts_count",
					order: "desc",
				});
				if (!isMounted) return;
				const mapped = response.data.map((ch: CommunityChannel) => ({
					id: ch.slug,
					label: ch.name,
					count: ch.posts_count,
					description: ch.description,
					image: ch.image,
					slug: ch.slug,
				}));
				setChannels(buildChannelItems(mapped));
			} catch {
				if (!isMounted) return;
				setChannels(buildFallbackChannels());
			}
		};
		void loadChannels();
		return () => {
			isMounted = false;
		};
	}, []);

	const renderSidebarContent = (isMobile = false) => (
		<div className={isMobile ? "px-4 py-4" : "px-3 py-4"}>
			<nav className='space-y-2'>
				{PRIMARY_NAV.map((item) => {
					const Icon = item.icon;
					const isActive =
						(item.id === "home" && pageMode === "home") ||
						(item.id === "chat" && pageMode === "chat");
					return (
						<Link
							key={item.id}
							to={item.to}
							onClick={() => setIsSidebarOpen(false)}
							className={`group relative flex w-full items-center text-left font-bold ${
								isMobile
									? "gap-3 rounded-xl px-3 py-3 text-base"
									: "gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px]"
							} ${
								isActive
									? "border-2 border-[var(--color-primary-dark)] bg-primary-100 text-[var(--color-text-primary)]"
									: "border-2 border-transparent bg-white text-gray-700 hover:bg-gray-100"
							}`}>
							<Icon
								className={`transition-colors duration-200 ${isMobile ? "h-5 w-5" : "h-4 w-4"} ${
									isActive ? "text-[var(--color-text-primary)]" : "text-gray-700"
								}`}
							/>
							{item.label}
						</Link>
					);
				})}
			</nav>

			<div
				className={`font-bold uppercase tracking-[0.2em] text-gray-500 ${
					isMobile ? "mt-6 px-1 text-xs" : "mt-7 px-3 text-[11px]"
				}`}>
				Kênh
			</div>
			<nav className='mt-3 space-y-2'>
				{channels.map((channel) => {
					const channelPath = `/cong-dong/${channel.slug}`;
					const isActive = pageMode === "channel" && activeChannel === channel.slug;
					return (
						<Link
							key={channel.id}
							to={channelPath}
							onClick={() => setIsSidebarOpen(false)}
							className={`group relative flex w-full items-center justify-between text-left font-bold ${
								isMobile
									? "rounded-xl px-3 py-2.5 text-base"
									: "rounded-lg px-2.5 py-2 text-[13px]"
							} ${
								isActive
									? "border-2 border-[var(--color-primary-dark)] bg-primary-100 text-[var(--color-text-primary)]"
									: "border-2 border-transparent bg-white text-black hover:bg-gray-100"
							}`}>
							<span className='flex items-center gap-3'>
								<Hash
									className={`transition-colors duration-200 ${
										isMobile ? "h-5 w-5" : "h-3.5 w-3.5"
									} ${isActive ? "text-[var(--color-text-primary)]" : "text-gray-500"}`}
								/>
								{channel.label}
							</span>
							<span
								className={`transition-colors duration-200 ${isMobile ? "text-sm" : "text-xs"} ${
									isActive ? "text-[var(--color-text-primary)]" : "text-gray-500"
								}`}>
								{channel.count}
							</span>
						</Link>
					);
				})}
			</nav>
		</div>
	);

	return (
		<div className='min-h-screen bg-[var(--color-surface)] pt-16 text-black'>
			<div className='community-shell'>
				<aside className='hidden border-r-2 border-black bg-white lg:block'>
					<div className='no-scrollbar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto'>
						{renderSidebarContent()}
					</div>
				</aside>

				<Outlet
					context={{ user, channels, setIsSidebarOpen } satisfies CommunityLayoutContext}
				/>
			</div>

			{isSidebarOpen && (
				<div className='fixed inset-0 z-50 lg:hidden'>
					<button
						className='absolute inset-0 h-full w-full bg-black/55'
						onClick={() => setIsSidebarOpen(false)}
						aria-label='Đóng menu cộng đồng'
					/>
					<aside className='no-scrollbar relative h-full w-[min(70vw,20rem)] overflow-y-auto border-r-2 border-black bg-white shadow-[6px_0_0_#111]'>
						<div className='sticky top-0 z-10 flex h-14 items-center justify-between border-b-2 border-black bg-white px-4'>
							<h2 className='font-heading text-lg font-extrabold text-black'>
								Cộng đồng
							</h2>
							<button
								onClick={() => setIsSidebarOpen(false)}
								className='inline-flex h-9 w-9 items-center justify-center rounded-lg bg-transparent text-black transition hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-100'
								aria-label='Đóng menu cộng đồng'>
								<X className='h-4 w-4' />
							</button>
						</div>
						{renderSidebarContent(true)}
					</aside>
				</div>
			)}
		</div>
	);
};

export default CommunityLayout;
