import { useState, type ComponentProps } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setFile(null);
			setIsSubmitting(false);
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
				toast.success(
					`Đã import ${response.data.processed_rows} dòng, có ${response.data.errors.length} dòng lỗi.`,
				);
			} else {
				toast.success("Đã import dữ liệu khoa, ngành, lớp.");
			}

			handleOpenChange(false);
			await onImported?.();
		} catch (error) {
			toast.error(getErrorMessage(error));
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
				<DialogContent className='sm:max-w-[640px]'>
					<DialogHeader>
						<DialogTitle>Import khoa, ngành, lớp</DialogTitle>
						<DialogDescription>
							Hệ thống sẽ đọc sheet đầu tiên của file và tự tạo quan hệ khoa - ngành -
							lớp nếu chưa tồn tại.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						<div className='rounded-md border bg-muted/30 p-4 text-sm leading-6'>
							<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
								<div>
									<p className='font-medium'>Cột hỗ trợ</p>
									<p className='text-muted-foreground'>
										File mẫu mặc định gồm 3 cột <code>Tên Khoa</code>,{" "}
										<code>Tên Ngành</code>, <code>Tên Lớp</code>.
									</p>
								</div>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={downloadAcademicStructureTemplate}>
									<Download className='h-4 w-4' />
									Tải file mẫu
								</Button>
							</div>
							<p className='text-muted-foreground'>
								Ưu tiên dùng <code>Tên Khoa, Tên Ngành, Tên Lớp</code>.
							</p>
							<p className='text-muted-foreground'>
								Hệ thống cũng hỗ trợ các cột kỹ thuật như{" "}
								<code>faculty_label, major_label, class_label</code> nếu cần.
							</p>
							<p className='mt-2 text-muted-foreground'>
								Ví dụ dữ liệu: <code>Công nghệ thông tin, Quản trị mạng, QTM 24</code>
							</p>
						</div>

						<div className='space-y-2'>
							<label htmlFor='academic-structure-file' className='text-sm font-medium'>
								Chọn file import
							</label>
							<Input
								id='academic-structure-file'
								type='file'
								accept='.xlsx,.csv,text/csv'
								onChange={(event) => {
									setFile(event.target.files?.[0] ?? null);
								}}
							/>
							<p className='text-xs text-muted-foreground'>
								Hỗ trợ `.xlsx` và `.csv`, dung lượng tối đa 5MB.
							</p>
						</div>

					</div>

					<DialogFooter>
						<Button variant='outline' onClick={() => setOpen(false)} disabled={isSubmitting}>
							Đóng
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting || !file}>
							{isSubmitting ? "Đang import..." : "Bắt đầu import"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

export default AcademicStructureImportDialog;
