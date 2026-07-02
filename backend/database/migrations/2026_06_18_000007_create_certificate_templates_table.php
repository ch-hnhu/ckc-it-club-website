<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Thiết kế canvas kéo-thả (Canva-style): { canvas:{...}, elements:[...] }.
            // Renderer (Browsershot) dựng lại scene này với dữ liệu thật khi cấp chứng chỉ.
            $table->json('design');
            $table->string('thumbnail')->nullable(); // ảnh preview để admin chọn
            $table->boolean('is_default')->default(false);
            $table->foreignId('created_by')->constrained('users');

            $table->timestamps();
        });

        // courses.certificate_template_id được khai báo (chưa có FK) ở create_courses_table vì
        // bảng này chưa tồn tại lúc đó — gắn FK thật ở đây, sau khi certificate_templates đã có.
        Schema::table('courses', function (Blueprint $table) {
            $table->foreign('certificate_template_id')->references('id')->on('certificate_templates')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['certificate_template_id']);
        });

        Schema::dropIfExists('certificate_templates');
    }
};
