export function formatEventDate(isoString: string): string {
	return new Date(isoString).toLocaleDateString("vi-VN", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

export function formatEventTime(isoString: string): string {
	return new Date(isoString).toLocaleTimeString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatEventDateTime(isoString: string): string {
	return `${formatEventDate(isoString)} · ${formatEventTime(isoString)}`;
}
