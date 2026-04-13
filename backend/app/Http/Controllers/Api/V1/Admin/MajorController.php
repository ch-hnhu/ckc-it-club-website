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
		$allowedSorts = ['id', 'value', 'label', 'slug', 'faculty_id', 'created_at', 'updated_at', 'faculty_label', 'school_classes_count'];
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
			->leftJoin('faculties', 'majors.faculty_id', '=', 'faculties.id')
			->select('majors.*')
			->with(['faculty:id,value,label,slug'])
			->withCount('schoolClasses')
			->when($search, function ($query, $search) {
				$query->where(function ($subQuery) use ($search) {
					$subQuery
						->where('majors.value', 'like', "%{$search}%")
						->orWhere('majors.label', 'like', "%{$search}%")
						->orWhere('majors.slug', 'like', "%{$search}%")
						->orWhereHas('faculty', function ($facultyQuery) use ($search) {
							$facultyQuery
								->where('value', 'like', "%{$search}%")
								->orWhere('label', 'like', "%{$search}%");
						});
				});
			})
			->when($sort === 'faculty_label', function ($query) use ($order) {
				$query->orderByRaw("COALESCE(faculties.label, faculties.value) {$order}");
			})
			->when($sort !== 'faculty_label', function ($query) use ($sort, $order) {
				if ($sort === 'school_classes_count') {
					$query->orderBy($sort, $order);

					return;
				}

				$query->orderBy("majors.{$sort}", $order);
			})
			->paginate($perPage);

		return $this->paginatedResponse($data, ApiMessage::RETRIEVED);
	}
}
