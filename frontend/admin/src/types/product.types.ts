// src/types/product.types.ts
/**
 * Product related types
 */

// Main product interface
export interface Product {
	id: number;
	name: string;
	description?: string;
	price: number;
	stock?: number;
	category_id?: number;
	image?: string;
	created_at?: string;
	updated_at?: string;
}

// Product creation data (without auto-generated fields)
export type CreateProductData = Omit<Product, "id" | "created_at" | "updated_at">;

// Product update data (all fields optional except id)
export type UpdateProductData = Partial<CreateProductData>;

// Product with category relationship
export interface ProductWithCategory extends Product {
	category?: {
		id: number;
		name: string;
	};
}

// Product form data (for forms)
export interface ProductFormData {
	name: string;
	description: string;
	price: number;
	stock: number;
	category_id: number | null;
	image: File | null;
}
