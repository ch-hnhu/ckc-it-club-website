<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            UserSeeder::class,
            ClubInformationSeeder::class,
            ClubInformationValueSeeder::class,
            DepartmentSeeder::class,
            DepartmentUserSeeder::class,
            FacultySeeder::class,
            MajorSeeder::class,
            SchoolClassSeeder::class,
            ContactSeeder::class,
            ApplicationQuestionSeeder::class,
            ApplicationQuestionOptionSeeder::class,
            ClubApplicationSeeder::class,
            ApplicationAnswerSeeder::class,
            ChannelSeeder::class,
            TagSeeder::class,
            PostSeeder::class,
            BlogSeeder::class,
            CommentSeeder::class,
            ReactionSeeder::class,
            MediaFileSeeder::class,
            ChatRoomSeeder::class,
            SkillSeeder::class,
            MailTemplateSeeder::class,
            EventSeeder::class,
            RankSeeder::class,
            PointRuleSeeder::class,
        ]);
    }
}
