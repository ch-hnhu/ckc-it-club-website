<?php

namespace Database\Seeders;

use App\Models\CertificateTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Mẫu chứng chỉ mặc định để CourseCertificateService có thể sinh PDF khi học viên
 * hoàn thành khoá học. Placeholder hỗ trợ: {{name}}, {{course}}, {{cert_code}}, {{issued_at}}, {{track}}.
 */
class CertificateTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::query()->orderBy('id')->value('id');
        if (! $adminId) {
            return;
        }

        $this->seedAssets();

        $template = CertificateTemplate::query()->where('is_default', true)->first()
            ?? CertificateTemplate::query()->where('name', 'Mẫu mặc định')->first()
            ?? new CertificateTemplate(['created_by' => $adminId]);

        CertificateTemplate::query()
            ->where('is_default', true)
            ->when($template->exists, fn ($query) => $query->whereKeyNot($template->id))
            ->update(['is_default' => false]);

        $template->fill([
            'name' => 'Mẫu mặc định',
            'design' => $this->defaultDesign(),
            'thumbnail' => 'certificate-thumbnails/50817e13-18e2-42ef-a288-231898857fce.png',
            'is_default' => true,
            'created_by' => $template->created_by ?: $adminId,
        ]);
        $template->save();
    }

    /**
     * Copy tracked seed logos to the public disk path referenced by the design.
     */
    private function seedAssets(): void
    {
        $assets = [
            'certificate-assets/cao-thang-logo.png' => database_path('seeders/assets/certificate-templates/cao-thang-logo.png'),
            'certificate-assets/doan-logo.webp' => database_path('seeders/assets/certificate-templates/doan-logo.webp'),
        ];

        foreach ($assets as $target => $source) {
            if (is_file($source)) {
                Storage::disk('public')->put($target, file_get_contents($source));
            }
        }
    }

    /**
     * @return array<string,mixed>
     */
    private function defaultDesign(): array
    {
        return json_decode(<<<'JSON'
        {
            "canvas": {
                "width": 1123,
                "height": 794,
                "background": {
                    "color": "#750000",
                    "image": null
                }
            },
            "elements": [
                {
                    "id": "kpj2kbdb",
                    "type": "rect",
                    "x": 39.99999999999994,
                    "y": 40,
                    "width": 1043,
                    "height": 714,
                    "rotation": 0,
                    "fill": "transparent",
                    "stroke": "#dddf58",
                    "strokeWidth": 5,
                    "cornerRadius": 0
                },
                {
                    "id": "nigs6c0y",
                    "type": "text",
                    "x": 223.16826042651235,
                    "y": 214.9266968927231,
                    "width": 676.6634791469753,
                    "height": 136,
                    "rotation": 0,
                    "text": "GIẤY CHỨNG NHẬN",
                    "fontFamily": "Be Vietnam Pro",
                    "fontSize": 68,
                    "fill": "#ffffff",
                    "align": "center",
                    "fontStyle": "bold"
                },
                {
                    "id": "v1c3vbfb",
                    "type": "qr",
                    "x": 943,
                    "y": 614,
                    "width": 120,
                    "height": 120,
                    "rotation": 0
                },
                {
                    "id": "ccbt2kiz",
                    "type": "image",
                    "x": 68.87701589083144,
                    "y": 66.5178107277874,
            "width": 80,
            "height": 120,
            "rotation": 0,
            "src": "/storage/certificate-assets/cao-thang-logo.png"
        },
        {
            "id": "js2afhh1",
                    "type": "image",
                    "x": 165.5689416566303,
                    "y": 66.5178107277874,
            "width": 115.1986375397641,
            "height": 120.07675574177382,
            "rotation": 0,
            "src": "/storage/certificate-assets/doan-logo.webp"
        },
                {
                    "id": "jzmt5ovk",
                    "type": "text",
                    "x": 361.49999999999994,
                    "y": 318.9266968927231,
                    "width": 400,
                    "height": 48,
                    "rotation": 0,
                    "text": "Chứng nhận học viên",
                    "fontFamily": "Be Vietnam Pro",
                    "fontSize": 32,
                    "fill": "#ffffff",
                    "align": "center",
                    "fontStyle": "normal"
                },
                {
                    "id": "n4lykb20",
                    "type": "text",
                    "x": 180.1113613539695,
                    "y": 366.9266968927231,
                    "width": 762.7772772920611,
                    "height": 31.999999999999968,
                    "rotation": 0,
                    "text": "{{name}}",
                    "fontFamily": "Be Vietnam Pro",
                    "fontSize": 32,
                    "fill": "#ffffff",
                    "align": "center",
                    "fontStyle": "normal"
                },
                {
                    "id": "rpghyp2j",
                    "type": "text",
                    "x": 361.49999999999994,
                    "y": 418.3018371928166,
                    "width": 400,
                    "height": 48,
                    "rotation": 0,
                    "text": "Hoàn thành khoá học",
                    "fontFamily": "Be Vietnam Pro",
                    "fontSize": 32,
                    "fill": "#ffffff",
                    "align": "center",
                    "fontStyle": "normal"
                },
                {
                    "id": "bylpi4gy",
                    "type": "text",
                    "x": 115.06796062736282,
                    "y": 466.3018371928166,
                    "width": 892.8640787452742,
                    "height": 31.999999999999982,
                    "rotation": 0,
                    "text": "{{course}}",
                    "fontFamily": "Be Vietnam Pro",
                    "fontSize": 32,
                    "fill": "#ffffff",
                    "align": "center",
                    "fontStyle": "normal"
                },
                {
                    "id": "wjc3iz3n",
                    "type": "text",
                    "x": 68.87701589083133,
                    "y": 673.9999999999998,
                    "width": 713.307648570416,
                    "height": 23.999999999999996,
                    "rotation": 0,
                    "text": "Ngày cấp: {{issued_at}}",
                    "fontFamily": "Be Vietnam Pro",
                    "fontSize": 24,
                    "fill": "#ffffff",
                    "align": "left",
                    "fontStyle": "normal"
                },
                {
                    "id": "h4duqtxc",
                    "type": "text",
                    "x": 68.87701589083133,
                    "y": 710,
                    "width": 683.9923130316635,
                    "height": 63.999999999999986,
                    "rotation": 0,
                    "text": "Mã chứng chỉ: {{cert_code}}",
                    "fontFamily": "Be Vietnam Pro",
                    "fontSize": 24,
                    "fill": "#ffffff",
                    "align": "left",
                    "fontStyle": "normal"
                },
                {
                    "id": "42jo7egl",
                    "type": "text",
                    "x": 260.72853408553857,
                    "y": 514.3018371928166,
                    "width": 601.542931828923,
                    "height": 31.999999999999975,
                    "rotation": 0,
                    "text": "Hình thức: {{track}}",
                    "fontFamily": "Be Vietnam Pro",
                    "fontSize": 32,
                    "fill": "#ffffff",
                    "align": "center",
                    "fontStyle": "normal"
                }
            ]
        }
        JSON, true, flags: JSON_THROW_ON_ERROR);
    }
}
