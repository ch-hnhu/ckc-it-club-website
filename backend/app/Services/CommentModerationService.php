<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Kiểm duyệt bình luận tự động bằng Google Gemini.
 *
 * Trả về kết quả dạng ['flagged' => bool, 'reason' => ?string, 'categories' => array].
 * Nguyên tắc fail-open: nếu tắt tính năng, thiếu API key hoặc gọi API lỗi thì
 * KHÔNG chặn bình luận (flagged = false) để tránh phụ thuộc hoàn toàn vào dịch vụ ngoài.
 */
class CommentModerationService
{
    private const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent';

    /**
     * Chấm một đoạn nội dung bình luận.
     *
     * @return array{flagged: bool, reason: ?string, categories: array<int, string>}
     */
    public function check(string $content): array
    {
        $clean = ['flagged' => false, 'reason' => null, 'categories' => []];

        $key = config('services.gemini.key');

        if (! config('services.gemini.moderation_enabled') || empty($key) || trim($content) === '') {
            return $clean;
        }

        try {
            $response = Http::timeout((int) config('services.gemini.timeout', 10))
                ->withOptions(['verify' => config('services.gemini.verify', true)])
                ->asJson()
                ->post(
                    sprintf(self::ENDPOINT, config('services.gemini.model', 'gemini-2.5-flash')) . '?key=' . $key,
                    [
                        'systemInstruction' => [
                            'parts' => [['text' => $this->systemPrompt()]],
                        ],
                        'contents' => [[
                            'parts' => [['text' => $content]],
                        ]],
                        'generationConfig' => [
                            'temperature'      => 0,
                            'responseMimeType' => 'application/json',
                        ],
                    ],
                );

            if ($response->failed()) {
                Log::warning('Gemini moderation HTTP error', ['status' => $response->status(), 'body' => $response->body()]);

                return $clean;
            }

            $text = data_get($response->json(), 'candidates.0.content.parts.0.text');
            $parsed = json_decode((string) $text, true);

            if (! is_array($parsed)) {
                Log::warning('Gemini moderation: unparseable response', ['text' => $text]);

                return $clean;
            }

            $flagged    = (bool) ($parsed['violating'] ?? false);
            $categories = array_values(array_filter((array) ($parsed['categories'] ?? [])));

            return [
                'flagged'    => $flagged,
                'reason'     => $flagged ? ($parsed['reason'] ?? $this->reasonFromCategories($categories)) : null,
                'categories' => $categories,
            ];
        } catch (Throwable $e) {
            Log::warning('Gemini moderation exception: ' . $e->getMessage());

            return $clean;
        }
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Bạn là bộ lọc kiểm duyệt nội dung cho một website cộng đồng sinh viên IT tại Việt Nam.
Hãy phân loại nội dung do người dùng đăng (bình luận hoặc bài viết). Phát hiện các loại vi phạm sau:
- toxic: chửi tục, xúc phạm, lăng mạ, công kích cá nhân
- hate: thù ghét, phân biệt vùng miền/giới tính/tôn giáo/sắc tộc
- sexual: nội dung tình dục, khiêu dâm
- violence: kích động bạo lực, đe dọa
- spam: quảng cáo rác, lừa đảo, link độc hại, rao vặt
- harassment: quấy rối, bắt nạt

Chỉ đánh dấu vi phạm khi thực sự rõ ràng. Nội dung bình thường, góp ý, chia sẻ kiến thức,
tranh luận lịch sự, hoặc chỉ dùng từ ngữ đời thường thì KHÔNG phải vi phạm.

Trả lời DUY NHẤT bằng JSON theo đúng schema, không thêm chữ nào khác:
{"violating": boolean, "categories": string[], "reason": string}
- "violating": true nếu vi phạm, false nếu an toàn.
- "categories": danh sách loại vi phạm (rỗng nếu an toàn).
- "reason": câu ngắn tiếng Việt giải thích lý do (chuỗi rỗng nếu an toàn).
PROMPT;
    }

    private function reasonFromCategories(array $categories): string
    {
        $map = [
            'toxic'      => 'ngôn từ xúc phạm',
            'hate'       => 'nội dung thù ghét/phân biệt',
            'sexual'     => 'nội dung tình dục',
            'violence'   => 'kích động bạo lực',
            'spam'       => 'spam/quảng cáo',
            'harassment' => 'quấy rối',
        ];

        $labels = array_map(fn ($c) => $map[$c] ?? $c, $categories);

        return $labels ? 'Vi phạm: ' . implode(', ', $labels) : 'Nội dung vi phạm tiêu chuẩn cộng đồng';
    }
}
