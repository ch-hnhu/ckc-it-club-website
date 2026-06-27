<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\ProjectHub\MoveProjectTaskRequest;
use App\Http\Requests\Api\V1\ProjectHub\StoreProjectColumnRequest;
use App\Http\Requests\Api\V1\ProjectHub\StoreProjectMemberRequest;
use App\Http\Requests\Api\V1\ProjectHub\StoreProjectRequest;
use App\Http\Requests\Api\V1\ProjectHub\StoreProjectTaskRequest;
use App\Http\Requests\Api\V1\ProjectHub\UpdateProjectColumnRequest;
use App\Http\Requests\Api\V1\ProjectHub\UpdateProjectMemberRoleRequest;
use App\Http\Requests\Api\V1\ProjectHub\UpdateProjectRequest;
use App\Http\Requests\Api\V1\ProjectHub\UpdateProjectTaskRequest;
use App\Models\Project;
use App\Models\ProjectColumn;
use App\Models\ProjectTask;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProjectController extends BaseApiController
{
    /** Các cột mặc định khi tạo board mới. */
    private const DEFAULT_COLUMNS = ['Cần làm', 'Đang làm', 'Hoàn thành'];

    private const ASSIGNEE_FIELDS = 'id,full_name,username,avatar';

    // ---------------------------------------------------------------------
    // Boards (projects)
    // ---------------------------------------------------------------------

    /**
     * Danh sách board user sở hữu hoặc là thành viên.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $perPage = min((int) $request->query('per_page', 15), 50);
        $archived = $request->query('archived') === '1';

        $projects = Project::query()
            ->where(fn ($q) => $q
                ->where('created_by', $userId)
                ->orWhereHas('members', fn ($m) => $m->where('users.id', $userId)))
            ->where('is_archived', $archived)
            ->with('department:id,name,slug')
            ->withCount(['columns', 'tasks'])
            ->orderByDesc('updated_at')
            ->paginate($perPage);

        return $this->paginatedResponse($projects, ApiMessage::RETRIEVED);
    }

    /**
     * Tạo board mới (kèm các cột mặc định + gán người tạo làm chủ sở hữu).
     */
    public function store(StoreProjectRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $project = DB::transaction(function () use ($validated, $user) {
            $project = Project::create([
                'name'          => trim($validated['name']),
                'slug'          => $this->uniqueSlug($validated['name']),
                'description'   => $validated['description'] ?? null,
                'color'         => $validated['color'] ?? null,
                'department_id' => $validated['department_id'] ?? null,
                'visibility'    => $validated['visibility'] ?? 'members',
                'created_by'    => $user->id,
            ]);

            $project->memberships()->create([
                'user_id'   => $user->id,
                'role'      => 'owner',
                'joined_at' => now(),
            ]);

            foreach (self::DEFAULT_COLUMNS as $index => $name) {
                $project->columns()->create([
                    'name'       => $name,
                    'position'   => $index,
                    'created_by' => $user->id,
                ]);
            }

            return $project;
        });

        return $this->createdResponse(
            $project->load('columns'),
            ApiMessage::CREATED
        );
    }

    /**
     * Chi tiết board: cột + task + người được giao (giao diện Kanban).
     */
    public function show(Request $request, Project $project): JsonResponse
    {
        if ($resp = $this->memberGuard($project, $request->user())) {
            return $resp;
        }

        $project->load([
            'department:id,name,slug',
            'members:' . self::ASSIGNEE_FIELDS,
            'columns.tasks.assignees:' . self::ASSIGNEE_FIELDS,
        ]);

        return $this->successResponse(true, $project, ApiMessage::RETRIEVED);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($project, $user)) {
            return $resp;
        }

        $data = collect($request->validated())
            ->only(['name', 'description', 'color', 'department_id', 'visibility'])
            ->toArray();
        $data['updated_by'] = $user->id;

        $project->update($data);

        return $this->successResponse(true, $project->fresh(), ApiMessage::UPDATED);
    }

    /**
     * Lưu trữ / bỏ lưu trữ board (toggle).
     */
    public function archive(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($project, $user)) {
            return $resp;
        }

        $archived = ! $project->is_archived;
        $project->update([
            'is_archived' => $archived,
            'archived_at' => $archived ? now() : null,
            'updated_by'  => $user->id,
        ]);

        return $this->successResponse(true, ['is_archived' => $archived], ApiMessage::UPDATED);
    }

    /**
     * Xóa board — chỉ chủ sở hữu (người tạo).
     */
    public function destroy(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();
        if ($project->created_by !== $user->id) {
            return $this->forbiddenResponse();
        }

        $project->update(['deleted_by' => $user->id]);
        $project->delete();

        return $this->successResponse(true, null, ApiMessage::DELETED);
    }

    // ---------------------------------------------------------------------
    // Columns
    // ---------------------------------------------------------------------

    public function storeColumn(StoreProjectColumnRequest $request, Project $project): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($project, $user)) {
            return $resp;
        }

        $validated = $request->validated();
        $position = (int) $project->columns()->max('position');
        $position = $project->columns()->exists() ? $position + 1 : 0;

        $column = $project->columns()->create([
            'name'       => trim($validated['name']),
            'color'      => $validated['color'] ?? null,
            'wip_limit'  => $validated['wip_limit'] ?? null,
            'position'   => $position,
            'created_by' => $user->id,
        ]);

        return $this->createdResponse($column, ApiMessage::CREATED);
    }

    public function updateColumn(UpdateProjectColumnRequest $request, Project $project, int $column): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($project, $user)) {
            return $resp;
        }

        $columnModel = $project->columns()->findOrFail($column);

        $data = collect($request->validated())
            ->only(['name', 'color', 'wip_limit'])
            ->toArray();
        $data['updated_by'] = $user->id;

        $columnModel->update($data);

        return $this->successResponse(true, $columnModel->fresh(), ApiMessage::UPDATED);
    }

    public function destroyColumn(Request $request, Project $project, int $column): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($project, $user)) {
            return $resp;
        }

        $columnModel = $project->columns()->findOrFail($column);
        $columnModel->delete(); // cascade xóa task thuộc cột (FK cascadeOnDelete)

        return $this->successResponse(true, null, ApiMessage::DELETED);
    }

    /**
     * Sắp xếp lại thứ tự các cột theo mảng id truyền lên.
     */
    public function reorderColumns(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($project, $user)) {
            return $resp;
        }

        $validated = $request->validate([
            'column_ids'   => ['required', 'array', 'min:1'],
            'column_ids.*' => ['integer'],
        ]);

        $ownedIds = $project->columns()->pluck('id')->all();
        if (array_diff($validated['column_ids'], $ownedIds)) {
            return $this->validationErrorResponse([
                'column_ids' => ['Danh sách cột không hợp lệ.'],
            ]);
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['column_ids'] as $index => $id) {
                ProjectColumn::whereKey($id)->update(['position' => $index]);
            }
        });

        return $this->successResponse(true, null, ApiMessage::UPDATED);
    }

    // ---------------------------------------------------------------------
    // Tasks
    // ---------------------------------------------------------------------

    public function storeTask(StoreProjectTaskRequest $request, Project $project): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($project, $user)) {
            return $resp;
        }

        $validated = $request->validated();
        $column = $project->columns()->findOrFail($validated['column_id']);

        $task = DB::transaction(function () use ($project, $column, $validated, $user) {
            $max = $project->tasks()->where('column_id', $column->id)->max('position');
            $position = is_null($max) ? 0 : $max + 1;

            $task = $project->tasks()->create([
                'column_id'   => $column->id,
                'title'       => trim($validated['title']),
                'description' => $validated['description'] ?? null,
                'priority'    => $validated['priority'] ?? null,
                'start_date'  => $validated['start_date'] ?? null,
                'due_date'    => $validated['due_date'] ?? null,
                'position'    => $position,
                'created_by'  => $user->id,
            ]);

            if (! empty($validated['assignee_ids'])) {
                $task->assignees()->attach($this->assigneePayload($validated['assignee_ids']));
            }

            return $task;
        });

        return $this->createdResponse(
            $task->load('assignees:' . self::ASSIGNEE_FIELDS),
            ApiMessage::CREATED
        );
    }

    public function updateTask(UpdateProjectTaskRequest $request, Project $project, int $task): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($project, $user)) {
            return $resp;
        }

        $taskModel = $project->tasks()->findOrFail($task);
        $validated = $request->validated();

        $data = collect($validated)
            ->only(['title', 'description', 'priority', 'start_date', 'due_date'])
            ->toArray();

        if (array_key_exists('completed', $validated)) {
            $data['completed_at'] = $validated['completed'] ? now() : null;
        }
        $data['updated_by'] = $user->id;

        DB::transaction(function () use ($taskModel, $data, $validated) {
            $taskModel->update($data);

            if (array_key_exists('assignee_ids', $validated)) {
                $taskModel->assignees()->sync($this->assigneePayload($validated['assignee_ids'] ?? []));
            }
        });

        return $this->successResponse(
            true,
            $taskModel->fresh()->load('assignees:' . self::ASSIGNEE_FIELDS),
            ApiMessage::UPDATED
        );
    }

    public function destroyTask(Request $request, Project $project, int $task): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($project, $user)) {
            return $resp;
        }

        $taskModel = $project->tasks()->findOrFail($task);
        $taskModel->update(['deleted_by' => $user->id]);
        $taskModel->delete();

        return $this->successResponse(true, null, ApiMessage::DELETED);
    }

    /**
     * Kéo-thả: chuyển task sang cột + vị trí mới, đánh lại số thứ tự 2 cột liên quan.
     */
    public function moveTask(MoveProjectTaskRequest $request, Project $project, int $task): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($project, $user)) {
            return $resp;
        }

        $taskModel = $project->tasks()->findOrFail($task);
        $validated = $request->validated();
        $targetColumn = $project->columns()->findOrFail($validated['column_id']);
        $sourceColumnId = $taskModel->column_id;
        $targetPosition = (int) $validated['position'];

        DB::transaction(function () use ($project, $taskModel, $targetColumn, $sourceColumnId, $targetPosition, $user) {
            $siblings = $project->tasks()
                ->where('column_id', $targetColumn->id)
                ->where('id', '!=', $taskModel->id)
                ->orderBy('position')
                ->pluck('id')
                ->all();

            $targetPosition = max(0, min($targetPosition, count($siblings)));
            array_splice($siblings, $targetPosition, 0, [$taskModel->id]);

            $taskModel->update([
                'column_id'  => $targetColumn->id,
                'updated_by' => $user->id,
            ]);

            foreach ($siblings as $index => $id) {
                ProjectTask::whereKey($id)->update(['position' => $index]);
            }

            // Đánh lại thứ tự cột nguồn để không bị "lỗ hổng" vị trí
            if ($sourceColumnId !== $targetColumn->id) {
                $sourceIds = $project->tasks()
                    ->where('column_id', $sourceColumnId)
                    ->orderBy('position')
                    ->pluck('id')
                    ->all();

                foreach ($sourceIds as $index => $id) {
                    ProjectTask::whereKey($id)->update(['position' => $index]);
                }
            }
        });

        return $this->successResponse(true, [
            'id'        => $taskModel->id,
            'column_id' => $targetColumn->id,
        ], ApiMessage::UPDATED);
    }

    // ---------------------------------------------------------------------
    // Members
    // ---------------------------------------------------------------------

    /**
     * Danh sách thành viên của board.
     */
    public function members(Request $request, Project $project): JsonResponse
    {
        if ($resp = $this->memberGuard($project, $request->user())) {
            return $resp;
        }

        $project->load('members:id,full_name,username,avatar');

        return $this->successResponse(true, $project->members, ApiMessage::RETRIEVED);
    }

    /**
     * Tìm user để thêm vào board (loại trừ thành viên hiện có). Chỉ chủ board.
     */
    public function assignableUsers(Request $request, Project $project): JsonResponse
    {
        if ($resp = $this->ownerGuard($project, $request->user())) {
            return $resp;
        }

        $search = trim((string) $request->query('search'));
        if (mb_strlen($search) < 2) {
            return $this->validationErrorResponse([
                'search' => ['Nhập tối thiểu 2 ký tự để tìm kiếm.'],
            ]);
        }

        $memberIds = $project->members()->pluck('users.id');

        $users = User::query()
            ->whereNotIn('id', $memberIds)
            ->where(fn ($q) => $q->where('full_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('username', 'like', "%{$search}%")
                ->orWhere('student_code', 'like', "%{$search}%"))
            ->limit(10)
            ->get(['id', 'full_name', 'username', 'email', 'student_code', 'avatar']);

        return $this->successResponse(true, $users, ApiMessage::RETRIEVED);
    }

    /**
     * Thêm thành viên vào board. Chỉ chủ board.
     */
    public function storeMember(StoreProjectMemberRequest $request, Project $project): JsonResponse
    {
        if ($resp = $this->ownerGuard($project, $request->user())) {
            return $resp;
        }

        $validated = $request->validated();
        $userId = (int) $validated['user_id'];

        if ($project->memberships()->where('user_id', $userId)->exists()) {
            return $this->errorResponse(false, 'Người dùng đã là thành viên của board.', 422);
        }

        $role = $validated['role'] ?? 'editor';
        $project->memberships()->create([
            'user_id'   => $userId,
            'role'      => $role,
            'joined_at' => now(),
        ]);

        $user = User::find($userId);

        return $this->createdResponse([
            'id'        => $user->id,
            'full_name' => $user->full_name,
            'username'  => $user->username,
            'avatar'    => $user->avatar,
            'pivot'     => ['role' => $role, 'joined_at' => now()->toISOString()],
        ], ApiMessage::CREATED);
    }

    /**
     * Đổi vai trò thành viên. Chỉ chủ board; không đổi vai trò người tạo board.
     */
    public function updateMemberRole(UpdateProjectMemberRoleRequest $request, Project $project, int $user): JsonResponse
    {
        if ($resp = $this->ownerGuard($project, $request->user())) {
            return $resp;
        }

        if ($user === $project->created_by) {
            return $this->errorResponse(false, 'Không thể đổi vai trò của người tạo board.', 422);
        }

        $membership = $project->memberships()->where('user_id', $user)->first();
        if (! $membership) {
            return $this->notFoundResponse();
        }

        $membership->update(['role' => $request->validated()['role']]);

        return $this->successResponse(true, [
            'user_id' => $user,
            'role'    => $membership->role,
        ], ApiMessage::UPDATED);
    }

    /**
     * Xóa thành viên khỏi board (kèm gỡ khỏi mọi task). Chỉ chủ board; không xóa người tạo.
     */
    public function destroyMember(Request $request, Project $project, int $user): JsonResponse
    {
        if ($resp = $this->ownerGuard($project, $request->user())) {
            return $resp;
        }

        if ($user === $project->created_by) {
            return $this->errorResponse(false, 'Không thể xóa người tạo board.', 422);
        }

        $membership = $project->memberships()->where('user_id', $user)->first();
        if (! $membership) {
            return $this->notFoundResponse();
        }

        DB::transaction(function () use ($project, $user, $membership) {
            DB::table('project_task_assignees')
                ->whereIn('task_id', $project->tasks()->pluck('id'))
                ->where('user_id', $user)
                ->delete();

            $membership->delete();
        });

        return $this->successResponse(true, null, ApiMessage::DELETED);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    /**
     * Chặn nếu user không thuộc board (không xem được).
     */
    private function memberGuard(Project $project, $user): ?JsonResponse
    {
        return $project->hasMember($user->id) ? null : $this->forbiddenResponse();
    }

    /**
     * Chặn nếu user không có quyền chỉnh sửa (không thuộc board hoặc chỉ là "viewer").
     */
    private function editorGuard(Project $project, $user): ?JsonResponse
    {
        if (! $project->hasMember($user->id)) {
            return $this->forbiddenResponse();
        }

        if ($project->created_by === $user->id) {
            return null;
        }

        $role = $project->memberships()->where('user_id', $user->id)->value('role');

        return $role === 'viewer' ? $this->forbiddenResponse() : null;
    }

    /**
     * Chặn nếu user không phải chủ board (người tạo hoặc thành viên vai trò "owner").
     */
    private function ownerGuard(Project $project, $user): ?JsonResponse
    {
        if ($project->created_by === $user->id) {
            return null;
        }

        $role = $project->memberships()->where('user_id', $user->id)->value('role');

        return $role === 'owner' ? null : $this->forbiddenResponse();
    }

    /**
     * Tạo slug duy nhất từ tên board (kể cả khi đã có bản ghi bị xóa mềm).
     */
    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'du-an';
        $slug = $base;
        $i = 1;

        while (Project::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }

    /**
     * Map danh sách user id thành payload pivot kèm thời điểm gán.
     */
    private function assigneePayload(array $ids): array
    {
        return collect($ids)
            ->unique()
            ->mapWithKeys(fn ($id) => [$id => ['assigned_at' => now()]])
            ->all();
    }
}
