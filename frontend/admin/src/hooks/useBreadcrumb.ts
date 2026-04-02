{
	/**
	 * How to use:
	 *
	 * 1. Import hook: import { useBreadcrumb } from "@/hooks/useBreadcrumb";
	 * 2. Tạo một array các breadcrumb item trong component con, ví dụ:
	 *    const breadcrumbs = [
	 *      { title: "Dashboard", link: "/" },
	 *      { title: "Users", link: "/users" },
	 *      { title: "User Detail" } // item cuối thường không cần link vì nó đại diện cho trang hiện tại
	 *    ];
	 * 3. Gọi hook useBreadcrumb với array đó: useBreadcrumb(breadcrumbs);
	 */
}

import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import type { BreadcrumbItemType } from "../components/partials/CustomBreadcrumb";
import type { OutletContextType } from "../layouts/MainLayout";

/**
 * Hook tùy chỉnh để cập nhật custom breadcrumb từ các component con
 */
export function useBreadcrumb(items: BreadcrumbItemType[]) {
	const context = useOutletContext<OutletContextType>();

	useEffect(() => {
		if (context?.setBreadcrumbs) {
			context.setBreadcrumbs(items);
		}
	}, []);
}
