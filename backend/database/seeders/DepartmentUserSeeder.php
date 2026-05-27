<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartmentUserSeeder extends Seeder
{
    public function run(): void
    {
        $departments = DB::table('departments')->pluck('id', 'slug');
        $students    = User::where('email', 'like', 'student%@gmail.com')
            ->pluck('id')
            ->toArray();

        if ($departments->isEmpty() || empty($students)) {
            return;
        }

        $deptIds = $departments->values()->toArray();

        // Map student index → department slug indices they belong to
        $assignments = [
            0 => [0],       // Ban Học thuật
            1 => [0, 1],    // Ban Học thuật + Truyền thông
            2 => [1],       // Ban Truyền thông
            3 => [1],       // Ban Truyền thông
            4 => [2],       // Ban Tình nguyện
            5 => [2],       // Ban Tình nguyện
            6 => [0, 2],    // Ban Học thuật + Tình nguyện
            7 => [1],       // Ban Truyền thông
            8 => [2],       // Ban Tình nguyện
            9 => [0],       // Ban Học thuật
        ];

        foreach ($assignments as $studentIndex => $deptIndices) {
            if (! isset($students[$studentIndex])) {
                continue;
            }

            $userId = $students[$studentIndex];

            foreach ($deptIndices as $deptIndex) {
                $departmentId = $deptIds[$deptIndex] ?? null;
                if (! $departmentId) {
                    continue;
                }

                DB::table('department_user')->updateOrInsert(
                    ['user_id' => $userId, 'department_id' => $departmentId],
                    [
                        'joined_at'  => now()->subDays(rand(30, 180)),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
