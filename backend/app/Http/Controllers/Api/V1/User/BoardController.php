<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Enums\ApiMessage;
use App\Enums\PermissionsEnum;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\ProjectHub\MoveBoardTaskRequest;
use App\Http\Requests\Api\V1\ProjectHub\StoreBoardColumnRequest;
use App\Http\Requests\Api\V1\ProjectHub\StoreBoardMemberRequest;
use App\Http\Requests\Api\V1\ProjectHub\StoreBoardRequest;
use App\Http\Requests\Api\V1\ProjectHub\StoreBoardTaskRequest;
use App\Http\Requests\Api\V1\ProjectHub\UpdateBoardColumnRequest;
use App\Http\Requests\Api\V1\ProjectHub\UpdateBoardMemberRoleRequest;
use App\Http\Requests\Api\V1\ProjectHub\UpdateBoardRequest;
use App\Http\Requests\Api\V1\ProjectHub\UpdateBoardTaskRequest;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\BoardTask;
use App\Models\Course;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BoardController extends BaseApiController
{
    /** Các cột mặc định khi tạo board mới. */
    private const DEFAULT_COLUMNS = ['Cần làm', 'Đang làm', 'Hoàn thành'];

    private const ASSIGNEE_FIELDS = 'id,full_name,username,avatar';

    // ---------------------------------------------------------------------
    // Boards
    // ---------------------------------------------------------------------

    /**
     * Danh sách board user sở hữu hoặc là thành viên.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $perPage = min((int) $request->query('per_page', 15), 50);
        $archived = $request->query('archived') === '1';

        $boards = Board::query()
            ->where(fn ($q) => $q
                ->where('created_by', $userId)
                ->orWhereHas('members', fn ($m) => $m->where('users.id', $userId)))
            ->where('is_archived', $archived)
            ->when($request->query('course_id'), fn ($q, $id) => $q->where('course_id', $id))
            ->when($request->query('event_id'), fn ($q, $id) => $q->where('event_id', $id))
            ->with(['department:id,name,slug', 'course:id,title,slug', 'event:id,title,slug'])
            ->withCount([
                'columns',
                'tasks',
                'tasks as completed_tasks_count' => fn ($q) => $q->whereNotNull('completed_at'),
            ])
            ->orderByDesc('updated_at')
            ->paginate($perPage);

        return $this->paginatedResponse($boards, ApiMessage::RETRIEVED);
    }

    /**
     * Tạo board mới (kèm các cột mặc định + gán người tạo làm chủ sở hữu).
     */
    public function store(StoreBoardRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $board = DB::transaction(function () use ($validated, $user) {
            $board = Board::create([
                'name'          => trim($validated['name']),
                'slug'          => $this->uniqueSlug($validated['name']),
                'description'   => $validated['description'] ?? null,
                'color'         => $validated['color'] ?? null,
                'department_id' => $validated['department_id'] ?? null,
                'course_id'     => $validated['course_id'] ?? null,
                'event_id'      => $validated['event_id'] ?? null,
                'created_by'    => $user->id,
            ]);

            $board->memberships()->create([
                'user_id'   => $user->id,
                'role'      => 'owner',
                'joined_at' => now(),
            ]);

            foreach (self::DEFAULT_COLUMNS as $index => $name) {
                $board->columns()->create([
                    'name'       => $name,
                    'position'   => $index,
                    'created_by' => $user->id,
                ]);
            }

            return $board;
        });

        return $this->createdResponse(
            $board->load('columns'),
            ApiMessage::CREATED
        );
    }

    /**
     * Chi tiết board: cột + task + người được giao (giao diện Kanban).
     */
    public function show(Request $request, Board $board): JsonResponse
    {
        if ($resp = $this->memberGuard($board, $request->user())) {
            return $resp;
        }

        $board->load([
            'department:id,name,slug',
            'course:id,title,slug',
            'event:id,title,slug',
            'members:' . self::ASSIGNEE_FIELDS,
            'columns.tasks.assignees:' . self::ASSIGNEE_FIELDS,
            'columns.tasks.checklistItems',
        ]);

        return $this->successResponse(true, $board, ApiMessage::RETRIEVED);
    }

    public function update(UpdateBoardRequest $request, Board $board): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($board, $user)) {
            return $resp;
        }

        $data = collect($request->validated())
            ->only(['name', 'description', 'color', 'department_id', 'course_id', 'event_id'])
            ->toArray();
        $data['updated_by'] = $user->id;

        $board->update($data);

        return $this->successResponse(
            true,
            $board->fresh()->load(['course:id,title,slug', 'event:id,title,slug']),
            ApiMessage::UPDATED
        );
    }

    /**
     * Lưu trữ / bỏ lưu trữ board (toggle).
     */
    public function archive(Request $request, Board $board): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($board, $user)) {
            return $resp;
        }

        $archived = ! $board->is_archived;
        $board->update([
            'is_archived' => $archived,
            'archived_at' => $archived ? now() : null,
            'updated_by'  => $user->id,
        ]);

        return $this->successResponse(true, ['is_archived' => $archived], ApiMessage::UPDATED);
    }

    /**
     * Xóa board — chỉ chủ sở hữu (người tạo).
     */
    public function destroy(Request $request, Board $board): JsonResponse
    {
        $user = $request->user();
        if ($board->created_by !== $user->id) {
            return $this->forbiddenResponse();
        }

        $board->update(['deleted_by' => $user->id]);
        $board->delete();

        return $this->successResponse(true, null, ApiMessage::DELETED);
    }

    /**
     * Danh sách course + event để chọn liên kết khi tạo/sửa board.
     */
    public function linkOptions(): JsonResponse
    {
        $courses = Course::query()
            ->orderByDesc('created_at')
            ->get(['id', 'title', 'slug']);

        $events = Event::query()
            ->orderByDesc('start_at')
            ->get(['id', 'title', 'slug']);

        return $this->successResponse(true, compact('courses', 'events'), ApiMessage::RETRIEVED);
    }

    // ---------------------------------------------------------------------
    // Columns
    // ---------------------------------------------------------------------

    public function storeColumn(StoreBoardColumnRequest $request, Board $board): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($board, $user)) {
            return $resp;
        }

        $validated = $request->validated();
        $position = (int) $board->columns()->max('position');
        $position = $board->columns()->exists() ? $position + 1 : 0;

        $column = $board->columns()->create([
            'name'       => trim($validated['name']),
            'color'      => $validated['color'] ?? null,
            'wip_limit'  => $validated['wip_limit'] ?? null,
            'position'   => $position,
            'created_by' => $user->id,
        ]);

        return $this->createdResponse($column, ApiMessage::CREATED);
    }

    public function updateColumn(UpdateBoardColumnRequest $request, Board $board, int $column): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($board, $user)) {
            return $resp;
        }

        $columnModel = $board->columns()->findOrFail($column);

        $data = collect($request->validated())
            ->only(['name', 'color', 'wip_limit'])
            ->toArray();
        $data['updated_by'] = $user->id;

        $columnModel->update($data);

        return $this->successResponse(true, $columnModel->fresh(), ApiMessage::UPDATED);
    }

    public function destroyColumn(Request $request, Board $board, int $column): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($board, $user)) {
            return $resp;
        }

        $columnModel = $board->columns()->findOrFail($column);
        $columnModel->delete(); // cascade xóa task thuộc cột (FK cascadeOnDelete)

        return $this->successResponse(true, null, ApiMessage::DELETED);
    }

    /**
     * Sắp xếp lại thứ tự các cột theo mảng id truyền lên.
     */
    public function reorderColumns(Request $request, Board $board): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($board, $user)) {
            return $resp;
        }

        $validated = $request->validate([
            'column_ids'   => ['required', 'array', 'min:1'],
            'column_ids.*' => ['integer'],
        ]);

        $ownedIds = $board->columns()->pluck('id')->all();
        if (array_diff($validated['column_ids'], $ownedIds)) {
            return $this->validationErrorResponse([
                'column_ids' => ['Danh sách cột không hợp lệ.'],
            ]);
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['column_ids'] as $index => $id) {
                BoardColumn::whereKey($id)->update(['position' => $index]);
            }
        });

        return $this->successResponse(true, null, ApiMessage::UPDATED);
    }

    // ---------------------------------------------------------------------
    // Tasks
    // ---------------------------------------------------------------------

    public function storeTask(StoreBoardTaskRequest $request, Board $board): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($board, $user)) {
            return $resp;
        }

        $validated = $request->validated();
        $column = $board->columns()->findOrFail($validated['column_id']);
        if ($resp = $this->boardAssigneeGuard($board, $validated['assignee_ids'] ?? [])) {
            return $resp;
        }

        $task = DB::transaction(function () use ($board, $column, $validated, $user) {
            $max = $board->tasks()->where('column_id', $column->id)->max('position');
            $position = is_null($max) ? 0 : $max + 1;

            $task = $board->tasks()->create([
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
                
                $assignees = \App\Models\User::whereIn('id', $validated['assignee_ids'])->get();
                foreach ($assignees as $assignee) {
                    if ($assignee->id !== $user->id) {
                        $assignee->notify(new \App\Notifications\AdminActionNotification(
                            'Được giao công việc mới',
                            "Bạn đã được giao công việc \"{$task->title}\" trong bảng \"{$board->name}\".",
                            'task_assigned',
                            'task',
                            $task->id,
                            $user->full_name,
                            "/to-do-list/{$board->slug}"
                        ));
                    }
                }
            }

            return $task;
        });

        return $this->createdResponse(
            $task->load(['assignees:' . self::ASSIGNEE_FIELDS, 'checklistItems']),
            ApiMessage::CREATED
        );
    }

    public function updateTask(UpdateBoardTaskRequest $request, Board $board, int $task): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($board, $user)) {
            return $resp;
        }

        $taskModel = $board->tasks()->findOrFail($task);
        $validated = $request->validated();
        if ($resp = $this->boardAssigneeGuard($board, $validated['assignee_ids'] ?? [])) {
            return $resp;
        }

        $data = collect($validated)
            ->only(['title', 'description', 'priority', 'start_date', 'due_date'])
            ->toArray();

        if (array_key_exists('completed', $validated)) {
            $data['completed_at'] = $validated['completed'] ? now() : null;
        }
        $data['updated_by'] = $user->id;

        DB::transaction(function () use ($taskModel, $data, $validated, $user, $board) {
            $taskModel->update($data);

            if (array_key_exists('assignee_ids', $validated)) {
                $oldAssigneeIds = $taskModel->assignees()->pluck('users.id')->toArray();
                $newAssigneeIds = $validated['assignee_ids'] ?? [];

                $taskModel->assignees()->sync($this->assigneePayload($newAssigneeIds));

                $addedAssigneeIds = array_diff($newAssigneeIds, $oldAssigneeIds);
                if (!empty($addedAssigneeIds)) {
                    $addedAssignees = \App\Models\User::whereIn('id', $addedAssigneeIds)->get();
                    foreach ($addedAssignees as $assignee) {
                        if ($assignee->id !== $user->id) {
                            $assignee->notify(new \App\Notifications\AdminActionNotification(
                                'Được giao công việc mới',
                                "Bạn đã được giao công việc \"{$taskModel->title}\" trong bảng \"{$board->name}\".",
                                'task_assigned',
                                'task',
                                $taskModel->id,
                                $user->full_name,
                                "/to-do-list/{$board->slug}"
                            ));
                        }
                    }
                }
            }
        });

        return $this->successResponse(
            true,
            $taskModel->fresh()->load(['assignees:' . self::ASSIGNEE_FIELDS, 'checklistItems']),
            ApiMessage::UPDATED
        );
    }

    public function destroyTask(Request $request, Board $board, int $task): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($board, $user)) {
            return $resp;
        }

        $taskModel = $board->tasks()->findOrFail($task);
        $taskModel->update(['deleted_by' => $user->id]);
        $taskModel->delete();

        return $this->successResponse(true, null, ApiMessage::DELETED);
    }

    /**
     * Kéo-thả: chuyển task sang cột + vị trí mới, đánh lại số thứ tự 2 cột liên quan.
     */
    public function moveTask(MoveBoardTaskRequest $request, Board $board, int $task): JsonResponse
    {
        $user = $request->user();
        if ($resp = $this->editorGuard($board, $user)) {
            return $resp;
        }

        $taskModel = $board->tasks()->findOrFail($task);
        $validated = $request->validated();
        $targetColumn = $board->columns()->findOrFail($validated['column_id']);
        $sourceColumnId = $taskModel->column_id;
        $targetPosition = (int) $validated['position'];

        DB::transaction(function () use ($board, $taskModel, $targetColumn, $sourceColumnId, $targetPosition, $user) {
            $siblings = $board->tasks()
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
                BoardTask::whereKey($id)->update(['position' => $index]);
            }

            // Đánh lại thứ tự cột nguồn để không bị "lỗ hổng" vị trí
            if ($sourceColumnId !== $targetColumn->id) {
                $sourceIds = $board->tasks()
                    ->where('column_id', $sourceColumnId)
                    ->orderBy('position')
                    ->pluck('id')
                    ->all();

                foreach ($sourceIds as $index => $id) {
                    BoardTask::whereKey($id)->update(['position' => $index]);
                }
            }
        });

        return $this->successResponse(true, [
            'id'        => $taskModel->id,
            'column_id' => $targetColumn->id,
        ], ApiMessage::UPDATED);
    }

    // ---------------------------------------------------------------------
    // Checklist (việc con của task)
    // ---------------------------------------------------------------------

    public function storeChecklistItem(Request $request, Board $board, int $task): JsonResponse
    {
        if ($resp = $this->editorGuard($board, $request->user())) {
            return $resp;
        }

        $taskModel = $board->tasks()->findOrFail($task);
        $validated = $request->validate(
            ['content' => ['required', 'string', 'max:500']],
            ['content.required' => 'Vui lòng nhập nội dung mục.', 'content.max' => 'Nội dung không được vượt quá 500 ký tự.']
        );

        $position = $taskModel->checklistItems()->exists()
            ? (int) $taskModel->checklistItems()->max('position') + 1
            : 0;

        $item = $taskModel->checklistItems()->create([
            'content'  => trim($validated['content']),
            'position' => $position,
        ]);

        return $this->createdResponse($item, ApiMessage::CREATED);
    }

    public function updateChecklistItem(Request $request, Board $board, int $task, int $item): JsonResponse
    {
        if ($resp = $this->editorGuard($board, $request->user())) {
            return $resp;
        }

        $taskModel = $board->tasks()->findOrFail($task);
        $itemModel = $taskModel->checklistItems()->findOrFail($item);

        $validated = $request->validate([
            'content' => ['sometimes', 'required', 'string', 'max:500'],
            'is_done' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['content'])) {
            $validated['content'] = trim($validated['content']);
        }

        $itemModel->update($validated);

        return $this->successResponse(true, $itemModel->fresh(), ApiMessage::UPDATED);
    }

    public function destroyChecklistItem(Request $request, Board $board, int $task, int $item): JsonResponse
    {
        if ($resp = $this->editorGuard($board, $request->user())) {
            return $resp;
        }

        $taskModel = $board->tasks()->findOrFail($task);
        $taskModel->checklistItems()->whereKey($item)->delete();

        return $this->successResponse(true, null, ApiMessage::DELETED);
    }

    // ---------------------------------------------------------------------
    // Members
    // ---------------------------------------------------------------------

    /**
     * Danh sách thành viên của board.
     */
    public function members(Request $request, Board $board): JsonResponse
    {
        if ($resp = $this->memberGuard($board, $request->user())) {
            return $resp;
        }

        $board->load('members:id,full_name,username,avatar');

        return $this->successResponse(true, $board->members, ApiMessage::RETRIEVED);
    }

    /**
     * Tìm user để thêm vào board (loại trừ thành viên hiện có). Chỉ chủ board.
     */
    public function assignableUsers(Request $request, Board $board): JsonResponse
    {
        if ($resp = $this->ownerGuard($board, $request->user())) {
            return $resp;
        }

        $memberIds = $board->members()->pluck('users.id');
        $search = trim((string) $request->query('search'));

        $users = User::query()
            ->permission(PermissionsEnum::ADMIN_PANEL_ACCESS->value)
            ->where('is_active', true)
            ->whereNotIn('id', $memberIds)
            ->when($search !== '', fn ($q) => $q->where(fn ($sub) => $sub
                ->where('full_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('username', 'like', "%{$search}%")
                ->orWhere('student_code', 'like', "%{$search}%")))
            ->orderBy('full_name')
            ->limit(30)
            ->get(['id', 'full_name', 'username', 'email', 'student_code', 'avatar']);

        return $this->successResponse(true, $users, ApiMessage::RETRIEVED);
    }

    /**
     * Thêm thành viên vào board. Chỉ chủ board.
     */
    public function storeMember(StoreBoardMemberRequest $request, Board $board): JsonResponse
    {
        if ($resp = $this->ownerGuard($board, $request->user())) {
            return $resp;
        }

        $validated = $request->validated();
        $userId = (int) $validated['user_id'];

        if ($board->memberships()->where('user_id', $userId)->exists()) {
            return $this->errorResponse(false, 'Người dùng đã là thành viên của board.', 422);
        }

        $canAccessAdmin = User::query()
            ->permission(PermissionsEnum::ADMIN_PANEL_ACCESS->value)
            ->where('is_active', true)
            ->whereKey($userId)
            ->exists();

        if (! $canAccessAdmin) {
            return $this->validationErrorResponse([
                'user_id' => ['Thành viên board phải có quyền truy cập trang quản trị.'],
            ]);
        }

        $role = $validated['role'] ?? 'editor';
        $board->memberships()->create([
            'user_id'   => $userId,
            'role'      => $role,
            'joined_at' => now(),
        ]);

        $user = User::find($userId);

        // Thông báo cho người vừa được thêm vào board.
        if ($user->id !== $request->user()->id) {
            $user->notify(new \App\Notifications\AdminActionNotification(
                'Được thêm vào bảng công việc',
                "Bạn đã được thêm vào bảng \"{$board->name}\".",
                'board_member_added',
                'board',
                $board->id,
                $request->user()->full_name,
                "/to-do-list/{$board->slug}"
            ));
        }

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
    public function updateMemberRole(UpdateBoardMemberRoleRequest $request, Board $board, int $user): JsonResponse
    {
        if ($resp = $this->ownerGuard($board, $request->user())) {
            return $resp;
        }

        if ($user === $board->created_by) {
            return $this->errorResponse(false, 'Không thể đổi vai trò của người tạo board.', 422);
        }

        $membership = $board->memberships()->where('user_id', $user)->first();
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
    public function destroyMember(Request $request, Board $board, int $user): JsonResponse
    {
        if ($resp = $this->ownerGuard($board, $request->user())) {
            return $resp;
        }

        if ($user === $board->created_by) {
            return $this->errorResponse(false, 'Không thể xóa người tạo board.', 422);
        }

        $membership = $board->memberships()->where('user_id', $user)->first();
        if (! $membership) {
            return $this->notFoundResponse();
        }

        DB::transaction(function () use ($board, $user, $membership) {
            DB::table('board_task_assignees')
                ->whereIn('task_id', $board->tasks()->pluck('id'))
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
    private function memberGuard(Board $board, $user): ?JsonResponse
    {
        return $board->hasMember($user->id) ? null : $this->forbiddenResponse();
    }

    /**
     * Chặn nếu user không có quyền chỉnh sửa (không thuộc board hoặc chỉ là "viewer").
     */
    private function editorGuard(Board $board, $user): ?JsonResponse
    {
        if (! $board->hasMember($user->id)) {
            return $this->forbiddenResponse();
        }

        if ($board->created_by === $user->id) {
            return null;
        }

        $role = $board->memberships()->where('user_id', $user->id)->value('role');

        return $role === 'viewer' ? $this->forbiddenResponse() : null;
    }

    /**
     * Chặn nếu user không phải chủ board (người tạo hoặc thành viên vai trò "owner").
     */
    private function ownerGuard(Board $board, $user): ?JsonResponse
    {
        if ($board->created_by === $user->id) {
            return null;
        }

        $role = $board->memberships()->where('user_id', $user->id)->value('role');

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

        while (Board::withTrashed()->where('slug', $slug)->exists()) {
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

    /**
     * Chỉ cho phép giao task cho thành viên của board.
     */
    private function boardAssigneeGuard(Board $board, array $ids): ?JsonResponse
    {
        $ids = collect($ids)->filter()->unique()->values();
        if ($ids->isEmpty()) {
            return null;
        }

        $validCount = $board->members()
            ->whereIn('users.id', $ids)
            ->count();

        if ($validCount !== $ids->count()) {
            return $this->validationErrorResponse([
                'assignee_ids' => ['Người phụ trách phải là thành viên của board.'],
            ]);
        }

        return null;
    }
}
