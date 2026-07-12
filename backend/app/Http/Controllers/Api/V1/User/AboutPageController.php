<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\ClubInformation;
use App\Models\ClubInformationValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Nội dung trang "Về chúng tôi" (About) — dạng config.
 *
 * Toàn bộ nội dung được lưu trong bảng club_informations dưới các slug
 * `about-<section>`, type `json`. Mỗi slug có một club_information_value active
 * chứa JSON của section đó. Controller này gộp tất cả lại thành một payload có
 * cấu trúc cho frontend user (show) và ghi ngược lại khi admin lưu (update).
 */
class AboutPageController extends BaseApiController
{
    /**
     * Các section của trang About và giá trị mặc định (khi DB chưa có).
     *
     * Object mặc định rỗng, mảng mặc định rỗng — dùng để suy ra kiểu khi encode
     * và làm fallback nếu thiếu slug.
     *
     * @var array<string, 'object'|'array'>
     */
    private const SECTIONS = [
        'hero' => 'object',
        'story' => 'object',
        'mission' => 'object',
        'vision' => 'object',
        'stats' => 'array',
        'values' => 'array',
        'timeline' => 'array',
        'departments' => 'array',
        'awards' => 'array',
        'faqs' => 'array',
        'cta' => 'object',
    ];

    /**
     * GET /api/v1/about-page (public) — trả toàn bộ nội dung trang About.
     */
    public function show(): JsonResponse
    {
        $slugs = array_map(fn ($key) => "about-{$key}", array_keys(self::SECTIONS));

        $infos = ClubInformation::whereIn('slug', $slugs)
            ->with(['clubInformationValues' => fn ($q) => $q->where('is_active', true)->orderBy('position')->orderBy('id')])
            ->get()
            ->keyBy('slug');

        $data = [];
        foreach (self::SECTIONS as $key => $shape) {
            $info = $infos->get("about-{$key}");
            $raw = $info?->clubInformationValues->first()?->value;
            $decoded = $raw !== null ? json_decode($raw, true) : null;

            $data[$key] = is_array($decoded)
                ? $decoded
                : ($shape === 'array' ? [] : (object) []);
        }

        return $this->successResponse(true, $data);
    }

    /**
     * PUT /api/v1/about-page (admin, permission club_info.manage) — lưu nội dung.
     *
     * Nhận payload keyed theo section; với mỗi section, ghi JSON vào value active
     * (tạo mới nếu chưa có). Chỉ cập nhật những section được gửi lên.
     */
    public function update(Request $request): JsonResponse
    {
        $payload = $request->all();
        $adminId = Auth::id();

        foreach (self::SECTIONS as $key => $shape) {
            if (! array_key_exists($key, $payload)) {
                continue;
            }

            $info = ClubInformation::where('slug', "about-{$key}")->first();
            if (! $info) {
                continue;
            }

            $json = json_encode($payload[$key], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            $value = $info->clubInformationValues()
                ->where('is_active', true)
                ->orderBy('position')
                ->orderBy('id')
                ->first();

            if ($value) {
                $value->update([
                    'value' => $json,
                    'updated_by' => $adminId,
                    'updated_at' => now(),
                ]);
            } else {
                ClubInformationValue::create([
                    'club_information_id' => $info->id,
                    'value' => $json,
                    'position' => 0,
                    'is_active' => true,
                    'created_by' => $adminId,
                    'created_at' => now(),
                    'updated_by' => $adminId,
                    'updated_at' => now(),
                ]);
            }
        }

        return $this->show();
    }
}
