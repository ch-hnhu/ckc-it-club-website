import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ArrowLeft,
	ChevronDown,
	ChevronUp,
	Circle as CircleIcon,
	Eye,
	Image as ImageIcon,
	Loader2,
	Minus,
	QrCode,
	Redo2,
	Save,
	Square,
	Trash2,
	Type,
	Undo2,
} from "lucide-react";
import type Konva from "konva";
import {
	Ellipse,
	Image as KonvaImage,
	Layer,
	Line,
	Rect,
	Stage,
	Text as KonvaText,
	Transformer,
} from "react-konva";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { cn } from "@/lib/utils";
import certificateTemplateService from "@/services/certificate-template.service";
import type {
	CertificateDesign,
	CertificateElement,
	CertificateElementType,
} from "@/types/certificate-template.type";

// ─── Hằng số ─────────────────────────────────────────────────────────────────

const CANVAS_W = 1123;
const CANVAS_H = 794; // A4 ngang @ 96dpi
const DISPLAY_W = 760; // bề rộng hiển thị canvas trong editor
const SCALE = DISPLAY_W / CANVAS_W;

const FONTS = ["Be Vietnam Pro", "Roboto", "Arial", "Times New Roman", "Georgia"];

const PLACEHOLDERS: Array<{ token: string; label: string }> = [
	{ token: "{{name}}", label: "Tên học viên" },
	{ token: "{{course}}", label: "Tên khóa học" },
	{ token: "{{issued_at}}", label: "Ngày cấp" },
	{ token: "{{cert_code}}", label: "Mã chứng chỉ" },
];

const emptyDesign = (): CertificateDesign => ({
	canvas: { width: CANVAS_W, height: CANVAS_H, background: { color: "#ffffff", image: null } },
	elements: [],
});

/** Chuẩn hoá design nạp từ server để luôn đủ field (chống dữ liệu cũ/thiếu). */
const normalizeDesign = (d: Partial<CertificateDesign> | null | undefined): CertificateDesign => {
	const base = emptyDesign();
	return {
		canvas: {
			width: d?.canvas?.width ?? base.canvas.width,
			height: d?.canvas?.height ?? base.canvas.height,
			background: {
				color: d?.canvas?.background?.color ?? base.canvas.background.color,
				image: d?.canvas?.background?.image ?? null,
			},
		},
		elements: Array.isArray(d?.elements) ? d!.elements : [],
	};
};

const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Hook nạp ảnh cho canvas ─────────────────────────────────────────────────

function useCanvasImage(src?: string | null) {
	const [img, setImg] = useState<HTMLImageElement>();
	useEffect(() => {
		if (!src) {
			setImg(undefined);
			return;
		}
		const image = new window.Image();
		image.src = src;
		const onload = () => setImg(image);
		image.addEventListener("load", onload);
		return () => image.removeEventListener("load", onload);
	}, [src]);
	return img;
}

// ─── Node ảnh (cần hook nên tách riêng) ──────────────────────────────────────

function ImageNode({ element, ...rest }: { element: CertificateElement; [key: string]: unknown }) {
	const img = useCanvasImage(element.src);
	return <KonvaImage image={img} {...rest} />;
}

// ─── Component chính ─────────────────────────────────────────────────────────

function CertificateTemplateEditorPage() {
	const { id } = useParams();
	const isEdit = Boolean(id);
	const navigate = useNavigate();

	useBreadcrumb([
		{ title: "Khoá học", link: "/courses" },
		{ title: "Giấy chứng nhận", link: "/certificate-templates" },
		{ title: isEdit ? "Chỉnh sửa mẫu" : "Tạo mẫu" },
	]);

	const [name, setName] = useState("Mẫu chứng chỉ mới");
	const [design, setDesign] = useState<CertificateDesign>(emptyDesign());
	const [past, setPast] = useState<CertificateDesign[]>([]);
	const [future, setFuture] = useState<CertificateDesign[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [loading, setLoading] = useState(isEdit);
	const [saving, setSaving] = useState(false);
	const [previewing, setPreviewing] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [dirty, setDirty] = useState(false);
	const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });

	const stageRef = useRef<Konva.Stage>(null);
	const trRef = useRef<Konva.Transformer>(null);
	const nodeRefs = useRef<Record<string, Konva.Node>>({});
	const fileInputRef = useRef<HTMLInputElement>(null);
	const bgInputRef = useRef<HTMLInputElement>(null);
	const designRef = useRef(design);
	designRef.current = design;

	const bgImage = useCanvasImage(design.canvas.background.image);
	const [, setFontsReady] = useState(false);

	// Nạp font web (Be Vietnam Pro, Roboto) cho canvas editor khớp với bản render PDF,
	// rồi ép Konva vẽ lại (Konva không tự redraw khi font tải xong).
	useEffect(() => {
		const href =
			"https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,700;1,400;1,700&family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap";
		if (!document.querySelector(`link[href="${href}"]`)) {
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = href;
			document.head.appendChild(link);
		}
		Promise.all([
			document.fonts.load('400 40px "Be Vietnam Pro"'),
			document.fonts.load('700 40px "Be Vietnam Pro"'),
			document.fonts.load('400 40px "Roboto"'),
			document.fonts.load('700 40px "Roboto"'),
		])
			.then(() => setFontsReady(true))
			.catch(() => undefined);
	}, []);

	// Mutator có lịch sử (undo/redo). Mọi thay đổi của người dùng đi qua đây.
	const commit = useCallback(
		(updater: CertificateDesign | ((d: CertificateDesign) => CertificateDesign)) => {
			setPast((p) => [...p, designRef.current]);
			setFuture([]);
			setDirty(true);
			setDesign((prev) => (typeof updater === "function" ? updater(prev) : updater));
		},
		[],
	);

	const undo = useCallback(() => {
		setPast((p) => {
			if (p.length === 0) return p;
			setFuture((f) => [designRef.current, ...f]);
			setDesign(p[p.length - 1]);
			setDirty(true);
			return p.slice(0, -1);
		});
	}, []);

	const redo = useCallback(() => {
		setFuture((f) => {
			if (f.length === 0) return f;
			setPast((p) => [...p, designRef.current]);
			setDesign(f[0]);
			setDirty(true);
			return f.slice(1);
		});
	}, []);

	// Phím tắt undo/redo (bỏ qua khi đang gõ trong input/textarea)
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
				e.preventDefault();
				e.shiftKey ? redo() : undo();
			} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
				e.preventDefault();
				redo();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [undo, redo]);

	// Cảnh báo khi đóng/refresh/rời tab trình duyệt nếu có thay đổi chưa lưu.
	useEffect(() => {
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			if (!dirty) return;
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", onBeforeUnload);
		return () => window.removeEventListener("beforeunload", onBeforeUnload);
	}, [dirty]);

	// Chặn điều hướng trong app (nút Quay lại, sidebar, link...) khi chưa lưu.
	const blocker = useBlocker(
		useCallback(
			({
				currentLocation,
				nextLocation,
			}: {
				currentLocation: { pathname: string };
				nextLocation: { pathname: string };
			}) => dirty && currentLocation.pathname !== nextLocation.pathname,
			[dirty],
		),
	);

	// Nạp mẫu khi sửa — reset lịch sử
	useEffect(() => {
		if (!isEdit) return;
		let cancelled = false;
		certificateTemplateService
			.getTemplate(Number(id))
			.then((res) => {
				if (cancelled) return;
				setName(res.data.name);
				setDesign(normalizeDesign(res.data.design));
				setPast([]);
				setFuture([]);
				setDirty(false);
			})
			.catch(() => toast.error("Không tải được mẫu chứng chỉ."))
			.finally(() => !cancelled && setLoading(false));
		return () => {
			cancelled = true;
		};
	}, [id, isEdit]);

	// Gắn Transformer vào node đang chọn
	useEffect(() => {
		const tr = trRef.current;
		if (!tr) return;
		const node = selectedId ? nodeRefs.current[selectedId] : null;
		tr.nodes(node ? [node] : []);
		tr.getLayer()?.batchDraw();
	}, [selectedId, design.elements]);

	const selected = useMemo(
		() => design.elements.find((e) => e.id === selectedId) ?? null,
		[design.elements, selectedId],
	);

	const updateElement = useCallback(
		(elId: string, patch: Partial<CertificateElement>) => {
			commit((d) => ({
				...d,
				elements: d.elements.map((e) => (e.id === elId ? { ...e, ...patch } : e)),
			}));
		},
		[commit],
	);

	const addElement = (type: CertificateElementType, extra: Partial<CertificateElement> = {}) => {
		const base: CertificateElement = {
			id: uid(),
			type,
			x: CANVAS_W / 2 - 150,
			y: CANVAS_H / 2 - 30,
			width: 300,
			height: type === "text" ? 60 : 120,
			rotation: 0,
			...extra,
		};
		commit((d) => ({ ...d, elements: [...d.elements, base] }));
		setSelectedId(base.id);
	};

	const addText = () =>
		addElement("text", {
			text: "Nhập nội dung",
			fontFamily: "Be Vietnam Pro",
			fontSize: 32,
			fill: "#111111",
			align: "center",
			fontStyle: "normal",
			width: 400,
			height: 48,
		});

	const addRect = () =>
		addElement("rect", {
			x: 40,
			y: 40,
			width: CANVAS_W - 80,
			height: CANVAS_H - 80,
			fill: "transparent",
			stroke: "#1d4ed8",
			strokeWidth: 8,
			cornerRadius: 0,
		});

	const addLine = () =>
		addElement("line", { width: 300, height: 0, stroke: "#111111", strokeWidth: 3 });

	const addEllipse = () =>
		addElement("ellipse", { fill: "transparent", stroke: "#1d4ed8", strokeWidth: 4 });

	const addQr = () =>
		addElement("qr", { width: 120, height: 120, x: CANVAS_W - 180, y: CANVAS_H - 180 });

	const handleAssetUpload = async (file: File, target: "element" | "background") => {
		try {
			const res = await certificateTemplateService.uploadAsset(file);
			const url = res.data.url;
			if (target === "background") {
				commit((d) => ({
					...d,
					canvas: { ...d.canvas, background: { ...d.canvas.background, image: url } },
				}));
			} else {
				addElement("image", { src: url, width: 160, height: 160 });
			}
			toast.success("Đã tải ảnh lên.");
		} catch {
			toast.error("Tải ảnh thất bại.");
		}
	};

	const removeSelected = () => {
		if (!selectedId) return;
		commit((d) => ({ ...d, elements: d.elements.filter((e) => e.id !== selectedId) }));
		setSelectedId(null);
	};

	const moveLayer = (dir: -1 | 1) => {
		if (!selectedId) return;
		commit((d) => {
			const idx = d.elements.findIndex((e) => e.id === selectedId);
			const to = idx + dir;
			if (idx < 0 || to < 0 || to >= d.elements.length) return d;
			const next = [...d.elements];
			[next[idx], next[to]] = [next[to], next[idx]];
			return { ...d, elements: next };
		});
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			// Thumbnail được render server-side (Browsershot) để khớp đúng thiết kế và tránh
			// lỗi "tainted canvas" khi thiết kế có ảnh khác origin.
			const payload = { name, design };
			if (isEdit) {
				await certificateTemplateService.updateTemplate(Number(id), payload);
				setDirty(false);
				toast.success("Đã lưu mẫu chứng chỉ.");
			} else {
				const res = await certificateTemplateService.createTemplate(payload);
				setDirty(false);
				toast.success("Đã tạo mẫu chứng chỉ.");
				navigate(`/certificate-templates/${res.data.id}/edit`, { replace: true });
			}
		} catch {
			toast.error("Lưu mẫu thất bại.");
		} finally {
			setSaving(false);
		}
	};

	const handlePreview = async () => {
		setPreviewing(true);
		try {
			const res = await certificateTemplateService.previewTemplate(design);
			// data URI → blob → hiện trong Dialog (không dùng window.open vì hay bị chặn pop-up)
			const blob = await (await fetch(res.data.pdf)).blob();
			setPreviewUrl((old) => {
				if (old) URL.revokeObjectURL(old);
				return URL.createObjectURL(blob);
			});
		} catch (err: unknown) {
			// Hiện lỗi thật để dễ chẩn đoán (status / message) thay vì nuốt lỗi.
			const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
			const detail = e?.response?.status
				? `HTTP ${e.response.status}${e.response.data?.message ? " – " + e.response.data.message : ""}`
				: e?.message || "lỗi không xác định";
			console.error("[Xem trước] lỗi:", err);
			toast.error("Không tạo được bản xem trước: " + detail);
		} finally {
			setPreviewing(false);
		}
	};

	// Cập nhật element sau khi biến đổi (resize/xoay) trên canvas
	const commitTransform = (el: CertificateElement, node: Konva.Node) => {
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();
		node.scaleX(1);
		node.scaleY(1);
		const width = Math.max(5, node.width() * scaleX);
		const height = Math.max(el.type === "line" ? 0 : 5, node.height() * scaleY);
		// Ellipse được vẽ theo tâm → quy về toạ độ góc trên-trái để nhất quán với renderer.
		const x = el.type === "ellipse" ? node.x() - width / 2 : node.x();
		const y = el.type === "ellipse" ? node.y() - height / 2 : node.y();
		updateElement(el.id, { x, y, rotation: node.rotation(), width, height });
	};

	// ── Snap: gom các đường căn (mép/tâm canvas + mép/tâm các object khác) ──
	const SNAP = 6;
	const snapTargets = (excludeId: string) => {
		const v = [0, CANVAS_W / 2, CANVAS_W];
		const h = [0, CANVAS_H / 2, CANVAS_H];
		for (const e of designRef.current.elements) {
			if (e.id === excludeId) continue;
			v.push(e.x, e.x + e.width / 2, e.x + e.width);
			h.push(e.y, e.y + e.height / 2, e.y + e.height);
		}
		return { v, h };
	};

	const handleDragMove = (el: CertificateElement, node: Konva.Node) => {
		const layer = node.getLayer();
		if (!layer) return;
		const box = node.getClientRect({ relativeTo: layer });
		const { v, h } = snapTargets(el.id);
		const vEdges = [box.x, box.x + box.width / 2, box.x + box.width];
		const hEdges = [box.y, box.y + box.height / 2, box.y + box.height];

		let bestV: { t: number; d: number; delta: number } | null = null;
		for (const t of v)
			for (const edge of vEdges) {
				const d = Math.abs(edge - t);
				if (d <= SNAP && (!bestV || d < bestV.d)) bestV = { t, d, delta: t - edge };
			}
		let bestH: { t: number; d: number; delta: number } | null = null;
		for (const t of h)
			for (const edge of hEdges) {
				const d = Math.abs(edge - t);
				if (d <= SNAP && (!bestH || d < bestH.d)) bestH = { t, d, delta: t - edge };
			}

		if (bestV) node.x(node.x() + bestV.delta);
		if (bestH) node.y(node.y() + bestH.delta);
		setGuides({ v: bestV ? [bestV.t] : [], h: bestH ? [bestH.t] : [] });
	};

	const handleDragEnd = (el: CertificateElement, node: Konva.Node) => {
		setGuides({ v: [], h: [] });
		const x = el.type === "ellipse" ? node.x() - el.width / 2 : node.x();
		const y = el.type === "ellipse" ? node.y() - el.height / 2 : node.y();
		updateElement(el.id, { x, y });
	};

	const registerNode = (elId: string) => (n: Konva.Node | null) => {
		if (n) nodeRefs.current[elId] = n;
		else delete nodeRefs.current[elId];
	};

	const renderNode = (el: CertificateElement) => {
		const common = {
			ref: registerNode(el.id),
			x: el.x,
			y: el.y,
			rotation: el.rotation ?? 0,
			draggable: true,
			onClick: () => setSelectedId(el.id),
			onTap: () => setSelectedId(el.id),
			onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => handleDragMove(el, e.target),
			onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(el, e.target),
			onTransformEnd: (e: Konva.KonvaEventObject<Event>) => commitTransform(el, e.target),
		};

		switch (el.type) {
			case "text":
				return (
					<KonvaText
						key={el.id}
						{...common}
						text={el.text || " "}
						width={el.width}
						fontSize={el.fontSize ?? 28}
						fontFamily={el.fontFamily ?? "Be Vietnam Pro"}
						fontStyle={el.fontStyle ?? "normal"}
						fill={el.fill ?? "#111111"}
						align={el.align ?? "center"}
					/>
				);
			case "image":
				return (
					<ImageNode
						key={el.id}
						element={el}
						{...common}
						width={el.width}
						height={el.height}
					/>
				);
			case "rect":
				return (
					<Rect
						key={el.id}
						{...common}
						width={el.width}
						height={el.height}
						fill={el.fill === "transparent" ? undefined : el.fill}
						stroke={el.stroke}
						strokeWidth={el.strokeWidth}
						cornerRadius={el.cornerRadius}
					/>
				);
			case "ellipse":
				return (
					<Ellipse
						key={el.id}
						{...common}
						x={el.x + el.width / 2}
						y={el.y + el.height / 2}
						radiusX={el.width / 2}
						radiusY={el.height / 2}
						fill={el.fill === "transparent" ? undefined : el.fill}
						stroke={el.stroke}
						strokeWidth={el.strokeWidth}
					/>
				);
			case "line":
				return (
					<Line
						key={el.id}
						{...common}
						points={[0, 0, el.width, 0]}
						stroke={el.stroke ?? "#111"}
						strokeWidth={el.strokeWidth ?? 3}
					/>
				);
			case "qr":
				return (
					<Rect
						key={el.id}
						{...common}
						width={el.width}
						height={el.height}
						fill='#e5e7eb'
						stroke='#9ca3af'
						strokeWidth={1}
						dash={[6, 4]}
					/>
				);
			default:
				return null;
		}
	};

	if (loading) {
		return (
			<div className='flex h-[60vh] items-center justify-center text-muted-foreground'>
				<Loader2 className='mr-2 h-5 w-5 animate-spin' /> Đang tải mẫu...
			</div>
		);
	}

	return (
		<div className='flex h-[calc(100vh-4rem)] flex-col'>
			{/* Thanh trên */}
			<div className='flex items-center gap-3 border-b px-4 py-2'>
				<Button
					variant='ghost'
					size='sm'
					onClick={() => navigate("/certificate-templates")}>
					<ArrowLeft className='h-4 w-4' /> Quay lại
				</Button>
				<Input
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						setDirty(true);
					}}
					className='h-8 max-w-72'
					placeholder='Tên mẫu chứng chỉ'
				/>
				<div className='ml-auto flex gap-2'>
					<Button
						variant='outline'
						size='icon'
						className='h-8 w-8'
						title='Hoàn tác (Ctrl+Z)'
						onClick={undo}
						disabled={past.length === 0}>
						<Undo2 className='h-4 w-4' />
					</Button>
					<Button
						variant='outline'
						size='icon'
						className='h-8 w-8'
						title='Làm lại (Ctrl+Shift+Z)'
						onClick={redo}
						disabled={future.length === 0}>
						<Redo2 className='h-4 w-4' />
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={handlePreview}
						disabled={previewing}>
						{previewing ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<Eye className='h-4 w-4' />
						)}
						Xem trước
					</Button>
					<Button size='sm' onClick={handleSave} disabled={saving}>
						{saving ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<Save className='h-4 w-4' />
						)}
						Lưu
					</Button>
				</div>
			</div>

			<div className='flex min-h-0 flex-1'>
				{/* Toolbar trái */}
				<div className='w-44 shrink-0 space-y-1 border-r p-2'>
					<p className='px-2 py-1 text-xs font-medium text-muted-foreground'>
						Thêm phần tử
					</p>
					<ToolButton
						icon={<Type className='h-4 w-4' />}
						label='Văn bản'
						onClick={addText}
					/>
					<ToolButton
						icon={<ImageIcon className='h-4 w-4' />}
						label='Ảnh / Logo'
						onClick={() => fileInputRef.current?.click()}
					/>
					<ToolButton
						icon={<Square className='h-4 w-4' />}
						label='Khối / Viền'
						onClick={addRect}
					/>
					<ToolButton
						icon={<Minus className='h-4 w-4' />}
						label='Đường kẻ'
						onClick={addLine}
					/>
					<ToolButton
						icon={<CircleIcon className='h-4 w-4' />}
						label='Elip'
						onClick={addEllipse}
					/>
					<ToolButton
						icon={<QrCode className='h-4 w-4' />}
						label='Ô QR'
						onClick={addQr}
					/>

					<div className='!mt-3 border-t pt-2'>
						<p className='px-2 py-1 text-xs font-medium text-muted-foreground'>Nền</p>
						<div className='flex items-center gap-2 px-2 py-1'>
							<input
								type='color'
								value={design.canvas.background.color}
								onChange={(e) =>
									commit((d) => ({
										...d,
										canvas: {
											...d.canvas,
											background: {
												...d.canvas.background,
												color: e.target.value,
											},
										},
									}))
								}
								className='h-7 w-7 cursor-pointer rounded border'
							/>
							<span className='text-xs text-muted-foreground'>Màu nền</span>
						</div>
						<ToolButton
							icon={<ImageIcon className='h-4 w-4' />}
							label='Ảnh nền'
							onClick={() => bgInputRef.current?.click()}
						/>
						{design.canvas.background.image && (
							<button
								type='button'
								onClick={() =>
									commit((d) => ({
										...d,
										canvas: {
											...d.canvas,
											background: { ...d.canvas.background, image: null },
										},
									}))
								}
								className='w-full px-2 py-1 text-left text-xs text-destructive hover:underline'>
								Xóa ảnh nền
							</button>
						)}
					</div>

					<input
						ref={fileInputRef}
						type='file'
						accept='image/*'
						className='hidden'
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) handleAssetUpload(f, "element");
							e.target.value = "";
						}}
					/>
					<input
						ref={bgInputRef}
						type='file'
						accept='image/*'
						className='hidden'
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) handleAssetUpload(f, "background");
							e.target.value = "";
						}}
					/>
				</div>

				{/* Canvas giữa */}
				<div className='flex min-w-0 flex-1 items-center justify-center overflow-auto bg-muted/40 p-6'>
					<div
						className='shadow-lg'
						style={{ width: DISPLAY_W, height: CANVAS_H * SCALE }}>
						<Stage
							ref={stageRef}
							width={DISPLAY_W}
							height={CANVAS_H * SCALE}
							scaleX={SCALE}
							scaleY={SCALE}
							onMouseDown={(e) => {
								// Click vào vùng trống (stage) hoặc nền → bỏ chọn.
								if (e.target === e.target.getStage() || e.target.name() === "bg")
									setSelectedId(null);
							}}>
							<Layer>
								{/* Nền không listening để click xuyên qua xuống stage → bỏ chọn được;
								    đặt name="bg" để onMouseDown nhận diện vùng nền. */}
								<Rect
									name='bg'
									x={0}
									y={0}
									width={CANVAS_W}
									height={CANVAS_H}
									fill={design.canvas.background.color}
									listening={false}
								/>
								{bgImage && (
									<KonvaImage
										image={bgImage}
										x={0}
										y={0}
										width={CANVAS_W}
										height={CANVAS_H}
										listening={false}
									/>
								)}
								{design.elements.map(renderNode)}
								{guides.v.map((x, i) => (
									<Line
										key={`gv${i}`}
										points={[x, 0, x, CANVAS_H]}
										stroke='#ec4899'
										strokeWidth={1 / SCALE}
										dash={[6, 4]}
										listening={false}
									/>
								))}
								{guides.h.map((y, i) => (
									<Line
										key={`gh${i}`}
										points={[0, y, CANVAS_W, y]}
										stroke='#ec4899'
										strokeWidth={1 / SCALE}
										dash={[6, 4]}
										listening={false}
									/>
								))}
								<Transformer
									ref={trRef}
									rotateEnabled
									boundBoxFunc={(oldBox, newBox) =>
										newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
									}
								/>
							</Layer>
						</Stage>
					</div>
				</div>

				{/* Panel thuộc tính phải */}
				<div className='w-72 shrink-0 overflow-y-auto border-l p-3'>
					{selected ? (
						<PropertyPanel
							element={selected}
							onChange={(patch) => updateElement(selected.id, patch)}
							onDelete={removeSelected}
							onLayer={moveLayer}
						/>
					) : (
						<p className='px-1 py-6 text-center text-sm text-muted-foreground'>
							Chọn một phần tử trên canvas để chỉnh sửa thuộc tính.
						</p>
					)}
				</div>
			</div>

			{/* Xem trước PDF ngay trong app (không dùng pop-up) */}
			<Dialog
				open={Boolean(previewUrl)}
				onOpenChange={(o) => {
					if (!o) {
						setPreviewUrl((url) => {
							if (url) URL.revokeObjectURL(url);
							return null;
						});
					}
				}}>
				<DialogContent className='max-w-[90vw] sm:max-w-4xl'>
					<DialogHeader>
						<DialogTitle>Xem trước chứng chỉ</DialogTitle>
					</DialogHeader>
					{previewUrl && (
						<iframe
							title='Xem trước chứng chỉ'
							src={previewUrl}
							className='h-[70vh] w-full rounded-md border'
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* Cảnh báo chưa lưu khi rời trang qua điều hướng trong app */}
			<Dialog
				open={blocker.state === "blocked"}
				onOpenChange={(o) => {
					if (!o && blocker.state === "blocked") blocker.reset();
				}}>
				<DialogContent className='sm:max-w-[440px]'>
					<DialogHeader>
						<DialogTitle>Thay đổi chưa được lưu</DialogTitle>
					</DialogHeader>
					<p className='text-sm text-muted-foreground'>
						Bạn có thay đổi chưa lưu trên mẫu chứng chỉ. Nếu rời khỏi trang, các thay
						đổi này sẽ bị mất.
					</p>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => blocker.state === "blocked" && blocker.reset()}>
							Ở lại
						</Button>
						<Button
							variant='destructive'
							onClick={() => blocker.state === "blocked" && blocker.proceed()}>
							Rời đi (bỏ thay đổi)
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ─── Nút toolbar ─────────────────────────────────────────────────────────────

function ToolButton({
	icon,
	label,
	onClick,
}: {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type='button'
			onClick={onClick}
			className='flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted'>
			{icon}
			{label}
		</button>
	);
}

// ─── Panel thuộc tính ────────────────────────────────────────────────────────

function PropertyPanel({
	element,
	onChange,
	onDelete,
	onLayer,
}: {
	element: CertificateElement;
	onChange: (patch: Partial<CertificateElement>) => void;
	onDelete: () => void;
	onLayer: (dir: -1 | 1) => void;
}) {
	const num = (v: string) => Math.round(Number(v) || 0);
	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-medium capitalize'>{element.type}</span>
				<div className='flex gap-1'>
					<Button
						variant='outline'
						size='icon'
						className='h-7 w-7'
						onClick={() => onLayer(1)}>
						<ChevronUp className='h-4 w-4' />
					</Button>
					<Button
						variant='outline'
						size='icon'
						className='h-7 w-7'
						onClick={() => onLayer(-1)}>
						<ChevronDown className='h-4 w-4' />
					</Button>
					<Button variant='outline' size='icon' className='h-7 w-7' onClick={onDelete}>
						<Trash2 className='h-4 w-4 text-destructive' />
					</Button>
				</div>
			</div>

			{/* Vị trí & kích thước */}
			<div className='grid grid-cols-2 gap-2'>
				<Field label='X'>
					<Input
						type='number'
						value={Math.round(element.x)}
						onChange={(e) => onChange({ x: num(e.target.value) })}
						className='h-8'
					/>
				</Field>
				<Field label='Y'>
					<Input
						type='number'
						value={Math.round(element.y)}
						onChange={(e) => onChange({ y: num(e.target.value) })}
						className='h-8'
					/>
				</Field>
				<Field label='Rộng'>
					<Input
						type='number'
						value={Math.round(element.width)}
						onChange={(e) => onChange({ width: num(e.target.value) })}
						className='h-8'
					/>
				</Field>
				{element.type !== "line" && (
					<Field label='Cao'>
						<Input
							type='number'
							value={Math.round(element.height)}
							onChange={(e) => onChange({ height: num(e.target.value) })}
							className='h-8'
						/>
					</Field>
				)}
				<Field label='Xoay (°)'>
					<Input
						type='number'
						value={Math.round(element.rotation ?? 0)}
						onChange={(e) => onChange({ rotation: num(e.target.value) })}
						className='h-8'
					/>
				</Field>
			</div>

			{/* Văn bản */}
			{element.type === "text" && (
				<div className='space-y-3 border-t pt-3'>
					<Field label='Nội dung'>
						<textarea
							value={element.text ?? ""}
							onChange={(e) => onChange({ text: e.target.value })}
							rows={2}
							className='w-full rounded-md border bg-transparent px-2 py-1 text-sm'
						/>
					</Field>
					<Field label='Chèn placeholder'>
						<Select
							onValueChange={(v) => onChange({ text: `${element.text ?? ""}${v}` })}>
							<SelectTrigger className='h-8'>
								<SelectValue placeholder='Chọn trường...' />
							</SelectTrigger>
							<SelectContent>
								{PLACEHOLDERS.map((p) => (
									<SelectItem key={p.token} value={p.token}>
										{p.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
					<div className='grid grid-cols-2 gap-2'>
						<Field label='Font'>
							<Select
								value={element.fontFamily ?? "Be Vietnam Pro"}
								onValueChange={(v) => onChange({ fontFamily: v })}>
								<SelectTrigger className='h-8'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{FONTS.map((f) => (
										<SelectItem key={f} value={f}>
											{f}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<Field label='Cỡ chữ'>
							<Input
								type='number'
								value={element.fontSize ?? 28}
								onChange={(e) => onChange({ fontSize: num(e.target.value) })}
								className='h-8'
							/>
						</Field>
						<Field label='Canh lề'>
							<Select
								value={element.align ?? "center"}
								onValueChange={(v) =>
									onChange({ align: v as CertificateElement["align"] })
								}>
								<SelectTrigger className='h-8'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='left'>Trái</SelectItem>
									<SelectItem value='center'>Giữa</SelectItem>
									<SelectItem value='right'>Phải</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<Field label='Kiểu'>
							<Select
								value={element.fontStyle ?? "normal"}
								onValueChange={(v) => onChange({ fontStyle: v })}>
								<SelectTrigger className='h-8'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='normal'>Thường</SelectItem>
									<SelectItem value='bold'>Đậm</SelectItem>
									<SelectItem value='italic'>Nghiêng</SelectItem>
									<SelectItem value='italic bold'>Đậm nghiêng</SelectItem>
								</SelectContent>
							</Select>
						</Field>
					</div>
					<ColorField
						label='Màu chữ'
						value={element.fill ?? "#111111"}
						onChange={(v) => onChange({ fill: v })}
					/>
				</div>
			)}

			{/* Shape (rect/ellipse/line) */}
			{(element.type === "rect" || element.type === "ellipse" || element.type === "line") && (
				<div className='space-y-3 border-t pt-3'>
					<ColorField
						label='Màu viền'
						value={element.stroke ?? "#1d4ed8"}
						onChange={(v) => onChange({ stroke: v })}
					/>
					<Field label='Độ dày viền'>
						<Input
							type='number'
							value={element.strokeWidth ?? 2}
							onChange={(e) => onChange({ strokeWidth: num(e.target.value) })}
							className='h-8'
						/>
					</Field>
					{element.type !== "line" && (
						<>
							<ColorField
								label='Màu nền'
								value={
									element.fill && element.fill !== "transparent"
										? element.fill
										: "#ffffff"
								}
								onChange={(v) => onChange({ fill: v })}
								transparent
								onTransparent={() => onChange({ fill: "transparent" })}
							/>
							{element.type === "rect" && (
								<Field label='Bo góc'>
									<Input
										type='number'
										value={element.cornerRadius ?? 0}
										onChange={(e) =>
											onChange({ cornerRadius: num(e.target.value) })
										}
										className='h-8'
									/>
								</Field>
							)}
						</>
					)}
				</div>
			)}

			{element.type === "qr" && (
				<p className='border-t pt-3 text-xs text-muted-foreground'>
					Ô QR sẽ được thay bằng mã QR xác minh thật khi cấp chứng chỉ.
				</p>
			)}
		</div>
	);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className='space-y-1'>
			<Label className='text-xs text-muted-foreground'>{label}</Label>
			{children}
		</div>
	);
}

function ColorField({
	label,
	value,
	onChange,
	transparent,
	onTransparent,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	transparent?: boolean;
	onTransparent?: () => void;
}) {
	return (
		<Field label={label}>
			<div className='flex items-center gap-2'>
				<input
					type='color'
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className='h-8 w-10 cursor-pointer rounded border'
				/>
				<span className='text-xs text-muted-foreground'>{value}</span>
				{transparent && (
					<button
						type='button'
						onClick={onTransparent}
						className={cn("ml-auto text-xs hover:underline", "text-muted-foreground")}>
						Trong suốt
					</button>
				)}
			</div>
		</Field>
	);
}

export default CertificateTemplateEditorPage;
