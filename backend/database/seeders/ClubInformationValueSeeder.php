<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClubInformationValueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminId = User::where('email', 'hnhu07012004@gmail.com')->value('id')
            ?? User::query()->value('id');

        $clubInformationIds = DB::table('club_informations')
            ->whereIn('slug', [
                'club-name',
                'club-slogan',
                'club-email',
                'about-club',
                'club-logo',
                'home-banners',
                'facebook-page',
                'recruitment-enabled',
                'auto-send-mail-recruitment',
            ])
            ->pluck('id', 'slug');

        $values = [
            [
                'slug' => 'club-name',
                'value' => 'CKC IT Club',
                'link' => null,
                'alt' => null,
                'position' => null,
            ],
            [
                'slug' => 'club-slogan',
                'value' => 'Kết nối đam mê, kiến tạo công nghệ',
                'link' => null,
                'alt' => null,
                'position' => null,
            ],
            [
                'slug' => 'club-email',
                'value' => 'itclub@caothang.edu.vn',
                'link' => 'mailto:itclub@caothang.edu.vn',
                'alt' => null,
                'position' => null,
            ],
            [
                'slug' => 'about-club',
                'value' => 'CKC IT Club là môi trường học tập, chia sẻ và thực hành công nghệ.',
                'link' => null,
                'alt' => null,
                'position' => null,
            ],
            [
                'slug' => 'club-logo',
                'value' => '/images/club/logo-ckc-it-club.png',
                'link' => '/',
                'alt' => 'Logo CKC IT Club',
                'position' => null,
            ],
            [
                'slug' => 'home-banners',
                'value' => '/images/club/banner-workshop.png',
                'link' => '/events',
                'alt' => 'Workshop công nghệ CKC IT Club',
                'position' => 1,
            ],
            [
                'slug' => 'home-banners',
                'value' => '/images/club/banner-recruitment.png',
                'link' => '/recruitment',
                'alt' => 'Tuyển thành viên CKC IT Club',
                'position' => 2,
            ],
            [
                'slug' => 'facebook-page',
                'value' => 'https://www.facebook.com/itclub.caothang',
                'link' => 'https://www.facebook.com/itclub.caothang',
                'alt' => 'Facebook CKC IT Club',
                'position' => null,
            ],
            [
                'slug' => 'recruitment-enabled',
                'value' => 'true',
                'link' => null,
                'alt' => null,
                'position' => null,
            ],
            [
                'slug' => 'auto-send-mail-recruitment',
                'value' => 'false',
                'link' => null,
                'alt' => null,
                'position' => null,
            ],
        ];

        foreach ($values as $item) {
            $clubInformationId = $clubInformationIds[$item['slug']] ?? null;

            if (! $clubInformationId) {
                continue;
            }

            DB::table('club_information_values')->updateOrInsert(
                [
                    'club_information_id' => $clubInformationId,
                    'value' => $item['value'],
                ],
                [
                    'link' => $item['link'],
                    'alt' => $item['alt'],
                    'position' => $item['position'],
                    'is_active' => true,
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
