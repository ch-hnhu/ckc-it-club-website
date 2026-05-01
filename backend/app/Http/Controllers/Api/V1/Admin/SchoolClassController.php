<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolClassController extends BaseApiController
{
	public function index(Request $request): JsonResponse
	{
		$allowedSorts = ['id', 'value', 'label', 'slug', 'major_id', 'created_at', 'updated_at', 'major_label', 'faculty_label'];
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

		$data = SchoolClass::query()
			->leftJoin('majors', 'school_classes.major_id', '=', 'majors.id')
			->leftJoin('faculties', 'majors.faculty_id', '=', 'faculties.id')
			->select('school_classes.*')
			->with(['major:id,value,label,slug,faculty_id', 'major.faculty:id,value,label,slug'])
			->when($search, function ($query, $search) {
				$query->where(function ($subQuery) use ($search) {
					$subQuery
						->where('school_classes.value', 'like', "%{$search}%")
						->orWhere('school_classes.label', 'like', "%{$search}%")
						->orWhere('school_classes.slug', 'like', "%{$search}%")
						->orWhereHas('major', function ($majorQuery) use ($search) {
							$majorQuery
								->where('value', 'like', "%{$search}%")
								->orWhere('label', 'like', "%{$search}%")
								->orWhereHas('faculty', function ($facultyQuery) use ($search) {
									$facultyQuery
										->where('value', 'like', "%{$search}%")
										->orWhere('label', 'like', "%{$search}%");
								});
						});
				});
			})
			->when($sort === 'major_label', function ($query) use ($order) {
				$query->orderByRaw("COALESCE(majors.label, majors.value) {$order}");
			})
			->when($sort === 'faculty_label', function ($query) use ($order) {
				$query->orderByRaw("COALESCE(faculties.label, faculties.value) {$order}");
			})
			->when(! in_array($sort, ['major_label', 'faculty_label'], true), function ($query) use ($sort, $order) {
				$query->orderBy("school_classes.{$sort}", $order);
			})
			->paginate($perPage);

		return $this->paginatedResponse($data, ApiMessage::RETRIEVED);
	}
}
