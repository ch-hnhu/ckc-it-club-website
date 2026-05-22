<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClubInformationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminId = User::where('email', 'hnhu07012004@gmail.com')->value('id')
            ?? User::query()->value('id');

        $clubInformations = [
            [
                'value' => 'club_name',
                'label' => 'Tên câu lạc bộ',
                'slug' => 'club-name',
                'type' => 'text',
                'description' => 'Tên chính thức hiển thị trên website.',
            ],
            [
                'value' => 'club_slogan',
                'label' => 'Slogan câu lạc bộ',
                'slug' => 'club-slogan',
                'type' => 'text',
                'description' => 'Câu khẩu hiệu ngắn dùng ở trang giới thiệu.',
            ],
            [
                'value' => 'club_email',
                'label' => 'Email liên hệ',
                'slug' => 'club-email',
                'type' => 'text',
                'description' => 'Email nhận liên hệ từ sinh viên và đối tác.',
            ],
            [
                'value' => 'about_club',
                'label' => 'Giới thiệu câu lạc bộ',
                'slug' => 'about-club',
                'type' => 'html',
                'description' => 'Nội dung giới thiệu ngắn về CKC IT Club.',
            ],
            [
                'value' => 'club_logo',
                'label' => 'Logo câu lạc bộ',
                'slug' => 'club-logo',
                'type' => 'image',
                'description' => 'Ảnh logo dùng ở header và các trang nhận diện.',
            ],
            [
                'value' => 'home_banners',
                'label' => 'Banner trang chủ',
                'slug' => 'home-banners',
                'type' => 'banner',
                'description' => 'Danh sách banner hiển thị tại trang chủ.',
            ],
            [
                'value' => 'facebook_page',
                'label' => 'Fanpage Facebook',
                'slug' => 'facebook-page',
                'type' => 'url',
                'description' => 'Đường dẫn fanpage chính thức của câu lạc bộ.',
            ],
            [
                'value' => 'recruitment_enabled',
                'label' => 'Cho phép đăng ký thành viên',
                'slug' => 'recruitment-enabled',
                'type' => 'boolean',
                'description' => 'Bật hoặc tắt form đăng ký tham gia câu lạc bộ.',
            ],
        ];

        foreach ($clubInformations as $clubInformation) {
            DB::table('club_informations')->updateOrInsert(
                ['slug' => $clubInformation['slug']],
                [
                    ...$clubInformation,
                    'created_at' => now(),
                    'created_by' => $adminId,
                    'updated_at' => now(),
                    'updated_by' => $adminId,
                    'deleted_at' => null,
                    'deleted_by' => null,
                ]
            );
        }
    }
}
