<?php

namespace App\Services;

use App\Models\CertificateTemplate;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Spatie\Browsershot\Browsershot;

/**
 * Render mẫu chứng chỉ (scene JSON kéo-thả từ editor Konva) thành PDF bằng Browsershot
 * (Chrome headless) — dựng lại đúng canvas của editor với dữ liệu thật (WYSIWYG).
 *
 * Placeholder hỗ trợ trong text element: {{name}} {{course}} {{issued_at}} {{cert_code}} {{track}}.
 * Phần tử type "qr" được thay bằng ảnh QR trỏ tới {{verify_url}}.
 */
class CertificateRenderer
{
    /**
     * Render mẫu thành PDF (A4 ngang).
     *
     * @param  array<string,string>  $data  name, course, issued_at, cert_code, track, verify_url
     */
    public function renderPdf(CertificateTemplate $template, array $data): string
    {
        return $this->makeShot($template, $data)
            ->format('A4')
            ->landscape()
            ->margins(0, 0, 0, 0)
            ->showBackground()
            ->pdf();
    }

    /**
     * Render mẫu thành ảnh PNG thu nhỏ (cho thumbnail danh sách) — chụp đúng canvas rồi resize.
     *
     * @param  array<string,string>  $data
     */
    public function renderThumbnail(CertificateTemplate $template, array $data, int $width = 480): string
    {
        $design = $template->design;
        $w = (int) ($design['canvas']['width'] ?? 1123);
        $h = (int) ($design['canvas']['height'] ?? 794);

        $png = $this->makeShot($template, $data)->windowSize($w, $h)->screenshot();

        return $this->downscalePng($png, $width);
    }

    /**
     * Dựng Browsershot đã cấu hình sẵn (html + node + chrome + chờ render xong). Dùng chung cho PDF/PNG.
     *
     * @param  array<string,string>  $data
     */
    private function makeShot(CertificateTemplate $template, array $data): Browsershot
    {
        $design = $template->design;
        abort_if(! is_array($design) || empty($design['canvas']), 422, 'Mẫu chứng chỉ chưa có thiết kế.');

        // Browsershot có thể chậm → nới giới hạn thời gian PHP để không bị kill giữa chừng.
        if (function_exists('set_time_limit')) {
            @set_time_limit(120);
        }

        $scene = $this->prepareScene($design, $data);
        $html = $this->buildHtml($scene);

        // KHÔNG dùng waitUntilNetworkIdle: nó chờ mạng (Google Fonts) nên có thể treo tới
        // timeout. renderScene() tự await font + ảnh (đã nhúng base64) rồi set __certReady.
        $shot = Browsershot::html($html)
            ->setNodeModulePath(base_path('node_modules'))
            ->timeout(90)
            ->waitForFunction('window.__certReady === true', null, 30000);

        // Chỉ định node tường minh để KHÔNG phụ thuộc PATH tiến trình (node thường cài qua nvm).
        if ($nodePath = $this->resolveNodeBinary()) {
            $shot->setNodeBinary($nodePath);
        }

        // Production (Alpine): dùng Chromium hệ thống thay vì Chromium của puppeteer.
        if ($chromePath = env('BROWSERSHOT_CHROME_PATH')) {
            $shot->setChromePath($chromePath)->noSandbox();
        }

        return $shot;
    }

    /**
     * Thu nhỏ ảnh PNG về bề rộng cho trước bằng GD (giảm dung lượng thumbnail).
     */
    private function downscalePng(string $png, int $width): string
    {
        if (! function_exists('imagecreatefromstring')) {
            return $png;
        }
        $src = @imagecreatefromstring($png);
        if (! $src) {
            return $png;
        }
        $scaled = imagescale($src, $width);
        ob_start();
        imagepng($scaled ?: $src);
        $out = ob_get_clean();
        imagedestroy($src);
        if ($scaled) {
            imagedestroy($scaled);
        }

        return $out !== false && $out !== '' ? $out : $png;
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
            '{{track}}' => $data['track'] ?? '',
        ];

        $qrDataUri = ! empty($data['verify_url']) ? $this->qrDataUri($data['verify_url']) : null;

        // Nhúng ảnh nền thành data URI (đọc từ đĩa) — tránh Chrome gọi ngược localhost:8000
        // (php artisan serve đơn luồng đang bận xử lý chính request này → deadlock → treo).
        if (! empty($design['canvas']['background']['image'])) {
            $design['canvas']['background']['image'] = $this->inlineAsset($design['canvas']['background']['image']);
        }

        $design['elements'] = array_map(function (array $el) use ($map, $qrDataUri) {
            if (($el['type'] ?? null) === 'text') {
                $el['text'] = strtr($el['text'] ?? '', $map);
            }
            if (($el['type'] ?? null) === 'qr' && $qrDataUri) {
                $el['src'] = $qrDataUri;
            }
            if (($el['type'] ?? null) === 'image' && ! empty($el['src'])) {
                $el['src'] = $this->inlineAsset($el['src']);
            }

            return $el;
        }, $design['elements'] ?? []);

        return $design;
    }

    /**
     * Đổi ảnh trên public storage thành data URI (đọc trực tiếp từ đĩa). Ảnh đã là data:/external
     * (không thuộc /storage/) thì giữ nguyên.
     */
    private function inlineAsset(string $url): string
    {
        if (str_starts_with($url, 'data:')) {
            return $url;
        }

        // Fetch public URL and convert to base64 so it can be reliably embedded in the PDF
        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            try {
                $verifySsl = filter_var(env('HTTP_VERIFY_SSL', ! app()->environment('local')), FILTER_VALIDATE_BOOL);
                $response = Http::withOptions(['verify' => $verifySsl])->timeout(30)->get($url);
                if ($response->successful()) {
                    $mime = $response->header('Content-Type') ?: 'image/png';
                    return 'data:'.$mime.';base64,'.base64_encode($response->body());
                }
            } catch (\Throwable) {
                // Fallback to the original URL if fetch fails
            }
        }

        // Ảnh trên public disk (/storage/...): ĐỌC TRỰC TIẾP TỪ ĐĨA thay vì Http::get qua APP_URL.
        // Fetch HTTP tự gọi ngược localhost dễ hỏng khi web server không chạy (lúc seed bằng CLI)
        // hoặc `artisan serve` đơn luồng đang bận chính request này → ảnh (logo) bị bỏ trắng.
        if (str_starts_with($url, '/storage/')) {
            $relative = ltrim(substr($url, strlen('/storage/')), '/');
            $absolute = storage_path('app/public/'.$relative);
            if (is_file($absolute)) {
                $mime = $this->guessMime($absolute);
                return 'data:'.$mime.';base64,'.base64_encode((string) File::get($absolute));
            }

            // Dự phòng: đọc từ đĩa thất bại thì thử fetch qua APP_URL (giữ hành vi cũ).
            $fullUrl = rtrim((string) config('app.url'), '/') . $url;
            try {
                $verifySsl = filter_var(env('HTTP_VERIFY_SSL', ! app()->environment('local')), FILTER_VALIDATE_BOOL);
                $response = Http::withOptions(['verify' => $verifySsl])->timeout(30)->get($fullUrl);
                if ($response->successful()) {
                    $mime = $response->header('Content-Type') ?: 'image/png';
                    return 'data:'.$mime.';base64,'.base64_encode($response->body());
                }
            } catch (\Throwable) {
                // Fallback
            }
        }

        return $url;
    }

    /**
     * Đoán MIME từ đuôi file (đủ cho ảnh chứng chỉ: png/jpg/webp/gif/svg). Mặc định image/png.
     */
    private function guessMime(string $path): string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            default => 'image/png',
        };
    }

    /**
     * Tìm đường dẫn node binary. Ưu tiên env BROWSERSHOT_NODE_PATH, sau đó dò nvm + vị trí phổ biến.
     */
    private function resolveNodeBinary(): ?string
    {
        if ($env = env('BROWSERSHOT_NODE_PATH')) {
            return is_executable($env) ? $env : null;
        }

        $home = $_SERVER['HOME'] ?? getenv('HOME') ?? '';
        $nvm = $home ? (glob($home.'/.nvm/versions/node/*/bin/node') ?: []) : [];
        rsort($nvm); // bản version cao trước (v22 > v14)

        foreach (array_merge($nvm, ['/opt/homebrew/bin/node', '/usr/local/bin/node', '/usr/bin/node']) as $candidate) {
            if (is_executable($candidate)) {
                return $candidate;
            }
        }

        return null; // để Browsershot tự dùng PATH (trường hợp node đã nằm sẵn trong PATH)
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
        // Font tự host (woff2 nhúng base64) — render đúng font, KHÔNG phụ thuộc mạng/Google Fonts.
        $fontCss = File::exists(public_path('vendor/fonts/cert-fonts.css'))
            ? File::get(public_path('vendor/fonts/cert-fonts.css'))
            : '';
        // JSON_UNESCAPED_SLASHES bị bỏ: giữ `\/` để tránh `</script>` phá vỡ HTML.
        $sceneJson = json_encode($scene, JSON_UNESCAPED_UNICODE);
        $w = (int) $scene['canvas']['width'];
        $h = (int) $scene['canvas']['height'];

        return <<<HTML
<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<style>{$fontCss}</style>
<style>html,body{margin:0;padding:0}
#cert{position:relative;width:{$w}px;height:{$h}px;overflow:hidden}
#cert .layer{position:absolute;left:0;top:0;width:{$w}px;height:{$h}px}
#cert #imglayer img{position:absolute;transform-origin:0 0}</style>
<script>{$konva}</script>
</head>
<body>
<div id="cert">
  <div id="bg" class="layer"></div>
  <div id="imglayer" class="layer"></div>
  <div id="stage" class="layer"></div>
</div>
<script>
const scene = {$sceneJson};
// Font được nhúng base64 trong cert-fonts.css → chỉ có Be Vietnam Pro và Roboto hỗ trợ đầy đủ
// tiếng Việt. Các font khác (Arial, Times New Roman...) dùng fallback về Be Vietnam Pro.
const EMBEDDED_FONTS = ['Be Vietnam Pro', 'Roboto'];
function safeFontFamily(f) {
  return EMBEDDED_FONTS.includes(f) ? '"'+f+'"' : '"'+f+'", "Be Vietnam Pro", sans-serif';
}
function buildNode(el){
  const t = el.type;
  const common = { x: el.x, y: el.y, rotation: el.rotation || 0 };
  if (t === 'text') {
    return new Konva.Text({ ...common, text: el.text || ' ', width: el.width,
      fontSize: el.fontSize || 28, fontFamily: safeFontFamily(el.fontFamily || 'Be Vietnam Pro'),
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
// Nền + ảnh + QR được vẽ bằng thẻ <img>/CSS DOM, KHÔNG qua canvas Konva. Konva vẽ ảnh lên canvas
// lúc Browsershot xuất PDF không ổn định (ảnh bị rớt theo thứ tự thêm vào layer — logo hay mất,
// QR nhỏ thường kịp), trong khi Chrome luôn rasterit hoá <img> DOM đúng. Ảnh đều đã là data URI
// (nhúng base64) nên không phát sinh gọi mạng.
function cssRotate(deg){ return deg ? 'transform:rotate('+deg+'deg);' : ''; }
function renderDomImages(){
  const b = scene.canvas.background || {};
  const bg = document.getElementById('bg');
  bg.style.background = b.color || '#ffffff';
  if (b.image) {
    bg.style.backgroundImage = 'url("'+b.image+'")';
    bg.style.backgroundSize = 'cover';         // phủ kín khung, giữ tỉ lệ, cắt phần thừa (giống editor)
    bg.style.backgroundPosition = 'center';
    bg.style.backgroundRepeat = 'no-repeat';
  }
  const layer = document.getElementById('imglayer');
  for (const el of (scene.elements || [])) {
    if ((el.type !== 'image' && el.type !== 'qr') || !el.src) continue;
    const img = document.createElement('img');
    img.src = el.src;
    img.style.cssText = 'left:'+el.x+'px;top:'+el.y+'px;width:'+el.width+'px;height:'+el.height+'px;'+cssRotate(el.rotation||0);
    layer.appendChild(img);
  }
}
// Chờ mọi <img> tải + decode xong (có timeout) để Browsershot chụp khi ảnh đã hiển thị.
function waitImages(timeoutMs){
  const imgs = Array.from(document.images);
  const one = (im) => im.complete
    ? (im.decode ? im.decode().catch(()=>{}) : Promise.resolve())
    : new Promise(r => { im.onload = () => (im.decode ? im.decode().then(r, r) : r()); im.onerror = () => r(); });
  return Promise.race([Promise.all(imgs.map(one)), new Promise(r => setTimeout(r, timeoutMs))]);
}
function fontLoadTextFor(family) {
  const sceneText = (scene.elements || [])
    .filter(e => e.type === 'text' && (e.fontFamily || 'Be Vietnam Pro') === family)
    .map(e => e.text || '')
    .join(' ');
  // Bắt Chrome load cả subset tiếng Việt trong @font-face unicode-range trước khi Konva vẽ canvas.
  return (sceneText + ' ÀÁÂĂÈÉÊÌÍÒÓÔƠÙÚƯỲÝĐàáâăèéêìíòóôơùúưỳýđ ' +
    'ạảãấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏõốồổỗộớờởỡợụủũứừửữựỳỵỷỹ ' +
    'Trưởng ban Học thuật Truyền thông Nguyễn Minh Anh').slice(0, 3000);
}
async function waitUntilFontsUsable(families, descriptors, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ready = families.every(f => {
      const text = fontLoadTextFor(f);
      return descriptors.every(d => document.fonts.check(d + ' "' + f + '"', text));
    });
    if (ready) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
}
(async () => {
  // Nạp tất cả variant cần thiết của font nhúng (base64 trong cert-fonts.css) trước khi Konva vẽ.
  // Timeout 15s: base64 decode có thể chậm trên server yếu nhưng không để treo vô hạn.
  const withTimeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);
  try {
    const families = [...new Set((scene.elements||[]).filter(e=>e.type==='text').map(e=>e.fontFamily||'Be Vietnam Pro'))]
      .filter(f => EMBEDDED_FONTS.includes(f)); // chỉ load font có trong cert-fonts.css
    const descriptors = ['400 40px', '700 40px', 'italic 400 40px', 'italic 700 40px'];
    await withTimeout(Promise.all(families.flatMap(f => {
      const text = fontLoadTextFor(f);
      return descriptors.map(d => document.fonts.load(d + ' "' + f + '"', text));
    })), 15000);
    await withTimeout(document.fonts.ready, 3000);
    await waitUntilFontsUsable(families, descriptors, 3000);
  } catch(e) {}
  try {
    // Nền + ảnh + QR: DOM (ổn định khi xuất PDF). Chờ ảnh hiển thị xong.
    renderDomImages();
    await waitImages(15000);
    // Konva chỉ vẽ text/shape lên stage TRONG SUỐT nằm trên cùng, để lộ lớp ảnh/nền phía dưới.
    // Giữ nguyên thứ tự cũ: nền < ảnh/QR < text/shape.
    const stage = new Konva.Stage({ container: 'stage', width: scene.canvas.width, height: scene.canvas.height });
    const layer = new Konva.Layer();
    stage.add(layer);
    for (const el of scene.elements) {
      if (el.type === 'image' || el.type === 'qr') continue;
      const node = buildNode(el);
      if (node) layer.add(node);
    }
    layer.draw();
  } catch (e) {
    document.title = 'CERT_RENDER_ERROR: ' + (e && e.message ? e.message : e);
  } finally {
    // LUÔN báo sẵn sàng (không phụ thuộc requestAnimationFrame) để Browsershot không treo.
    window.__certReady = true;
  }
})();
</script>
</body>
</html>
HTML;
    }
}
