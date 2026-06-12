import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolvePublicAssetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }

  const baseUrl = import.meta.env.VITE_USER_SITE_URL || "http://localhost:5174";
  if (baseUrl && path.startsWith("/assets/")) {
    return `${String(baseUrl).replace(/\/$/, "")}${path}`;
  }

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  if (backendUrl && path.startsWith("/storage/")) {
    return `${String(backendUrl).replace(/\/$/, "")}${path}`;
  }

  return path;
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}
