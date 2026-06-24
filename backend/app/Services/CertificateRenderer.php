<?php

namespace App\Services;

use App\Models\CertificateTemplate;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\File;
use Spatie\Browsershot\Browsershot;

/**
 * Render mẫu chứng chỉ (scene JSON kéo-thả từ editor Konva) thành PDF bằng Browsershot
 * (Chrome headless) — dựng lại đúng canvas của editor với dữ liệu thật (WYSIWYG).
 *
 * Placeholder hỗ trợ trong text element: {{name}} {{course}} {{issued_at}} {{cert_code}}.
 * Phần tử type "qr" được thay bằng ảnh QR trỏ tới {{verify_url}}.
 */
class CertificateRenderer
{
    /**
     * @param  array<string,string>  $data  name, course, issued_at, cert_code, verify_url
     */
    public function renderPdf(CertificateTemplate $template, array $data): string
    {
        $design = $template->design;
        abort_if(! is_array($design) || empty($design['canvas']), 422, 'Mẫu chứng chỉ chưa có thiết kế.');

        $scene = $this->prepareScene($design, $data);
        $html = $this->buildHtml($scene);

        $shot = Browsershot::html($html)
            ->setNodeModulePath(base_path('node_modules'))
            ->format('A4')
            ->landscape()
            ->margins(0, 0, 0, 0)
            ->showBackground()
            ->waitUntilNetworkIdle()
            ->waitForFunction('window.__certReady === true', null, 15000);

        // Production (Alpine): dùng Chromium hệ thống thay vì Chromium của puppeteer.
        if ($chromePath = env('BROWSERSHOT_CHROME_PATH')) {
            $shot->setChromePath($chromePath)->noSandbox();
        }

        return $shot->pdf();
    }

    /**
     * Thay placeholder trong text + chèn data-URI QR cho phần tử qr.
     *
     * @param  array<string,mixed>  $design
     * @param  array<string,string>  $data
     * @return array<string,mixed>
     */
    private function prepareScene(array $design, array $data): array
    {
        $map = [
            '{{name}}' => $data['name'] ?? '',
            '{{course}}' => $data['course'] ?? '',
            '{{issued_at}}' => $data['issued_at'] ?? '',
            '{{cert_code}}' => $data['cert_code'] ?? '',
        ];

        $qrDataUri = ! empty($data['verify_url']) ? $this->qrDataUri($data['verify_url']) : null;

        $design['elements'] = array_map(function (array $el) use ($map, $qrDataUri) {
            if (($el['type'] ?? null) === 'text') {
                $el['text'] = strtr($el['text'] ?? '', $map);
            }
            if (($el['type'] ?? null) === 'qr' && $qrDataUri) {
                $el['src'] = $qrDataUri;
            }

            return $el;
        }, $design['elements'] ?? []);

        return $design;
    }

    private function qrDataUri(string $url): string
    {
        return (new Builder(writer: new PngWriter(), data: $url, size: 300, margin: 0))
            ->build()
            ->getDataUri();
    }

    /**
     * Tạo HTML tự chứa: nạp Konva (inline) + font Việt + vẽ scene bằng JS giống editor.
     *
     * @param  array<string,mixed>  $scene
     */
    private function buildHtml(array $scene): string
    {
        $konva = File::get(public_path('vendor/konva.min.js'));
        $sceneJson = json_encode($scene, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $w = (int) $scene['canvas']['width'];
        $h = (int) $scene['canvas']['height'];

        return <<<HTML
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,700;1,400;1,700&family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<style>html,body{margin:0;padding:0}#stage{width:{$w}px;height:{$h}px}</style>
<script>{$konva}</script>
</head>
<body>
<div id="stage"></div>
<script>
const scene = {$sceneJson};
function buildNode(el){
  const t = el.type;
  const common = { x: el.x, y: el.y, rotation: el.rotation || 0 };
  if (t === 'text') {
    return new Konva.Text({ ...common, text: el.text || ' ', width: el.width,
      fontSize: el.fontSize || 28, fontFamily: el.fontFamily || 'Be Vietnam Pro',
      fontStyle: el.fontStyle || 'normal', fill: el.fill || '#111111', align: el.align || 'center' });
  }
  if (t === 'rect') {
    return new Konva.Rect({ ...common, width: el.width, height: el.height,
      fill: (el.fill && el.fill !== 'transparent') ? el.fill : undefined,
      stroke: el.stroke, strokeWidth: el.strokeWidth, cornerRadius: el.cornerRadius || 0 });
  }
  if (t === 'ellipse') {
    return new Konva.Ellipse({ x: el.x + el.width/2, y: el.y + el.height/2, rotation: el.rotation||0,
      radiusX: el.width/2, radiusY: el.height/2,
      fill: (el.fill && el.fill !== 'transparent') ? el.fill : undefined,
      stroke: el.stroke, strokeWidth: el.strokeWidth });
  }
  if (t === 'line') {
    return new Konva.Line({ ...common, points: [0,0, el.width,0], stroke: el.stroke || '#111', strokeWidth: el.strokeWidth || 3 });
  }
  return null; // image/qr xử lý async bên dưới
}
function loadImage(src){
  return new Promise((resolve) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = () => resolve(null); im.src = src; });
}
(async () => {
  // Nạp tường minh các font được dùng (Google Fonts) trước khi Konva vẽ — nếu không
  // Konva sẽ vẽ bằng font fallback (serif) vì @font-face chưa kịp tải.
  try {
    const families = [...new Set((scene.elements||[]).filter(e=>e.type==='text').map(e=>e.fontFamily||'Be Vietnam Pro'))];
    await Promise.all(families.flatMap(f => [
      document.fonts.load('400 40px "'+f+'"'),
      document.fonts.load('700 40px "'+f+'"'),
      document.fonts.load('italic 400 40px "'+f+'"'),
    ]));
    await document.fonts.ready;
  } catch(e) {}
  const stage = new Konva.Stage({ container: 'stage', width: scene.canvas.width, height: scene.canvas.height });
  const layer = new Konva.Layer();
  stage.add(layer);
  // nền
  layer.add(new Konva.Rect({ x:0, y:0, width: scene.canvas.width, height: scene.canvas.height, fill: (scene.canvas.background && scene.canvas.background.color) || '#ffffff' }));
  if (scene.canvas.background && scene.canvas.background.image) {
    const bg = await loadImage(scene.canvas.background.image);
    if (bg) layer.add(new Konva.Image({ image: bg, x:0, y:0, width: scene.canvas.width, height: scene.canvas.height }));
  }
  for (const el of scene.elements) {
    if (el.type === 'image' || el.type === 'qr') {
      if (!el.src) continue;
      const img = await loadImage(el.src);
      if (img) layer.add(new Konva.Image({ image: img, x: el.x, y: el.y, width: el.width, height: el.height, rotation: el.rotation||0 }));
      continue;
    }
    const node = buildNode(el);
    if (node) layer.add(node);
  }
  layer.draw();
  // chờ font vẽ lại 1 nhịp rồi báo sẵn sàng
  requestAnimationFrame(() => { layer.draw(); window.__certReady = true; });
})();
</script>
</body>
</html>
HTML;
    }
}
