<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ApiMessage;
use App\Enums\HttpStatus;
use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;

class UserController extends BaseApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $sort = $request->query('sort', 'created_at');
        $order = $request->query('order', 'desc');
        $perPage = $request->query('per_page', 15);
        $search = $request->query('search');

        $data = User::query()
            ->when($search, function ($query, $search) {
                $query->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderBy($sort, $order)
            ->paginate($perPage);
        return $this->paginatedResponse($data, ApiMessage::USERS_RETRIEVED);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
