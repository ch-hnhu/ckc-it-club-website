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
            ResourceSeeder::class,
            CommentSeeder::class,
            ReactionSeeder::class,
            MediaFileSeeder::class,
            ChatRoomSeeder::class,
            SkillSeeder::class,
            MailTemplateSeeder::class,
            EventSeeder::class,
            RankSeeder::class,
            PointRuleSeeder::class,
            QuestionTypeSeeder::class,
            LearningCenterSeeder::class,
            CertificateTemplateSeeder::class,
            CourseCertificateTestSeeder::class,

            // ── Dữ liệu demo bổ sung (hồ sơ, gamification, ProjectHub, kiểm duyệt AI) ──
            UserSkillSeeder::class,
            UserFollowSeeder::class,
            BookmarkSeeder::class,
            CourseMentorSeeder::class,
            PointTransactionSeeder::class,
            ProjectHubSeeder::class,
            ModerationDemoSeeder::class,
        ]);
    }
}
