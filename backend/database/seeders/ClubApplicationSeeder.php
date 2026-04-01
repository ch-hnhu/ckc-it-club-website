<?php

namespace Database\Seeders;

use App\Models\ClubApplication;
use App\Models\User;
use Illuminate\Database\Seeder;

class ClubApplicationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'full_name' => 'Administrator',
                'is_active' => true,
            ]
        );

        $studentIds = User::where('email', 'like', 'student%@gmail.com')
            ->orderBy('id')
            ->pluck('id')
            ->all();

        if (empty($studentIds)) {
            for ($i = 1; $i <= 4; $i++) {
                $studentIds[] = User::firstOrCreate(
                    ['email' => "student{$i}@gmail.com"],
                    [
                        'full_name' => "Student {$i}",
                        'student_code' => "CD22000{$i}",
                        'is_active' => true,
                    ]
                )->id;
            }
        }

        $applications = [
            ['status' => 'pending', 'note' => 'Ung tuyen vao ban truyen thong dot 1'],
            ['status' => 'processing', 'note' => 'Ho so dang duoc xem xet'],
            ['status' => 'interview', 'note' => 'Hen phong van vao thu 2'],
            ['status' => 'passed', 'note' => 'Da vuot qua vong phong van'],
            ['status' => 'failed', 'note' => 'Can bo sung ky nang thuc hanh'],
            ['status' => 'pending', 'note' => 'Ung tuyen vao ban ky thuat'],
            ['status' => 'processing', 'note' => 'Dang doi xac nhan thong tin'],
            ['status' => 'interview', 'note' => 'Phong van online luc 19h'],
            ['status' => 'passed', 'note' => 'Du dieu kien tham gia CLB'],
            ['status' => 'failed', 'note' => 'Chua phu hop voi dot tuyen nay'],
        ];

        foreach ($applications as $index => $application) {
            $createdBy = $studentIds[$index % count($studentIds)];
            $createdAt = now()->subDays(10 - $index);

            ClubApplication::updateOrCreate(
                ['note' => $application['note']],
                [
                    'status' => $application['status'],
                    'created_by' => $createdBy,
                    'updated_by' => $admin->id,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt->copy()->addHours(4),
                ]
            );
        }
    }
}
