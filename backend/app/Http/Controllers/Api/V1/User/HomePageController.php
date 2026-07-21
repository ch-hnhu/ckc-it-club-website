<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\ClubInformation;
use App\Models\ClubInformationValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Nội dung tĩnh của trang chủ (Landing) — dạng config.
 *
 * Tương tự AboutPageController: toàn bộ phần chữ/thẻ tĩnh của trang chủ được lưu
 * trong bảng club_informations dưới các slug `home-<section>`, type `json`. Mỗi
 * slug có một club_information_value active chứa JSON của section. Controller này
 * gộp tất cả thành một payload có cấu trúc cho frontend user (show) và ghi ngược
 * lại khi admin lưu (update).
 *
 * Lưu ý: khối "Giải thưởng & Thành tích" ở trang chủ KHÔNG nằm ở đây mà dùng
 * chung config trang About (slug `about-awards`) — xem AboutPageController.
 */
class HomePageController extends BaseApiController
{
    /**
     * Các section tĩnh của trang chủ. Ở trang chủ mọi section đều là object.
     *
     * @var array<int, string>
     */
    private const SECTIONS = [
        'hero',
        'quick_actions',
        'about',
        'headers',
        'contribution',
        'cta',
    ];

    /**
     * GET /api/v1/home-page (public) — trả toàn bộ nội dung tĩnh của trang chủ.
     */
    public function show(): JsonResponse
    {
        $slugs = array_map(fn ($key) => 'home-'.str_replace('_', '-', $key), self::SECTIONS);

        $infos = ClubInformation::whereIn('slug', $slugs)
            ->with(['clubInformationValues' => fn ($q) => $q->where('is_active', true)->orderBy('position')->orderBy('id')])
            ->get()
            ->keyBy('slug');

        $data = [];
        foreach (self::SECTIONS as $key) {
            $slug = 'home-'.str_replace('_', '-', $key);
            $info = $infos->get($slug);
            $raw = $info?->clubInformationValues->first()?->value;
            $decoded = $raw !== null ? json_decode($raw, true) : null;

            $data[$key] = is_array($decoded) ? $decoded : (object) [];
        }

        return $this->successResponse(true, $data);
    }

    /**
     * PUT /api/v1/home-page (admin, permission club_info.manage) — lưu nội dung.
     *
     * Nhận payload keyed theo section; với mỗi section, ghi JSON vào value active
     * (tạo mới nếu chưa có). Chỉ cập nhật những section được gửi lên.
     */
    public function update(Request $request): JsonResponse
    {
        $payload = $request->all();
        $adminId = Auth::id();

        foreach (self::SECTIONS as $key) {
            if (! array_key_exists($key, $payload)) {
                continue;
            }

            $slug = 'home-'.str_replace('_', '-', $key);
            $info = ClubInformation::where('slug', $slug)->first();
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
