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
	Archive,
	Bookmark,
	BookOpen,
	BookOpenText,
	Calendar,
	Camera,
	Check,
	ChevronLeft,
	ChevronRight,
	FileText,
	GraduationCap,
	Heart,
	ImagePlus,
	LayoutGrid,
	Loader2,
	MessageCircle,
	Pin,
	Plus,
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
import { blogService } from "@/services/blog.service";
import type { ApiResponse } from "@/types/api.types";
import type { Blog } from "@/types/blog.types";
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
import BlogCard from "@/components/community/BlogCard";
import PostCard from "@/components/community/PostCard";

const sortPinnedFirst = <T extends { is_pinned?: boolean }>(items: T[]): T[] =>
	[...items].sort((a, b) => Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned)));

type PostMutationReason = "archived" | "restored" | "deleted";

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
					{profile.content_count}
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
	followLoading: boolean;
	onFollow: () => void;
	onUpdated?: (p: UserProfile) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
	profile,
	isOwnProfile,
	followed,
	followLoading,
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
								disabled={followLoading}
								className={`inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-black px-3 py-2 text-xs font-extrabold transition hover:bg-white hover:shadow-none sm:px-4 sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed ${
									followed
										? "bg-white text-black shadow-none translate-x-[1px] translate-y-[1px]"
										: "bg-[var(--color-primary)] text-black shadow-[3px_3px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px]"
								}`}>
								{followLoading ? (
									<Loader2 className='h-4 w-4 animate-spin' />
								) : followed ? (
									<UserCheck className='h-4 w-4' />
								) : (
									<UserPlus className='h-4 w-4' />
								)}
								{followed ? "Đang theo dõi" : "Theo dõi"}
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
	isOwnProfile: boolean;
	onPostDeleted?: (id: number, reason?: PostMutationReason) => void;
}

const UserPostsTab: React.FC<UserPostsTabProps> = ({
	username,
	user,
	isOwnProfile,
	onPostDeleted,
}) => {
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
				if (!cancelled) setPosts(sortPinnedFirst(res.data));
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
					{error
						? "Vui lòng thử lại sau."
						: isOwnProfile
							? "Bạn chưa đăng bài viết nào."
							: "Người dùng này chưa đăng bài viết nào."}
				</p>
				{!error && isOwnProfile && (
					<Link
						to='/cong-dong/dang-bai'
						className='mt-5 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-primary px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						<Plus className='h-4 w-4' />
						Tạo bài viết
					</Link>
				)}
			</div>
		);
	}

	return (
		<div className='mt-5 mb-5 space-y-5 px-6 sm:px-0'>
			{posts.map((post) => (
				<PostCard
					key={post.id}
					post={post}
					user={user}
					showPinnedBadge
					onPostDeleted={(id, reason) => {
						setPosts((prev) => prev.filter((p) => p.id !== id));
						onPostDeleted?.(id, reason);
					}}
				/>
			))}
		</div>
	);
};

// ─── Tab Content: Blogs ───────────────────────────────────────────────────────

interface UserBlogsTabProps {
	username: string;
	isOwnProfile: boolean;
}

const UserBlogsTab: React.FC<UserBlogsTabProps> = ({ username, isOwnProfile }) => {
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(false);

		userService
			.getUserBlogs(username)
			.then((res) => {
				if (!cancelled) setBlogs(sortPinnedFirst(res.data));
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
			<div className='mt-5 grid gap-5 px-6 sm:grid-cols-2 sm:px-0'>
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className='h-80 animate-pulse rounded-2xl border-2 border-black bg-gray-200'
					/>
				))}
			</div>
		);
	}

	if (error || blogs.length === 0) {
		return (
			<div className='mx-6 mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-16 text-center sm:mx-0'>
				<BookOpen className='mx-auto mb-4 h-10 w-10 text-gray-300' />
				<p className='font-heading text-base font-extrabold text-black'>
					{error ? "Không thể tải blog" : "Chưa có blog nào"}
				</p>
				<p className='mt-1 text-sm text-gray-400'>
					{error
						? "Vui lòng thử lại sau."
						: isOwnProfile
							? "Bạn chưa đăng blog nào."
							: "Người dùng này chưa đăng blog nào."}
				</p>
				{!error && isOwnProfile && (
					<Link
						to='/blog/dang-bai'
						className='mt-5 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-primary px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						<Plus className='h-4 w-4' />
						Tạo blog
					</Link>
				)}
			</div>
		);
	}

	return (
		<div className='mt-5 mb-5 grid gap-5 px-6 sm:grid-cols-2 sm:px-0'>
			{blogs.map((blog) => (
				<BlogCard key={blog.id} blog={blog} showPinnedBadge />
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
	const [copiedLink, setCopiedLink] = useState(false);

	const handleCopyLink = async (e: React.MouseEvent) => {
		e.preventDefault();
		const url = `${window.location.origin}${detailUrl}`;
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(url);
			} else {
				const ta = document.createElement("textarea");
				ta.value = url;
				ta.style.cssText = "position:fixed;top:-9999px;left:-9999px";
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				document.body.removeChild(ta);
			}
			setCopiedLink(true);
			setTimeout(() => setCopiedLink(false), 2000);
		} catch {
			// silently fail
		}
	};

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
		<article className='relative flex w-68 shrink-0 flex-col rounded-2xl border-2 border-black bg-white'>
			{post.is_pinned && (
				<span
					className='absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-primary text-black shadow-[2px_2px_0_#111]'
					aria-label='Bài viết đã ghim'
					title='Bài viết đã ghim'>
					<Pin className='h-4 w-4' />
				</span>
			)}

			{/* Header */}
			<div className='flex items-center gap-2 px-4 pt-4 pb-2 pr-12 cursor-pointer'>
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
					onClick={handleCopyLink}
					className='ml-auto text-gray-400 transition hover:text-black'
					aria-label='Sao chép liên kết bài viết'
					title={copiedLink ? "Đã sao chép!" : "Sao chép liên kết"}>
					{copiedLink ? (
						<Check className='h-4 w-4 text-lime-600' />
					) : (
						<Share2 className='h-4 w-4' />
					)}
				</button>
			</div>
		</article>
	);
};

// ─── Post Carousel ────────────────────────────────────────────────────────────

interface PostCarouselProps {
	posts: Post[];
	user: AuthUser | null;
	isOwnProfile: boolean;
	onShowAll: () => void;
}

const PostCarousel: React.FC<PostCarouselProps> = ({ posts, user, isOwnProfile, onShowAll }) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const showArrows = posts.length > 3;

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
		return () => window.removeEventListener("resize", updateScrollShadows);
	}, [posts]);

	return (
		<div>
			<div className='mb-4 flex items-center justify-between'>
				<h1 className='font-heading font-extrabold text-black text-2xl'>Posts</h1>
				{showArrows && (
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
				)}
			</div>

			{posts.length === 0 ? (
				<div className='rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-12 text-center'>
					<p className='text-sm text-gray-500'>
						{isOwnProfile
							? "Bạn chưa đăng bài viết nào."
							: "Người dùng này chưa đăng bài viết nào."}
					</p>
					{isOwnProfile && (
						<Link
							to='/cong-dong/dang-bai'
							className='mt-4 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-primary px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							<Plus className='h-4 w-4' />
							Tạo bài viết
						</Link>
					)}
				</div>
			) : (
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
			)}

			{posts.length >= 6 && (
				<div className='mt-5 flex justify-center'>
					<button
						onClick={onShowAll}
						className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-6 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						Xem tất cả Posts
						<ChevronRight className='h-4 w-4' />
					</button>
				</div>
			)}
		</div>
	);
};

// ─── Blog Carousel ────────────────────────────────────────────────────────────

interface BlogCarouselProps {
	blogs: Blog[];
	isOwnProfile: boolean;
	onShowAll: () => void;
}

const BlogCarousel: React.FC<BlogCarouselProps> = ({ blogs, isOwnProfile, onShowAll }) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const showArrows = blogs.length > 3;

	const updateScrollShadows = () => {
		const el = scrollRef.current;
		if (!el) return;
		const maxScrollLeft = el.scrollWidth - el.clientWidth;
		setCanScrollLeft(el.scrollLeft > 4);
		setCanScrollRight(el.scrollLeft < maxScrollLeft - 4);
	};

	const scroll = (dir: "left" | "right") => {
		scrollRef.current?.scrollBy({
			left: dir === "right" ? 336 : -336,
			behavior: "smooth",
		});
	};

	useEffect(() => {
		updateScrollShadows();
		window.addEventListener("resize", updateScrollShadows);
		return () => window.removeEventListener("resize", updateScrollShadows);
	}, [blogs]);

	return (
		<div>
			<div className='mb-4 flex items-center justify-between'>
				<h1 className='font-heading font-extrabold text-black text-2xl'>Blogs</h1>
				{showArrows && (
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
				)}
			</div>

			{blogs.length === 0 ? (
				<div className='rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-12 text-center'>
					<p className='text-sm text-gray-500'>
						{isOwnProfile
							? "Bạn chưa đăng blog nào."
							: "Người dùng này chưa đăng blog nào."}
					</p>
					{isOwnProfile && (
						<Link
							to='/blog/dang-bai'
							className='mt-4 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-primary px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							<Plus className='h-4 w-4' />
							Tạo blog
						</Link>
					)}
				</div>
			) : (
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
						{blogs.map((blog) => (
							<div key={blog.id} className='w-72 shrink-0 sm:w-80'>
								<BlogCard blog={blog} showPinnedBadge />
							</div>
						))}
					</div>
				</div>
			)}

			{blogs.length >= 6 && (
				<div className='mt-5 flex justify-center'>
					<button
						onClick={onShowAll}
						className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-6 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						Xem tất cả Blogs
						<ChevronRight className='h-4 w-4' />
					</button>
				</div>
			)}
		</div>
	);
};

// ─── Tab Content: Overview ────────────────────────────────────────────────────

interface OverviewTabProps {
	profile: UserProfile;
	user: AuthUser | null;
	isOwnProfile: boolean;
	onSwitchToPostsTab: () => void;
	onSwitchToBlogTab: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
	profile,
	user,
	isOwnProfile,
	onSwitchToPostsTab,
	onSwitchToBlogTab,
}) => {
	const profileHandle = profile.username ?? profile.email.split("@")[0];
	const [recentPosts, setRecentPosts] = useState<Post[]>([]);
	const [recentBlogs, setRecentBlogs] = useState<Blog[]>([]);
	const [loadingPosts, setLoadingPosts] = useState(true);
	const [loadingBlogs, setLoadingBlogs] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoadingPosts(true);

		userService
			.getUserPosts(profileHandle, 1)
			.then((res) => {
				if (!cancelled) setRecentPosts(sortPinnedFirst(res.data).slice(0, 6));
			})
			.catch(() => {
				if (!cancelled) setRecentPosts([]);
			})
			.finally(() => {
				if (!cancelled) setLoadingPosts(false);
			});

		return () => {
			cancelled = true;
		};
	}, [profileHandle]);

	useEffect(() => {
		let cancelled = false;
		setLoadingBlogs(true);

		userService
			.getUserBlogs(profileHandle, 1)
			.then((res) => {
				if (!cancelled) setRecentBlogs(sortPinnedFirst(res.data).slice(0, 6));
			})
			.catch(() => {
				if (!cancelled) setRecentBlogs([]);
			})
			.finally(() => {
				if (!cancelled) setLoadingBlogs(false);
			});

		return () => {
			cancelled = true;
		};
	}, [profileHandle]);

	return (
		<div className='mt-5 mb-5 space-y-10 px-6 sm:px-0'>
			{/* Recent posts carousel */}
			{loadingPosts ? (
				<div>
					<div className='mb-4 flex items-center justify-between'>
						<div className='h-7 w-24 animate-pulse rounded bg-gray-200' />
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
			) : (
				<PostCarousel
					posts={recentPosts}
					user={user}
					isOwnProfile={isOwnProfile}
					onShowAll={onSwitchToPostsTab}
				/>
			)}

			{/* Recent blogs carousel */}
			{loadingBlogs ? (
				<div>
					<div className='mb-4 flex items-center justify-between'>
						<div className='h-7 w-16 animate-pulse rounded bg-gray-200' />
					</div>
					<div className='no-scrollbar flex gap-4 overflow-x-hidden pb-2'>
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className='h-80 w-72 shrink-0 animate-pulse rounded-2xl border-2 border-black bg-gray-200 sm:w-80'
							/>
						))}
					</div>
				</div>
			) : (
				<BlogCarousel
					blogs={recentBlogs}
					isOwnProfile={isOwnProfile}
					onShowAll={onSwitchToBlogTab}
				/>
			)}
		</div>
	);
};

// ─── Tab Content: Saved ───────────────────────────────────────────────────────

const BookmarksTab: React.FC<{ user: AuthUser | null }> = ({ user }) => {
	const [posts, setPosts] = useState<Post[]>([]);
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(false);

		Promise.all([userService.getBookmarks(), blogService.getBookmarkedBlogs()])
			.then(([postsRes, blogsRes]) => {
				if (!cancelled) {
					setPosts(postsRes.data);
					setBlogs(blogsRes.data);
				}
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
	}, []);

	if (loading) {
		return (
			<div className='mt-5 space-y-5 px-6 sm:px-0'>
				{Array.from({ length: 3 }).map((_, i) => (
					<PostSkeleton key={i} />
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className='mx-6 mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-16 text-center sm:mx-0'>
				<Bookmark className='mx-auto mb-4 h-10 w-10 text-gray-300' />
				<p className='font-heading text-base font-extrabold text-black'>
					Không thể tải danh sách đã lưu
				</p>
				<p className='mt-1 text-sm text-gray-400'>Vui lòng thử lại sau.</p>
			</div>
		);
	}

	const isEmpty = posts.length === 0 && blogs.length === 0;

	if (isEmpty) {
		return (
			<div className='mx-6 mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-16 text-center sm:mx-0'>
				<Bookmark className='mx-auto mb-4 h-10 w-10 text-gray-300' />
				<p className='font-heading text-base font-extrabold text-black'>
					Chưa có nội dung nào được lưu
				</p>
				<p className='mt-1 text-sm text-gray-400'>
					Bài viết và blog bạn lưu sẽ hiển thị ở đây.
				</p>
			</div>
		);
	}

	return (
		<div className='mt-5 mb-5 space-y-10 px-6 sm:px-0'>
			{posts.length > 0 && (
				<PostCarousel posts={posts} user={user} isOwnProfile={true} onShowAll={() => {}} />
			)}
			{blogs.length > 0 && (
				<BlogCarousel blogs={blogs} isOwnProfile={true} onShowAll={() => {}} />
			)}
		</div>
	);
};

// ─── Tab Content: Archived ────────────────────────────────────────────────────

const ArchivedTab: React.FC<{
	user: AuthUser | null;
}> = ({ user }) => {
	const [posts, setPosts] = useState<Post[]>([]);
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(false);

		Promise.all([postService.getArchivedPosts(), blogService.getArchivedBlogs()])
			.then(([postsRes, blogsRes]) => {
				if (!cancelled) {
					setPosts(postsRes.data);
					setBlogs(blogsRes.data);
				}
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
	}, []);

	if (loading) {
		return (
			<div className='mt-5 space-y-10 px-6 sm:px-0'>
				{[0, 1].map((i) => (
					<div key={i}>
						<div className='mb-4 flex items-center justify-between'>
							<div className='h-7 w-24 animate-pulse rounded bg-gray-200' />
						</div>
						<div className='no-scrollbar flex gap-4 overflow-x-hidden pb-2'>
							{Array.from({ length: 3 }).map((_, j) => (
								<div
									key={j}
									className='h-56 w-68 shrink-0 animate-pulse rounded-2xl border-2 border-black bg-gray-200'
								/>
							))}
						</div>
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className='mx-6 mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-16 text-center sm:mx-0'>
				<Archive className='mx-auto mb-4 h-10 w-10 text-gray-300' />
				<p className='font-heading text-base font-extrabold text-black'>
					Không thể tải nội dung lưu trữ
				</p>
				<p className='mt-1 text-sm text-gray-400'>Vui lòng thử lại sau.</p>
			</div>
		);
	}

	if (posts.length === 0 && blogs.length === 0) {
		return (
			<div className='mx-6 mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-16 text-center sm:mx-0'>
				<Archive className='mx-auto mb-4 h-10 w-10 text-gray-300' />
				<p className='font-heading text-base font-extrabold text-black'>
					Chưa có nội dung lưu trữ nào
				</p>
				<p className='mt-1 text-sm text-gray-400'>
					Bài viết và blog bạn lưu trữ sẽ hiển thị ở đây.
				</p>
			</div>
		);
	}

	return (
		<div className='mt-5 mb-5 space-y-10 px-6 sm:px-0'>
			{posts.length > 0 && (
				<PostCarousel
					posts={posts}
					user={user}
					isOwnProfile={true}
					onShowAll={() => {}}
				/>
			)}
			{blogs.length > 0 && (
				<BlogCarousel blogs={blogs} isOwnProfile={true} onShowAll={() => {}} />
			)}
		</div>
	);
};

// ─── UserProfilePage ──────────────────────────────────────────────────────────

type Tab = "overview" | "posts" | "blog" | "bookmarks" | "archived";

type TabDef = { id: Tab; label: string; icon: React.ElementType };

const BASE_TABS: TabDef[] = [
	{ id: "overview", label: "Tổng quan", icon: LayoutGrid },
	{ id: "posts", label: "Posts", icon: FileText },
	{ id: "blog", label: "Blogs", icon: BookOpen },
];

const BOOKMARKS_TAB: TabDef = { id: "bookmarks", label: "Đã lưu", icon: Bookmark };
const ARCHIVED_TAB: TabDef = { id: "archived", label: "Lưu trữ", icon: Archive };

const writeClipboardText = async (text: string) => {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.setAttribute("readonly", "");
	textarea.style.position = "fixed";
	textarea.style.top = "-9999px";
	document.body.appendChild(textarea);
	textarea.select();

	try {
		const copied = document.execCommand("copy");
		if (!copied) throw new Error("Copy command failed");
	} finally {
		document.body.removeChild(textarea);
	}
};

const UserProfilePage: React.FC = () => {
	const { username: rawParam } = useParams<{ username: string }>();
	// Strip leading "@" so both "/@ch-hnhu" and "/ch-hnhu" resolve to the same profile
	const username = rawParam?.replace(/^@/, "");
	const { user } = useOutletContext<{ user: AuthUser | null }>();

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [followed, setFollowed] = useState(false);
	const [followLoading, setFollowLoading] = useState(false);
	const [copiedProfileLink, setCopiedProfileLink] = useState(false);
	const copyResetTimeoutRef = useRef<number | null>(null);

	// ── Tab state synced with URL ?tab= query param ──────────────────────────
	const [searchParams, setSearchParams] = useSearchParams();
	const tabParam = searchParams.get("tab") ?? "";
	const activeTab: Tab =
		tabParam === "posts"
			? "posts"
			: tabParam === "blog"
				? "blog"
				: tabParam === "bookmarks"
					? "bookmarks"
					: tabParam === "archived"
						? "archived"
						: "overview";
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

	// Guard: if someone manually types ?tab=bookmarks or ?tab=archived on another user's profile,
	// redirect to overview once we know it's not their own profile.
	useEffect(() => {
		if (!loading && (activeTab === "bookmarks" || activeTab === "archived") && !isOwnProfile) {
			setSearchParams({}, { replace: true });
		}
	}, [loading, activeTab, isOwnProfile]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		return () => {
			if (copyResetTimeoutRef.current) {
				window.clearTimeout(copyResetTimeoutRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!username) return;
		let cancelled = false;
		setLoading(true);
		setNotFound(false);
		setProfile(null);

		userService
			.getProfile(username)
			.then((res) => {
				if (!cancelled) {
					setProfile(res.data);
					setFollowed(res.data.is_following ?? false);
				}
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
							blogs_count: 0,
							content_count: 12,
							likes_count: 0,
							followers_count: 85,
							following_count: 3,
							is_following: false,
							bookmarks_count: null,
							archived_count: null,
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

	const handleFollow = async () => {
		if (!user) {
			// Chưa đăng nhập → redirect về trang login
			window.location.href = "/login";
			return;
		}
		if (followLoading) return;
		// Optimistic update
		const wasFollowed = followed;
		setFollowed(!wasFollowed);
		setProfile((p) =>
			p
				? {
						...p,
						followers_count: wasFollowed
							? Math.max(0, p.followers_count - 1)
							: p.followers_count + 1,
					}
				: p,
		);
		setFollowLoading(true);
		try {
			const res = await userService.toggleFollow(username!);
			setFollowed(res.data.is_following);
			setProfile((p) => (p ? { ...p, followers_count: res.data.followers_count } : p));
		} catch {
			// Rollback
			setFollowed(wasFollowed);
			setProfile((p) =>
				p
					? {
							...p,
							followers_count: wasFollowed
								? p.followers_count + 1
								: Math.max(0, p.followers_count - 1),
						}
					: p,
			);
			toast.error("Không thể thực hiện. Vui lòng thử lại.");
		} finally {
			setFollowLoading(false);
		}
	};

	const handleCopyProfileLink = async () => {
		const profileUrl = `${window.location.origin}${buildProfileUrl(
			profile.username,
			profile.email,
		)}`;

		try {
			await writeClipboardText(profileUrl);
			setCopiedProfileLink(true);
			toast.success("Đã sao chép liên kết hồ sơ.");

			if (copyResetTimeoutRef.current) {
				window.clearTimeout(copyResetTimeoutRef.current);
			}
			copyResetTimeoutRef.current = window.setTimeout(() => {
				setCopiedProfileLink(false);
				copyResetTimeoutRef.current = null;
			}, 2000);
		} catch {
			toast.error("Không thể sao chép liên kết. Vui lòng thử lại.");
		}
	};

	const handlePublishedPostRemoved = (_id: number, reason?: PostMutationReason) => {
		if (reason !== "archived" && reason !== "deleted") return;

		setProfile((prev) =>
			prev
				? {
						...prev,
						posts_count: Math.max(0, prev.posts_count - 1),
						content_count: Math.max(0, prev.content_count - 1),
						archived_count:
							reason === "archived" && prev.archived_count != null
								? prev.archived_count + 1
								: prev.archived_count,
					}
				: prev,
		);
	};

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
							followLoading={followLoading}
							onFollow={handleFollow}
							onUpdated={(updated) => setProfile(updated)}
						/>

						{/* Tabs — "Đã lưu" and "Lưu trữ" only visible on own profile */}
						{(() => {
							const tabs: TabDef[] = isOwnProfile
								? [...BASE_TABS, BOOKMARKS_TAB, ARCHIVED_TAB]
								: BASE_TABS;
							const badgeCount: Partial<Record<Tab, number>> = {
								posts: profile.posts_count,
								blog: profile.blogs_count,
								...(profile.bookmarks_count != null
									? { bookmarks: profile.bookmarks_count }
									: {}),
								...(profile.archived_count != null
									? { archived: profile.archived_count }
									: {}),
							};
							return (
								<div className='mx-6 mt-6 border-b-2 border-slate-200 sm:mx-0'>
									<nav className='no-scrollbar flex gap-2 overflow-x-auto overflow-y-hidden sm:gap-4'>
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
								isOwnProfile={isOwnProfile}
								onSwitchToPostsTab={() => setActiveTab("posts")}
								onSwitchToBlogTab={() => setActiveTab("blog")}
							/>
						) : activeTab === "bookmarks" ? (
							<BookmarksTab user={user} />
						) : activeTab === "archived" ? (
							<ArchivedTab user={user} />
						) : activeTab === "blog" ? (
							<UserBlogsTab username={username} isOwnProfile={isOwnProfile} />
						) : (
							<UserPostsTab
								username={username}
								user={user}
								isOwnProfile={isOwnProfile}
								onPostDeleted={handlePublishedPostRemoved}
							/>
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
								type='button'
								onClick={handleCopyProfileLink}
								aria-label='Sao chép liên kết hồ sơ'
								className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
								{copiedProfileLink ? (
									<Check className='h-4 w-4 text-lime-600' />
								) : (
									<Share2 className='h-4 w-4' />
								)}
								{copiedProfileLink ? "Đã sao chép" : "Sao chép liên kết hồ sơ"}
							</button>
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
};

export default UserProfilePage;
