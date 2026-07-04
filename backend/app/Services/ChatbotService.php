<?php

namespace App\Services;

use App\Models\ClubInformation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * ChatbotService — proxy hỏi đáp tới Google Gemini.
 *
 * Giữ API key ở phía server (config/services.php), nhét thông tin CLB vào
 * system prompt và chuyển lịch sử hội thoại sang định dạng "contents" của Gemini.
 */
class ChatbotService
{
    /**
     * Slug của bản ghi ClubInformation chứa system prompt cho chatbot.
     */
    private const SYSTEM_PROMPT_SLUG = 'ai-chatbot-system-prompt';

    /**
     * Prompt dự phòng khi chưa cấu hình trong DB (chưa seed / bị xoá).
     */
    private const FALLBACK_PROMPT = 'Bạn là trợ lý ảo của Câu lạc bộ IT (CKC IT Club). '
        .'Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt các câu hỏi về câu lạc bộ. '
        .'Nếu không chắc chắn, hãy đề nghị người dùng liên hệ ban chủ nhiệm và không bịa đặt thông tin.';

    /**
     * Lấy system prompt từ bảng club_informations (giá trị active mới nhất theo position).
     * Nội dung được quản trị viên chỉnh sửa trực tiếp trong DB, không gán cứng trong code.
     */
    private function systemPrompt(): string
    {
        $info = ClubInformation::where('slug', self::SYSTEM_PROMPT_SLUG)->first();

        $prompt = $info?->clubInformationValues()
            ->where('is_active', true)
            ->orderBy('position')
            ->value('value');

        $prompt = is_string($prompt) ? trim($prompt) : '';

        return $prompt !== '' ? $prompt : self::FALLBACK_PROMPT;
    }

    /**
     * Gửi tin nhắn tới Gemini và trả về câu trả lời (text).
     *
     * @param  string  $message  Câu hỏi hiện tại của người dùng.
     * @param  array<int, array{role: string, text: string}>  $history  Lịch sử hội thoại (cũ -> mới), không gồm $message.
     * @return string
     *
     * @throws \RuntimeException khi cấu hình thiếu hoặc Gemini lỗi.
     */
    public function ask(string $message, array $history = []): string
    {
        $apiKey = config('services.gemini.key');
        $model = config('services.gemini.model');
        $baseUrl = rtrim((string) config('services.gemini.base_url'), '/');

        if (empty($apiKey)) {
            throw new \RuntimeException('Chatbot chưa được cấu hình (thiếu GEMINI_API_KEY).');
        }

        // Chuyển lịch sử sang định dạng contents của Gemini. Chỉ nhận role user/model.
        $contents = [];
        foreach ($history as $turn) {
            $role = ($turn['role'] ?? '') === 'model' ? 'model' : 'user';
            $text = trim((string) ($turn['text'] ?? ''));
            if ($text === '') {
                continue;
            }
            $contents[] = ['role' => $role, 'parts' => [['text' => $text]]];
        }

        // Tin nhắn hiện tại luôn là lượt user cuối cùng.
        $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

        $response = Http::timeout(30)
            ->withHeaders(['x-goog-api-key' => $apiKey])
            ->post("{$baseUrl}/models/{$model}:generateContent", [
                'systemInstruction' => [
                    'parts' => [['text' => $this->systemPrompt()]],
                ],
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.4,
                    'maxOutputTokens' => 1024,
                ],
                // Nới lỏng vừa phải để không chặn nhầm câu hỏi bình thường.
                'safetySettings' => [
                    ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_ONLY_HIGH'],
                    ['category' => 'HARM_CATEGORY_HATE_SPEECH', 'threshold' => 'BLOCK_ONLY_HIGH'],
                    ['category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'threshold' => 'BLOCK_ONLY_HIGH'],
                    ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_ONLY_HIGH'],
                ],
            ]);

        if ($response->failed()) {
            Log::error('Gemini chatbot request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Không gọi được dịch vụ chatbot. Vui lòng thử lại sau.');
        }

        $data = $response->json();
        $answer = data_get($data, 'candidates.0.content.parts.0.text');

        if (! is_string($answer) || trim($answer) === '') {
            $blockReason = data_get($data, 'promptFeedback.blockReason');
            if ($blockReason) {
                return 'Xin lỗi, mình không thể trả lời câu hỏi này. Bạn thử hỏi về hoạt động của câu lạc bộ nhé!';
            }

            Log::warning('Gemini chatbot returned empty answer', ['body' => $response->body()]);
            throw new \RuntimeException('Chatbot không trả về nội dung. Vui lòng thử lại.');
        }

        return trim($answer);
    }
}
