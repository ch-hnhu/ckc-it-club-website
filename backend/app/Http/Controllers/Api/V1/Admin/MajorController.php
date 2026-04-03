<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Major;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MajorController extends BaseApiController
{
	public function index(Request $request): JsonResponse
	{
		$allowedSorts = ['id', 'value', 'label', 'slug', 'faculty_id', 'created_at'];
		$sort = $request->query('sort', 'created_at');
		$order = $request->query('order', 'desc');
		$perPage = (int) $request->query('per_page', 10);
		$search = $request->query('search');

		if (! in_array($sort, $allowedSorts, true)) {
			$sort = 'created_at';
		}

		if (! in_array($order, ['asc', 'desc'], true)) {
			$order = 'desc';
		}

		$data = Major::query()
			->with(['faculty:id,value,label,slug'])
			->withCount('schoolClasses')
			->when($search, function ($query, $search) {
				$query->where(function ($subQuery) use ($search) {
					$subQuery
						->where('value', 'like', "%{$search}%")
						->orWhere('label', 'like', "%{$search}%")
						->orWhere('slug', 'like', "%{$search}%")
						->orWhereHas('faculty', function ($facultyQuery) use ($search) {
							$facultyQuery
								->where('value', 'like', "%{$search}%")
								->orWhere('label', 'like', "%{$search}%");
						});
				});
			})
			->orderBy($sort, $order)
			->paginate($perPage);

		return $this->paginatedResponse($data, ApiMessage::RETRIEVED);
	}
}