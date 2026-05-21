import {
	useState,
	type ChangeEvent,
	type ComponentProps,
	type DragEvent,
	type KeyboardEvent,
} from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { downloadAcademicStructureTemplate } from "@/lib/academic-structure-template";
import academicStructureService from "@/services/academic-structure.service";

interface AcademicStructureImportDialogProps {
	onImported?: () => void | Promise<void>;
	triggerLabel?: string;
	triggerVariant?: ComponentProps<typeof Button>["variant"];
	triggerSize?: ComponentProps<typeof Button>["size"];
	triggerClassName?: string;
}

function getErrorMessage(error: unknown) {
	if (
		typeof error === "object" &&
		error !== null &&
		"response" in error &&
		typeof error.response === "object" &&
		error.response !== null &&
		"data" in error.response &&
		typeof error.response.data === "object" &&
		error.response.data !== null
	) {
		const responseData = error.response.data as {
			message?: string;
			errors?: Record<string, string[]>;
		};
		const firstError = Object.values(responseData.errors ?? {})[0]?.[0];
		return firstError || responseData.message || "Import dữ liệu thất bại.";
	}

	return "Import dữ liệu thất bại.";
}

function AcademicStructureImportDialog({
	onImported,
	triggerLabel = "Import Excel",
	triggerVariant = "outline",
	triggerSize = "sm",
	triggerClassName,
}: AcademicStructureImportDialogProps) {
	const [open, setOpen] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setFile(null);
			setIsDragOver(false);
			setIsSubmitting(false);
		}
	};

	const selectFile = (nextFile: File | null) => {
		setFile(nextFile);
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		selectFile(event.target.files?.[0] ?? null);
	};

	const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		setIsDragOver(true);
	};

	const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		setIsDragOver(false);
	};

	const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		setIsDragOver(false);
		selectFile(event.dataTransfer.files?.[0] ?? null);
	};

	const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLLabelElement>) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			document.getElementById("academic-structure-file")?.click();
		}
	};

	const handleSubmit = async () => {
		if (!file) {
			toast.error("Vui lòng chọn file .xlsx hoặc .csv.");
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await academicStructureService.importStructure(file);

			if (response.data.errors.length > 0) {
				toast.warning(
					`Đã import ${response.data.processed_rows} dòng nhưng có ${response.data.errors.length} dòng lỗi.`,
				);
			} else {
				toast.success("Đã import dữ liệu khoa, ngành, lớp.");
			}

			handleOpenChange(false);
			await onImported?.();
		} catch (error) {
			toast.error(getErrorMessage(error));
			await onImported?.();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<Button
				variant={triggerVariant}
				size={triggerSize}
				className={cn("h-8", triggerClassName)}
				onClick={() => setOpen(true)}>
				<Upload className='h-4 w-4' />
				{triggerLabel}
			</Button>

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className='overflow-hidden p-0 shadow-2xl sm:max-w-[600px]'>
					<DialogHeader className='border-b bg-gradient-to-b from-slate-50 to-white px-6 pb-5 pt-6 text-left'>
						<div className='inline-flex w-fit items-center gap-2 rounded-full border border-slate-900/20 bg-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-900'>
							<Upload className='h-3.5 w-3.5' />
							<span>Import Excel</span>
						</div>
						<DialogTitle className='text-2xl font-bold tracking-tight'>
							Import khoa, ngành, lớp
						</DialogTitle>
						<p className='max-w-[520px] text-sm leading-6 text-muted-foreground'>
							Chọn file Excel theo mẫu để import dữ liệu khoa, ngành, lớp và tự tạo
							quan hệ nếu chưa tồn tại.
						</p>
					</DialogHeader>

					<div className='bg-white px-6 py-5'>
						<div className='grid gap-4'>
							<div className='space-y-2'>
								<label
									htmlFor='academic-structure-file'
									className='text-xs font-semibold tracking-[0.02em] text-slate-500'>
									File Excel <span className='text-destructive'>*</span>
								</label>
								<input
									id='academic-structure-file'
									type='file'
									accept='.xlsx,.csv,text/csv'
									className='sr-only'
									onChange={handleFileChange}
								/>
								<label
									htmlFor='academic-structure-file'
									role='button'
									tabIndex={0}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onDrop={handleDrop}
									onKeyDown={handleDropzoneKeyDown}
									className={cn(
										"flex min-h-[178px] w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center transition",
										"hover:border-slate-900 hover:bg-slate-100 hover:shadow-[0_0_0_4px_rgba(0,0,0,0.08)]",
										(isDragOver || file) &&
											"border-slate-900 bg-slate-100 shadow-[0_0_0_4px_rgba(0,0,0,0.08)]",
									)}>
									<span className='flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900/10 text-slate-900'>
										<FileSpreadsheet className='h-8 w-8' />
									</span>
									<span className='text-base font-bold text-slate-900'>
										Kéo thả hoặc chọn file
									</span>
									<span className='max-w-[380px] text-sm leading-5 text-slate-500'>
										Định dạng .xlsx hoặc .csv. File mẫu gồm 3 cột Tên Khoa, Tên
										Ngành, Tên Lớp. Dung lượng tối đa 5MB.
									</span>
									<span className='max-w-full truncate rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700'>
										{file?.name ?? "Chưa chọn file"}
									</span>
								</label>
							</div>
						</div>
					</div>

					<DialogFooter className='items-stretch justify-between border-t bg-slate-50 px-6 py-4 sm:flex-row'>
						<Button
							type='button'
							variant='outline'
							onClick={downloadAcademicStructureTemplate}
							className='h-9 border-slate-900/30 bg-white px-4 font-semibold text-slate-900 hover:bg-slate-100 hover:text-slate-900'>
							<Download className='h-4 w-4' />
							Tải file mẫu
						</Button>
						<div className='flex gap-2'>
							<Button
								type='button'
								variant='outline'
								onClick={() => setOpen(false)}
								disabled={isSubmitting}
								className='h-9 px-4 font-semibold'>
								Hủy
							</Button>
							<Button
								type='button'
								onClick={handleSubmit}
								disabled={isSubmitting || !file}
								className='h-9 bg-slate-900 px-4 font-semibold text-white hover:bg-slate-800'>
								<Upload className='h-4 w-4' />
								{isSubmitting ? "Đang import..." : "Import"}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

export default AcademicStructureImportDialog;
