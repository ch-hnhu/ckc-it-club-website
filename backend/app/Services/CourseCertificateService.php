<?php

namespace App\Services;

use App\Models\CertificateTemplate;
use App\Models\CourseCertificate;
use App\Models\CourseEnrollment;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Cấp/thu hồi/cấp lại chứng chỉ khoá học. Cấp tự động được gọi từ
 * CourseCompletionService::recalc ngay khi một enrollment vừa chuyển sang hoàn thành.
 */
class CourseCertificateService
{
    /**
     * Cấp chứng chỉ cho enrollment đã hoàn thành. Idempotent theo unique
     * (user_id, course_id, track) trên course_certificates — nếu đã có chứng chỉ còn hiệu lực
     * (chưa bị thu hồi) thì trả về luôn, không sinh PDF lại. Trả null nếu chưa có mẫu chứng chỉ nào.
     */
    public function issue(CourseEnrollment $enrollment): ?CourseCertificate
    {
        $existing = CourseCertificate::where([
            'user_id' => $enrollment->user_id,
            'course_id' => $enrollment->course_id,
            'track' => $enrollment->track,
        ])->first();

        if ($existing && ! $existing->revoked_at) {
            return $existing;
        }

        $template = $enrollment->course->certificateTemplate
            ?? CertificateTemplate::where('is_default', true)->first()
            ?? CertificateTemplate::first();

        if (! $template) {
            return null;
        }

        return $this->generate($enrollment, $template, $existing);
    }

    /**
     * Thu hồi chứng chỉ — giữ lại bản ghi + file PDF cũ làm lịch sử, chỉ đánh dấu đã thu hồi.
     */
    public function revoke(CourseCertificate $certificate, User $admin): CourseCertificate
    {
        $certificate->update(['revoked_at' => now(), 'revoked_by' => $admin->id]);

        return $certificate;
    }

    /**
     * Cấp lại: sinh cert_code + PDF mới (vd template đã đổi, hoặc cấp lại sau khi thu hồi),
     * gỡ trạng thái thu hồi trên cùng bản ghi (không tạo dòng mới vì unique theo user+course+track).
     */
    public function reissue(CourseCertificate $certificate): CourseCertificate
    {
        $template = $certificate->template
            ?? $certificate->course->certificateTemplate
            ?? CertificateTemplate::where('is_default', true)->first();
        abort_if(! $template, 422, 'Chưa có mẫu chứng chỉ để cấp lại.');

        $enrollment = $certificate->course->enrollmentFor($certificate->user_id);
        abort_if(! $enrollment, 422, 'Học viên không còn ghi danh khoá học này.');

        return $this->generate($enrollment, $template, $certificate);
    }

    private function generate(CourseEnrollment $enrollment, CertificateTemplate $template, ?CourseCertificate $existing): CourseCertificate
    {
        $certCode = $this->generateCertCode();
        $renderData = [
            'name' => $enrollment->user->full_name ?? '',
            'course' => $enrollment->course->title,
            'cert_code' => $certCode,
            'issued_at' => now()->format('d/m/Y'),
            'verify_url' => rtrim((string) config('app.url'), '/').'/verify/'.$certCode,
        ];

        $path = "certificates/{$certCode}.pdf";

        if (is_array($template->design) && ! empty($template->design['canvas'])) {
            // Mẫu thiết kế canvas (editor kéo-thả) → render WYSIWYG bằng Browsershot.
            $pdfBytes = app(CertificateRenderer::class)->renderPdf($template, $renderData);
        } else {
            // Mẫu cũ chỉ có html_content → fallback dompdf.
            $pdfBytes = Pdf::loadHTML($template->render($renderData))->setPaper('a4', 'landscape')->output();
        }

        Storage::disk('public')->put($path, $pdfBytes);

        $data = [
            'template_id' => $template->id,
            'cert_code' => $certCode,
            'cert_url' => Storage::disk('public')->url($path),
            'issued_at' => now(),
            'revoked_at' => null,
            'revoked_by' => null,
        ];

        if ($existing) {
            $oldPath = $this->storagePathFromUrl($existing->cert_url);
            $existing->update($data);
            if ($oldPath) {
                Storage::disk('public')->delete($oldPath);
            }

            return $existing->refresh();
        }

        return CourseCertificate::create([
            'user_id' => $enrollment->user_id,
            'course_id' => $enrollment->course_id,
            'track' => $enrollment->track,
            ...$data,
        ]);
    }

    private function generateCertCode(): string
    {
        do {
            $code = 'CKC-' . now()->format('Y') . '-' . Str::upper(Str::random(8));
        } while (CourseCertificate::where('cert_code', $code)->exists());

        return $code;
    }

    private function storagePathFromUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $marker = '/storage/';
        $pos = strpos($url, $marker);

        return $pos !== false ? substr($url, $pos + strlen($marker)) : null;
    }
}
