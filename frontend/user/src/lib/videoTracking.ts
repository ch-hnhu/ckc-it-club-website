// Helper nhận diện nguồn video để theo dõi tiến độ xem (dùng bởi TrackedVideoPlayer & VideoDetailPage).

/** Bóc videoId từ các dạng URL YouTube (embed / watch?v= / youtu.be). null nếu không phải YouTube. */
export const getYouTubeId = (url: string): string | null => {
	const patterns = [
		/youtube\.com\/embed\/([\w-]{6,})/,
		/youtube\.com\/watch\?[^#]*\bv=([\w-]{6,})/,
		/youtu\.be\/([\w-]{6,})/,
	];
	for (const p of patterns) {
		const m = url.match(p);
		if (m) return m[1];
	}
	return null;
};

export const isEmbedUrl = (url: string) => url.includes("youtube") || url.includes("/embed");

/**
 * Xác định video có theo dõi được tiến độ xem không:
 * - YouTube  → có (qua IFrame Player API)
 * - file mp4 (<video> gốc) → có (event timeupdate)
 * - embed khác (Vimeo, Drive...) → không (cross-origin, trình duyệt chặn)
 */
export const isTrackableUrl = (url: string): boolean => {
	if (!url) return false;
	if (getYouTubeId(url)) return true;
	if (!isEmbedUrl(url)) return true; // file video trực tiếp
	return false;
};
