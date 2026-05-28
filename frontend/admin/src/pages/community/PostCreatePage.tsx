import { type FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
	ArrowLeft,
	Hash,
	Image,
	Loader2,
	Send,
	UploadCloud,
	X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import StacksEditorWrapper, {
	type StacksEditorHandle,
} from "@/components/ui/StacksEditorWrapper";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import channelService from "@/services/channel.service";
import postService from "@/services/post.service";
import tagService from "@/services/tag.service";
import type { ApiErrorResponse } from "@/types/api.types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChannelOption {
	id: number;
	name: string;
	slug: string;
}

interface TagOption {
	id: number;
	name: string;
	color: string | null;
}

interface MediaPreview {
	id: string;
	name: string;
	type: string;
	url: string;
}

type FormState = {
	channel_id: string;
	title: string;
	visibility: "public" | "members_only";
};

type FieldErrors = Partial<
	Record<keyof FormState | "content" | "media" | "tags", string>
>;

const getInitialForm = (): FormState => ({
	channel_id: "",
	title: "",
	visibility: "public",
});

// ─── Component ────────────────────────────────────────────────────────────────

function PostCreatePage() {
	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Quản lý bài đăng", link: "/community/posts" },
		{ title: "Thêm bài đăng" },
	]);

	const navigate = useNavigate();

	const [form, setForm] = useState<FormState>(getInitialForm);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [submitting, setSubmitting] = useState(false);

	// Editor
	const editorRef = useRef<StacksEditorHandle>(null);

	// Channels
	const [channels, setChannels] = useState<ChannelOption[]>([]);
	const [channelsLoading, setChannelsLoading] = useState(true);

	// Tags
	const [tags, setTags] = useState<TagOption[]>([]);
	const [selectedTags, setSelectedTags] = useState<number[]>([]);
	const [tagsLoading, setTagsLoading] = useState(true);

	// Media
	const [mediaFile, setMediaFile] = useState<File | null>(null);
	const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
	const mediaInputRef = useRef<HTMLInputElement>(null);

	// ── Load channels & tags ──
	useEffect(() => {
		channelService
			.getChannels({ per_page: 100 })
			.then((res) => setChannels(res.data as unknown as ChannelOption[]))
			.catch(() => toast.error("Không thể tải danh sách kênh."))
			.finally(() => setChannelsLoading(false));

		tagService
			.getTags({ per_page: 100 })
			.then((res) => setTags(res.data as unknown as TagOption[]))
			.catch(() => toast.error("Không thể tải danh sách tag."))
			.finally(() => setTagsLoading(false));
	}, []);

	// ── Media preview ──
	useEffect(() => {
		if (!mediaFile) {
			setMediaPreview(null);
			return;
		}
		const preview: MediaPreview = {
			id: `${mediaFile.name}-${mediaFile.size}-${mediaFile.lastModified}`,
			name: mediaFile.name,
			type: mediaFile.type,
			url: URL.createObjectURL(mediaFile),
		};
		setMediaPreview(preview);
		return () => URL.revokeObjectURL(preview.url);
	}, [mediaFile]);

	// ── Helpers ──
	const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
		setForm((prev) => ({ ...prev, [key]: val }));
		setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const toggleTag = (id: number) => {
		setSelectedTags((prev) =>
			prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
		);
	};

	const openMediaDialog = () => {
		if (!mediaInputRef.current) return;
		mediaInputRef.current.value = "";
		mediaInputRef.current.click();
	};

	const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMediaFile(e.target.files?.[0] ?? null);
	};

	const removeMedia = (event: React.MouseEvent) => {
		event.stopPropagation();
		setMediaFile(null);
	};

	// ── Validation ──
	const validate = (): boolean => {
		const errors: FieldErrors = {};
		const content = editorRef.current?.getContent()?.trim() ?? "";
		if (!form.channel_id) errors.channel_id = "Vui lòng chọn kênh đăng bài.";
		if (!form.title.trim()) errors.title = "Vui lòng nhập tiêu đề bài đăng.";
		if (!content) errors.content = "Vui lòng nhập nội dung bài đăng.";
		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// ── Submit ──
	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		const content = editorRef.current?.getContent()?.trim() ?? "";

		setSubmitting(true);
		try {
			const formData = new FormData();
			formData.append("channel_id", form.channel_id);
			formData.append("title", form.title.trim());
			formData.append("content", content);
			formData.append("visibility", form.visibility);
			selectedTags.forEach((id) => formData.append("tag_ids[]", String(id)));
			if (mediaFile) formData.append("media", mediaFile);

			await postService.createPost(formData);
			toast.success("Tạo bài đăng thành công.", { position: "top-right" });
			navigate("/community/posts");
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const data = err.response?.data as ApiErrorResponse | undefined;
				if (data?.errors) {
					const mapped: FieldErrors = {};
					for (const [key, msgs] of Object.entries(data.errors)) {
						mapped[key as keyof FieldErrors] = Array.isArray(msgs)
							? msgs[0]
							: String(msgs);
					}
					setFieldErrors(mapped);
					return;
				}
				toast.error(data?.message ?? "Có lỗi xảy ra.", { position: "top-right" });
			} else {
				toast.error("Có lỗi xảy ra.", { position: "top-right" });
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
			{/* Back button */}
			<Button asChild variant="outline" className="w-fit">
				<Link to="/community/posts">
					<ArrowLeft className="h-4 w-4" />
					Quay lại
				</Link>
			</Button>

			<form onSubmit={(e) => void handleSubmit(e)}>
				<div className="grid gap-6 lg:grid-cols-3">
					{/* ── Main content ── */}
					<div className="flex flex-col gap-6 lg:col-span-2">
						{/* Basic info card */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Thông tin bài đăng</CardTitle>
								<CardDescription>
									Điền tiêu đề và nội dung cho bài đăng mới trong cộng đồng.
								</CardDescription>
							</CardHeader>

							<CardContent className="flex flex-col gap-5">
								{/* Title */}
								<div className="flex flex-col gap-2">
									<Label htmlFor="post-title">
										Tiêu đề <span className="text-destructive">*</span>
									</Label>
									<Input
										id="post-title"
										placeholder="Nhập tiêu đề bài đăng..."
										value={form.title}
										onChange={(e) => setField("title", e.target.value)}
										disabled={submitting}
									/>
									{fieldErrors.title && (
										<p className="text-sm text-destructive">{fieldErrors.title}</p>
									)}
								</div>

								{/* Content — Stacks Editor */}
								<div className="flex flex-col gap-2">
									<Label htmlFor="post-content">
										Nội dung <span className="text-destructive">*</span>
									</Label>
									<div
										className="overflow-hidden rounded-md border bg-background"
										onClick={() => editorRef.current?.focus()}
										style={{ cursor: "text" }}>
										<StacksEditorWrapper
											ref={editorRef}
											placeholder="Bạn đang nghĩ gì? Chia sẻ với cộng đồng..."
										/>
									</div>
									{fieldErrors.content && (
										<p className="text-sm text-destructive">{fieldErrors.content}</p>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Media upload card */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Image className="h-5 w-5 text-muted-foreground" />
									Hình ảnh / Video
								</CardTitle>
								<CardDescription>
									Đính kèm một ảnh hoặc video cho bài đăng (tuỳ chọn).
								</CardDescription>
							</CardHeader>

							<CardContent>
								<input
									ref={mediaInputRef}
									type="file"
									accept="image/*,video/*"
									className="sr-only"
									onChange={handleMediaChange}
								/>

								{/* Drop zone */}
								<div
									role="button"
									tabIndex={0}
									onClick={openMediaDialog}
									onKeyDown={(e) => {
										if (e.key !== "Enter" && e.key !== " ") return;
										e.preventDefault();
										openMediaDialog();
									}}
									aria-label="Tải hình ảnh hoặc video"
									className="group relative flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center transition hover:border-muted-foreground/50 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
									{mediaPreview ? (
										<div className="w-full space-y-3">
											<div className="mx-auto max-w-sm overflow-hidden rounded-lg border bg-background shadow-sm">
												<div className="relative aspect-video w-full bg-muted">
													{mediaPreview.type.startsWith("video/") ? (
														<video
															src={mediaPreview.url}
															className="h-full w-full object-cover"
															muted
															playsInline
															preload="metadata"
														/>
													) : (
														<img
															src={mediaPreview.url}
															alt={mediaPreview.name}
															className="h-full w-full object-cover"
														/>
													)}
												</div>
												<div className="flex items-center justify-between border-t px-3 py-2">
													<p className="truncate text-xs text-muted-foreground">
														{mediaPreview.name}
													</p>
													<button
														type="button"
														onClick={removeMedia}
														aria-label="Xoá tệp"
														className="ml-2 shrink-0 rounded p-0.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
														<X className="h-3.5 w-3.5" />
													</button>
												</div>
											</div>
											<p className="text-sm text-muted-foreground">
												Nhấn để thay đổi tệp
											</p>
										</div>
									) : (
										<>
											<UploadCloud className="h-10 w-10 text-muted-foreground/50 transition group-hover:text-muted-foreground" />
											<p className="mt-3 text-sm font-medium text-muted-foreground">
												Kéo & thả hoặc nhấn để chọn tệp
											</p>
											<p className="mt-1 text-xs text-muted-foreground/60">
												Hỗ trợ PNG, JPG, GIF, MP4, MOV (tối đa 50MB)
											</p>
										</>
									)}
								</div>

								{fieldErrors.media && (
									<p className="mt-2 text-sm text-destructive">{fieldErrors.media}</p>
								)}
							</CardContent>
						</Card>
					</div>

					{/* ── Sidebar (channel, visibility, tags) ── */}
					<div className="flex flex-col gap-6">
						{/* Channel & visibility */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Cài đặt đăng bài</CardTitle>
							</CardHeader>

							<CardContent className="flex flex-col gap-5">
								{/* Channel */}
								<div className="flex flex-col gap-2">
									<Label htmlFor="post-channel">
										<span className="flex items-center gap-1.5">
											<Hash className="h-3.5 w-3.5 text-muted-foreground" />
											Kênh đăng <span className="text-destructive">*</span>
										</span>
									</Label>
									<Select
										value={form.channel_id}
										onValueChange={(v) => setField("channel_id", v)}
										disabled={submitting || channelsLoading}>
										<SelectTrigger id="post-channel" className="w-full">
											<SelectValue
												placeholder={
													channelsLoading ? "Đang tải kênh..." : "Chọn kênh"
												}
											/>
										</SelectTrigger>
										<SelectContent>
											{channels.map((ch) => (
												<SelectItem key={ch.id} value={String(ch.id)}>
													{ch.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{fieldErrors.channel_id && (
										<p className="text-sm text-destructive">
											{fieldErrors.channel_id}
										</p>
									)}
								</div>

								{/* Visibility */}
								<div className="flex flex-col gap-2">
									<Label htmlFor="post-visibility">Đối tượng xem</Label>
									<Select
										value={form.visibility}
										onValueChange={(v) =>
											setField("visibility", v as FormState["visibility"])
										}
										disabled={submitting}>
										<SelectTrigger id="post-visibility" className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="public">Công khai</SelectItem>
											<SelectItem value="members_only">Thành viên CLB</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</CardContent>
						</Card>

						{/* Tags */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Tags</CardTitle>
								<CardDescription>
									Gắn tag giúp bài đăng dễ được tìm thấy hơn.
								</CardDescription>
							</CardHeader>

							<CardContent>
								{tagsLoading ? (
									<p className="text-sm text-muted-foreground">Đang tải tags...</p>
								) : tags.length === 0 ? (
									<p className="text-sm text-muted-foreground">Chưa có tag nào.</p>
								) : (
									<div className="flex flex-wrap gap-2">
										{tags.map((tag) => {
											const isActive = selectedTags.includes(tag.id);
											return (
												<button
													key={tag.id}
													type="button"
													onClick={() => toggleTag(tag.id)}
													disabled={submitting}
													className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
													<Badge
														variant={isActive ? "default" : "outline"}
														className="cursor-pointer rounded-full px-3 py-1 text-xs transition-all"
														style={
															tag.color && !isActive
																? {
																		borderColor: `${tag.color}50`,
																		color: tag.color,
																  }
																: tag.color && isActive
																  ? {
																			backgroundColor: tag.color,
																			borderColor: tag.color,
																			color: "#fff",
																	  }
																  : undefined
														}>
														{tag.name}
													</Badge>
												</button>
											);
										})}
									</div>
								)}
								{selectedTags.length > 0 && (
									<p className="mt-3 text-xs text-muted-foreground">
										Đã chọn {selectedTags.length} tag
									</p>
								)}
							</CardContent>
						</Card>

						{/* Actions */}
						<Card className="shadow-sm">
							<CardFooter className="flex flex-col gap-3 pt-6">
								<Button type="submit" className="w-full" disabled={submitting}>
									{submitting ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Send className="h-4 w-4" />
									)}
									{submitting ? "Đang đăng..." : "Đăng bài"}
								</Button>
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={() => navigate("/community/posts")}
									disabled={submitting}>
									Hủy
								</Button>
							</CardFooter>
						</Card>
					</div>
				</div>
			</form>
		</div>
	);
}

export default PostCreatePage;
