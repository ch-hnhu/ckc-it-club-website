import { useEffect, useMemo, useState } from "react";

/**
 * Phân trang phía client cho một mảng đã tải sẵn (vd các tab chi tiết khóa học).
 * Tự kẹp lại trang hiện tại khi tổng số phần tử giảm (đổi bộ lọc...).
 */
export function useClientPagination<T>(items: T[], defaultPerPage = 10) {
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(defaultPerPage);

	const total = items.length;
	const lastPage = Math.max(1, Math.ceil(total / perPage));

	useEffect(() => {
		if (page > lastPage) setPage(lastPage);
	}, [page, lastPage]);

	const pageItems = useMemo(
		() => items.slice((page - 1) * perPage, (page - 1) * perPage + perPage),
		[items, page, perPage],
	);

	const setPerPageReset = (n: number) => {
		setPerPage(n);
		setPage(1);
	};

	return { page, setPage, perPage, setPerPage: setPerPageReset, total, lastPage, pageItems };
}
