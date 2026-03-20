import adminAxiosInstance from "@/config/axios.config";
import type {
	Product,
	CreateProductData,
	UpdateProductData,
	ProductWithCategory,
} from "@/types/product.types";
import type { ApiResponse, PaginatedResponse, ListQueryParams } from "@/types/api.types";

/**
 * Product Service
 * Handles all API calls related to products
 */
class ProductService {
	private readonly baseUrl = "/products";

	/**
	 * Get all products with pagination
	 * @param params - Query parameters (page, per_page, search, sort)
	 * @returns Paginated list of products
	 */
	async getProducts(params?: ListQueryParams): Promise<PaginatedResponse<Product>> {
		const response = await adminAxiosInstance.get<PaginatedResponse<Product>>(this.baseUrl, {
			params,
		});
		return response.data;
	}

	/**
	 * Get all products without pagination
	 * @returns List of all products
	 */
	async getAllProducts(): Promise<ApiResponse<Product[]>> {
		const response = await adminAxiosInstance.get<ApiResponse<Product[]>>(
			`${this.baseUrl}/all`,
		);
		return response.data;
	}

	/**
	 * Get single product by ID
	 * @param id - Product ID
	 * @returns Single product data
	 */
	async getProduct(id: number): Promise<ApiResponse<ProductWithCategory>> {
		const response = await adminAxiosInstance.get<ApiResponse<ProductWithCategory>>(
			`${this.baseUrl}/${id}`,
		);
		return response.data;
	}

	/**
	 * Create new product
	 * @param data - Product creation data
	 * @returns Created product
	 */
	async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
		const response = await adminAxiosInstance.post<ApiResponse<Product>>(this.baseUrl, data);
		return response.data;
	}

	/**
	 * Update existing product
	 * @param id - Product ID
	 * @param data - Product update data
	 * @returns Updated product
	 */
	async updateProduct(id: number, data: UpdateProductData): Promise<ApiResponse<Product>> {
		const response = await adminAxiosInstance.put<ApiResponse<Product>>(
			`${this.baseUrl}/${id}`,
			data,
		);
		return response.data;
	}

	/**
	 * Delete product
	 * @param id - Product ID
	 * @returns Success message
	 */
	async deleteProduct(id: number): Promise<ApiResponse<null>> {
		const response = await adminAxiosInstance.delete<ApiResponse<null>>(
			`${this.baseUrl}/${id}`,
		);
		return response.data;
	}

	/**
	 * Upload product image
	 * @param id - Product ID
	 * @param file - Image file
	 * @returns Updated product with image URL
	 */
	async uploadImage(id: number, file: File): Promise<ApiResponse<Product>> {
		const formData = new FormData();
		formData.append("image", file);

		const response = await adminAxiosInstance.post<ApiResponse<Product>>(
			`${this.baseUrl}/${id}/image`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			},
		);
		return response.data;
	}

	/**
	 * Search products by keyword
	 * @param keyword - Search keyword
	 * @param params - Additional query parameters
	 * @returns Paginated search results
	 */
	async searchProducts(
		keyword: string,
		params?: Omit<ListQueryParams, "search">,
	): Promise<PaginatedResponse<Product>> {
		const response = await adminAxiosInstance.get<PaginatedResponse<Product>>(this.baseUrl, {
			params: {
				...params,
				search: keyword,
			},
		});
		return response.data;
	}

	/**
	 * Get products by category
	 * @param categoryId - Category ID
	 * @param params - Query parameters
	 * @returns Paginated list of products in category
	 */
	async getProductsByCategory(
		categoryId: number,
		params?: ListQueryParams,
	): Promise<PaginatedResponse<Product>> {
		const response = await adminAxiosInstance.get<PaginatedResponse<Product>>(
			`${this.baseUrl}/category/${categoryId}`,
			{ params },
		);
		return response.data;
	}

	/**
	 * Bulk delete products
	 * @param ids - Array of product IDs
	 * @returns Success message
	 */
	async bulkDelete(ids: number[]): Promise<ApiResponse<null>> {
		const response = await adminAxiosInstance.post<ApiResponse<null>>(
			`${this.baseUrl}/bulk-delete`,
			{ ids },
		);
		return response.data;
	}
}

// Export singleton instance
export const productService = new ProductService();
