<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\MediaFile;
use App\Services\SupabaseStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MediaFileController extends BaseApiController
{
    public function __construct(private readonly SupabaseStorageService $storage) {}
    public function index(Request $request): JsonResponse
    {
        $allowedSorts = ['id', 'url', 'size_kb', 'created_at', 'file_type', 'target_type', 'owner_name'];
        $sort       = in_array($request->query('sort', 'created_at'), $allowedSorts) ? $request->query('sort', 'created_at') : 'created_at';
        $order      = in_array($request->query('order', 'desc'), ['asc', 'desc']) ? $request->query('order', 'desc') : 'desc';
        $perPage    = (int) $request->query('per_page', 20);
        $search     = $request->query('search');
        $fileType   = $request->query('file_type');
        $targetType = $request->query('target_type');

        $files = MediaFile::query()
            ->with('owner:id,full_name,email,avatar')
            ->when($search, fn ($q) => $q->where(fn ($s) => $s
                ->where('media_files.url', 'like', "%{$search}%")
                ->orWhereHas('owner', fn ($u) => $u->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"))
            ))
            ->when($fileType, fn ($q) => $q->where('media_files.file_type', $fileType))
            ->when($targetType, fn ($q) => $q->where('media_files.target_type', $targetType))
            ->when(in_array($sort, ['id', 'url', 'size_kb', 'created_at', 'file_type', 'target_type']), fn ($q) => $q->orderBy("media_files.{$sort}", $order))
            ->when($sort === 'owner_name', fn ($q) => $q->orderByRaw("(SELECT COALESCE(full_name, email) FROM users WHERE users.id = media_files.owner_id) {$order}"))
            ->paginate($perPage);

        $files->getCollection()->transform(fn (MediaFile $file) => $this->transformFile($file));

        return $this->paginatedResponse($files, ApiMessage::RETRIEVED);
    }

    public function stats(): JsonResponse
    {
        $counts = DB::table('media_files')
            ->selectRaw('file_type, COUNT(*) as count')
            ->groupBy('file_type')
            ->pluck('count', 'file_type');

        $totalSizeKb = (int) DB::table('media_files')->sum('size_kb');

        return $this->successResponse(true, [
            'total'          => (int) $counts->sum(),
            'image'          => (int) ($counts['image']    ?? 0),
            'video'          => (int) ($counts['video']    ?? 0),
            'document'       => (int) ($counts['document'] ?? 0),
            'gif'            => (int) ($counts['gif']      ?? 0),
            'total_size_kb'  => $totalSizeKb,
        ], ApiMessage::RETRIEVED);
    }

    public function destroy(MediaFile $mediaFile): JsonResponse
    {
        // Xóa file vật lý trên storage (trích path từ URL)
        $this->deleteStorageFile($mediaFile->url);

        $mediaFile->delete();

        return $this->successResponse(true, null, 'Đã xóa tài nguyên.');
    }

    private function deleteStorageFile(string $url): void
    {
        try {
            // Delegate to SupabaseStorageService which parses Supabase URLs and calls the delete API.
            $this->storage->delete($url);
        } catch (\Throwable) {
            // Don't throw — delete DB record even if storage delete fails.
        }
    }

    private function transformFile(MediaFile $file): array
    {
        $owner = $file->owner;

        return [
            'id'          => $file->id,
            'owner'       => $owner ? [
                'id'        => $owner->id,
                'full_name' => $owner->full_name,
                'email'     => $owner->email,
                'avatar'    => $owner->avatar,
            ] : null,
            'url'         => $file->url,
            'file_type'   => $file->file_type,
            'size_kb'     => $file->size_kb,
            'target_type' => $file->target_type,
            'target_id'   => $file->target_id,
            'created_at'  => $file->created_at?->toIso8601String(),
        ];
    }
}
