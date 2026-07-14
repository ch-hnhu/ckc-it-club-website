<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Reusable Supabase Storage service.
 *
 * All credentials are read from environment variables:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_IMAGE_BUCKET
 *   SUPABASE_FILE_BUCKET
 *
 * Bucket structure:
 *   images/
 *     avatars/
 *     blog/
 *     certificate/
 *     channels/
 *     chat-rooms/
 *     club-info/
 *     community/
 *     course/
 *     covers/
 *     event/
 *     rank/
 *
 *   files/
 *     imports/
 */
class SupabaseStorageService
{
    private string $baseUrl;
    private string $serviceRoleKey;
    private string $imageBucket;
    private string $fileBucket;

    public function __construct()
    {
        $this->baseUrl        = rtrim((string) config('services.supabase.url'), '/');
        $this->serviceRoleKey = (string) config('services.supabase.service_role_key');
        $this->imageBucket    = (string) config('services.supabase.image_bucket');
        $this->fileBucket     = (string) config('services.supabase.file_bucket');
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Upload an image file to the images bucket.
     *
     * @param  UploadedFile  $file    The uploaded file from the request.
     * @param  string        $folder  Target folder inside the images bucket (e.g. 'avatars').
     * @return string                 Full public URL of the uploaded file.
     *
     * @throws RuntimeException       On upload failure.
     */
    public function uploadImage(UploadedFile $file, string $folder): string
    {
        return $this->upload($file, $this->imageBucket, $folder);
    }

    /**
     * Upload a non-image file to the files bucket.
     *
     * @param  UploadedFile  $file    The uploaded file from the request.
     * @param  string        $folder  Target folder inside the files bucket (e.g. 'imports').
     * @return string                 Full public URL of the uploaded file.
     *
     * @throws RuntimeException       On upload failure.
     */
    public function uploadFile(UploadedFile $file, string $folder): string
    {
        return $this->upload($file, $this->fileBucket, $folder);
    }

    /**
     * Upload raw binary content (e.g. server-generated thumbnails or PDFs).
     *
     * @param  string  $content    Raw binary string.
     * @param  string  $folder     Target folder inside the bucket.
     * @param  string  $filename   Filename including extension (e.g. 'abc.png').
     * @param  string  $mimeType   MIME type (e.g. 'image/png', 'application/pdf').
     * @param  string  $bucket     Bucket name ('images' or 'files').
     * @return string              Full public URL of the uploaded file.
     *
     * @throws RuntimeException    On upload failure.
     */
    public function uploadRaw(
        string $content,
        string $folder,
        string $filename,
        string $mimeType,
        string $bucket,
    ): string {
        $folder = trim($folder, '/');
        $path   = $folder ? "{$folder}/{$filename}" : $filename;

        $response = Http::withHeaders($this->authHeaders())
            ->withBody($content, $mimeType)
            ->post("{$this->baseUrl}/storage/v1/object/{$bucket}/{$path}");

        if (! $response->successful()) {
            Log::error('Supabase uploadRaw failed', [
                'bucket'   => $bucket,
                'path'     => $path,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);
            throw new RuntimeException(
                "Supabase upload failed [{$response->status()}]: {$response->body()}"
            );
        }

        return $this->publicUrl($bucket, $path);
    }

    /**
     * Delete a file from Supabase Storage by its public URL.
     *
     * Silently ignores URLs that are not from this Supabase project so that
     * legacy local-storage URLs or external URLs are not accidentally processed.
     *
     * @param  string|null  $url  Full Supabase public URL (or any URL — non-Supabase ones are ignored).
     * @return void
     */
    public function delete(?string $url): void
    {
        if (! $url || ! Str::startsWith($url, $this->baseUrl)) {
            return;
        }

        // Extract: /storage/v1/object/public/{bucket}/{path}
        $prefix   = $this->baseUrl . '/storage/v1/object/public/';
        $relative = Str::after($url, $prefix);

        // relative = "{bucket}/{path}"
        $slash  = strpos($relative, '/');
        if ($slash === false) {
            return;
        }
        $bucket = substr($relative, 0, $slash);
        $path   = substr($relative, $slash + 1);

        if (! $bucket || ! $path) {
            return;
        }

        $response = Http::withHeaders($this->authHeaders())
            ->delete("{$this->baseUrl}/storage/v1/object/{$bucket}", [
                'prefixes' => [$path],
            ]);

        if (! $response->successful()) {
            Log::warning('Supabase delete failed (non-fatal)', [
                'url'    => $url,
                'bucket' => $bucket,
                'path'   => $path,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /**
     * Upload an UploadedFile to the given bucket and folder.
     *
     * Auto-generates a UUID filename, preserving the original extension.
     */
    private function upload(UploadedFile $file, string $bucket, string $folder): string
    {
        $extension = strtolower($file->getClientOriginalExtension()) ?: $file->guessExtension() ?: 'bin';
        $filename  = Str::uuid()->toString() . '.' . $extension;
        $folder    = trim($folder, '/');
        $path      = $folder ? "{$folder}/{$filename}" : $filename;
        $mimeType  = $file->getMimeType() ?: 'application/octet-stream';
        $content   = file_get_contents($file->getRealPath());

        if ($content === false) {
            throw new RuntimeException("Could not read uploaded file: {$file->getClientOriginalName()}");
        }

        $response = Http::withHeaders($this->authHeaders())
            ->withBody($content, $mimeType)
            ->post("{$this->baseUrl}/storage/v1/object/{$bucket}/{$path}");

        if (! $response->successful()) {
            Log::error('Supabase upload failed', [
                'bucket'        => $bucket,
                'path'          => $path,
                'original_name' => $file->getClientOriginalName(),
                'status'        => $response->status(),
                'body'          => $response->body(),
            ]);
            throw new RuntimeException(
                "Supabase upload failed [{$response->status()}]: {$response->body()}"
            );
        }

        return $this->publicUrl($bucket, $path);
    }

    /**
     * Build the public URL for a file in Supabase Storage.
     */
    private function publicUrl(string $bucket, string $path): string
    {
        return "{$this->baseUrl}/storage/v1/object/public/{$bucket}/{$path}";
    }

    /**
     * Authorization headers for Supabase REST API calls.
     *
     * @return array<string, string>
     */
    private function authHeaders(): array
    {
        return [
            'Authorization' => "Bearer {$this->serviceRoleKey}",
            'apikey'        => $this->serviceRoleKey,
        ];
    }
}
