<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $adminId = DB::table('users')->value('id');

        $exists = DB::table('club_informations')
            ->where('slug', 'auto-send-mail-recruitment')
            ->exists();

        if (! $exists) {
            $infoId = DB::table('club_informations')->insertGetId([
                'value' => 'auto_send_mail_recruitment',
                'label' => 'Tự động gửi mail khi cập nhật đơn tuyển',
                'slug' => 'auto-send-mail-recruitment',
                'type' => 'boolean',
                'description' => 'Bật hoặc tắt tính năng tự động gửi email cho ứng viên khi trạng thái đơn ứng tuyển được cập nhật.',
                'created_at' => now(),
                'created_by' => $adminId,
                'updated_at' => now(),
                'updated_by' => $adminId,
            ]);

            DB::table('club_information_values')->insert([
                'club_information_id' => $infoId,
                'value' => 'false',
                'link' => null,
                'alt' => null,
                'position' => null,
                'is_active' => true,
                'created_at' => now(),
                'created_by' => $adminId,
                'updated_at' => now(),
                'updated_by' => $adminId,
            ]);
        }
    }

    public function down(): void
    {
        $info = DB::table('club_informations')
            ->where('slug', 'auto-send-mail-recruitment')
            ->first();

        if ($info) {
            DB::table('club_information_values')
                ->where('club_information_id', $info->id)
                ->delete();
            DB::table('club_informations')->where('id', $info->id)->delete();
        }
    }
};
