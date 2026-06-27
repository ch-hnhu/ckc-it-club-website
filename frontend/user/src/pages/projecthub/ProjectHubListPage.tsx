import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { LayoutGrid, Loader2, Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import type { AuthUser } from "@/services/auth.service";
import { projectHubService } from "@/services/projecthub.service";
import type { CreateProjectInput, Project } from "@/types/projecthub.types";
import CreateBoardDialog from "@/components/projecthub/CreateBoardDialog";

interface OutletCtx {
	user: AuthUser | null;
	loadingUser: boolean;
}

const CardSkeleton: React.FC = () => (
	<div className='h-40 animate-pulse rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
		<div className='h-2 rounded-t-xl bg-gray-200' />
		<div className='space-y-3 p-5'>
			<div className='h-5 w-2/3 rounded bg-gray-200' />
			<div className='h-3 w-full rounded bg-gray-200' />
			<div className='h-3 w-4/5 rounded bg-gray-200' />
		</div>
	</div>
);

const ProjectHubListPage: React.FC = () => {
	const { user, loadingUser } = useOutletContext<OutletCtx>();
	const navigate = useNavigate();

	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState<"active" | "archived">("active");
	const [showCreate, setShowCreate] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await projectHubService.listProjects({
				archived: tab === "archived" ? 1 : 0,
				per_page: 50,
			});
			setProjects(res.data);
		} catch {
			toast.error("Không tải được danh sách dự án");
		} finally {
			setLoading(false);
		}
	}, [tab]);

	useEffect(() => {
		if (user) load();
	}, [user, load]);

	const handleCreate = async (body: CreateProjectInput) => {
		try {
			const res = await projectHubService.createProject(body);
			toast.success("Đã tạo dự án");
			setShowCreate(false);
			navigate(`/du-an/${res.data.slug}`);
		} catch {
			toast.error("Tạo dự án thất bại");
		}
	};

	// ── Chưa đăng nhập ────────────────────────────────────────────────────────
	if (!loadingUser && !user) {
		return (
			<div className='neo-container neo-section flex flex-col items-center justify-center py-24 text-center'>
				<Lock className='mb-4 h-12 w-12' />
				<h1 className='mb-2 text-2xl font-bold'>ProjectHub dành cho thành viên</h1>
				<p className='mb-6 text-gray-600'>Đăng nhập để quản lý dự án theo mô hình Kanban.</p>
				<Link
					to={`/login?returnTo=${encodeURIComponent("/du-an")}`}
					className='neo-btn neo-btn-primary'>
					Đăng nhập
				</Link>
			</div>
		);
	}

	return (
		<div className='neo-container neo-section w-full'>
			{/* Header */}
			<div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
				<div>
					<h1 className='flex items-center gap-2 text-3xl font-extrabold'>
						<LayoutGrid className='h-8 w-8' /> ProjectHub
					</h1>
					<p className='mt-1 text-gray-600'>Bảng Kanban quản lý tiến độ công việc của bạn.</p>
				</div>
				<button onClick={() => setShowCreate(true)} className='neo-btn neo-btn-primary'>
					<Plus className='h-5 w-5' /> Tạo dự án
				</button>
			</div>

			{/* Tabs */}
			<div className='mb-6 flex gap-2'>
				{(["active", "archived"] as const).map((t) => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={`rounded-lg border-2 border-black px-4 py-1.5 text-sm font-bold shadow-[2px_2px_0_#111] transition ${
							tab === t ? "bg-[var(--color-primary)]" : "bg-white hover:bg-gray-50"
						}`}>
						{t === "active" ? "Đang hoạt động" : "Đã lưu trữ"}
					</button>
				))}
			</div>

			{/* Grid */}
			{loading ? (
				<div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
					{Array.from({ length: 6 }).map((_, i) => (
						<CardSkeleton key={i} />
					))}
				</div>
			) : projects.length === 0 ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 py-20 text-center'>
					<LayoutGrid className='mb-3 h-10 w-10 text-gray-400' />
					<p className='font-semibold text-gray-600'>
						{tab === "active" ? "Chưa có dự án nào" : "Không có dự án lưu trữ"}
					</p>
					{tab === "active" && (
						<button
							onClick={() => setShowCreate(true)}
							className='mt-4 neo-btn neo-btn-primary'>
							<Plus className='h-5 w-5' /> Tạo dự án đầu tiên
						</button>
					)}
				</div>
			) : (
				<div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
					{projects.map((p) => (
						<Link
							key={p.id}
							to={`/du-an/${p.slug}`}
							className='group flex flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111] transition hover:-translate-y-1 hover:shadow-[6px_6px_0_#111]'>
							<div className='h-2.5' style={{ backgroundColor: p.color || "#a3e635" }} />
							<div className='flex flex-1 flex-col p-5'>
								<h3 className='mb-1 line-clamp-1 text-lg font-bold'>{p.name}</h3>
								<p className='mb-4 line-clamp-2 flex-1 text-sm text-gray-600'>
									{p.description || "Không có mô tả"}
								</p>
								<div className='flex items-center gap-3 border-t-2 border-gray-100 pt-3 text-xs font-semibold text-gray-500'>
									<span>{p.columns_count ?? 0} cột</span>
									<span>·</span>
									<span>{p.tasks_count ?? 0} công việc</span>
									{p.department && (
										<span className='ml-auto rounded-full bg-gray-100 px-2 py-0.5'>
											{p.department.name}
										</span>
									)}
								</div>
							</div>
						</Link>
					))}
				</div>
			)}

			{loadingUser && (
				<div className='flex justify-center py-10'>
					<Loader2 className='h-6 w-6 animate-spin' />
				</div>
			)}

			{showCreate && (
				<CreateBoardDialog onClose={() => setShowCreate(false)} onCreate={handleCreate} />
			)}
		</div>
	);
};

export default ProjectHubListPage;
