import { useState } from "react";
import axios from "axios";
import { ArrowUp, ArrowDown, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import aboutPageService from "@/services/about-page.service";
import { ABOUT_BG_OPTIONS, ABOUT_ICON_NAMES } from "@/types/about";

/**
 * Các helper field dùng chung cho những trình chỉnh sửa nội dung trang tĩnh
 * (trang chủ và trang giới thiệu). Cùng chia sẻ vì hai trang dùng chung một mô
 * hình config (slug `about-*` trong club_informations).
 */

export function getErrorMessage(error: unknown, fallback: string) {
	if (axios.isAxiosError(error)) {
		const responseMessage = (error.response?.data as { message?: string } | undefined)?.message;
		if (responseMessage) return responseMessage;
	}
	if (error instanceof Error && error.message) return error.message;
	return fallback;
}

export function TextField({
	label,
	value,
	onChange,
	placeholder,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
}) {
	return (
		<div className='space-y-1.5'>
			<Label>{label}</Label>
			<Input
				value={value}
				placeholder={placeholder}
				onChange={(e) => onChange(e.target.value)}
			/>
		</div>
	);
}

export function AreaField({
	label,
	value,
	onChange,
	rows = 3,
	hint,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	rows?: number;
	hint?: string;
}) {
	return (
		<div className='space-y-1.5'>
			<Label>{label}</Label>
			<Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
			{hint ? <p className='text-xs text-muted-foreground'>{hint}</p> : null}
		</div>
	);
}

export function IconField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	return (
		<div className='space-y-1.5'>
			<Label>Icon</Label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger>
					<SelectValue placeholder='Chọn icon' />
				</SelectTrigger>
				<SelectContent>
					{ABOUT_ICON_NAMES.map((name) => (
						<SelectItem key={name} value={name}>
							{name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

export function BgField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	return (
		<div className='space-y-1.5'>
			<Label>Màu nền</Label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger>
					<SelectValue placeholder='Chọn màu' />
				</SelectTrigger>
				<SelectContent>
					{ABOUT_BG_OPTIONS.map((opt) => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

/** Chọn/tải ảnh: xem trước + nút tải lên (upload trả URL) + ô nhập URL thủ công. */
export function ImageField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	const [uploading, setUploading] = useState(false);

	const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = ""; // cho phép chọn lại cùng một file
		if (!file) return;
		setUploading(true);
		try {
			const url = await aboutPageService.uploadImage(file);
			onChange(url);
			toast.success("Đã tải ảnh lên.");
		} catch (error) {
			toast.error(getErrorMessage(error, "Không thể tải ảnh lên."));
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className='space-y-1.5'>
			<Label>{label}</Label>
			<div className='flex items-start gap-3'>
				<div className='flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted'>
					{value ? (
						<img src={value} alt='' className='h-full w-full object-cover' />
					) : (
						<span className='text-xs text-muted-foreground'>Chưa có ảnh</span>
					)}
				</div>
				<div className='flex-1 space-y-2'>
					<div className='flex items-center gap-2'>
						<Button asChild type='button' variant='outline' size='sm' disabled={uploading}>
							<label className='cursor-pointer'>
								{uploading ? (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								) : (
									<ImagePlus className='mr-2 h-4 w-4' />
								)}
								{uploading ? "Đang tải..." : "Tải ảnh lên"}
								<input
									type='file'
									accept='image/*'
									className='hidden'
									disabled={uploading}
									onChange={(e) => void handleFile(e)}
								/>
							</label>
						</Button>
						{value ? (
							<Button
								type='button'
								variant='ghost'
								size='sm'
								className='text-destructive'
								onClick={() => onChange("")}>
								Xóa ảnh
							</Button>
						) : null}
					</div>
					<Input
						value={value}
						placeholder='Hoặc dán URL ảnh'
						onChange={(e) => onChange(e.target.value)}
					/>
				</div>
			</div>
		</div>
	);
}

/** Khung một item trong danh sách, có nút lên/xuống/xóa. */
export function ListItemCard({
	index,
	total,
	title,
	onMoveUp,
	onMoveDown,
	onRemove,
	children,
}: {
	index: number;
	total: number;
	title: string;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
	children: React.ReactNode;
}) {
	return (
		<div className='rounded-lg border p-4 space-y-3'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-semibold'>{title}</span>
				<div className='flex items-center gap-1'>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						disabled={index === 0}
						onClick={onMoveUp}>
						<ArrowUp className='h-4 w-4' />
					</Button>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						disabled={index === total - 1}
						onClick={onMoveDown}>
						<ArrowDown className='h-4 w-4' />
					</Button>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='text-destructive'
						onClick={onRemove}>
						<Trash2 className='h-4 w-4' />
					</Button>
				</div>
			</div>
			{children}
		</div>
	);
}

/* ---------- Immutable list helpers ---------- */

export function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
	const next = [...list];
	const target = index + dir;
	if (target < 0 || target >= next.length) return list;
	[next[index], next[target]] = [next[target], next[index]];
	return next;
}

export function replaceAt<T>(list: T[], index: number, patch: Partial<T>): T[] {
	return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}
