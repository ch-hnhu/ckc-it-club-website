// src/types/api.types.ts
/**
 * Generic API Response Types
 * Used across all API endpoints
 */

// Success response with single data
export interface ApiResponse<T> {
	success: boolean;
	message: string;
	data: T;
}

// Error response
export interface ApiErrorResponse {
	success: false;
	message: string;
	errors?: Record<string, string[]>; // Validation errors
}

// Paginated response
export interface PaginatedResponse<T> {
	success: boolean;
	message: string;
	data: T[];
	meta: PaginationMeta;
	links: PaginationLinks;
}

// Pagination metadata
export interface PaginationMeta {
	current_page: number;
	from: number;
	last_page: number;
	per_page: number;
	to: number;
	total: number;
}

// Pagination links
export interface PaginationLinks {
	first: string;
	last: string;
	prev: string | null;
	next: string | null;
}

// Query parameters for listing
export interface ListQueryParams {
	page?: number;
	per_page?: number;
	search?: string;
	sort_by?: string;
	sort_order?: "asc" | "desc";
}
