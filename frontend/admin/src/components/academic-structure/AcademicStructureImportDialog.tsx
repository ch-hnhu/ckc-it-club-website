import { useState } from "react";
import { Upload } from "lucide-react";
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
import academicStructureService from "@/services/academic-structure.service";
import type { AcademicStructureImportSummary } from "@/types/academic-structure.type";

interface AcademicStructureImportDialogProps {
	onImported?: () => void | Promise<void>;
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
}: AcademicStructureImportDialogProps) {
	const [open, setOpen] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState<AcademicStructureImportSummary | null>(null);

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setFile(null);
			setResult(null);
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
			setResult(response.data);
			await onImported?.();

			if (response.data.errors.length > 0) {
				toast.success(
					`Đã import ${response.data.processed_rows} dòng, có ${response.data.errors.length} dòng lỗi.`,
				);
			} else {
				toast.success("Đã import dữ liệu khoa, ngành, lớp.");
			}
		} catch (error) {
			toast.error(getErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<Button variant='outline' size='sm' className='h-8' onClick={() => setOpen(true)}>
				<Upload className='h-4 w-4' />
				Import Excel
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
							<p className='font-medium'>Cột hỗ trợ</p>
							<p className='text-muted-foreground'>
								Ưu tiên dùng <code>faculty_label, major_label, class_label</code>.
							</p>
							<p className='text-muted-foreground'>
								Có thể thêm <code>faculty_value, major_value, class_value</code> nếu
								muốn tách mã và tên.
							</p>
							<p className='mt-2 text-muted-foreground'>
								Ví dụ dữ liệu: <code>Công nghệ thông tin, Kỹ thuật phần mềm, CTK42</code>
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
									setResult(null);
								}}
							/>
							<p className='text-xs text-muted-foreground'>
								Hỗ trợ `.xlsx` và `.csv`, dung lượng tối đa 5MB.
							</p>
						</div>

						{result ? (
							<div className='space-y-3 rounded-md border p-4 text-sm'>
								<div className='grid gap-2 sm:grid-cols-3'>
									<div>
										<p className='text-muted-foreground'>Dòng hợp lệ</p>
										<p className='text-lg font-semibold'>{result.processed_rows}</p>
									</div>
									<div>
										<p className='text-muted-foreground'>Tạo mới</p>
										<p className='text-lg font-semibold'>
											{result.created.faculties +
												result.created.majors +
												result.created.school_classes}
										</p>
									</div>
									<div>
										<p className='text-muted-foreground'>Dòng lỗi</p>
										<p className='text-lg font-semibold'>{result.errors.length}</p>
									</div>
								</div>

								<div className='grid gap-3 sm:grid-cols-2'>
									<div className='rounded-md bg-muted/30 p-3'>
										<p className='font-medium'>Tạo mới</p>
										<p>Khoa: {result.created.faculties}</p>
										<p>Ngành: {result.created.majors}</p>
										<p>Lớp: {result.created.school_classes}</p>
									</div>
									<div className='rounded-md bg-muted/30 p-3'>
										<p className='font-medium'>Đã tồn tại</p>
										<p>Khoa: {result.existing.faculties}</p>
										<p>Ngành: {result.existing.majors}</p>
										<p>Lớp: {result.existing.school_classes}</p>
									</div>
								</div>

								{result.errors.length > 0 ? (
									<div className='space-y-2'>
										<p className='font-medium'>Lỗi theo dòng</p>
										<div className='max-h-40 space-y-2 overflow-y-auto rounded-md bg-destructive/5 p-3'>
											{result.errors.slice(0, 10).map((item) => (
												<p key={`${item.row}-${item.message}`}>
													Dòng {item.row}: {item.message}
												</p>
											))}
										</div>
									</div>
								) : null}
							</div>
						) : null}
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
