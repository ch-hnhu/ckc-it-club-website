import React, { useEffect, useRef } from "react";
import { getYouTubeId, isEmbedUrl } from "@/lib/videoTracking";

// ─── Loader cho YouTube IFrame API (nhúng 1 lần, dùng chung) ──────────────────────

// Kiểu tối giản cho window.YT — tránh phụ thuộc @types.
type YTPlayer = {
	getCurrentTime: () => number;
	getDuration: () => number;
	destroy: () => void;
};

declare global {
	interface Window {
		YT?: {
			Player: new (
				el: HTMLElement | string,
				opts: Record<string, unknown>,
			) => YTPlayer;
			PlayerState: { PLAYING: number };
		};
		onYouTubeIframeAPIReady?: () => void;
	}
}

let ytApiPromise: Promise<NonNullable<Window["YT"]>> | null = null;

const loadYouTubeApi = (): Promise<NonNullable<Window["YT"]>> => {
	if (ytApiPromise) return ytApiPromise;
	ytApiPromise = new Promise((resolve) => {
		if (window.YT?.Player) {
			resolve(window.YT);
			return;
		}
		const prev = window.onYouTubeIframeAPIReady;
		window.onYouTubeIframeAPIReady = () => {
			prev?.();
			if (window.YT) resolve(window.YT);
		};
		if (!document.getElementById("youtube-iframe-api")) {
			const tag = document.createElement("script");
			tag.id = "youtube-iframe-api";
			tag.src = "https://www.youtube.com/iframe_api";
			document.head.appendChild(tag);
		}
	});
	return ytApiPromise;
};

// ─── TrackedVideoPlayer ──────────────────────────────────────────────────────────

interface TrackedVideoPlayerProps {
	url: string;
	title: string;
	/** Gọi liên tục với % xem hiện tại (0–100, đã làm tròn). */
	onPercent: (percent: number) => void;
}

/**
 * Player theo dõi tiến độ xem. Remount khi `url` đổi (parent nên đặt key={url}).
 * Với embed không theo dõi được thì chỉ render iframe thường, không báo % (nút hoàn thành
 * ở parent tự chuyển sang chế độ đánh dấu tay).
 */
const TrackedVideoPlayer: React.FC<TrackedVideoPlayerProps> = ({ url, title, onPercent }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	// Giữ callback mới nhất mà không cần đưa vào deps của effect.
	const onPercentRef = useRef(onPercent);
	useEffect(() => {
		onPercentRef.current = onPercent;
	}, [onPercent]);

	const youTubeId = getYouTubeId(url);
	const trackableNative = !youTubeId && !isEmbedUrl(url);

	// ── Nhánh YouTube: dựng player + poll tiến độ ──
	useEffect(() => {
		if (!youTubeId || !containerRef.current) return;
		let player: YTPlayer | null = null;
		let pollId: number | undefined;
		let cancelled = false;

		loadYouTubeApi().then((YT) => {
			if (cancelled || !containerRef.current) return;
			const host = document.createElement("div");
			host.className = "h-full w-full";
			containerRef.current.appendChild(host);

			player = new YT.Player(host, {
				videoId: youTubeId,
				width: "100%",
				height: "100%",
				playerVars: {
					rel: 0,
					modestbranding: 1,
					origin: window.location.origin,
				},
				events: {
					onReady: () => {
						pollId = window.setInterval(() => {
							if (!player) return;
							const dur = player.getDuration();
							if (!dur || dur <= 0) return;
							const pct = Math.min(100, Math.round((player.getCurrentTime() / dur) * 100));
							onPercentRef.current(pct);
						}, 1500);
					},
				},
			});
		});

		return () => {
			cancelled = true;
			if (pollId) window.clearInterval(pollId);
			try {
				player?.destroy();
			} catch {
				/* player có thể đã bị gỡ */
			}
		};
	}, [youTubeId]);

	if (youTubeId) {
		return <div ref={containerRef} className='h-full w-full' />;
	}

	// ── Nhánh video mp4 gốc: theo dõi qua timeupdate ──
	if (trackableNative) {
		return (
			<video
				key={url}
				src={url}
				controls
				className='h-full w-full'
				onTimeUpdate={(e) => {
					const el = e.currentTarget;
					if (!el.duration || el.duration <= 0) return;
					onPercentRef.current(Math.min(100, Math.round((el.currentTime / el.duration) * 100)));
				}}
			/>
		);
	}

	// ── Embed không theo dõi được (Vimeo, Drive...): iframe thường ──
	return (
		<iframe
			key={url}
			src={url}
			title={title}
			className='h-full w-full'
			allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
			allowFullScreen
		/>
	);
};

export default TrackedVideoPlayer;
