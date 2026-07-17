<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'CKC IT Club API',
    description: 'REST API cho hệ thống quản lý CLB Tin học CKC: xác thực, hồ sơ thành viên, đơn xin gia nhập, cộng đồng (bài viết/blog/bình luận/chat), khoá học & chứng chỉ, sự kiện, gamification và quản trị.',
)]
#[OA\Server(
    url: '/api',
    description: 'API server (relative to current host)'
)]
#[OA\Tag(name: 'Auth', description: 'Đăng nhập, đăng ký, quên mật khẩu, phiên đăng nhập')]
#[OA\Tag(name: 'User Profile', description: 'Hồ sơ cá nhân, theo dõi (follow) thành viên')]
#[OA\Tag(name: 'Club Application', description: 'Đơn xin gia nhập CLB (phía user và phía admin duyệt đơn)')]
#[OA\Tag(name: 'Learning - Courses (User)', description: 'Khoá học, bài học, quiz, chứng chỉ (phía học viên)')]
#[OA\Tag(name: 'Learning - Courses (Admin)', description: 'Quản trị khoá học, bài học, quiz, mẫu chứng chỉ')]
class OpenApiSpec {}
