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
	Save,
	Square,
	Trash2,
	Type,
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
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
		image.src = src; // không set crossOrigin: ảnh khác origin vẫn hiển thị (chỉ ảnh hưởng export thumbnail)
		const onload = () => setImg(image);
		image.addEventListener("load", onload);
		return () => image.removeEventListener("load", onload);
	}, [src]);
	return img;
}

// ─── Node ảnh (cần hook nên tách riêng) ──────────────────────────────────────

function ImageNode({
	element,
	...rest
}: {
	element: CertificateElement;
	[key: string]: unknown;
}) {
	const img = useCanvasImage(element.src);
	return <KonvaImage image={img} {...rest} />;
}

// ─── Component chính ─────────────────────────────────────────────────────────

function CertificateTemplateEditorPage() {
	const { id } = useParams();
	const isEdit = Boolean(id);
	const navigate = useNavigate();

	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Trung tâm đào tạo" },
		{ title: "Giấy chứng nhận", link: "/certificate-templates" },
		{ title: isEdit ? "Chỉnh sửa mẫu" : "Tạo mẫu" },
	]);

	const [name, setName] = useState("Mẫu chứng chỉ mới");
	const [design, setDesign] = useState<CertificateDesign>(emptyDesign());
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [loading, setLoading] = useState(isEdit);
	const [saving, setSaving] = useState(false);
	const [previewing, setPreviewing] = useState(false);

	const stageRef = useRef<Konva.Stage>(null);
	const trRef = useRef<Konva.Transformer>(null);
	const nodeRefs = useRef<Record<string, Konva.Node>>({});
	const fileInputRef = useRef<HTMLInputElement>(null);
	const bgInputRef = useRef<HTMLInputElement>(null);

	const bgImage = useCanvasImage(design.canvas.background.image);

	// Nạp mẫu khi sửa
	useEffect(() => {
		if (!isEdit) return;
		let cancelled = false;
		certificateTemplateService
			.getTemplate(Number(id))
			.then((res) => {
				if (cancelled) return;
				setName(res.data.name);
				setDesign(normalizeDesign(res.data.design));
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

	const updateElement = useCallback((elId: string, patch: Partial<CertificateElement>) => {
		setDesign((d) => ({
			...d,
			elements: d.elements.map((e) => (e.id === elId ? { ...e, ...patch } : e)),
		}));
	}, []);

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
		setDesign((d) => ({ ...d, elements: [...d.elements, base] }));
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

	const addQr = () => addElement("qr", { width: 120, height: 120, x: CANVAS_W - 180, y: CANVAS_H - 180 });

	const handleAssetUpload = async (file: File, target: "element" | "background") => {
		try {
			const res = await certificateTemplateService.uploadAsset(file);
			const url = res.data.url;
			if (target === "background") {
				setDesign((d) => ({
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
		setDesign((d) => ({ ...d, elements: d.elements.filter((e) => e.id !== selectedId) }));
		setSelectedId(null);
	};

	const moveLayer = (dir: -1 | 1) => {
		if (!selectedId) return;
		setDesign((d) => {
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
		let thumbnail: string | null = null;
		try {
			thumbnail = stageRef.current?.toDataURL({ pixelRatio: 0.4 }) ?? null;
		} catch {
			thumbnail = null; // canvas bị "taint" do ảnh khác origin — bỏ qua thumbnail
		}
		try {
			const payload = { name, design, thumbnail };
			if (isEdit) {
				await certificateTemplateService.updateTemplate(Number(id), payload);
				toast.success("Đã lưu mẫu chứng chỉ.");
			} else {
				const res = await certificateTemplateService.createTemplate(payload);
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
			// data URI → blob → mở tab mới (tránh giới hạn độ dài data URI khi mở trực tiếp)
			const blob = await (await fetch(res.data.pdf)).blob();
			window.open(URL.createObjectURL(blob), "_blank");
		} catch {
			toast.error("Không tạo được bản xem trước.");
		} finally {
			setPreviewing(false);
		}
	};

	// Cập nhật element sau khi kéo/biến đổi trên canvas
	const commitTransform = (el: CertificateElement, node: Konva.Node) => {
		const scaleX = node.scaleX();
		const scaleY = node.scaleY();
		node.scaleX(1);
		node.scaleY(1);
		updateElement(el.id, {
			x: node.x(),
			y: node.y(),
			rotation: node.rotation(),
			width: Math.max(5, node.width() * scaleX),
			height: Math.max(el.type === "line" ? 0 : 5, node.height() * scaleY),
		});
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
			onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
				updateElement(el.id, { x: e.target.x(), y: e.target.y() }),
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
						width={el.width}
						height={el.height}
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
						fill="#e5e7eb"
						stroke="#9ca3af"
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
				<Button variant='ghost' size='sm' onClick={() => navigate("/certificate-templates")}>
					<ArrowLeft className='h-4 w-4' /> Quay lại
				</Button>
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					className='h-8 max-w-72'
					placeholder='Tên mẫu chứng chỉ'
				/>
				<div className='ml-auto flex gap-2'>
					<Button variant='outline' size='sm' onClick={handlePreview} disabled={previewing}>
						{previewing ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<Eye className='h-4 w-4' />
						)}
						Xem trước
					</Button>
					<Button size='sm' onClick={handleSave} disabled={saving}>
						{saving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
						Lưu
					</Button>
				</div>
			</div>

			<div className='flex min-h-0 flex-1'>
				{/* Toolbar trái */}
				<div className='w-44 shrink-0 space-y-1 border-r p-2'>
					<p className='px-2 py-1 text-xs font-medium text-muted-foreground'>Thêm phần tử</p>
					<ToolButton icon={<Type className='h-4 w-4' />} label='Văn bản' onClick={addText} />
					<ToolButton
						icon={<ImageIcon className='h-4 w-4' />}
						label='Ảnh / Logo'
						onClick={() => fileInputRef.current?.click()}
					/>
					<ToolButton icon={<Square className='h-4 w-4' />} label='Khối / Viền' onClick={addRect} />
					<ToolButton icon={<Minus className='h-4 w-4' />} label='Đường kẻ' onClick={addLine} />
					<ToolButton icon={<CircleIcon className='h-4 w-4' />} label='Elip' onClick={addEllipse} />
					<ToolButton icon={<QrCode className='h-4 w-4' />} label='Ô QR' onClick={addQr} />

					<div className='!mt-3 border-t pt-2'>
						<p className='px-2 py-1 text-xs font-medium text-muted-foreground'>Nền</p>
						<div className='flex items-center gap-2 px-2 py-1'>
							<input
								type='color'
								value={design.canvas.background.color}
								onChange={(e) =>
									setDesign((d) => ({
										...d,
										canvas: {
											...d.canvas,
											background: { ...d.canvas.background, color: e.target.value },
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
									setDesign((d) => ({
										...d,
										canvas: { ...d.canvas, background: { ...d.canvas.background, image: null } },
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
					<div className='shadow-lg' style={{ width: DISPLAY_W, height: CANVAS_H * SCALE }}>
						<Stage
							ref={stageRef}
							width={DISPLAY_W}
							height={CANVAS_H * SCALE}
							scaleX={SCALE}
							scaleY={SCALE}
							onMouseDown={(e) => {
								if (e.target === e.target.getStage()) setSelectedId(null);
							}}>
							<Layer>
								<Rect
									x={0}
									y={0}
									width={CANVAS_W}
									height={CANVAS_H}
									fill={design.canvas.background.color}
								/>
								{bgImage && (
									<KonvaImage image={bgImage} x={0} y={0} width={CANVAS_W} height={CANVAS_H} />
								)}
								{design.elements.map(renderNode)}
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
					<Button variant='outline' size='icon' className='h-7 w-7' onClick={() => onLayer(1)}>
						<ChevronUp className='h-4 w-4' />
					</Button>
					<Button variant='outline' size='icon' className='h-7 w-7' onClick={() => onLayer(-1)}>
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
					<Input type='number' value={Math.round(element.x)} onChange={(e) => onChange({ x: num(e.target.value) })} className='h-8' />
				</Field>
				<Field label='Y'>
					<Input type='number' value={Math.round(element.y)} onChange={(e) => onChange({ y: num(e.target.value) })} className='h-8' />
				</Field>
				<Field label='Rộng'>
					<Input type='number' value={Math.round(element.width)} onChange={(e) => onChange({ width: num(e.target.value) })} className='h-8' />
				</Field>
				{element.type !== "line" && (
					<Field label='Cao'>
						<Input type='number' value={Math.round(element.height)} onChange={(e) => onChange({ height: num(e.target.value) })} className='h-8' />
					</Field>
				)}
				<Field label='Xoay (°)'>
					<Input type='number' value={Math.round(element.rotation ?? 0)} onChange={(e) => onChange({ rotation: num(e.target.value) })} className='h-8' />
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
						<Select onValueChange={(v) => onChange({ text: `${element.text ?? ""}${v}` })}>
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
							<Select value={element.fontFamily ?? "Be Vietnam Pro"} onValueChange={(v) => onChange({ fontFamily: v })}>
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
							<Input type='number' value={element.fontSize ?? 28} onChange={(e) => onChange({ fontSize: num(e.target.value) })} className='h-8' />
						</Field>
						<Field label='Canh lề'>
							<Select value={element.align ?? "center"} onValueChange={(v) => onChange({ align: v as CertificateElement["align"] })}>
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
							<Select value={element.fontStyle ?? "normal"} onValueChange={(v) => onChange({ fontStyle: v })}>
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
					<ColorField label='Màu chữ' value={element.fill ?? "#111111"} onChange={(v) => onChange({ fill: v })} />
				</div>
			)}

			{/* Shape (rect/ellipse/line) */}
			{(element.type === "rect" || element.type === "ellipse" || element.type === "line") && (
				<div className='space-y-3 border-t pt-3'>
					<ColorField label='Màu viền' value={element.stroke ?? "#1d4ed8"} onChange={(v) => onChange({ stroke: v })} />
					<Field label='Độ dày viền'>
						<Input type='number' value={element.strokeWidth ?? 2} onChange={(e) => onChange({ strokeWidth: num(e.target.value) })} className='h-8' />
					</Field>
					{element.type !== "line" && (
						<>
							<ColorField
								label='Màu nền'
								value={element.fill && element.fill !== "transparent" ? element.fill : "#ffffff"}
								onChange={(v) => onChange({ fill: v })}
								transparent
								onTransparent={() => onChange({ fill: "transparent" })}
							/>
							{element.type === "rect" && (
								<Field label='Bo góc'>
									<Input type='number' value={element.cornerRadius ?? 0} onChange={(e) => onChange({ cornerRadius: num(e.target.value) })} className='h-8' />
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
