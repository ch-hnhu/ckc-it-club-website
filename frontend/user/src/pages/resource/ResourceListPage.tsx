import React, { useEffect, useState } from "react";
import {
	ExternalLink,
	Flag,
	FolderOpen,
	Github,
	Globe,
	Lock,
	LogIn,
	PlusSquare,
	Search,
	Youtube,
	Link2,
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { isAxiosError } from "axios";
import type { AuthUser } from "@/services/auth.service";
import { resourceService } from "@/services/resource.service";
import type { Resource, ResourceLinkType } from "@/types/resource.types";
import ReportResourceModal from "@/components/resource/ReportResourceModal";

const LINK_TYPE_LABELS: Record<ResourceLinkType, string> = {
	google_drive: "Google Drive",
	youtube: "YouTube",
	github: "GitHub",
	document: "Website",
	other: "Khác",
};

const LINK_TYPE_ICONS: Record<ResourceLinkType, React.ElementType> = {
	google_drive: FolderOpen,
	youtube: Youtube,
	github: Github,
	document: Globe,
	other: Link2,
};

const AccessGate: React.FC<{
	icon: React.ElementType;
	title: string;
	message: string;
	action: { to: string; label: string };
}> = ({ icon: Icon, title, message, action }) => (
	<div className='neo-container px-6 pt-8'>
		<div className='mx-auto max-w-xl rounded-2xl border-2 border-black bg-white px-6 py-16 text-center shadow-[4px_4px_0_#111]'>
			<Icon className='mx-auto h-10 w-10 text-gray-300' />
			<p className='mt-4 font-heading text-xl font-extrabold text-black'>{title}</p>
			<p className='mt-2 text-sm text-gray-600'>{message}</p>
			<Link
				to={action.to}
				className='mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
				{action.label}
			</Link>
		</div>
	</div>
);

const CardSkeleton: React.FC = () => (
	<div className='animate-pulse rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#111]'>
		<div className='mb-3 h-9 w-9 rounded-lg bg-gray-200' />
		<div className='mb-2 h-5 w-4/5 rounded bg-gray-200' />
		<div className='h-3.5 w-full rounded bg-gray-200' />
		<div className='mt-4 h-8 w-24 rounded bg-gray-200' />
	</div>
);

const ResourceCard: React.FC<{
	resource: Resource;
	currentUserId?: string;
	onReport: (id: number) => void;
}> = ({ resource, currentUserId, onReport }) => {
	const Icon = LINK_TYPE_ICONS[resource.link_type];
	const isOwner =
		currentUserId != null &&
		resource.uploader != null &&
		String(resource.uploader.id) === currentUserId;

	const handleOpen = () => {
		resourceService.recordClick(resource.id).catch(() => {});
	};

	return (
		<div className='flex h-full flex-col rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#111]'>
			<div
				className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black ${
					resource.is_locked ? "bg-gray-200" : "bg-[var(--color-pastel-green)]"
				}`}>
				{resource.is_locked ? (
					<Lock className='h-5 w-5 text-gray-500' />
				) : (
					<Icon className='h-5 w-5 text-black' />
				)}
			</div>
			<p className='font-heading text-base font-extrabold leading-snug text-black'>
				{resource.title}
			</p>
			{resource.description && (
				<p className='mt-1.5 line-clamp-2 text-sm text-gray-600'>{resource.description}</p>
			)}
			<div className='mt-3 flex items-center gap-2 text-xs text-gray-400'>
				<span className='inline-block rounded-full border border-gray-300 px-2 py-0.5 font-semibold uppercase'>
					{LINK_TYPE_LABELS[resource.link_type]}
				</span>
				<span>·</span>
				<span>{resource.uploader?.full_name ?? "Ẩn danh"}</span>
			</div>
			<div className='mt-auto flex items-center justify-between gap-2 pt-4'>
				{resource.is_locked ? (
					<Link
						to='/ung-tuyen'
						className='inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3.5 py-2 text-xs font-extrabold text-gray-600 transition hover:bg-gray-50'>
						<Lock className='h-3.5 w-3.5' />
						Tham gia CLB để mở
					</Link>
				) : (
					<a
						href={resource.url ?? undefined}
						target='_blank'
						rel='noopener noreferrer'
						onClick={handleOpen}
						className='inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[var(--color-primary)] px-3.5 py-2 text-xs font-extrabold text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						Mở liên kết
						<ExternalLink className='h-3.5 w-3.5' />
					</a>
				)}
				{!isOwner && (
					<button
						onClick={() => onReport(resource.id)}
						title='Báo cáo tài nguyên'
						className='inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-transparent text-gray-400 transition hover:border-black hover:text-red-600'>
						<Flag className='h-4 w-4' />
					</button>
				)}
			</div>
		</div>
	);
};

const ResourceListPage: React.FC = () => {
	const { user } = useOutletContext<{ user: AuthUser | null }>();

	const [resources, setResources] = useState<Resource[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [linkType, setLinkType] = useState<ResourceLinkType | "all">("all");
	const [reportTargetId, setReportTargetId] = useState<number | null>(null);
	const [forbidden, setForbidden] = useState(false);

	const canBrowse = user != null;
	const hasLockedResources = resources.some((r) => r.is_locked);

	useEffect(() => {
		const t = setTimeout(() => setSearch(searchInput.trim()), 400);
		return () => clearTimeout(t);
	}, [searchInput]);

	useEffect(() => {
		// Chưa đăng nhập thì không gọi API — 401 sẽ bị interceptor đá thẳng sang /login.
		if (!canBrowse) {
			setLoading(false);
			return;
		}

		let cancelled = false;
		setLoading(true);
		resourceService
			.getResources({ per_page: 24, search: search || undefined, link_type: linkType })
			.then((res) => {
				if (cancelled) return;
				setResources(res.data);
				setForbidden(false);
			})
			.catch((err) => {
				if (cancelled) return;
				if (isAxiosError(err) && err.response?.status === 403) {
					setForbidden(true);
					setResources([]);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [search, linkType, canBrowse]);

	return (
		<div className='w-full min-h-screen pb-12 pt-16'>
			<div
				className='relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden border-b-2 border-black px-6 py-14 md:min-h-[300px] md:py-20'
				style={{
					backgroundImage:
						"linear-gradient(rgba(0, 0, 0, 0.46), rgba(0, 0, 0, 0.46)), url('/assets/gif/resource-page-banner.gif')",
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}>
				<h1
					className='font-pixel text-4xl text-white md:text-5xl'
					style={{ textShadow: "5px 5px 0 #111, 0 2px 10px rgba(0, 0, 0, 0.45)" }}>
					Tài nguyên
				</h1>
				<p className='mt-10 max-w-xl text-center text-md font-bold text-white'>
					Kho tài liệu, slide, video và link hữu ích do thành viên CLB chia sẻ.
				</p>
			</div>

			{canBrowse && !forbidden && (
			<div className='border-b-2 border-black bg-white py-4'>
				<div className='neo-container flex flex-col gap-3 px-6 xl:flex-row xl:items-center'>
					<div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
						<Link
							to='/tai-nguyen/gui'
							className='inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-4 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							<PlusSquare className='h-4 w-4' strokeWidth={3} />
							Đóng góp
						</Link>

						<div className='group/search relative shrink-0 sm:w-72'>
							<Search className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
							<input
								type='text'
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder='Tìm tài nguyên...'
								className='w-full rounded-xl border-2 border-black bg-white py-2 pl-10 pr-3 text-sm font-medium text-black outline-none focus:shadow-[0_0_0_3px_#A3E635]'
							/>
						</div>
					</div>

					<div className='flex flex-wrap gap-2'>
						{(
							[
								"all",
								"google_drive",
								"youtube",
								"github",
								"document",
								"other",
							] as const
						).map((type) => (
							<button
								key={type}
								onClick={() => setLinkType(type)}
								className={`inline-flex h-9 shrink-0 items-center justify-center rounded-full border-2 border-black px-4 text-sm font-bold transition-all duration-150 hover:translate-x-[1px] hover:translate-y-[1px] ${
									linkType === type
										? "bg-[var(--color-primary)] text-black"
										: "bg-white text-gray-700 hover:bg-gray-50"
								}`}>
								{type === "all" ? "Tất cả" : LINK_TYPE_LABELS[type]}
							</button>
						))}
					</div>
				</div>
			</div>
			)}

			{!loading && !canBrowse ? (
				<AccessGate
					icon={LogIn}
					title='Đăng nhập để xem tài nguyên'
					message='Kho tài nguyên dành cho sinh viên trường Cao Thắng và thành viên câu lạc bộ.'
					action={{ to: "/login", label: "Đăng nhập" }}
				/>
			) : !loading && forbidden ? (
				<AccessGate
					icon={Lock}
					title='Bạn chưa có quyền xem tài nguyên'
					message='Kho tài nguyên chỉ dành cho sinh viên trường Cao Thắng và thành viên câu lạc bộ. Hãy ứng tuyển để trở thành thành viên.'
					action={{ to: "/ung-tuyen", label: "Tham gia CLB" }}
				/>
			) : (
			<div className='neo-container px-6 pt-8'>
				{!loading && hasLockedResources && (
					<div className='mb-5 flex flex-col gap-3 rounded-2xl border-2 border-black bg-[var(--color-pastel-yellow,#FEF3C7)] px-5 py-4 shadow-[4px_4px_0_#111] sm:flex-row sm:items-center sm:justify-between'>
						<div className='flex items-start gap-3'>
							<Lock className='mt-0.5 h-5 w-5 shrink-0 text-black' />
							<p className='text-sm font-bold text-black'>
								Sinh viên Cao Thắng xem được 3 tài nguyên mới nhất. Trở thành thành
								viên câu lạc bộ để mở khoá toàn bộ kho tài nguyên.
							</p>
						</div>
						<Link
							to='/ung-tuyen'
							className='inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-4 py-2 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Tham gia CLB
						</Link>
					</div>
				)}
				{loading ? (
					<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
						{Array.from({ length: 6 }).map((_, i) => (
							<CardSkeleton key={i} />
						))}
					</div>
				) : resources.length === 0 ? (
					<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'>
						<Search className='mx-auto h-10 w-10 text-gray-300' />
						<p className='mt-4 font-heading text-xl font-extrabold text-black'>
							Không tìm thấy tài nguyên nào
						</p>
						<p className='mt-2 text-sm text-gray-600'>
							Hãy là người đầu tiên chia sẻ tài nguyên!
						</p>
					</div>
				) : (
					<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
						{resources.map((resource) => (
							<ResourceCard
								key={resource.id}
								resource={resource}
								currentUserId={user?.id}
								onReport={setReportTargetId}
							/>
						))}
					</div>
				)}
			</div>
			)}

			{reportTargetId != null && (
				<ReportResourceModal
					resourceId={reportTargetId}
					onClose={() => setReportTargetId(null)}
				/>
			)}
		</div>
	);
};

export default ResourceListPage;
