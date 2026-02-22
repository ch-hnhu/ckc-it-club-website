// src/types/index.ts
/**
 * Central export point for all types
 * Import from here: import { Product, ApiResponse } from '@/types'
 */

// API types
export type {
	ApiResponse,
	ApiErrorResponse,
	PaginatedResponse,
	PaginationMeta,
	PaginationLinks,
	ListQueryParams,
} from "./api.types";

// Product types
export type {
	Product,
	CreateProductData,
	UpdateProductData,
	ProductWithCategory,
	ProductFormData,
} from "./product.types";
