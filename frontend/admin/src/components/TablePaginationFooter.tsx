import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";

interface TablePaginationFooterProps {
	/** Số cột của bảng để colSpan trải hết hàng footer */
	colSpan: number;
	/** Số dòng đang hiển thị ở trang hiện tại */
	shown: number;
	total: number;
	/** Danh từ cho câu đếm, vd "buổi học", "học viên" */
	noun: string;
	page: number;
	perPage: number;
	lastPage: number;
	onPageChange: (page: number) => void;
	onPerPageChange: (perPage: number) => void;
	pageSizeOptions?: number[];
}

/**
 * Footer phân trang dùng chung — khớp markup footer của trang quản lý.
 * Đặt làm con trực tiếp của <Table> ngay sau <TableBody>.
 */
export function TablePaginationFooter({
	colSpan,
	shown,
	total,
	noun,
	page,
	perPage,
	lastPage,
	onPageChange,
	onPerPageChange,
	pageSizeOptions = [10, 20, 25, 50],
}: TablePaginationFooterProps) {
	return (
		<TableFooter className='bg-transparent'>
			<TableRow>
				<TableCell colSpan={colSpan}>
					<div className='flex items-center justify-between px-2'>
						<p className='flex-1 text-sm text-muted-foreground'>
							Đang hiển thị {shown} trên tổng {total} {noun}.
						</p>
						<div className='flex items-center space-x-6 lg:space-x-8'>
							<div className='flex items-center space-x-2'>
								<p className='text-sm font-medium'>Số hàng mỗi trang</p>
								<Select value={`${perPage}`} onValueChange={(v) => onPerPageChange(Number(v))}>
									<SelectTrigger className='h-8 w-[70px]'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent side='top'>
										{pageSizeOptions.map((s) => (
											<SelectItem key={s} value={`${s}`}>
												{s}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='flex w-[110px] items-center justify-center text-sm font-medium'>
								Trang {page} / {lastPage}
							</div>
							<div className='flex items-center space-x-2'>
								<Button
									variant='outline'
									className='hidden h-8 w-8 p-0 lg:flex'
									onClick={() => onPageChange(1)}
									disabled={page === 1}>
									<ChevronsLeft className='h-4 w-4' />
								</Button>
								<Button
									variant='outline'
									className='h-8 w-8 p-0'
									onClick={() => onPageChange(Math.max(1, page - 1))}
									disabled={page === 1}>
									<ChevronLeft className='h-4 w-4' />
								</Button>
								<Button
									variant='outline'
									className='h-8 w-8 p-0'
									onClick={() => onPageChange(Math.min(lastPage, page + 1))}
									disabled={page === lastPage}>
									<ChevronRight className='h-4 w-4' />
								</Button>
								<Button
									variant='outline'
									className='hidden h-8 w-8 p-0 lg:flex'
									onClick={() => onPageChange(lastPage)}
									disabled={page === lastPage}>
									<ChevronsRight className='h-4 w-4' />
								</Button>
							</div>
						</div>
					</div>
				</TableCell>
			</TableRow>
		</TableFooter>
	);
}
