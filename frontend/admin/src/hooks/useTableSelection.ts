import { useEffect, useMemo, useState } from "react";

export function useTableSelection(rowIds: number[]) {
	const [selectedIds, setSelectedIds] = useState<number[]>([]);

	useEffect(() => {
		const visibleIds = new Set(rowIds);

		setSelectedIds((prev) => {
			const next = prev.filter((id) => visibleIds.has(id));

			if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
				return prev;
			}

			return next;
		});
	}, [rowIds]);

	const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
	const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIdSet.has(id));

	const toggleAll = (checked: boolean) => {
		setSelectedIds(checked ? [...new Set(rowIds)] : []);
	};

	const toggleOne = (rowId: number, checked: boolean) => {
		setSelectedIds((prev) => {
			if (checked) {
				return prev.includes(rowId) ? prev : [...prev, rowId];
			}

			return prev.filter((id) => id !== rowId);
		});
	};

	const isSelected = (rowId: number) => selectedIdSet.has(rowId);

	return {
		allSelected,
		isSelected,
		selectedIds,
		toggleAll,
		toggleOne,
	};
}
