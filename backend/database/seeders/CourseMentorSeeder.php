<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CourseMentorSeeder extends Seeder
{
    public function run(): void
    {
        $mentorIds = User::whereIn('email', [
            'academichead@gmail.com',
            'student1@gmail.com',
        ])->pluck('id');

        if ($mentorIds->isEmpty()) {
            return;
        }

        $courseIds = DB::table('courses')->where('status', 'published')->pluck('id');

        foreach ($courseIds as $courseId) {
            foreach ($mentorIds as $mentorId) {
                DB::table('course_mentors')->insertOrIgnore([
                    'course_id' => $courseId,
                    'user_id'   => $mentorId,
                ]);
            }
        }
    }
}
