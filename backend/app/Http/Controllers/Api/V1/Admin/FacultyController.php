<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Faculty\StoreFacultyRequest;
use App\Http\Requests\Api\V1\Faculty\UpdateFacultyRequest;
use App\Models\Faculty;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FacultyController extends BaseApiController
{
	public function index(Request $request): JsonResponse
	{
		$allowedSorts = ['id', 'value', 'label', 'slug', 'created_at', 'updated_at', 'majors_count'];
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

		$data = Faculty::query()
			->withCount('majors')
			->when($search, function ($query, $search) {
				$query->where(function ($subQuery) use ($search) {
					$subQuery
						->where('value', 'like', "%{$search}%")
						->orWhere('label', 'like', "%{$search}%")
						->orWhere('slug', 'like', "%{$search}%");
				});
			})
			->orderBy($sort, $order)
			->paginate($perPage);

		return $this->paginatedResponse($data, ApiMessage::RETRIEVED);
	}

	public function show(Faculty $faculty): JsonResponse
	{
		$faculty->loadCount('majors');

		return $this->successResponse(true, $faculty, 'Lấy thông tin khoa thành công.');
	}

	public function store(StoreFacultyRequest $request): JsonResponse
	{
		$faculty = Faculty::query()->create([
			'label' => trim($request->string('label')->value()),
			'value' => trim($request->string('value')->value()),
			'slug' => Str::slug($request->string('label')->value()) ?: Str::slug($request->string('value')->value()),
			'created_by' => $request->user()?->id,
			'updated_by' => $request->user()?->id,
		]);

		$faculty->loadCount('majors');

		return $this->createdResponse($faculty, 'Tạo khoa thành công.');
	}

	public function update(UpdateFacultyRequest $request, Faculty $faculty): JsonResponse
	{
		$faculty->update([
			'label' => trim($request->string('label')->value()),
			'value' => trim($request->string('value')->value()),
			'slug' => Str::slug($request->string('label')->value()) ?: Str::slug($request->string('value')->value()),
			'updated_by' => $request->user()?->id,
		]);

		$faculty->loadCount('majors');

		return $this->successResponse(true, $faculty, 'Cập nhật khoa thành công.');
	}

	public function destroy(Request $request, Faculty $faculty): JsonResponse
	{
		if ($faculty->majors()->exists()) {
			return $this->validationErrorResponse([
				'faculty' => ['Không thể xóa khoa đang có ngành trực thuộc.'],
			]);
		}

		if (User::query()->where('faculty_id', $faculty->id)->exists()) {
			return $this->validationErrorResponse([
				'faculty' => ['Không thể xóa khoa đang được gán cho người dùng.'],
			]);
		}

		$faculty->delete();

		return $this->successResponse(true, null, 'Xóa khoa thành công.');
	}
}
