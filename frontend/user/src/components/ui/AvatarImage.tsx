import React from "react";
import { buildAvatar } from "@/lib/utils";

type AvatarImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
	/**
	 * Name used to generate the fallback avatar (ui-avatars) when the
	 * primary image fails to load. Usually the user's full name.
	 */
	fallbackName?: string | null;
};

/**
 * Avatar <img> that never disappears.
 *
 * Google avatar URLs (lh3.googleusercontent.com) can return HTTP 429 or a
 * broken image after repeated logins/requests, which made avatars vanish.
 * This component:
 *  - sends no `Referer` header (referrerPolicy="no-referrer") so Google
 *    is far less likely to rate-limit the request, and
 *  - falls back to a generated ui-avatars image on error.
 */
export function AvatarImage({
	fallbackName,
	onError,
	referrerPolicy = "no-referrer",
	...props
}: AvatarImageProps) {
	const fallback = buildAvatar(fallbackName ?? null, null);

	return (
		<img
			{...props}
			referrerPolicy={referrerPolicy}
			onError={(event) => {
				const img = event.currentTarget;
				if (img.src !== fallback) {
					img.src = fallback;
				}
				onError?.(event);
			}}
		/>
	);
}

export default AvatarImage;
