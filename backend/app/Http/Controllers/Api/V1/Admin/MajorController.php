<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Major\StoreMajorRequest;
use App\Http\Requests\Api\V1\Major\UpdateMajorRequest;
use App\Models\Major;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MajorController extends BaseApiController
{
	public function index(Request $request): JsonResponse
	{
		$allowedSorts = ['id', 'value', 'label', 'slug', 'faculty_id', 'created_at', 'updated_at', 'faculty_label', 'school_classes_count'];
		$sort = $request->query('sort', 'created_at');
		$order = $request->query('order', 'desc');
		$perPage = (int) $request->query('per_page', 10);
		$search = $request->query('search');
		$facultyId = $request->integer('faculty_id') ?: null;

		if (! in_array($sort, $allowedSorts, true)) {
			$sort = 'created_at';
		}

		if (! in_array($order, ['asc', 'desc'], true)) {
			$order = 'desc';
		}

		$data = Major::query()
			->leftJoin('faculties', 'majors.faculty_id', '=', 'faculties.id')
			->select('majors.*')
			->with(['faculty' => fn ($query) => $query->withTrashed()->select('id', 'value', 'label', 'slug')])
			->withCount('schoolClasses')
			->when($facultyId, function ($query) use ($facultyId) {
				$query->where('majors.faculty_id', $facultyId);
			})
			->when($search, function ($query, $search) {
				$query->where(function ($subQuery) use ($search) {
					$subQuery
						->where('majors.value', 'like', "%{$search}%")
						->orWhere('majors.label', 'like', "%{$search}%")
						->orWhere('majors.slug', 'like', "%{$search}%")
						->orWhereHas('faculty', function ($facultyQuery) use ($search) {
							$facultyQuery
								->withTrashed()
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

		$data->getCollection()->transform(fn (Major $major) => $this->transformMajor($major));

		return $this->paginatedResponse($data, ApiMessage::RETRIEVED);
	}

	public function trash(Request $request): JsonResponse
	{
		$allowedSorts = ['id', 'value', 'label', 'slug', 'faculty_id', 'created_at', 'updated_at', 'deleted_at', 'faculty_label', 'school_classes_count'];
		$sort = $request->query('sort', 'deleted_at');
		$order = $request->query('order', 'desc');
		$perPage = (int) $request->query('per_page', 10);
		$search = $request->query('search');
		$facultyId = $request->integer('faculty_id') ?: null;

		if (! in_array($sort, $allowedSorts, true)) {
			$sort = 'deleted_at';
		}

		if (! in_array($order, ['asc', 'desc'], true)) {
			$order = 'desc';
		}

		$data = Major::onlyTrashed()
			->leftJoin('faculties', 'majors.faculty_id', '=', 'faculties.id')
			->select('majors.*')
			->with(['faculty' => fn ($query) => $query->withTrashed()->select('id', 'value', 'label', 'slug')])
			->withCount('schoolClasses')
			->when($facultyId, function ($query) use ($facultyId) {
				$query->where('majors.faculty_id', $facultyId);
			})
			->when($search, function ($query, $search) {
				$query->where(function ($subQuery) use ($search) {
					$subQuery
						->where('majors.value', 'like', "%{$search}%")
						->orWhere('majors.label', 'like', "%{$search}%")
						->orWhere('majors.slug', 'like', "%{$search}%")
						->orWhereHas('faculty', function ($facultyQuery) use ($search) {
							$facultyQuery
								->withTrashed()
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

		$data->getCollection()->transform(fn (Major $major) => $this->transformMajor($major));

		return $this->paginatedResponse($data, ApiMessage::RETRIEVED);
	}

	public function show(Major $major): JsonResponse
	{
		$major->load(['faculty' => fn ($query) => $query->withTrashed()->select('id', 'value', 'label', 'slug')])->loadCount('schoolClasses');

		return $this->successResponse(true, $this->transformMajor($major), 'Lấy thông tin ngành thành công.');
	}

	public function store(StoreMajorRequest $request): JsonResponse
	{
		$major = Major::query()->create([
			'faculty_id' => $request->integer('faculty_id'),
			'label' => trim($request->string('label')->value()),
			'value' => trim($request->string('value')->value()),
			'slug' => Str::slug($request->string('label')->value()) ?: Str::slug($request->string('value')->value()),
			'created_by' => $request->user()?->id,
			'updated_by' => $request->user()?->id,
		]);

		$major->load(['faculty' => fn ($query) => $query->withTrashed()->select('id', 'value', 'label', 'slug')])->loadCount('schoolClasses');

		return $this->createdResponse($this->transformMajor($major), 'Tạo ngành thành công.');
	}

	public function update(UpdateMajorRequest $request, Major $major): JsonResponse
	{
		$major->update([
			'faculty_id' => $request->integer('faculty_id'),
			'label' => trim($request->string('label')->value()),
			'value' => trim($request->string('value')->value()),
			'slug' => Str::slug($request->string('label')->value()) ?: Str::slug($request->string('value')->value()),
			'updated_by' => $request->user()?->id,
		]);

		$major->load(['faculty' => fn ($query) => $query->withTrashed()->select('id', 'value', 'label', 'slug')])->loadCount('schoolClasses');

		return $this->successResponse(true, $this->transformMajor($major), 'Cập nhật ngành thành công.');
	}

	public function destroy(Request $request, Major $major): JsonResponse
	{
		if ($major->schoolClasses()->exists()) {
			return $this->validationErrorResponse([
				'major' => ['Không thể xóa ngành đang có lớp trực thuộc.'],
			]);
		}

		if (User::query()->where('major_id', $major->id)->exists()) {
			return $this->validationErrorResponse([
				'major' => ['Không thể xóa ngành đang được gán cho người dùng.'],
			]);
		}

		$major->deleted_by = $request->user()?->id;
		$major->save();
		$major->delete();

		return $this->successResponse(true, null, 'Xóa ngành thành công.');
	}

	public function restore(int $major): JsonResponse
	{
		$major = Major::onlyTrashed()->findOrFail($major);
		$major->restore();
		$major->deleted_by = null;
		$major->save();
		$major->load(['faculty' => fn ($query) => $query->withTrashed()->select('id', 'value', 'label', 'slug')])->loadCount('schoolClasses');

		return $this->successResponse(true, $this->transformMajor($major), 'Khôi phục ngành thành công.');
	}

	public function forceDestroy(int $major): JsonResponse
	{
		$major = Major::onlyTrashed()->findOrFail($major);
		$major->forceDelete();

		return $this->successResponse(true, null, 'Xóa vĩnh viễn ngành thành công.');
	}

	private function transformMajor(Major $major): array
	{
		return [
			'id' => $major->id,
			'value' => $major->value,
			'label' => $major->label,
			'slug' => $major->slug,
			'faculty_id' => $major->faculty_id,
			'school_classes_count' => $major->school_classes_count,
			'created_at' => $major->created_at?->toISOString(),
			'updated_at' => $major->updated_at?->toISOString(),
			'deleted_at' => $major->deleted_at?->toISOString(),
			'faculty' => $major->faculty ? [
				'id' => $major->faculty->id,
				'value' => $major->faculty->value,
				'label' => $major->faculty->label,
				'slug' => $major->faculty->slug,
			] : null,
		];
	}
}
