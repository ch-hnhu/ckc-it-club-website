import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatRelativeTime(isoString: string): string {
	const diffMs = Date.now() - new Date(isoString).getTime();
	const mins = Math.floor(diffMs / 60_000);
	const hours = Math.floor(diffMs / 3_600_000);
	const days = Math.floor(diffMs / 86_400_000);
	if (mins < 1) return "vừa xong";
	if (mins < 60) return `${mins} phút`;
	if (hours < 24) return `${hours} giờ`;
	if (days < 30) return `${days} ngày`;
	return new Date(isoString).toLocaleDateString("vi-VN");
}

export function formatNotificationTime(isoString: string): string {
	const diff = Date.now() - new Date(isoString).getTime();
	const minutes = Math.floor(diff / 60_000);
	if (minutes < 1) return "Vừa xong";
	if (minutes < 60) return `${minutes} phút trước`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} giờ trước`;
	return `${Math.floor(hours / 24)} ngày trước`;
}

export function getHandle(username: string | null, email: string): string {
	if (username) return `@${username}`;
	return `@${email.split("@")[0]}`;
}

export function buildAvatar(
	name: string | null | undefined,
	avatar: string | null | undefined,
): string {
	if (avatar) return avatar;
	const n = name || "CKC";
	return `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=d4f2c4&color=111111&bold=true`;
}

export function buildProfileUrl(
	username: string | null | undefined,
	email: string | null | undefined,
): string {
	const handle = username || (email ? email.split("@")[0] : "unknown");
	return `/@${handle}`;
}

export function readingTime(htmlContent: string): number {
	const text = htmlContent.replace(/<[^>]*>/g, " ");
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 200));
}

export function isVideoMediaUrl(url: string): boolean {
	const path = (() => {
		try {
			return new URL(url, window.location.origin).pathname;
		} catch {
			return url;
		}
	})();

	return /\.(mp4|webm|mov|m4v)$/i.test(path);
}
