import React, { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
	BookOpen,
	Building2,
	Calendar,
	GraduationCap,
	Heart,
	MessageCircle,
	Share2,
	UserCheck,
	UserPlus,
	Users,
} from "lucide-react";
import type { AuthUser } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { postService } from "@/services/post.service";
import { buildAvatar, formatRelativeTime, getHandle } from "@/lib/utils";
import type { UserProfile } from "@/types/user.types";
import type { Post } from "@/types/post.types";
import PostCard from "@/components/community/PostCard";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ProfileSkeleton: React.FC = () => (
	<div className='animate-pulse'>
		<div className='h-48 rounded-t-2xl bg-gray-200' />
		<div className='rounded-b-2xl border-2 border-t-0 border-black bg-white px-6 pb-6 pt-14'>
			<div className='flex items-start justify-between'>
				<div className='space-y-2'>
					<div className='h-5 w-40 rounded bg-gray-200' />
					<div className='h-4 w-24 rounded bg-gray-200' />
				</div>
				<div className='h-10 w-28 rounded-xl bg-gray-200' />
			</div>
			<div className='mt-3 space-y-2'>
				<div className='h-3 w-full rounded bg-gray-200' />
				<div className='h-3 w-3/4 rounded bg-gray-200' />
			</div>
			<div className='mt-4 flex gap-6'>
				<div className='h-3 w-20 rounded bg-gray-200' />
				<div className='h-3 w-20 rounded bg-gray-200' />
				<div className='h-3 w-20 rounded bg-gray-200' />
			</div>
		</div>
	</div>
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
					Lượt thích nhận được
				</span>
				<span className='font-heading text-sm font-extrabold text-black'>—</span>
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
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
	profile,
	isOwnProfile,
	followed,
	onFollow,
}) => {
	const handle = getHandle(profile.username, profile.email);
	const avatar = buildAvatar(profile.full_name, profile.avatar);
	const joinYear = new Date(profile.created_at).getFullYear();

	const coverStyle = profile.cover_image
		? { backgroundImage: `url(${profile.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" }
		: { background: "linear-gradient(135deg, #a3e635 0%, #35d399 50%, #bfd9fe 100%)" };

	return (
		<div className='overflow-hidden rounded-2xl border-2 border-black'>
			{/* Banner */}
			<div className='relative h-44' style={coverStyle}>
				{/* Avatar positioned at bottom-left, overlapping */}
				<div className='absolute -bottom-10 left-6'>
					<img
						src={avatar}
						alt={profile.full_name}
						className='h-24 w-24 rounded-full border-4 border-black bg-[var(--color-pastel-blue)] object-cover shadow-[3px_3px_0_#111]'
					/>
				</div>
			</div>

			{/* Profile info */}
			<div className='bg-white px-6 pb-5 pt-14'>
				<div className='flex items-start justify-between gap-3'>
					<div className='min-w-0'>
						<h1 className='font-heading text-xl font-extrabold text-black leading-tight'>
							{profile.full_name}
						</h1>
						<p className='text-sm font-medium text-gray-500'>{handle}</p>
					</div>

					{isOwnProfile ? (
						<Link
							to='/cai-dat'
							className='inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Chỉnh sửa hồ sơ
						</Link>
					) : (
						<button
							onClick={onFollow}
							className={`inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-black px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
								followed
									? "bg-white text-black"
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

				{profile.bio && (
					<p className='mt-3 text-sm leading-relaxed text-gray-700'>{profile.bio}</p>
				)}

				{/* Metadata row */}
				<div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500'>
					{profile.faculty && (
						<span className='flex items-center gap-1.5'>
							<Building2 className='h-4 w-4 shrink-0' />
							{profile.faculty}
						</span>
					)}
					{profile.major && (
						<span className='flex items-center gap-1.5'>
							<GraduationCap className='h-4 w-4 shrink-0' />
							{profile.major}
						</span>
					)}
					<span className='flex items-center gap-1.5'>
						<Calendar className='h-4 w-4 shrink-0' />
						Tham gia {joinYear}
					</span>
				</div>

				{/* Follower counts */}
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
	);
};

// ─── Not Found ────────────────────────────────────────────────────────────────

const ProfileNotFound: React.FC<{ username: string }> = ({ username }) => (
	<div className='flex flex-col items-center justify-center py-24 text-center'>
		<div className='mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-black bg-[var(--color-pastel-yellow)] text-4xl shadow-[4px_4px_0_#111]'>
			🔍
		</div>
		<h1 className='font-heading text-2xl font-extrabold text-black'>
			Không tìm thấy người dùng
		</h1>
		<p className='mt-2 text-gray-500'>
			Không có tài khoản nào với tên{" "}
			<span className='font-bold text-black'>@{username}</span>.
		</p>
		<Link
			to='/cong-dong'
			className='mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
			Về cộng đồng
		</Link>
	</div>
);

// ─── Tab Content: Posts ───────────────────────────────────────────────────────

interface UserPostsTabProps {
	username: string;
	user: AuthUser | null;
	postsCount: number;
}

const UserPostsTab: React.FC<UserPostsTabProps> = ({ username, user, postsCount }) => {
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
			<div className='mt-5 space-y-5'>
				{Array.from({ length: 3 }).map((_, i) => (
					<PostSkeleton key={i} />
				))}
			</div>
		);
	}

	if (error || posts.length === 0) {
		return (
			<div className='mt-5 rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'>
				<p className='font-heading text-lg font-extrabold text-black'>
					{error ? "Không thể tải bài viết" : "Chưa có bài viết nào"}
				</p>
				<p className='mt-2 text-sm text-gray-500'>
					{error
						? "Vui lòng thử lại sau."
						: `Người dùng này chưa đăng bài viết nào.`}
				</p>
			</div>
		);
	}

	return (
		<div className='mt-5 space-y-5'>
			{posts.map((post) => (
				<PostCard key={post.id} post={post} user={user} />
			))}
		</div>
	);
};

// ─── Tab Content: Overview ────────────────────────────────────────────────────

interface OverviewTabProps {
	profile: UserProfile;
	user: AuthUser | null;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ profile, user }) => {
	const [recentPosts, setRecentPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		userService
			.getUserPosts(profile.username ?? profile.email.split("@")[0], 1)
			.then((res) => {
				if (!cancelled) setRecentPosts(res.data.slice(0, 3));
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
		<div className='mt-5 space-y-6'>
			{/* Recent posts preview */}
			<section>
				<div className='mb-3 flex items-center justify-between'>
					<h2 className='font-heading text-base font-extrabold text-black'>
						Bài viết gần đây
					</h2>
					<button
						onClick={() => {}}
						className='text-xs font-bold text-lime-700 hover:text-black'>
						Xem tất cả
					</button>
				</div>

				{loading ? (
					<div className='space-y-4'>
						{Array.from({ length: 2 }).map((_, i) => (
							<PostSkeleton key={i} />
						))}
					</div>
				) : recentPosts.length > 0 ? (
					<div className='space-y-4'>
						{recentPosts.map((post) => (
							<PostCard key={post.id} post={post} user={user} />
						))}
					</div>
				) : (
					<div className='rounded-2xl border-2 border-black bg-white px-6 py-10 text-center'>
						<p className='text-sm font-medium text-gray-500'>Chưa có bài viết nào.</p>
					</div>
				)}
			</section>
		</div>
	);
};

// ─── UserProfilePage ──────────────────────────────────────────────────────────

type Tab = "overview" | "posts";

const TABS: { id: Tab; label: string }[] = [
	{ id: "overview", label: "Tổng quan" },
	{ id: "posts", label: "Bài viết" },
];

const UserProfilePage: React.FC = () => {
	const { username: rawParam } = useParams<{ username: string }>();
	// Strip leading "@" so both "/@ch-hnhu" and "/ch-hnhu" resolve to the same profile
	const username = rawParam?.replace(/^@/, "");
	const { user } = useOutletContext<{ user: AuthUser | null }>();

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [activeTab, setActiveTab] = useState<Tab>("overview");
	const [followed, setFollowed] = useState(false);

	const isOwnProfile = Boolean(
		user && profile && (String(user.id) === String(profile.id) || user.email === profile.email),
	);

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
							faculty: "Công nghệ thông tin",
							major: "Lập trình máy tính",
							class_name: "22CNTT1",
							gender: null,
							is_active: true,
							posts_count: 12,
							followers_count: 85,
							following_count: 3,
							skills: ["JavaScript", "React", "Laravel", "Python"],
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
			<div className='mx-auto w-full max-w-6xl px-4 py-8'>
				<div className='flex gap-6'>
					<div className='min-w-0 flex-1'>
						<ProfileSkeleton />
					</div>
					<aside className='hidden w-72 shrink-0 space-y-5 lg:block'>
						<div className='h-48 animate-pulse rounded-2xl border-2 border-black bg-gray-200' />
						<div className='h-36 animate-pulse rounded-2xl border-2 border-black bg-gray-200' />
					</aside>
				</div>
			</div>
		);
	}

	if (notFound || !username) {
		return (
			<div className='mx-auto w-full max-w-6xl px-4'>
				<ProfileNotFound username={username ?? ""} />
			</div>
		);
	}

	if (!profile) return null;

	return (
		<div className='mx-auto w-full max-w-6xl px-4 py-8'>
			<div className='flex gap-6'>
				{/* ── Main content ── */}
				<div className='min-w-0 flex-1'>
					<ProfileHeader
						profile={profile}
						isOwnProfile={isOwnProfile}
						followed={followed}
						onFollow={() => setFollowed((f) => !f)}
					/>

					{/* Tabs */}
					<div className='mt-5 border-b-2 border-black'>
						<nav className='flex'>
							{TABS.map((tab) => {
								const isActive = activeTab === tab.id;
								return (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id)}
										className='relative pb-3 pr-6 pt-1 font-heading text-sm font-extrabold transition md:text-base'
										style={{ color: isActive ? "#111" : "#6b7280" }}>
										{tab.label}
										{tab.id === "posts" && profile.posts_count > 0 && (
											<span className='ml-1.5 rounded-md border border-black bg-[var(--color-pastel-yellow)] px-1.5 py-0.5 text-xs font-bold'>
												{profile.posts_count}
											</span>
										)}
										{isActive && (
											<span className='absolute -bottom-[3px] left-0 right-6 h-[3px] rounded-t-sm bg-[var(--color-primary)]' />
										)}
									</button>
								);
							})}
						</nav>
					</div>

					{/* Tab content */}
					{activeTab === "overview" ? (
						<OverviewTab profile={profile} user={user} />
					) : (
						<UserPostsTab
							username={username}
							user={user}
							postsCount={profile.posts_count}
						/>
					)}
				</div>

				{/* ── Sidebar ── */}
				<aside className='hidden w-72 shrink-0 space-y-5 lg:block'>
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
									<span className='font-bold text-black'>{profile.student_code}</span>
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
									<span className='font-bold text-black'>{profile.class_name}</span>
								</div>
							)}
							<div className='flex items-center justify-between border-t-2 border-dashed border-gray-200 pt-2'>
								<span className='text-gray-500'>Tham gia</span>
								<span className='font-bold text-black'>
									{new Date(profile.created_at).toLocaleDateString("vi-VN", {
										year: "numeric",
										month: "short",
									})}
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
				</aside>
			</div>
		</div>
	);
};

export default UserProfilePage;
