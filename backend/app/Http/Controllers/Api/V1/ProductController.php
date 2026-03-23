<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ApiMessage;
use App\Enums\HttpStatus;
use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends BaseApiController
{
    /**
     * Display a listing of products.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // Example: Get all products with pagination
        // $products = Product::paginate($this->perPage);
        // return $this->paginatedResponse($products, ApiMessage::PRODUCTS_RETRIEVED);

        // For demo purposes
        $products = [
            ['id' => 1, 'name' => 'Product 1', 'price' => 100],
            ['id' => 2, 'name' => 'Product 2', 'price' => 200],
        ];

        return $this->successResponse($products);
    }

    /**
     * Store a newly created product.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // Validate request
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        // Example: Create product
        // $product = Product::create($validated);
        // return $this->createdResponse($product);

        // For demo purposes
        $product = array_merge(['id' => 1], $validated);

        return $this->createdResponse($product);
    }

    /**
     * Display the specified product.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        // Example: Find product
        // $product = Product::find($id);
        // if (!$product) {
        //     return $this->notFoundResponse();
        // }
        // return $this->successResponse($product);

        // For demo purposes
        if ($id > 100) {
            return $this->notFoundResponse();
        }

        $product = ['id' => $id, 'name' => 'Product '.$id, 'price' => 100];

        return $this->successResponse($product);
    }

    /**
     * Update the specified product.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        // Validate request
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        // Example: Update product
        // $product = Product::find($id);
        // if (!$product) {
        //     return $this->notFoundResponse();
        // }
        // $product->update($validated);
        // return $this->successResponse($product);

        // For demo purposes
        if ($id > 100) {
            return $this->notFoundResponse();
        }

        $product = array_merge(['id' => $id], $validated);

        return $this->successResponse($product);
    }

    /**
     * Remove the specified product.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        // Example: Delete product
        // $product = Product::find($id);
        // if (!$product) {
        //     return $this->notFoundResponse();
        // }
        // $product->delete();
        // return $this->successResponse(null);

        // For demo purposes
        if ($id > 100) {
            return $this->notFoundResponse();
        }

        return $this->successResponse(null);
    }
}
