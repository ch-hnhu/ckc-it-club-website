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
		$majorId = $request->integer('major_id') ?: null;

		if (! in_array($sort, $allowedSorts, true)) {
			$sort = 'created_at';
		}

		if (! in_array($order, ['asc', 'desc'], true)) {
			$order = 'desc';
		}

		$data = $this->schoolClassListQuery()
			->when($majorId, function ($query) use ($majorId) {
				$query->where('school_classes.major_id', $majorId);
			})
			->when($search, fn ($query, $search) => $this->applySearch($query, $search))
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

		$data->getCollection()->transform(fn (SchoolClass $schoolClass) => $this->transformSchoolClass($schoolClass));

		return $this->paginatedResponse($data, ApiMessage::RETRIEVED);
	}

	public function trash(Request $request): JsonResponse
	{
		$allowedSorts = ['id', 'value', 'label', 'slug', 'major_id', 'created_at', 'updated_at', 'deleted_at', 'major_label', 'faculty_label'];
		$sort = $request->query('sort', 'deleted_at');
		$order = $request->query('order', 'desc');
		$perPage = (int) $request->query('per_page', 10);
		$search = $request->query('search');
		$majorId = $request->integer('major_id') ?: null;

		if (! in_array($sort, $allowedSorts, true)) {
			$sort = 'deleted_at';
		}

		if (! in_array($order, ['asc', 'desc'], true)) {
			$order = 'desc';
		}

		$data = $this->schoolClassListQuery(onlyTrashed: true)
			->when($majorId, function ($query) use ($majorId) {
				$query->where('school_classes.major_id', $majorId);
			})
			->when($search, fn ($query, $search) => $this->applySearch($query, $search))
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

		$data->getCollection()->transform(fn (SchoolClass $schoolClass) => $this->transformSchoolClass($schoolClass));

		return $this->paginatedResponse($data, ApiMessage::RETRIEVED);
	}

	public function show(SchoolClass $schoolClass): JsonResponse
	{
		$this->loadRelations($schoolClass);

		return $this->successResponse(true, $this->transformSchoolClass($schoolClass), 'Lấy thông tin lớp thành công.');
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

		$this->loadRelations($schoolClass);

		return $this->createdResponse($this->transformSchoolClass($schoolClass), 'Tạo lớp thành công.');
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

		$this->loadRelations($schoolClass);

		return $this->successResponse(true, $this->transformSchoolClass($schoolClass), 'Cập nhật lớp thành công.');
	}

	public function destroy(Request $request, SchoolClass $schoolClass): JsonResponse
	{
		if (User::query()->where('class_id', $schoolClass->id)->exists()) {
			return $this->validationErrorResponse([
				'school_class' => ['Không thể xóa lớp đang được gán cho người dùng.'],
			]);
		}

		$schoolClass->deleted_by = $request->user()?->id;
		$schoolClass->save();
		$schoolClass->delete();

		return $this->successResponse(true, null, 'Xóa lớp thành công.');
	}

	public function restore(int $schoolClass): JsonResponse
	{
		$schoolClass = SchoolClass::onlyTrashed()->findOrFail($schoolClass);
		$schoolClass->restore();
		$schoolClass->deleted_by = null;
		$schoolClass->save();
		$this->loadRelations($schoolClass);

		return $this->successResponse(true, $this->transformSchoolClass($schoolClass), 'Khôi phục lớp thành công.');
	}

	public function forceDestroy(int $schoolClass): JsonResponse
	{
		$schoolClass = SchoolClass::onlyTrashed()->findOrFail($schoolClass);
		$schoolClass->forceDelete();

		return $this->successResponse(true, null, 'Xóa vĩnh viễn lớp thành công.');
	}

	private function schoolClassListQuery(bool $onlyTrashed = false)
	{
		$query = $onlyTrashed ? SchoolClass::onlyTrashed() : SchoolClass::query();

		return $query
			->leftJoin('majors', 'school_classes.major_id', '=', 'majors.id')
			->leftJoin('faculties', 'majors.faculty_id', '=', 'faculties.id')
			->select('school_classes.*')
			->with([
				'major' => fn ($query) => $query->withTrashed()->select('id', 'value', 'label', 'slug', 'faculty_id'),
				'major.faculty' => fn ($query) => $query->withTrashed()->select('id', 'value', 'label', 'slug'),
			]);
	}

	private function applySearch($query, string $search): void
	{
		$query->where(function ($subQuery) use ($search) {
			$subQuery
				->where('school_classes.value', 'like', "%{$search}%")
				->orWhere('school_classes.label', 'like', "%{$search}%")
				->orWhere('school_classes.slug', 'like', "%{$search}%")
				->orWhereHas('major', function ($majorQuery) use ($search) {
					$majorQuery
						->withTrashed()
						->where('value', 'like', "%{$search}%")
						->orWhere('label', 'like', "%{$search}%")
						->orWhereHas('faculty', function ($facultyQuery) use ($search) {
							$facultyQuery
								->withTrashed()
								->where('value', 'like', "%{$search}%")
								->orWhere('label', 'like', "%{$search}%");
						});
				});
		});
	}

	private function loadRelations(SchoolClass $schoolClass): void
	{
		$schoolClass->load([
			'major' => fn ($query) => $query->withTrashed()->select('id', 'value', 'label', 'slug', 'faculty_id'),
			'major.faculty' => fn ($query) => $query->withTrashed()->select('id', 'value', 'label', 'slug'),
		]);
	}

	private function transformSchoolClass(SchoolClass $schoolClass): array
	{
		return [
			'id' => $schoolClass->id,
			'value' => $schoolClass->value,
			'label' => $schoolClass->label,
			'slug' => $schoolClass->slug,
			'major_id' => $schoolClass->major_id,
			'created_at' => $schoolClass->created_at?->toISOString(),
			'updated_at' => $schoolClass->updated_at?->toISOString(),
			'deleted_at' => $schoolClass->deleted_at?->toISOString(),
			'major' => $schoolClass->major ? [
				'id' => $schoolClass->major->id,
				'value' => $schoolClass->major->value,
				'label' => $schoolClass->major->label,
				'slug' => $schoolClass->major->slug,
				'faculty_id' => $schoolClass->major->faculty_id,
				'faculty' => $schoolClass->major->faculty ? [
					'id' => $schoolClass->major->faculty->id,
					'value' => $schoolClass->major->faculty->value,
					'label' => $schoolClass->major->faculty->label,
					'slug' => $schoolClass->major->faculty->slug,
				] : null,
			] : null,
		];
	}
}
