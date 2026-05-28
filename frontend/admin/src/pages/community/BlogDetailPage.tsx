import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import {
	Archive,
	ArrowLeft,
	BookOpen,
	Calendar,
	CalendarCheck,
	Clock,
	Eye,
	Heart,
	Hash,
	Loader2,
	MessageSquare,
	RotateCcw,
	Send,
	Tag,
	Trash2,
	User,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import blogService from "@/services/blog.service";
import { cn } from "@/lib/utils";
import type { BlogDetail, BlogStatus } from "./BlogListPage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" });
const timeFmt = new Intl.DateTimeFormat("vi-VN", { timeStyle: "short" });

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "--";
	return `${dateFmt.format(d)}, ${timeFmt.format(d)}`;
}

function getAuthorInitials(name: string | null, email: string) {
	return (name ?? email).charAt(0).toUpperCase();
}

const STATUS_MAP: Record<BlogStatus, { label: string; className: string }> = {
	published: {
		label: "Đã xuất bản",
		className:
			"border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
	},
	draft: {
		label: "Bản nháp",
		className:
			"border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10",
	},
	pending_review: {
		label: "Chờ duyệt",
		className:
			"border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10",
	},
	archived: {
		label: "Lưu trữ",
		className:
			"border-slate-500/20 bg-slate-500/10 text-slate-600 hover:bg-slate-500/10",
	},
};

function getStatusBadge(status: BlogStatus) {
	const { label, className } = STATUS_MAP[status] ?? STATUS_MAP.draft;
	return (
		<Badge variant="outline" className={cn("rounded-full px-3 py-1 text-xs font-medium", className)}>
			{label}
		</Badge>
	);
}

type StatusAction = { next: BlogStatus; label: string; icon: React.ReactNode; variant?: "default" | "outline" | "ghost" };

function getNextActions(status: BlogStatus): StatusAction[] {
	if (status === "draft")
		return [
			{ next: "published", label: "Xuất bản ngay", icon: <Send className="h-4 w-4" />, variant: "default" },
			{ next: "pending_review", label: "Gửi duyệt", icon: <BookOpen className="h-4 w-4" />, variant: "outline" },
		];
	if (status === "pending_review")
		return [
			{ next: "published", label: "Duyệt & Xuất bản", icon: <Send className="h-4 w-4" />, variant: "default" },
			{ next: "draft", label: "Trả về nháp", icon: <RotateCcw className="h-4 w-4" />, variant: "outline" },
		];
	if (status === "published")
		return [
			{ next: "archived", label: "Lưu trữ", icon: <Archive className="h-4 w-4" />, variant: "outline" },
			{ next: "draft", label: "Thu hồi về nháp", icon: <RotateCcw className="h-4 w-4" />, variant: "outline" },
		];
	if (status === "archived")
		return [
			{ next: "published", label: "Khôi phục xuất bản", icon: <Send className="h-4 w-4" />, variant: "default" },
		];
	return [];
}

// Configure marked
marked.setOptions({ async: false });

function renderMarkdown(content: string): string {
	try {
		const result = marked.parse(content, { async: false }) as string;
		return result;
	} catch {
		return content;
	}
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
			<Skeleton className="h-9 w-28" />
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="flex flex-col gap-6 lg:col-span-2">
					<Skeleton className="h-56 w-full rounded-2xl" />
					<Skeleton className="h-48 w-full rounded-2xl" />
					<Skeleton className="h-96 w-full rounded-2xl" />
				</div>
				<div className="flex flex-col gap-4">
					<Skeleton className="h-36 w-full rounded-2xl" />
					<Skeleton className="h-28 w-full rounded-2xl" />
					<Skeleton className="h-28 w-full rounded-2xl" />
					<Skeleton className="h-36 w-full rounded-2xl" />
				</div>
			</div>
		</div>
	);
}

// ─── Component ────────────────────────────────────────────────────────────────

function BlogDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [blog, setBlog] = useState<BlogDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [statusLoading, setStatusLoading] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const breadcrumb = useMemo(
		() => [
			{ title: "Dashboard", link: "/" },
			{ title: "Quản lý blog", link: "/community/blogs" },
			{ title: blog?.title ?? `Blog #${id ?? "--"}` },
		],
		[blog?.title, id],
	);
	useBreadcrumb(breadcrumb);

	useEffect(() => {
		if (!id) { setNotFound(true); setLoading(false); return; }
		let cancelled = false;
		setLoading(true);
		blogService.getBlog(id)
			.then((res) => { if (!cancelled) setBlog(res.data); })
			.catch(() => { if (!cancelled) setNotFound(true); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [id]);

	const renderedContent = useMemo(
		() => (blog?.content ? renderMarkdown(blog.content) : ""),
		[blog?.content],
	);

	const handleChangeStatus = async (next: BlogStatus) => {
		if (!blog) return;
		setStatusLoading(true);
		try {
			await blogService.updateStatus(blog.id, next);
			setBlog((prev) => prev ? { ...prev, status: next } : prev);
			toast.success(`Đã chuyển trạng thái sang "${STATUS_MAP[next].label}".`);
		} catch {
			toast.error("Không thể cập nhật trạng thái.");
		} finally {
			setStatusLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!blog) return;
		setIsDeleting(true);
		try {
			await blogService.deleteBlog(blog.id);
			toast.success("Đã xóa blog thành công.");
			navigate("/community/blogs");
		} catch {
			toast.error("Không thể xóa blog.");
			setIsDeleting(false);
		}
	};

	if (loading) return <DetailSkeleton />;

	if (notFound || !blog) {
		return (
			<div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8">
				<Button asChild variant="outline" className="w-fit">
					<Link to="/community/blogs">
						<ArrowLeft className="h-4 w-4" />
						Quay lại
					</Link>
				</Button>
				<Card>
					<CardHeader>
						<CardTitle>Không tìm thấy blog</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Bài viết này không tồn tại hoặc đã bị xóa.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const actions = getNextActions(blog.status);

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">

			{/* Back */}
			<Button asChild variant="outline" className="w-fit">
				<Link to="/community/blogs">
					<ArrowLeft className="h-4 w-4" />
					Quay lại danh sách
				</Link>
			</Button>

			<div className="grid gap-6 lg:grid-cols-3">

				{/* ── Main column ── */}
				<div className="flex flex-col gap-6 lg:col-span-2">

					{/* Featured image */}
					{blog.featured_image && (
						<div className="overflow-hidden rounded-2xl border bg-muted shadow-sm">
							<div className="flex max-h-64 w-full items-center justify-center bg-muted/50">
								<img
									src={blog.featured_image}
									alt={blog.title}
									className="max-h-64 w-full object-contain"
								/>
							</div>
						</div>
					)}

					{/* Title + meta */}
					<Card className="shadow-sm">
						<CardContent className="pt-6 flex flex-col gap-4">
							{/* Status + ID row */}
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="secondary" className="rounded-full text-xs font-mono">
									BLG-{blog.id}
								</Badge>
								{getStatusBadge(blog.status)}
								{blog.tags.map((tag) => (
									<Badge
										key={tag.id}
										variant="outline"
										className="rounded-full text-xs"
										style={tag.color ? { borderColor: `${tag.color}40`, color: tag.color } : undefined}>
										{tag.name}
									</Badge>
								))}
							</div>

							{/* Title */}
							<div>
								<h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
									{blog.title}
								</h1>
								<p className="mt-1.5 font-mono text-sm text-muted-foreground">
									/{blog.slug}
								</p>
							</div>

							{/* Excerpt */}
							{blog.excerpt && (
								<p className="rounded-xl bg-muted/40 px-4 py-3 text-sm leading-7 text-muted-foreground border-l-2 border-sky-500/40 italic">
									{blog.excerpt}
								</p>
							)}

							{/* Author row */}
							<div className="flex items-center gap-3 rounded-xl bg-muted/30 border px-4 py-3">
								<Avatar className="h-9 w-9 shrink-0">
									<AvatarImage src={blog.user.avatar ?? undefined} />
									<AvatarFallback className="text-sm">
										{getAuthorInitials(blog.user.full_name, blog.user.email)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<p className="text-sm font-semibold leading-none">
										{blog.user.full_name ?? "Ẩn danh"}
									</p>
									<p className="mt-1 truncate text-xs text-muted-foreground">
										{blog.user.email}
									</p>
								</div>
								<div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
									<Clock className="h-3.5 w-3.5" />
									{formatDate(blog.created_at)}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Content */}
					<Card className="shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
								Nội dung bài viết
							</CardTitle>
						</CardHeader>
						<Separator />
						<CardContent className="pt-6">
							{blog.content ? (
								<div
									className="blog-content-viewer"
									// eslint-disable-next-line react/no-danger
									dangerouslySetInnerHTML={{ __html: renderedContent }}
								/>
							) : (
								<p className="text-sm italic text-muted-foreground">
									Bài viết này chưa có nội dung.
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* ── Sidebar ── */}
				<div className="flex flex-col gap-4">

					{/* Stats */}
					<Card className="shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-semibold">Thống kê</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							{([
								{ icon: <Eye className="h-4 w-4 text-sky-500" />, label: "Lượt xem", value: blog.view_count.toLocaleString("vi-VN") },
								{ icon: <Heart className="h-4 w-4 text-rose-500" />, label: "Cảm xúc", value: blog.reactions_count.toLocaleString("vi-VN") },
								{ icon: <MessageSquare className="h-4 w-4 text-violet-500" />, label: "Bình luận", value: blog.comments_count.toLocaleString("vi-VN") },
							] as const).map(({ icon, label, value }) => (
								<div key={label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										{icon}
										{label}
									</div>
									<span className="text-sm font-semibold tabular-nums">{value}</span>
								</div>
							))}
						</CardContent>
					</Card>

					{/* Tags */}
					{blog.tags.length > 0 && (
						<Card className="shadow-sm">
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
									<Tag className="h-3.5 w-3.5 text-muted-foreground" />
									Tags
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-1.5">
									{blog.tags.map((tag) => (
										<Badge
											key={tag.id}
											variant="outline"
											className="rounded-full px-2.5 py-0.5 text-xs"
											style={tag.color ? { borderColor: `${tag.color}40`, color: tag.color } : undefined}>
											{tag.name}
										</Badge>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Dates */}
					<Card className="shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
								<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
								Thời gian
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<div className="flex flex-col gap-0.5">
								<p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
									<Clock className="h-3 w-3" />Thời gian tạo
								</p>
								<p className="text-sm font-medium">{formatDate(blog.created_at)}</p>
							</div>
							<div className="flex flex-col gap-0.5">
								<p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
									<CalendarCheck className="h-3 w-3" />Xuất bản 								</p>
								<p className="text-sm font-medium">{formatDate(blog.published_at)}</p>
							</div>
							<div className="flex flex-col gap-0.5">
								<p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
									<Clock className="h-3 w-3" />Cập nhật cuối
								</p>
								<p className="text-sm font-medium">{formatDate(blog.updated_at)}</p>
							</div>
							<div className="flex flex-col gap-0.5">
								<p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
									<Hash className="h-3 w-3" />Slug
								</p>
								<p className="break-all font-mono text-xs text-muted-foreground">
									/{blog.slug}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Author */}
					<Card className="shadow-sm">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
								<User className="h-3.5 w-3.5 text-muted-foreground" />
								Tác giả
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10 shrink-0">
									<AvatarImage src={blog.user.avatar ?? undefined} />
									<AvatarFallback className="text-sm font-semibold">
										{getAuthorInitials(blog.user.full_name, blog.user.email)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold">
										{blog.user.full_name ?? "Ẩn danh"}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{blog.user.email}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Status actions */}
					{actions.length > 0 && (
						<Card className="shadow-sm">
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
									Thay đổi trạng thái
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-2">
								<p className="mb-1 text-xs text-muted-foreground">
									Trạng thái hiện tại:{" "}
									<span className="font-medium text-foreground">
										{STATUS_MAP[blog.status]?.label}
									</span>
								</p>
								{actions.map(({ next, label, icon, variant }) => (
									<Button
										key={next}
										size="sm"
										variant={variant ?? "outline"}
										className="w-full justify-start"
										disabled={statusLoading}
										onClick={() => void handleChangeStatus(next)}>
										{statusLoading ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											icon
										)}
										{label}
									</Button>
								))}
							</CardContent>
						</Card>
					)}

					{/* Danger zone */}
					<Card className="shadow-sm border-destructive/20">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-semibold text-destructive">
								Vùng nguy hiểm
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Button
								variant="destructive"
								size="sm"
								className="w-full"
								onClick={() => setDeleteOpen(true)}>
								<Trash2 className="h-4 w-4" />
								Xóa bài viết này
							</Button>
							<p className="mt-2 text-xs text-muted-foreground">
								Hành động này không thể hoàn tác.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Delete confirm dialog */}
			<Dialog open={deleteOpen} onOpenChange={(o) => !isDeleting && setDeleteOpen(o)}>
				<DialogContent className="sm:max-w-[440px]">
					<DialogHeader>
						<DialogTitle>Xác nhận xóa blog</DialogTitle>
					</DialogHeader>
					<div className="space-y-2 text-sm text-muted-foreground">
						<p>
							Bạn sắp xóa blog{" "}
							<span className="font-semibold text-foreground">"{blog.title}"</span>.
						</p>
						<p>
							Hành động này không thể hoàn tác. Toàn bộ bình luận và cảm xúc liên
							quan cũng sẽ bị xóa.
						</p>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteOpen(false)}
							disabled={isDeleting}>
							Hủy
						</Button>
						<Button
							variant="destructive"
							onClick={() => void handleDelete()}
							disabled={isDeleting}>
							{isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
							Xóa blog
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default BlogDetailPage;
