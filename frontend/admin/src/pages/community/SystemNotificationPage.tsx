import { useEffect, useState } from "react";
import {
	Bell,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Info,
	Send,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationTarget = "all" | "role" | "faculty";
export type NotificationType = "info" | "success" | "warning";

export interface SentNotificationRecord {
	id: string;
	title: string;
	message: string;
	type: NotificationType;
	target: NotificationTarget;
	target_label: string;
	recipient_count: number;
	sent_at: string;
	sent_by: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

const TYPE_MAP: Record<NotificationType, { label: string; className: string }> = {
	info: {
		label: "Thông tin",
		className: "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10",
	},
	success: {
		label: "Thành công",
		className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
	},
	warning: {
		label: "Cảnh báo",
		className: "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10",
	},
};

const TARGET_OPTIONS: Array<{ value: NotificationTarget; label: string }> = [
	{ value: "all", label: "Tất cả thành viên" },
	{ value: "role", label: "Theo vai trò" },
	{ value: "faculty", label: "Theo khoa" },
];

// ─── Form state ──────────────────────────────────────────────────────────────

interface FormState {
	title: string;
	message: string;
	type: NotificationType;
	target: NotificationTarget;
	target_id: string;
}

const emptyForm: FormState = {
	title: "",
	message: "",
	type: "info",
	target: "all",
	target_id: "",
};

// ─── Component ───────────────────────────────────────────────────────────────

function SystemNotificationPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Thông báo hệ thống" }]);

	// Form
	const [form, setForm] = useState<FormState>(emptyForm);
	const [isSending, setIsSending] = useState(false);
	const [previewCount, setPreviewCount] = useState<number | null>(null);

	// History
	const [history, setHistory] = useState<SentNotificationRecord[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(true);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });

	useEffect(() => {
		let cancelled = false;
		setLoadingHistory(true);
		// TODO: notificationService.getSentHistory(...)
		setTimeout(() => {
			if (cancelled) return;
			setHistory([]);
			setMeta({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
			setLoadingHistory(false);
		}, 600);
		return () => { cancelled = true; };
	}, [meta.current_page, meta.per_page]);

	// Simulate recipient count preview when target changes
	useEffect(() => {
		setPreviewCount(null);
		if (form.target === "all") {
			// TODO: fetch actual count
			const timer = setTimeout(() => setPreviewCount(0), 400);
			return () => clearTimeout(timer);
		}
	}, [form.target, form.target_id]);

	const handleSend = async () => {
		if (!form.title.trim()) { toast.error("Tiêu đề không được để trống."); return; }
		if (!form.message.trim()) { toast.error("Nội dung thông báo không được để trống."); return; }
		if (form.target !== "all" && !form.target_id) {
			toast.error("Vui lòng chọn đối tượng nhận thông báo."); return;
		}

		setIsSending(true);
		try {
			// TODO: notificationService.sendMass(form)
			await new Promise((r) => setTimeout(r, 800));
			toast.success("Đã gửi thông báo thành công.");
			setForm(emptyForm);
			setMeta((p) => ({ ...p, current_page: 1 }));
		} catch {
			toast.error("Không thể gửi thông báo. Vui lòng thử lại.");
		} finally {
			setIsSending(false);
		}
	};

	const charCount = form.message.length;
	const maxChar = 500;

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* Hero */}
				<section className="overflow-hidden rounded-[30px] border border-rose-500/15 bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(255,248,250,0.96)_44%,rgba(255,252,253,0.98)_100%)] shadow-sm dark:bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(18,8,10,0.96)_45%,rgba(12,5,7,0.98)_100%)]">
					<div className="px-6 py-7 md:px-8 md:py-9">
						<div className="max-w-3xl space-y-4">
							<Badge className="w-fit rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-800 hover:bg-rose-500/10 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
								Thông báo hệ thống
							</Badge>
							<div className="space-y-2">
								<h1 className="text-foreground text-[1.85rem] font-semibold leading-tight md:text-[2.4rem] md:leading-[1.1]">
									Gửi thông báo đến thành viên
								</h1>
								<p className="text-sm leading-7 text-rose-950/70 md:text-base dark:text-rose-50/65">
									Soạn và gửi thông báo hàng loạt đến tất cả thành viên hoặc nhóm đối tượng cụ thể trong CLB.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Compose form */}
				<Card className="border-border/80 shadow-sm">
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2 text-base">
							<Bell className="h-4 w-4" />
							Soạn thông báo
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-5">
						<div className="grid gap-5 md:grid-cols-2">
							{/* Title */}
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="notif-title">
									Tiêu đề <span className="text-destructive">*</span>
								</Label>
								<Input
									id="notif-title"
									placeholder="Ví dụ: CLB thông báo lịch sinh hoạt tháng 6"
									value={form.title}
									onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
									maxLength={150}
								/>
							</div>

							{/* Type */}
							<div className="space-y-2">
								<Label htmlFor="notif-type">Loại thông báo</Label>
								<Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as NotificationType }))}>
									<SelectTrigger id="notif-type">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="info">
											<span className="flex items-center gap-2">
												<span className="h-2 w-2 rounded-full bg-sky-500" />
												Thông tin
											</span>
										</SelectItem>
										<SelectItem value="success">
											<span className="flex items-center gap-2">
												<span className="h-2 w-2 rounded-full bg-emerald-500" />
												Thành công
											</span>
										</SelectItem>
										<SelectItem value="warning">
											<span className="flex items-center gap-2">
												<span className="h-2 w-2 rounded-full bg-amber-500" />
												Cảnh báo
											</span>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Target */}
							<div className="space-y-2">
								<Label htmlFor="notif-target">Đối tượng nhận</Label>
								<Select value={form.target} onValueChange={(v) => setForm((p) => ({ ...p, target: v as NotificationTarget, target_id: "" }))}>
									<SelectTrigger id="notif-target">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{TARGET_OPTIONS.map((opt) => (
											<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Target sub-select */}
							{form.target === "role" && (
								<div className="space-y-2">
									<Label htmlFor="notif-role">Vai trò</Label>
									<Select value={form.target_id} onValueChange={(v) => setForm((p) => ({ ...p, target_id: v }))}>
										<SelectTrigger id="notif-role"><SelectValue placeholder="Chọn vai trò..." /></SelectTrigger>
										<SelectContent>
											{/* TODO: load roles from API */}
											<SelectItem value="admin">Quản trị viên</SelectItem>
											<SelectItem value="president">Chủ nhiệm</SelectItem>
											<SelectItem value="vice-president">Phó Chủ nhiệm</SelectItem>
											<SelectItem value="user">Thành viên</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}

							{form.target === "faculty" && (
								<div className="space-y-2">
									<Label htmlFor="notif-faculty">Khoa</Label>
									<Select value={form.target_id} onValueChange={(v) => setForm((p) => ({ ...p, target_id: v }))}>
										<SelectTrigger id="notif-faculty"><SelectValue placeholder="Chọn khoa..." /></SelectTrigger>
										<SelectContent>
											{/* TODO: load faculties from API */}
											<SelectItem value="cntt">Công nghệ thông tin</SelectItem>
											<SelectItem value="dien">Điện - Điện tử</SelectItem>
											<SelectItem value="co">Cơ khí</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</div>

						{/* Message */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="notif-message">
									Nội dung <span className="text-destructive">*</span>
								</Label>
								<span className={cn("text-xs", charCount > maxChar * 0.9 ? "text-amber-600" : "text-muted-foreground")}>
									{charCount}/{maxChar}
								</span>
							</div>
							<Textarea
								id="notif-message"
								placeholder="Nhập nội dung thông báo..."
								value={form.message}
								onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
								maxLength={maxChar}
								rows={5}
								className="resize-none"
							/>
						</div>

						{/* Preview */}
						{form.title && form.message && (
							<div className={cn("rounded-xl border p-4 space-y-1.5",
								form.type === "info" && "border-sky-500/20 bg-sky-500/5",
								form.type === "success" && "border-emerald-500/20 bg-emerald-500/5",
								form.type === "warning" && "border-amber-500/20 bg-amber-500/5",
							)}>
								<div className="flex items-center gap-2">
									<Info className={cn("h-4 w-4",
										form.type === "info" && "text-sky-600",
										form.type === "success" && "text-emerald-600",
										form.type === "warning" && "text-amber-600",
									)} />
									<p className="text-sm font-semibold">{form.title}</p>
								</div>
								<p className="text-sm text-muted-foreground leading-6 pl-6">{form.message}</p>
							</div>
						)}

						{/* Recipient summary */}
						<div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Users className="h-4 w-4" />
								<span>
									{form.target === "all" ? "Gửi đến tất cả thành viên" :
									 form.target === "role" ? `Gửi đến vai trò: ${form.target_id || "chưa chọn"}` :
									 `Gửi đến khoa: ${form.target_id || "chưa chọn"}`}
									{previewCount !== null && (
										<span className="ml-1 font-medium text-foreground">
											(~{previewCount} người)
										</span>
									)}
								</span>
							</div>
							<Button onClick={handleSend} disabled={isSending} className="h-8 gap-2">
								<Send className="h-4 w-4" />
								{isSending ? "Đang gửi..." : "Gửi ngay"}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* History */}
				<div className="space-y-3">
					<h3 className="text-base font-semibold">Lịch sử thông báo đã gửi</h3>

					<div className="overflow-hidden rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[120px] text-sm font-medium">Thời gian gửi</TableHead>
									<TableHead className="min-w-[200px] text-sm font-medium">Tiêu đề</TableHead>
									<TableHead className="w-[120px] text-sm font-medium">Loại</TableHead>
									<TableHead className="w-[160px] text-sm font-medium">Đối tượng</TableHead>
									<TableHead className="w-[120px] text-sm font-medium">Số người nhận</TableHead>
									<TableHead className="w-[140px] text-sm font-medium">Người gửi</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{loadingHistory ? (
									Array.from({ length: 5 }).map((_, i) => (
										<TableRow key={i}>
											<TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell>
										</TableRow>
									))
								) : history.length > 0 ? (
									history.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="text-sm text-muted-foreground">{formatDate(item.sent_at)}</TableCell>
											<TableCell>
												<div className="space-y-0.5">
													<p className="text-sm font-medium">{item.title}</p>
													<p className="text-xs text-muted-foreground line-clamp-1">{item.message}</p>
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="outline" className={cn("rounded-full px-3 py-1", TYPE_MAP[item.type].className)}>
													{TYPE_MAP[item.type].label}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">{item.target_label}</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
													<Users className="h-3.5 w-3.5" />
													{item.recipient_count} người
												</div>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">{item.sent_by}</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
											Chưa có thông báo nào được gửi.
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={6}>
										<div className="flex items-center justify-between px-2">
											<p className="flex-1 text-sm text-muted-foreground">
												Tổng {meta.total} thông báo đã gửi.
											</p>
											<div className="flex items-center space-x-6 lg:space-x-8">
												<div className="flex items-center space-x-2">
													<p className="text-sm font-medium">Rows per page</p>
													<Select value={`${meta.per_page}`}
														onValueChange={(v) => setMeta((p) => ({ ...p, per_page: Number(v), current_page: 1 }))}>
														<SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
														<SelectContent side="top">
															{[10, 20, 25, 50].map((s) => <SelectItem key={s} value={`${s}`}>{s}</SelectItem>)}
														</SelectContent>
													</Select>
												</div>
												<div className="flex w-[110px] items-center justify-center text-sm font-medium">
													Trang {meta.current_page} / {meta.last_page}
												</div>
												<div className="flex items-center space-x-2">
													<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
														onClick={() => setMeta((p) => ({ ...p, current_page: 1 }))} disabled={meta.current_page === 1}>
														<ChevronsLeft className="h-4 w-4" />
													</Button>
													<Button variant="outline" className="h-8 w-8 p-0"
														onClick={() => setMeta((p) => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))} disabled={meta.current_page === 1}>
														<ChevronLeft className="h-4 w-4" />
													</Button>
													<Button variant="outline" className="h-8 w-8 p-0"
														onClick={() => setMeta((p) => ({ ...p, current_page: Math.min(p.last_page, p.current_page + 1) }))} disabled={meta.current_page === meta.last_page}>
														<ChevronRight className="h-4 w-4" />
													</Button>
													<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
														onClick={() => setMeta((p) => ({ ...p, current_page: p.last_page }))} disabled={meta.current_page === meta.last_page}>
														<ChevronsRight className="h-4 w-4" />
													</Button>
												</div>
											</div>
										</div>
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</div>
				</div>
			</div>
		</div>
	);
}

export default SystemNotificationPage;
