<?php

namespace App\Http\Controllers\Api\V1\User;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\CourseCertificate;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class CertificateVerificationController extends BaseApiController
{
    /**
     * Xác minh công khai một chứng chỉ theo mã (cert_code) nhúng trong QR.
     *
     * Không cần đăng nhập: bất kỳ ai quét QR trên chứng chỉ đều có thể kiểm tra
     * tính xác thực. Luôn trả về HTTP 200 kèm cờ trạng thái để phía frontend
     * hiển thị (hợp lệ / đã thu hồi / không tồn tại) mà không rơi vào nhánh lỗi.
     */
    #[OA\Get(
        path: '/v1/certificates/verify/{code}',
        summary: 'Xác minh công khai chứng chỉ theo mã',
        tags: ['Learning - Certificates (Public)'],
        parameters: [
            new OA\Parameter(name: 'code', in: 'path', required: true, description: 'Mã chứng chỉ (cert_code)', schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Kết quả xác minh (valid / revoked / not_found)'),
        ]
    )]
    public function show(string $code): JsonResponse
    {
        $certificate = CourseCertificate::query()
            ->where('cert_code', $code)
            ->with([
                'user:id,full_name,username,avatar',
                'course:id,slug,title,thumbnail',
            ])
            ->first();

        if (! $certificate) {
            return $this->successResponse(true, [
                'valid' => false,
                'status' => 'not_found',
                'certificate' => null,
            ], 'Không tìm thấy chứng chỉ với mã này.');
        }

        $revoked = $certificate->revoked_at !== null;

        return $this->successResponse(true, [
            'valid' => ! $revoked,
            'status' => $revoked ? 'revoked' : 'valid',
            'certificate' => [
                'cert_code' => $certificate->cert_code,
                'cert_url' => $this->resolveUrl($certificate->cert_url),
                'track' => $certificate->track,
                'issued_at' => $certificate->issued_at?->toIso8601String(),
                'revoked_at' => $certificate->revoked_at?->toIso8601String(),
                'recipient' => [
                    'full_name' => $certificate->user?->full_name,
                    'username' => $certificate->user?->username,
                    'avatar' => $this->resolveUrl($certificate->user?->avatar),
                ],
                'course' => $certificate->course ? [
                    'slug' => $certificate->course->slug,
                    'title' => $certificate->course->title,
                    'thumbnail' => $this->resolveUrl($certificate->course->thumbnail),
                ] : null,
            ],
        ], $revoked ? 'Chứng chỉ đã bị thu hồi.' : 'Chứng chỉ hợp lệ.');
    }

    /**
     * Bản ghi cũ có thể lưu đường dẫn tương đối trên disk public;
     * bản ghi mới lưu URL tuyệt đối (Supabase). Chuẩn hoá về URL đầy đủ.
     */
    private function resolveUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return Str::startsWith($path, ['http://', 'https://']) ? $path : asset('storage/'.$path);
    }
}
