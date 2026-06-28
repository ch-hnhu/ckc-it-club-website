import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutGrid, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { projectHubService } from "@/services/projecthub.service";
import type { CreateProjectInput, Project } from "@/types/projecthub.types";
import CreateBoardDialog from "@/components/projecthub/CreateBoardDialog";

const ProjectHubListPage: React.FC = () => {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "ProjectHub" }]);
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
		load();
	}, [load]);

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

	return (
		<div className='space-y-6 p-4 md:p-6'>
			{/* Header */}
			<div className='flex flex-wrap items-center justify-between gap-4'>
				<div>
					<h1 className='flex items-center gap-2 text-2xl font-semibold tracking-tight'>
						<LayoutGrid className='h-6 w-6' /> ProjectHub
					</h1>
					<p className='mt-1 text-sm text-muted-foreground'>
						Bảng Kanban quản lý tiến độ công việc.
					</p>
				</div>
				<Button onClick={() => setShowCreate(true)}>
					<Plus className='mr-1.5 h-4 w-4' /> Tạo dự án
				</Button>
			</div>

			<Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "archived")}>
				<TabsList>
					<TabsTrigger value='active'>Đang hoạt động</TabsTrigger>
					<TabsTrigger value='archived'>Đã lưu trữ</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* Grid */}
			{loading ? (
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
					{Array.from({ length: 8 }).map((_, i) => (
						<Skeleton key={i} className='h-36 rounded-xl' />
					))}
				</div>
			) : projects.length === 0 ? (
				<div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center'>
					<LayoutGrid className='mb-3 h-10 w-10 text-muted-foreground' />
					<p className='font-medium text-muted-foreground'>
						{tab === "active" ? "Chưa có dự án nào" : "Không có dự án lưu trữ"}
					</p>
					{tab === "active" && (
						<Button className='mt-4' onClick={() => setShowCreate(true)}>
							<Plus className='mr-1.5 h-4 w-4' /> Tạo dự án đầu tiên
						</Button>
					)}
				</div>
			) : (
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
					{projects.map((p) => (
						<Link
							key={p.id}
							to={`/du-an/${p.slug}`}
							className='group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'>
							<div className='h-2' style={{ backgroundColor: p.color || "var(--primary)" }} />
							<div className='flex flex-1 flex-col p-4'>
								<h3 className='mb-1 line-clamp-1 font-semibold'>{p.name}</h3>
								<p className='mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground'>
									{p.description || "Không có mô tả"}
								</p>
								<div className='flex items-center gap-3 border-t pt-3 text-xs font-medium text-muted-foreground'>
									<span>{p.columns_count ?? 0} cột</span>
									<span>·</span>
									<span>{p.tasks_count ?? 0} công việc</span>
									{p.department && (
										<span className='ml-auto rounded-full bg-muted px-2 py-0.5'>
											{p.department.name}
										</span>
									)}
								</div>
							</div>
						</Link>
					))}
				</div>
			)}

			{showCreate && (
				<CreateBoardDialog onClose={() => setShowCreate(false)} onCreate={handleCreate} />
			)}
		</div>
	);
};

export default ProjectHubListPage;
