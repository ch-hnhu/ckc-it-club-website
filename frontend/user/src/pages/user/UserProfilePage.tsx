import React, { useEffect, useRef, useState } from "react";
import {
	Link,
	useLocation,
	useNavigate,
	useOutletContext,
	useParams,
	useSearchParams,
} from "react-router-dom";
import {
	Bookmark,
	BookOpen,
	BookOpenText,
	Calendar,
	Camera,
	ChevronLeft,
	ChevronRight,
	FileText,
	GraduationCap,
	Heart,
	ImagePlus,
	LayoutGrid,
	Loader2,
	MessageCircle,
	Search,
	Share2,
	UserCheck,
	UserPen,
	UserPlus,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import type { AuthUser } from "@/services/auth.service";
import { api } from "@/services/api.service";
import { userService } from "@/services/user.service";
import { postService } from "@/services/post.service";
import type { ApiResponse } from "@/types/api.types";
import {
	buildAvatar,
	buildProfileUrl,
	formatRelativeTime,
	getHandle,
	isVideoMediaUrl,
} from "@/lib/utils";
import { renderMarkdownPreview } from "@/lib/markdown";
import type { UserProfile } from "@/types/user.types";
import type { Post } from "@/types/post.types";
import PostCard from "@/components/community/PostCard";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ProfileSkeleton: React.FC = () => (
	<div className='animate-pulse'>
		<div className='h-40 bg-gray-200 sm:h-48 sm:rounded-2xl md:h-55' />

		<div className='bg-white pb-5'>
			<div className='relative -mt-12 flex items-end justify-between gap-3 sm:-mt-16 md:-mt-[5rem]'>
				<div className='px-6'>
					<div className='h-24 w-24 rounded-full border-4 border-white bg-gray-200 sm:h-32 sm:w-32 md:h-36 md:w-36' />
				</div>
				<div className='absolute bottom-0 right-6 h-9 w-28 rounded-xl border-2 border-black bg-white shadow-[3px_3px_0_#111] sm:static sm:w-36' />
			</div>

			<div className='mt-5 space-y-3 px-6 sm:px-0'>
				<div className='h-7 w-44 rounded bg-gray-200' />
				<div className='h-4 w-28 rounded bg-gray-200' />
				<div className='hidden h-4 w-64 rounded bg-gray-200 sm:block' />
				<div className='flex flex-wrap gap-3'>
					<div className='h-4 w-32 rounded bg-gray-200' />
					<div className='hidden h-4 w-36 rounded bg-gray-200 sm:block' />
					<div className='hidden h-4 w-28 rounded bg-gray-200 sm:block' />
				</div>
				<div className='flex gap-5'>
					<div className='h-4 w-28 rounded bg-gray-200' />
					<div className='h-4 w-28 rounded bg-gray-200' />
				</div>
			</div>
		</div>

		<div className='mx-6 mt-6 border-b-2 border-slate-200 sm:mx-0'>
			<div className='flex gap-2 sm:gap-4'>
				<div className='relative h-10 w-32 pb-4'>
					<div className='h-7 w-28 rounded bg-gray-200' />
					<div className='absolute -bottom-[2px] left-0 h-1 w-full bg-primary' />
				</div>
				<div className='flex h-10 w-28 items-start gap-2'>
					<div className='h-7 w-20 rounded bg-gray-200' />
					<div className='h-5 w-5 rounded-full bg-gray-200' />
				</div>
			</div>
		</div>

		<div className='mt-5 space-y-6 px-6 sm:px-0'>
			<div>
				<div className='mb-4 flex items-center justify-between'>
					<div className='h-7 w-20 rounded bg-gray-200' />
					<div className='flex gap-2'>
						<div className='h-8 w-8 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111]' />
						<div className='h-8 w-8 rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111]' />
					</div>
				</div>
				<div className='flex gap-4 overflow-hidden'>
					{Array.from({ length: 2 }).map((_, i) => (
						<div
							key={i}
							className='h-64 min-w-[260px] rounded-2xl border-2 border-black bg-white p-4 sm:min-w-[300px]'>
							<div className='mb-5 flex items-center gap-3'>
								<div className='h-10 w-10 rounded-full bg-gray-200' />
								<div className='space-y-2'>
									<div className='h-4 w-28 rounded bg-gray-200' />
									<div className='h-3 w-36 rounded bg-gray-200' />
								</div>
							</div>
							<div className='mb-4 h-5 w-4/5 rounded bg-gray-200' />
							<div className='space-y-2'>
								<div className='h-3 w-full rounded bg-gray-200' />
								<div className='h-3 w-5/6 rounded bg-gray-200' />
								<div className='h-28 w-full rounded-lg bg-gray-200' />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	</div>
);

const ProfileSidebarSkeleton: React.FC = () => (
	<aside className='hidden w-72 shrink-0 animate-pulse space-y-5 lg:block'>
		{[0, 1, 2].map((item) => (
			<div
				key={item}
				className='rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_#111]'>
				<div className='mb-4 h-5 w-32 rounded bg-gray-200' />
				<div className='space-y-3'>
					<div className='h-4 w-full rounded bg-gray-200' />
					<div className='h-4 w-5/6 rounded bg-gray-200' />
					<div className='h-4 w-3/4 rounded bg-gray-200' />
				</div>
			</div>
		))}
		<div className='h-11 rounded-xl border-2 border-black bg-white shadow-[3px_3px_0_#111]' />
	</aside>
);

const PostSkeleton: React.FC = () => (
	<div className='animate-pulse rounded-2xl border-2 border-black bg-white p-4'>
		<div className='mb-3 flex items-center gap-3'>
			<div className='h-10 w-10 rounded-full bg-gray-200' />
			<div className='space-y-2'>
				<div className='h-3 w-32 rounded bg-gray-200' />
				<div className='h-3 w-20 rounded bg-gray-200' />
			</div>
		</div>
		<div className='mb-3 h-5 w-3/4 rounded bg-gray-200' />
		<div className='space-y-2'>
			<div className='h-3 w-full rounded bg-gray-200' />
			<div className='h-3 w-5/6 rounded bg-gray-200' />
		</div>
	</div>
);

// ─── Stats Card ───────────────────────────────────────────────────────────────

interface StatsCardProps {
	profile: UserProfile;
}

const StatsCard: React.FC<StatsCardProps> = ({ profile }) => (
	<div className='rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_#111]'>
		<h2 className='mb-4 font-heading text-base font-extrabold text-black'>Thống kê</h2>
		<div className='space-y-3'>
			<div className='flex items-center justify-between'>
				<span className='flex items-center gap-2 text-sm font-medium text-gray-600'>
					<BookOpen className='h-4 w-4' />
					Bài viết
				</span>
				<span className='font-heading text-sm font-extrabold text-black'>
					{profile.posts_count}
				</span>
			</div>
			<div className='flex items-center justify-between'>
				<span className='flex items-center gap-2 text-sm font-medium text-gray-600'>
					<Users className='h-4 w-4' />
					Người theo dõi
				</span>
				<span className='font-heading text-sm font-extrabold text-black'>
					{profile.followers_count}
				</span>
			</div>
			<div className='flex items-center justify-between'>
				<span className='flex items-center gap-2 text-sm font-medium text-gray-600'>
					<Heart className='h-4 w-4' />
					Lượt thích
				</span>
				<span className='font-heading text-sm font-extrabold text-black'>
					{profile.likes_count}
				</span>
			</div>
		</div>
	</div>
);

// ─── Skills Card ──────────────────────────────────────────────────────────────

const PASTEL_COLORS = [
	"var(--color-pastel-green)",
	"var(--color-pastel-blue)",
	"var(--color-pastel-pink)",
	"var(--color-pastel-yellow)",
	"var(--color-pastel-purple)",
	"var(--color-pastel-orange)",
];

interface SkillsCardProps {
	skills: string[];
}

const SkillsCard: React.FC<SkillsCardProps> = ({ skills }) => {
	if (skills.length === 0) return null;
	return (
		<div className='rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_#111]'>
			<h2 className='mb-4 font-heading text-base font-extrabold text-black'>Kỹ năng</h2>
			<div className='flex flex-wrap gap-2'>
				{skills.map((skill, i) => (
					<span
						key={skill}
						className='rounded-lg border-2 border-black px-3 py-1 text-xs font-bold text-black'
						style={{ background: PASTEL_COLORS[i % PASTEL_COLORS.length] }}>
						{skill}
					</span>
				))}
			</div>
		</div>
	);
};

// ─── Profile Header ───────────────────────────────────────────────────────────

interface ProfileHeaderProps {
	profile: UserProfile;
	isOwnProfile: boolean;
	followed: boolean;
	onFollow: () => void;
	onUpdated?: (p: UserProfile) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
	profile,
	isOwnProfile,
	followed,
	onFollow,
	onUpdated,
}) => {
	const handle = getHandle(profile.username, profile.email);
	const avatar = buildAvatar(profile.full_name, profile.avatar);
	const joinYear = new Date(profile.created_at).getFullYear();

	const avatarInputRef = useRef<HTMLInputElement>(null);
	const coverInputRef = useRef<HTMLInputElement>(null);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [uploadingCover, setUploadingCover] = useState(false);

	const DEFAULT_BANNER = "https://www.codedex.io/images/css/banner-v2.png";
	const coverBg = profile.cover_image || DEFAULT_BANNER;

	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploadingAvatar(true);
		try {
			const fd = new FormData();
			fd.append("avatar", file);
			const res = await api.postForm<ApiResponse<UserProfile>>("/users/profile", fd);
			onUpdated?.(res.data);
			toast.success("Đã cập nhật ảnh đại diện!");
		} catch {
			toast.error("Không thể cập nhật ảnh. Vui lòng thử lại.");
		} finally {
			setUploadingAvatar(false);
			e.target.value = "";
		}
	};

	const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploadingCover(true);
		try {
			const fd = new FormData();
			fd.append("cover_image", file);
			const res = await api.postForm<ApiResponse<UserProfile>>("/users/profile", fd);
			onUpdated?.(res.data);
			toast.success("Đã cập nhật ảnh bìa!");
		} catch {
			toast.error("Không thể cập nhật ảnh bìa. Vui lòng thử lại.");
		} finally {
			setUploadingCover(false);
			e.target.value = "";
		}
	};

	return (
		<div className='overflow-hidden'>
			{/* ── Banner ─────────────────────────────────────────────── */}
			<div
				className={`relative h-40 overflow-hidden sm:h-48 md:h-55 ${isOwnProfile ? "cursor-pointer group" : ""}`}
				onClick={() => isOwnProfile && !uploadingCover && coverInputRef.current?.click()}>
				<img
					src={coverBg}
					alt='Ảnh bìa'
					className='h-full w-full object-cover sm:rounded-xl'
				/>
				{isOwnProfile && (
					<>
						<div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 sm:rounded-2xl'>
							{uploadingCover ? (
								<Loader2 className='h-6 w-6 animate-spin text-white' />
							) : (
								<>
									<ImagePlus className='h-6 w-6 text-white' />
									<span className='text-sm font-bold text-white'>
										Cập nhật ảnh bìa
									</span>
								</>
							)}
						</div>
						<input
							ref={coverInputRef}
							type='file'
							accept='image/*'
							className='hidden'
							onChange={handleCoverUpload}
						/>
					</>
				)}
			</div>

			{/* ── Avatar row + button ─────────────────────────────────── */}
			<div className='bg-white pb-5'>
				<div className='relative -mt-12 flex items-end justify-between gap-3 sm:-mt-16 md:-mt-[5rem]'>
					{/* Avatar with edit overlay */}
					<div className='px-6'>
						<div
							className={`relative rounded-full border-6 border-white shrink-0 ${isOwnProfile ? "cursor-pointer group" : ""}`}
							onClick={() =>
								isOwnProfile && !uploadingAvatar && avatarInputRef.current?.click()
							}>
							<img
								src={avatar}
								alt={profile.full_name}
								className='h-24 w-24 rounded-full bg-[var(--color-pastel-blue)] object-cover sm:h-32 sm:w-32 md:h-36 md:w-36'
							/>
							{isOwnProfile && (
								<>
									<div className='absolute inset-0 flex cursor-pointer flex-col items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
										{uploadingAvatar ? (
											<Loader2 className='h-5 w-5 animate-spin text-white' />
										) : (
											<>
												<Camera className='h-5 w-5 text-white' />
												<span className='mt-0.5 text-[10px] font-bold text-white'>
													Đổi ảnh
												</span>
											</>
										)}
									</div>
									<input
										ref={avatarInputRef}
										type='file'
										accept='image/*'
										className='hidden'
										onChange={handleAvatarUpload}
									/>
								</>
							)}
						</div>
					</div>

					<div className='absolute bottom-0 right-6 shrink-0 sm:static sm:px-1'>
						{/* Edit / Follow button */}
						{isOwnProfile ? (
							<Link
								to='/tai-khoan?tabIndex=0'
								className='inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-black bg-white px-3 py-2 text-xs font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none sm:px-4 sm:text-sm'>
								<UserPen className='h-4 w-4' />
								Chỉnh sửa hồ sơ
							</Link>
						) : (
							<button
								onClick={onFollow}
								className={`inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-black px-3 py-2 text-xs font-extrabold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition hover:bg-white shadow-[3px_3px_0_#111] sm:px-4 sm:text-sm ${
									followed
										? "bg-white text-black shadow-none translate-x-[1px] translate-y-[1px]"
										: "bg-[var(--color-primary)] text-black"
								}`}>
								{followed ? (
									<>
										<UserCheck className='h-4 w-4' />
										Đang theo dõi
									</>
								) : (
									<>
										<UserPlus className='h-4 w-4' />
										Theo dõi
									</>
								)}
							</button>
						)}
					</div>
				</div>

				{/* ── Profile info ────────────────────────────────────── */}
				<div className='mt-5 px-6 sm:px-0'>
					<h1 className='font-heading text-3xl font-extrabold leading-tight text-black sm:text-4xl'>
						{profile.full_name}
					</h1>
					<p className='text-sm font-medium text-gray-500'>{handle}</p>

					{profile.bio && (
						<p className='mt-2 hidden text-sm leading-relaxed text-gray-700 sm:block'>
							{profile.bio}
						</p>
					)}

					<div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500'>
						{profile.major && (
							<span className='hidden items-center gap-1.5 sm:flex'>
								<GraduationCap className='h-4 w-4 shrink-0' />
								{profile.major}
							</span>
						)}
						{profile.class_name && (
							<span className='hidden items-center gap-1.5 sm:flex'>
								<BookOpenText className='h-4 w-4 shrink-0' />
								{profile.class_name}
							</span>
						)}
						<span className='flex items-center gap-1.5'>
							<Calendar className='h-4 w-4 shrink-0' />
							Tham gia {joinYear}
						</span>
					</div>

					<div className='mt-3 flex items-center gap-5 text-sm'>
						<button className='flex items-center gap-1 font-bold text-black hover:underline'>
							<span className='font-extrabold'>{profile.followers_count}</span>
							<span className='font-medium text-gray-500'>Người theo dõi</span>
						</button>
						<button className='flex items-center gap-1 font-bold text-black hover:underline'>
							<span className='font-extrabold'>{profile.following_count}</span>
							<span className='font-medium text-gray-500'>Đang theo dõi</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// ─── Not Found ────────────────────────────────────────────────────────────────

const ProfileNotFound: React.FC<{ username: string }> = ({ username }) => {
	const navigate = useNavigate();
	return (
		<div className='flex flex-col items-center justify-center py-24 text-center'>
			<div className='mb-4 flex h-18 w-18 items-center justify-center rounded-full bg-gray-300 text-4xl'>
				<Search className='text-white' strokeWidth={4} />
			</div>
			<h1 className='font-heading text-2xl font-extrabold text-black'>
				Không tìm thấy người dùng
			</h1>
			<p className='mt-2 text-gray-500'>
				Không có tài khoản nào với tên{" "}
				<span className='font-bold text-black'>@{username}</span>.
			</p>
			<button
				onClick={() => navigate(-1)}
				className='mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
				Quay lại
			</button>
		</div>
	);
};

// ─── Tab Content: Posts ───────────────────────────────────────────────────────

interface UserPostsTabProps {
	username: string;
	user: AuthUser | null;
}

const UserPostsTab: React.FC<UserPostsTabProps> = ({ username, user }) => {
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(false);

		userService
			.getUserPosts(username)
			.then((res) => {
				if (!cancelled) setPosts(res.data);
			})
			.catch(() => {
				if (!cancelled) setError(true);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [username]);

	if (loading) {
		return (
			<div className='mt-5 space-y-5 px-6 sm:px-0'>
				{Array.from({ length: 3 }).map((_, i) => (
					<PostSkeleton key={i} />
				))}
			</div>
		);
	}

	if (error || posts.length === 0) {
		return (
			<div className='mx-6 mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-16 text-center sm:mx-0'>
				<FileText className='mx-auto mb-4 h-10 w-10 text-gray-300' />
				<p className='font-heading text-base font-extrabold text-black'>
					{error ? "Không thể tải bài viết" : "Chưa có bài viết nào"}
				</p>
				<p className='mt-1 text-sm text-gray-400'>
					{error ? "Vui lòng thử lại sau." : "Người dùng này chưa đăng bài viết nào."}
				</p>
			</div>
		);
	}

	return (
		<div className='mt-5 mb-5 space-y-5 px-6 sm:px-0'>
			{posts.map((post) => (
				<PostCard key={post.id} post={post} user={user} />
			))}
		</div>
	);
};

// ─── Compact Post Card (for horizontal carousel) ─────────────────────────────

interface PostCardCompactProps {
	post: Post;
	user: AuthUser | null;
}

const PostCardCompact: React.FC<PostCardCompactProps> = ({ post, user }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const authorName = post.user?.full_name ?? "Ẩn danh";
	const authorAvatar = buildAvatar(post.user?.full_name, post.user?.avatar);
	const authorProfileUrl = post.user
		? buildProfileUrl(post.user.username, post.user.email)
		: null;
	const detailUrl = `/cong-dong/bai-viet/${post.id}`;
	const sourceContent = post.content ?? post.excerpt;
	const preview = sourceContent ? renderMarkdownPreview(sourceContent, 100) : null;

	const [liked, setLiked] = useState(post.my_reaction === "heart");
	const [heartCount, setHeartCount] = useState(post.reactions_count);
	const [loading, setLoading] = useState(false);

	const handleLike = async (e: React.MouseEvent) => {
		e.preventDefault();
		if (!user) {
			navigate("/login", { state: { from: location.pathname } });
			return;
		}
		if (loading) return;
		const wasLiked = liked;
		setLiked(!wasLiked);
		setHeartCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
		setLoading(true);
		try {
			const res = await postService.toggleReaction(post.id, "heart");
			setLiked(res.data.my_reaction === "heart");
			setHeartCount(res.data.reactions_count);
		} catch {
			setLiked(wasLiked);
			setHeartCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
		} finally {
			setLoading(false);
		}
	};

	return (
		<article className='flex w-68 shrink-0 flex-col rounded-2xl border-2 border-black bg-white'>
			{/* Header */}
			<div className='flex items-center gap-2 px-4 pt-4 pb-2 cursor-pointer'>
				<Link
					to={authorProfileUrl ?? "#"}
					onClick={(e) => !authorProfileUrl && e.preventDefault()}
					className='shrink-0'>
					<img
						src={authorAvatar}
						alt={authorName}
						className='h-8 w-8 rounded-full border-2 border-black object-cover'
					/>
				</Link>
				<div className='min-w-0 flex-1'>
					<Link
						to={authorProfileUrl ?? "#"}
						onClick={(e) => !authorProfileUrl && e.preventDefault()}
						className='block truncate font-heading text-xs font-extrabold text-black hover:underline'>
						{authorName}
					</Link>
					<p className='text-[11px] text-gray-400'>
						{formatRelativeTime(post.created_at)}
					</p>
				</div>
			</div>

			{post.channel && (
				<p className='px-4 pb-1 text-[11px] font-bold text-lime-700'>
					#{post.channel.name}
				</p>
			)}

			{/* Body */}
			<Link to={detailUrl} className='flex min-h-0 flex-1 flex-col px-4 pb-3'>
				<h3 className='font-heading text-sm font-extrabold leading-snug text-black line-clamp-2 mb-2 hover:underline'>
					{post.title}
				</h3>

				{post.featured_image && !isVideoMediaUrl(post.featured_image) ? (
					<div className='mt-1 overflow-hidden rounded-lg border-2 border-black'>
						<img
							src={post.featured_image}
							alt={post.title}
							className='aspect-[16/9] w-full object-cover'
						/>
					</div>
				) : preview?.html ? (
					<div
						className='community-markdown text-xs text-gray-600 line-clamp-3'
						dangerouslySetInnerHTML={{ __html: preview.html }}
					/>
				) : null}
			</Link>

			{/* Footer */}
			<div className='flex items-center gap-3 border-t-2 border-black px-4 py-2.5'>
				<button
					onClick={handleLike}
					disabled={loading}
					className={`inline-flex items-center gap-1.5 text-xs font-bold transition disabled:opacity-60 ${
						liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
					}`}>
					<Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
					{heartCount}
				</button>
				<Link
					to={detailUrl}
					className='inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black'>
					<MessageCircle className='h-4 w-4' />
					{post.comments_count}
				</Link>
				<button
					className='ml-auto text-gray-400 transition hover:text-black'
					aria-label='Chia sẻ'>
					<Share2 className='h-4 w-4' />
				</button>
			</div>
		</article>
	);
};

// ─── Post Carousel ────────────────────────────────────────────────────────────

interface PostCarouselProps {
	posts: Post[];
	user: AuthUser | null;
	onShowAll: () => void;
}

const PostCarousel: React.FC<PostCarouselProps> = ({ posts, user, onShowAll }) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	const updateScrollShadows = () => {
		const el = scrollRef.current;
		if (!el) return;

		const maxScrollLeft = el.scrollWidth - el.clientWidth;
		setCanScrollLeft(el.scrollLeft > 4);
		setCanScrollRight(el.scrollLeft < maxScrollLeft - 4);
	};

	const scroll = (dir: "left" | "right") => {
		scrollRef.current?.scrollBy({
			left: dir === "right" ? 288 : -288,
			behavior: "smooth",
		});
	};

	useEffect(() => {
		updateScrollShadows();
		window.addEventListener("resize", updateScrollShadows);

		return () => {
			window.removeEventListener("resize", updateScrollShadows);
		};
	}, [posts]);

	return (
		<div>
			<div className='mb-4 flex items-center justify-between'>
				<h1 className='font-heading font-extrabold text-black text-2xl'>Posts</h1>
				<div className='flex items-center gap-2'>
					<button
						onClick={() => scroll("left")}
						className='flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
						aria-label='Cuộn trái'>
						<ChevronLeft className='h-4 w-4' />
					</button>
					<button
						onClick={() => scroll("right")}
						className='flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
						aria-label='Cuộn phải'>
						<ChevronRight className='h-4 w-4' />
					</button>
				</div>
			</div>

			{/* Scrollable row — hidden scrollbar */}
			<div className='relative'>
				{canScrollLeft && (
					<div className='pointer-events-none absolute inset-y-0 left-0 z-10 w-20 sm:w-40 bg-gradient-to-r from-white via-white/20 to-transparent' />
				)}
				{canScrollRight && (
					<div className='pointer-events-none absolute inset-y-0 right-0 z-10 w-28 sm:w-48 bg-gradient-to-l from-white via-white/20 to-transparent' />
				)}
				<div
					ref={scrollRef}
					onScroll={updateScrollShadows}
					className='no-scrollbar flex gap-4 overflow-x-auto pb-2'>
					{posts.map((post) => (
						<PostCardCompact key={post.id} post={post} user={user} />
					))}
				</div>
			</div>

			{/* Show all button */}
			<div className='mt-5 flex justify-center'>
				<button
					onClick={onShowAll}
					className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-6 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					Xem tất cả Posts
					<ChevronRight className='h-4 w-4' />
				</button>
			</div>
		</div>
	);
};

// ─── Tab Content: Overview ────────────────────────────────────────────────────

interface OverviewTabProps {
	profile: UserProfile;
	user: AuthUser | null;
	onSwitchToPostsTab: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ profile, user, onSwitchToPostsTab }) => {
	const [recentPosts, setRecentPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		userService
			.getUserPosts(profile.username ?? profile.email.split("@")[0], 1)
			.then((res) => {
				if (!cancelled) setRecentPosts(res.data.slice(0, 6));
			})
			.catch(() => {
				if (!cancelled) setRecentPosts([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [profile]);

	return (
		<div className='mt-5 mb-5 px-6 sm:px-0'>
			{/* Recent posts carousel */}
			{loading ? (
				<div>
					<div className='mb-4 flex items-center justify-between'>
						<div className='h-5 w-40 animate-pulse rounded bg-gray-200' />
						<div className='flex gap-2'>
							<div className='h-8 w-8 animate-pulse rounded-lg bg-gray-200' />
							<div className='h-8 w-8 animate-pulse rounded-lg bg-gray-200' />
						</div>
					</div>
					<div className='no-scrollbar flex gap-4 overflow-x-hidden pb-2'>
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className='h-56 w-68 shrink-0 animate-pulse rounded-2xl border-2 border-black bg-gray-200'
							/>
						))}
					</div>
				</div>
			) : recentPosts.length > 0 ? (
				<PostCarousel posts={recentPosts} user={user} onShowAll={onSwitchToPostsTab} />
			) : (
				<div className='rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-16 text-center'>
					<LayoutGrid className='mx-auto mb-4 h-10 w-10 text-gray-300' />
					<p className='font-heading text-base font-extrabold text-black'>
						Chưa có bài viết nào
					</p>
					<p className='mt-1 text-sm text-gray-400'>
						Người dùng này chưa đăng bài viết nào.
					</p>
				</div>
			)}
		</div>
	);
};

// ─── Tab Content: Saved ───────────────────────────────────────────────────────

const BookmarksTab: React.FC = () => (
	<div className='mt-5 mb-5 px-6 sm:px-0'>
		<div className='rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-16 text-center'>
			<Bookmark className='mx-auto mb-4 h-10 w-10 text-gray-300' />
			<p className='font-heading text-base font-extrabold text-black'>
				Chưa có bài viết nào được lưu
			</p>
			<p className='mt-1 text-sm text-gray-400'>Những bài viết được lưu sẽ hiển thị ở đây.</p>
		</div>
	</div>
);

// ─── UserProfilePage ──────────────────────────────────────────────────────────

type Tab = "overview" | "posts" | "bookmarks";

type TabDef = { id: Tab; label: string; icon: React.ElementType };

const BASE_TABS: TabDef[] = [
	{ id: "overview", label: "Tổng quan", icon: LayoutGrid },
	{ id: "posts", label: "Posts", icon: FileText },
];

const BOOKMARKS_TAB: TabDef = { id: "bookmarks", label: "Đã lưu", icon: Bookmark };

const UserProfilePage: React.FC = () => {
	const { username: rawParam } = useParams<{ username: string }>();
	// Strip leading "@" so both "/@ch-hnhu" and "/ch-hnhu" resolve to the same profile
	const username = rawParam?.replace(/^@/, "");
	const { user } = useOutletContext<{ user: AuthUser | null }>();

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [followed, setFollowed] = useState(false);

	// ── Tab state synced with URL ?tab= query param ──────────────────────────
	const [searchParams, setSearchParams] = useSearchParams();
	const tabParam = searchParams.get("tab") ?? "";
	const activeTab: Tab =
		tabParam === "posts" ? "posts" : tabParam === "bookmarks" ? "bookmarks" : "overview";
	const previousUsernameRef = useRef<string | undefined>(undefined);

	const setActiveTab = (tab: Tab) => {
		if (tab === "overview") {
			setSearchParams({}, { replace: true });
		} else {
			setSearchParams({ tab }, { replace: true });
		}
	};

	// Derive the handle the current user would own (same logic as buildProfileUrl / Navbar links)
	const myHandle = user ? buildProfileUrl(user.username, user.email).replace(/^\/@/, "") : null;
	const isOwnProfile = Boolean(
		user &&
		username &&
		// Handle-based match: works even when profile API returns stub data
		((myHandle && myHandle === username) ||
			// DB-level match: works once the real profile is loaded
			(profile && (String(user.id) === String(profile.id) || user.email === profile.email))),
	);

	// When navigating to a different profile, clear ?tab= so overview is shown.
	useEffect(() => {
		if (previousUsernameRef.current && previousUsernameRef.current !== username) {
			setSearchParams({}, { replace: true });
		}
		previousUsernameRef.current = username;
	}, [username]); // eslint-disable-line react-hooks/exhaustive-deps

	// Guard: if someone manually types ?tab=bookmarks on another user's profile,
	// redirect to overview once we know it's not their own profile.
	useEffect(() => {
		if (!loading && activeTab === "bookmarks" && !isOwnProfile) {
			setSearchParams({}, { replace: true });
		}
	}, [loading, activeTab, isOwnProfile]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!username) return;
		let cancelled = false;
		setLoading(true);
		setNotFound(false);
		setProfile(null);

		userService
			.getProfile(username)
			.then((res) => {
				if (!cancelled) setProfile(res.data);
			})
			.catch((err) => {
				if (!cancelled) {
					// Only show "not found" page when the API explicitly returns 404
					// with a user-not-found message. Route-level 404 (endpoint missing)
					// falls through to a stub so the layout is visible during development.
					const status = err?.response?.status;
					const message: string = err?.response?.data?.message ?? "";
					const isUserNotFound =
						status === 404 && /not.found|không.tìm.thấy/i.test(message);

					if (isUserNotFound) {
						setNotFound(true);
					} else {
						setProfile({
							id: 0,
							full_name: username,
							username,
							email: `${username}@ckc.edu.vn`,
							avatar: null,
							cover_image: null,
							bio: "Thành viên CKC IT CLUB.",
							student_code: "2200000",
							faculty_id: null,
							faculty: "Công nghệ thông tin",
							major_id: null,
							major: "Lập trình máy tính",
							class_id: null,
							class_name: "22CNTT1",
							gender: null,
							date_of_birth: null,
							is_active: true,
							posts_count: 12,
							likes_count: 0,
							followers_count: 85,
							following_count: 3,
							skills: ["JavaScript", "React", "Laravel", "Python"],
							social_github: null,
							social_linkedin: null,
							social_instagram: null,
							social_youtube: null,
							social_tiktok: null,
							social_twitch: null,
							created_at: "2022-09-01T00:00:00Z",
						});
					}
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [username]);

	if (loading) {
		return (
			<div className='w-full min-h-screen pt-16'>
				<div className='neo-container px-0 py-0 sm:px-4 sm:py-8 md:px-6'>
					<div className='flex gap-6'>
						<div className='min-w-0 flex-1'>
							<ProfileSkeleton />
						</div>
						<ProfileSidebarSkeleton />
					</div>
				</div>
			</div>
		);
	}

	if (notFound || !username) {
		return (
			<div className='w-full min-h-screen pt-16'>
				<div className='neo-container px-4 md:px-6'>
					<ProfileNotFound username={username ?? ""} />
				</div>
			</div>
		);
	}

	if (!profile) return null;

	return (
		<div className='w-full min-h-screen pt-16'>
			<div className='neo-container px-0 py-0 sm:px-4 sm:py-8 md:px-6'>
				<div className='flex gap-6'>
					{/* ── Main content ── */}
					<div className='min-w-0 flex-1'>
						<ProfileHeader
							profile={profile}
							isOwnProfile={isOwnProfile}
							followed={followed}
							onFollow={() => setFollowed((f) => !f)}
							onUpdated={(updated) => setProfile(updated)}
						/>

						{/* Tabs — "Đã lưu" only visible on own profile */}
						{(() => {
							const tabs: TabDef[] = isOwnProfile
								? [...BASE_TABS, BOOKMARKS_TAB]
								: BASE_TABS;
							const badgeCount: Partial<Record<Tab, number>> = {
								posts: profile.posts_count,
							};
							return (
								<div className='mx-6 mt-6 border-b-2 border-slate-200 sm:mx-0'>
									<nav className='flex gap-2 sm:gap-4'>
										{tabs.map((tab) => {
											const isActive = activeTab === tab.id;
											const Icon = tab.icon;
											const count = badgeCount[tab.id];
											return (
												<button
													key={tab.id}
													onClick={() => setActiveTab(tab.id)}
													className={`group relative inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 px-3 pb-2 text-md transition-colors duration-200 md:text-lg ${
														isActive
															? "font-bold text-slate-950"
															: "font-medium text-slate-500 hover:text-slate-950"
													}`}
													style={{ fontFamily: "var(--font-body)" }}>
													<Icon className='h-4 w-4 shrink-0' />
													<span>{tab.label}</span>
													{count !== undefined && count > 0 && (
														<span className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-bold leading-none text-slate-500'>
															{count}
														</span>
													)}
													<span
														className={`absolute -bottom-[2px] left-0 h-1 w-full bg-primary transition-transform duration-200 group-hover:scale-x-100 ${
															isActive ? "scale-x-100" : "scale-x-0"
														}`}
													/>
												</button>
											);
										})}
									</nav>
								</div>
							);
						})()}

						{/* Tab content */}
						{activeTab === "overview" ? (
							<OverviewTab
								profile={profile}
								user={user}
								onSwitchToPostsTab={() => setActiveTab("posts")}
							/>
						) : activeTab === "bookmarks" ? (
							<BookmarksTab />
						) : (
							<UserPostsTab username={username} user={user} />
						)}
					</div>

					{/* ── Sidebar ── */}
					<aside className='hidden w-72 shrink-0 self-start sticky top-24 lg:block'>
						<div className='space-y-5'>
							<StatsCard profile={profile} />

							{/* Member info card */}
							<div className='rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_#111]'>
								<h2 className='mb-4 font-heading text-base font-extrabold text-black'>
									Thông tin thành viên
								</h2>
								<div className='space-y-2.5 text-sm'>
									{profile.student_code && (
										<div className='flex items-center justify-between'>
											<span className='text-gray-500'>MSSV</span>
											<span className='font-bold text-black'>
												{profile.student_code}
											</span>
										</div>
									)}
									{profile.faculty && (
										<div className='flex items-center justify-between'>
											<span className='text-gray-500'>Khoa</span>
											<span className='max-w-[60%] text-right font-bold text-black'>
												{profile.faculty}
											</span>
										</div>
									)}
									{profile.major && (
										<div className='flex items-center justify-between'>
											<span className='text-gray-500'>Ngành</span>
											<span className='max-w-[60%] text-right font-bold text-black'>
												{profile.major}
											</span>
										</div>
									)}
									{profile.class_name && (
										<div className='flex items-center justify-between'>
											<span className='text-gray-500'>Lớp</span>
											<span className='font-bold text-black'>
												{profile.class_name}
											</span>
										</div>
									)}
									<div className='flex items-center justify-between border-t-2 border-dashed border-gray-200 pt-2'>
										<span className='text-gray-500'>Tham gia</span>
										<span className='font-bold text-black'>
											{new Date(profile.created_at).toLocaleDateString(
												"vi-VN",
												{
													day: "numeric",
													month: "short",
													year: "numeric",
												},
											)}
										</span>
									</div>
								</div>
							</div>

							<SkillsCard skills={profile.skills} />

							{/* Share profile */}
							<button
								onClick={() => {
									navigator.clipboard.writeText(window.location.href);
								}}
								className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
								<Share2 className='h-4 w-4' />
								Sao chép liên kết hồ sơ
							</button>
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
};

export default UserProfilePage;
