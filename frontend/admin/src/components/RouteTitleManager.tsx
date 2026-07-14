import { useEffect } from "react";
import { Outlet, useMatches } from "react-router-dom";

const SITE_NAME = "CKC IT CLUB";

type RouteHandle = { title?: string };

/**
 * Đặt document.title theo route khớp sâu nhất có khai báo `handle.title`.
 * Định dạng: "CKC IT CLUB | Tên trang". Nếu route không khai báo title thì
 * chỉ hiển thị tên website.
 */
export default function RouteTitleManager() {
	const matches = useMatches();

	useEffect(() => {
		const active = [...matches]
			.reverse()
			.find((match) => (match.handle as RouteHandle | undefined)?.title);
		const title = (active?.handle as RouteHandle | undefined)?.title;
		document.title = title ? `${SITE_NAME} | ${title}` : SITE_NAME;
	}, [matches]);

	return <Outlet />;
}
