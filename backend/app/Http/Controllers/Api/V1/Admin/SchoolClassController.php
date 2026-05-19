<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\SchoolClass\StoreSchoolClassRequest;
use App\Http\Requests\Api\V1\SchoolClass\UpdateSchoolClassRequest;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

	public function show(SchoolClass $schoolClass): JsonResponse
	{
		$schoolClass->load(['major:id,value,label,slug,faculty_id', 'major.faculty:id,value,label,slug']);

		return $this->successResponse(true, $schoolClass, 'Lấy thông tin lớp thành công.');
	}

	public function store(StoreSchoolClassRequest $request): JsonResponse
	{
		$schoolClass = SchoolClass::query()->create([
			'major_id' => $request->integer('major_id'),
			'label' => trim($request->string('label')->value()),
			'value' => trim($request->string('value')->value()),
			'slug' => Str::slug($request->string('label')->value()) ?: Str::slug($request->string('value')->value()),
			'created_by' => $request->user()?->id,
			'updated_by' => $request->user()?->id,
		]);

		$schoolClass->load(['major:id,value,label,slug,faculty_id', 'major.faculty:id,value,label,slug']);

		return $this->createdResponse($schoolClass, 'Tạo lớp thành công.');
	}

	public function update(UpdateSchoolClassRequest $request, SchoolClass $schoolClass): JsonResponse
	{
		$schoolClass->update([
			'major_id' => $request->integer('major_id'),
			'label' => trim($request->string('label')->value()),
			'value' => trim($request->string('value')->value()),
			'slug' => Str::slug($request->string('label')->value()) ?: Str::slug($request->string('value')->value()),
			'updated_by' => $request->user()?->id,
		]);

		$schoolClass->load(['major:id,value,label,slug,faculty_id', 'major.faculty:id,value,label,slug']);

		return $this->successResponse(true, $schoolClass, 'Cập nhật lớp thành công.');
	}

	public function destroy(Request $request, SchoolClass $schoolClass): JsonResponse
	{
		if (User::query()->where('class_id', $schoolClass->id)->exists()) {
			return $this->validationErrorResponse([
				'school_class' => ['Không thể xóa lớp đang được gán cho người dùng.'],
			]);
		}

		$schoolClass->delete();

		return $this->successResponse(true, null, 'Xóa lớp thành công.');
	}
}
