import React, { useEffect, useState } from "react";
import {
	ExternalLink,
	Flag,
	FolderOpen,
	Github,
	Globe,
	PlusSquare,
	Search,
	Youtube,
	Link2,
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
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
			<div className='mb-3 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-[var(--color-pastel-green)]'>
				<Icon className='h-5 w-5 text-black' />
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
				<a
					href={resource.url}
					target='_blank'
					rel='noopener noreferrer'
					onClick={handleOpen}
					className='inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[var(--color-primary)] px-3.5 py-2 text-xs font-extrabold text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					Mở liên kết
					<ExternalLink className='h-3.5 w-3.5' />
				</a>
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

	useEffect(() => {
		const t = setTimeout(() => setSearch(searchInput.trim()), 400);
		return () => clearTimeout(t);
	}, [searchInput]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		resourceService
			.getResources({ per_page: 24, search: search || undefined, link_type: linkType })
			.then((res) => {
				if (!cancelled) setResources(res.data);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [search, linkType]);

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

			<div className='border-b-2 border-black bg-white py-4'>
				<div className='neo-container flex flex-col gap-3 px-6 md:flex-row md:items-center'>
					<Link
						to={user ? "/tai-nguyen/gui" : "/login"}
						className='inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-4 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						<PlusSquare className='h-4 w-4' strokeWidth={3} />
						Đóng góp
					</Link>

					<div className='group/search relative shrink-0 md:w-72'>
						<Search className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
						<input
							type='text'
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder='Tìm tài nguyên...'
							className='w-full rounded-xl border-2 border-black bg-white py-2 pl-10 pr-3 text-sm font-medium text-black outline-none focus:shadow-[0_0_0_3px_#A3E635]'
						/>
					</div>

					<div className='flex flex-1 flex-wrap gap-2'>
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

			<div className='neo-container px-6 pt-8'>
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
