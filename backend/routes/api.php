<?php

use App\Http\Controllers\Api\V1\Admin\AcademicStructureController;
use App\Http\Controllers\Api\V1\Admin\ApplicationQuestionController;
use App\Http\Controllers\Api\V1\Admin\BlogController;
use App\Http\Controllers\Api\V1\Admin\ChannelController;
use App\Http\Controllers\Api\V1\Admin\ChatRoomController;
use App\Http\Controllers\Api\V1\Admin\ClubApplicationController;
use App\Http\Controllers\Api\V1\Admin\ClubInformationController;
use App\Http\Controllers\Api\V1\Admin\CommentController;
use App\Http\Controllers\Api\V1\Admin\ContactController as AdminContactController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\DepartmentController;
use App\Http\Controllers\Api\V1\Admin\EventController as AdminEventController;
use App\Http\Controllers\Api\V1\Admin\FacultyController;
use App\Http\Controllers\Api\V1\Admin\MajorController;
use App\Http\Controllers\Api\V1\Admin\MediaFileController;
use App\Http\Controllers\Api\V1\Admin\NotificationController;
use App\Http\Controllers\Api\V1\Admin\PermissionController;
use App\Http\Controllers\Api\V1\Admin\PostController;
use App\Http\Controllers\Api\V1\Admin\BlogReportController;
use App\Http\Controllers\Api\V1\Admin\MailTemplateController;
use App\Http\Controllers\Api\V1\Admin\ReportController;
use App\Http\Controllers\Api\V1\Admin\UnifiedReportController;
use App\Http\Controllers\Api\V1\Admin\RoleController;
use App\Http\Controllers\Api\V1\Admin\SchoolClassController;
use App\Http\Controllers\Api\V1\Admin\SkillController;
use App\Http\Controllers\Api\V1\Admin\TagController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\User\AcademicController;
use App\Http\Controllers\Api\V1\User\BlogController as UserBlogController;
use App\Http\Controllers\Api\V1\User\ChannelController as UserChannelController;
use App\Http\Controllers\Api\V1\User\ChatController as UserChatController;
use App\Http\Controllers\Api\V1\User\ClubApplicationController as UserClubApplicationController;
use App\Http\Controllers\Api\V1\User\ContactController as PublicContactController;
use App\Http\Controllers\Api\V1\User\EventController as UserEventController;
use App\Http\Controllers\Api\V1\User\PostController as UserPostController;
use App\Http\Controllers\Api\V1\User\FollowController;
use App\Http\Controllers\Api\V1\User\ProfileController;
use App\Http\Controllers\Api\V1\User\UserNotificationController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\CredentialAuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\RegisterVerificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // WebSocket private-channel auth — must use auth:sanctum (Bearer token),
    // NOT the default BroadcastServiceProvider route which uses web/session middleware.
    Route::post('/broadcasting/auth', function (\Illuminate\Http\Request $request) {
        return \Illuminate\Support\Facades\Broadcast::auth($request);
    })->middleware('auth:sanctum');

    // public routes
    Route::get('/health', function () {
        return response()->json([
            'success' => true,
            'message' => 'API is running',
            'version' => 'v1',
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    Route::get('/auth/verify-token', [AuthController::class, 'verifyToken']);
    Route::post('/auth/login', [CredentialAuthController::class, 'loginUser']);
    Route::post('/auth/admin/login', [CredentialAuthController::class, 'loginAdmin']);
    Route::post('/contacts', [PublicContactController::class, 'store']);
    Route::get('/community/channels', [ChannelController::class, 'index']);

    // Public club config — returns the active value for a given slug (no auth required)
    Route::get('/club-config/{slug}', function (string $slug) {
        $info = \App\Models\ClubInformation::where('slug', $slug)->first();
        if (! $info) {
            return response()->json(['success' => false, 'data' => null, 'message' => 'Config not found.'], 404);
        }
        $activeValue = $info->clubInformationValues()->where('is_active', true)->orderBy('position')->first();
        return response()->json([
            'success' => true,
            'data'    => ['value' => $activeValue?->value, 'type' => $info->type],
        ]);
    });
    Route::get('/users/profile/{username}', [ProfileController::class, 'showPublic']);
    Route::get('/users/{username}/followers', [FollowController::class, 'followers']);
    Route::get('/users/{username}/following', [FollowController::class, 'following']);

    // Community routes
    Route::prefix('community')->group(function () {
        // Public (read-only, published posts only)
        Route::get('/posts', [UserPostController::class, 'index']);
        Route::get('/posts/{id}/comments', [UserPostController::class, 'comments']);
        Route::get('/posts/{id}/reactions/users', [UserPostController::class, 'reactors']);
        Route::get('/channels', [UserChannelController::class, 'index']);

        // Public blog routes
        Route::get('/blogs', [UserBlogController::class, 'index']);
        Route::get('/blog-tags', [UserBlogController::class, 'tags']);
        Route::get('/blogs/{id}/comments', [UserBlogController::class, 'comments']);
        Route::get('/blogs/{id}/reactions/users', [UserBlogController::class, 'reactors']);

        // Public event routes (avoid collision with admin /v1/events resource routes)
        Route::get('/events', [UserEventController::class, 'index']);
        Route::get('/events/{event:slug}', [UserEventController::class, 'show']);
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/events/{event}/register', [UserEventController::class, 'register']);
            Route::delete('/events/{event}/register', [UserEventController::class, 'cancelRegistration']);
            Route::get('/events/{event}/my-ticket', [UserEventController::class, 'myTicket']);
        });

        // Chat rooms (public list, auth for messages, admin-only create)
        Route::get('/chat-rooms', [UserChatController::class, 'index']);
        Route::middleware('auth:sanctum')->group(function () {
            Route::middleware('permission:community.chat.manage')
                ->post('/chat-rooms', [UserChatController::class, 'store']);
            Route::get('/chat-rooms/{room}/messages', [UserChatController::class, 'messages']);
            Route::get('/chat-rooms/{room}/poll', [UserChatController::class, 'poll']);
            Route::post('/chat-rooms/{room}/messages', [UserChatController::class, 'send']);
        });

        // Authenticated actions
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/posts/bookmarks', [UserPostController::class, 'bookmarks']);
            Route::get('/posts/archived', [UserPostController::class, 'archived']);
            Route::post('/posts', [UserPostController::class, 'store']);
            Route::patch('/posts/{id}', [UserPostController::class, 'update']);
            Route::delete('/posts/{id}', [UserPostController::class, 'destroy']);
            Route::post('/posts/{id}/reactions', [UserPostController::class, 'react']);
            Route::post('/posts/{id}/comments', [UserPostController::class, 'comment']);
            Route::post('/comments/{id}/reactions', [UserPostController::class, 'reactComment']);
            Route::post('/posts/{id}/bookmark', [UserPostController::class, 'bookmark']);
            Route::post('/posts/{id}/report', [UserPostController::class, 'report']);
            Route::post('/blogs', [UserBlogController::class, 'store']);
            Route::get('/blogs/bookmarks', [UserBlogController::class, 'bookmarks']);
            Route::get('/blogs/my-drafts', [UserBlogController::class, 'myDraftBlogs']);
            Route::patch('/blogs/{slug}', [UserBlogController::class, 'update']);
            Route::post('/blogs/{slug}/update', [UserBlogController::class, 'update']);
            Route::get('/blogs/archived', [UserBlogController::class, 'archived']);
            Route::post('/blogs/{id}/reactions', [UserBlogController::class, 'react']);
            Route::post('/blogs/{id}/bookmark', [UserBlogController::class, 'bookmark']);
            Route::post('/blogs/{id}/comments', [UserBlogController::class, 'comment']);
            Route::post('/blogs/{id}/pin', [UserBlogController::class, 'pin']);
            Route::post('/blogs/{id}/archive', [UserBlogController::class, 'archive']);
            Route::post('/blogs/{id}/visibility', [UserBlogController::class, 'updateVisibility']);
            Route::post('/blogs/{id}/report', [UserBlogController::class, 'report']);
            Route::delete('/blogs/{id}', [UserBlogController::class, 'destroy']);
        });

        // Wildcard routes registered last to avoid masking specific paths above
        Route::get('/posts/{id}', [UserPostController::class, 'show']);
        Route::get('/blogs/{slug}', [UserBlogController::class, 'show']);
        Route::post('/blogs/{slug}/view', [UserBlogController::class, 'recordView']);
    });

    // Registration with OTP verification (throttled: 5 attempts per minute per IP)
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/auth/register', [RegisterVerificationController::class, 'sendOtp']);
        Route::post('/auth/register/verify-otp', [RegisterVerificationController::class, 'verifyOtp']);
    });

    // Forgot password (throttled: 5 attempts per minute per IP)
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/auth/forgot-password', [ForgotPasswordController::class, 'sendOtp']);
        Route::post('/auth/verify-otp', [ForgotPasswordController::class, 'verifyOtp']);
        Route::post('/auth/reset-password', [ForgotPasswordController::class, 'resetPassword']);
    });

    // auth
    Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // user logged-in routes
    Route::middleware('auth:sanctum')->group(function () {
        // user notifications (realtime + REST)
        Route::prefix('user-notifications')->group(function () {
            Route::get('/', [UserNotificationController::class, 'index']);
            Route::get('/unread-count', [UserNotificationController::class, 'unreadCount']);
            Route::patch('/read-all', [UserNotificationController::class, 'markAllAsRead']);
            Route::patch('/{id}/read', [UserNotificationController::class, 'markAsRead']);
        });
        // club applications (user-facing)
        Route::get('/user/application-questions', [UserClubApplicationController::class, 'questions']);
        Route::get('/user/club-applications/me', [UserClubApplicationController::class, 'myApplication']);
        Route::post('/user/club-applications', [UserClubApplicationController::class, 'store']);

        // academic structure
        Route::prefix('academic')->group(function () {
            Route::get('/faculties', [AcademicController::class, 'faculties']);
            Route::get('/majors', [AcademicController::class, 'majors']);
            Route::get('/school-classes', [AcademicController::class, 'schoolClasses']);
        });

        // user profile
        Route::prefix('users')->group(function () {
            Route::get('/skills', [ProfileController::class, 'skills']);
            Route::get('/check-username', [ProfileController::class, 'checkUsername']);
            Route::get('/check-school-student', [ProfileController::class, 'checkSchoolStudent']);
            Route::get('/profile', [ProfileController::class, 'show']);
            Route::post('/profile', [ProfileController::class, 'update']);
            Route::delete('/account', [ProfileController::class, 'deleteAccount']);
            Route::post('/{username}/follow', [FollowController::class, 'toggle']);
        });
    });

    // admin routes
    Route::middleware(['auth:sanctum', 'permission:admin_panel.access'])->group(function () {

        // dashboard
        Route::middleware('permission:dashboard.view')
            ->get('/', [DashboardController::class, 'index']);

        // notifications (personal)
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
            Route::patch('/read-all', [NotificationController::class, 'markAllAsRead']);
            Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
        });

        // notifications (admin log)
        Route::middleware('permission:community.notifications.send')->group(function () {
            Route::get('notifications/admin-stats', [NotificationController::class, 'adminStats']);
            Route::get('notifications/log', [NotificationController::class, 'log']);
            Route::delete('notifications/{id}/admin', [NotificationController::class, 'adminDestroy']);
        });

        // users
        Route::middleware('permission:users.view')->group(function () {
            Route::get('users', [UserController::class, 'index']);
            Route::get('users/{user}', [UserController::class, 'show']);
        });
        Route::middleware('permission:users.create')
            ->post('users', [UserController::class, 'store']);
        Route::middleware('permission:users.update')->group(function () {
            Route::put('users/{user}', [UserController::class, 'update']);
            Route::patch('users/{user}', [UserController::class, 'update']);
        });
        Route::middleware('permission:users.delete')
            ->delete('users/{user}', [UserController::class, 'destroy']);

        // roles
        Route::middleware('permission:roles.view')->group(function () {
            Route::get('roles', [RoleController::class, 'index']);
            Route::get('roles/{role}', [RoleController::class, 'show']);
        });
        Route::middleware('permission:roles.manage')->group(function () {
            Route::post('roles', [RoleController::class, 'store']);
            Route::put('roles/{role}', [RoleController::class, 'update']);
            Route::patch('roles/{role}', [RoleController::class, 'update']);
            Route::delete('roles/{role}', [RoleController::class, 'destroy']);
            Route::post('roles/{role}/permissions', [RoleController::class, 'syncPermissions']);
        });

        // permissions
        Route::middleware('permission:permissions.view')
            ->get('permissions', [PermissionController::class, 'index']);
        Route::middleware('permission:permissions.manage')
            ->put('permissions/{permission}/roles', [PermissionController::class, 'syncRoles']);

        // club-informations
        Route::middleware('permission:club_info.view')->group(function () {
            Route::get('club-informations', [ClubInformationController::class, 'index']);
            Route::get('club-informations/{clubInformation}', [ClubInformationController::class, 'show']);
        });
        Route::middleware('permission:club_info.manage')->group(function () {
            Route::post('club-informations', [ClubInformationController::class, 'store']);
            Route::put('club-informations/{clubInformation}', [ClubInformationController::class, 'update']);
            Route::patch('club-informations/{clubInformation}', [ClubInformationController::class, 'update']);

            Route::post('club-informations/{clubInformation}/values', [ClubInformationController::class, 'storeValue']);
            Route::patch('club-informations/{clubInformation}/values/{clubInformationValue}/default', [ClubInformationController::class, 'setDefaultValue']);
            Route::put('club-informations/{clubInformation}/values/{clubInformationValue}', [ClubInformationController::class, 'updateValue']);
            Route::patch('club-informations/{clubInformation}/values/{clubInformationValue}', [ClubInformationController::class, 'updateValue']);
            Route::delete('club-informations/{clubInformation}/values/{clubInformationValue}', [ClubInformationController::class, 'destroyValue']);
        });

        // contacts
        Route::middleware('permission:contacts.view')->group(function () {
            Route::get('contacts/stats', [AdminContactController::class, 'stats']);
            Route::get('contacts', [AdminContactController::class, 'index']);
        });
        Route::middleware('permission:contacts.manage')->group(function () {
            Route::patch('contacts/{contact}/status', [AdminContactController::class, 'updateStatus']);
            Route::delete('contacts/{contact}', [AdminContactController::class, 'destroy']);
        });

        // departments
        Route::middleware('permission:club_info.view')->group(function () {
            Route::get('departments', [DepartmentController::class, 'index']);
            Route::get('departments/trash', [DepartmentController::class, 'trash']);
            Route::get('departments/{department}', [DepartmentController::class, 'show']);
        });
        Route::middleware('permission:club_info.manage')->group(function () {
            Route::post('departments', [DepartmentController::class, 'store']);
            Route::put('departments/{department}', [DepartmentController::class, 'update']);
            Route::patch('departments/{department}', [DepartmentController::class, 'update']);
            Route::delete('departments/{department}', [DepartmentController::class, 'destroy']);
            Route::patch('departments/{department}/restore', [DepartmentController::class, 'restore']);
            Route::delete('departments/{department}/force', [DepartmentController::class, 'forceDestroy']);
            Route::post('departments/{department}/users', [DepartmentController::class, 'storeUser']);
            Route::patch('departments/{department}/users/{user}', [DepartmentController::class, 'updateUserRole']);
            Route::delete('departments/{department}/users/{user}', [DepartmentController::class, 'destroyUser']);
        });

        // club applications
        Route::middleware('permission:applications.view')
            ->get('club-applications', [ClubApplicationController::class, 'index']);
        Route::middleware('permission:applications.manage')
            ->patch('club-applications/{clubApplication}/status', [ClubApplicationController::class, 'updateStatus']);

        // application questions
        Route::middleware('permission:application_questions.view')->group(function () {
            Route::get('application-questions', [ApplicationQuestionController::class, 'index']);
            Route::get('application-questions/{applicationQuestion}', [ApplicationQuestionController::class, 'show']);
        });
        Route::middleware('permission:application_questions.manage')->group(function () {
            Route::patch('application-questions/reorder', [ApplicationQuestionController::class, 'reorder']);
            Route::post('application-questions', [ApplicationQuestionController::class, 'store']);
            Route::put('application-questions/{applicationQuestion}', [ApplicationQuestionController::class, 'update']);
            Route::patch('application-questions/{applicationQuestion}', [ApplicationQuestionController::class, 'update']);
            Route::delete('application-questions/{applicationQuestion}', [ApplicationQuestionController::class, 'destroy']);
        });

        // academic structure
        Route::middleware('permission:academic_structure.import')->group(function () {
            Route::post('academic-structure/import', [AcademicStructureController::class, 'import']);
        });
        Route::middleware('permission:academic_data.view')->group(function () {
            Route::get('academic-structure/imports/stats', [AcademicStructureController::class, 'stats']);
            Route::get('academic-structure/imports', [AcademicStructureController::class, 'index']);
            Route::get('academic-structure/imports/{academicStructureImport}/download', [AcademicStructureController::class, 'download']);
            Route::get('faculties/trash', [FacultyController::class, 'trash']);
            Route::apiResource('faculties', FacultyController::class)->except(['create', 'edit', 'store', 'update', 'destroy']);
            Route::get('majors/trash', [MajorController::class, 'trash']);
            Route::apiResource('majors', MajorController::class)->except(['create', 'edit', 'store', 'update', 'destroy']);
            Route::get('school-classes/trash', [SchoolClassController::class, 'trash']);
            Route::apiResource('school-classes', SchoolClassController::class)->except(['create', 'edit', 'store', 'update', 'destroy']);
        });
        Route::middleware('permission:academic_structure.import')->group(function () {
            Route::post('faculties/bulk-delete', [FacultyController::class, 'bulkDestroy']);
            Route::patch('faculties/{faculty}/restore', [FacultyController::class, 'restore']);
            Route::delete('faculties/{faculty}/force', [FacultyController::class, 'forceDestroy']);
            Route::apiResource('faculties', FacultyController::class)->only(['store', 'update', 'destroy']);
            Route::patch('majors/{major}/restore', [MajorController::class, 'restore']);
            Route::delete('majors/{major}/force', [MajorController::class, 'forceDestroy']);
            Route::apiResource('majors', MajorController::class)->only(['store', 'update', 'destroy']);
            Route::patch('school-classes/{schoolClass}/restore', [SchoolClassController::class, 'restore']);
            Route::delete('school-classes/{schoolClass}/force', [SchoolClassController::class, 'forceDestroy']);
            Route::apiResource('school-classes', SchoolClassController::class)->only(['store', 'update', 'destroy']);
        });

        // channels
        Route::middleware('permission:community.channels.manage')->group(function () {
            Route::get('channels/trash', [ChannelController::class, 'trash']);
            Route::get('channels', [ChannelController::class, 'index']);
            Route::post('channels', [ChannelController::class, 'store']);
            Route::put('channels/{channel}', [ChannelController::class, 'update']);
            Route::patch('channels/{channel}', [ChannelController::class, 'update']);
            Route::delete('channels/{channel}', [ChannelController::class, 'destroy']);
            Route::patch('channels/{id}/restore', [ChannelController::class, 'restore']);
            Route::delete('channels/{id}/force-delete', [ChannelController::class, 'forceDestroy']);
        });

        // posts
        Route::middleware('permission:community.posts.view')->group(function () {
            Route::get('posts/stats', [PostController::class, 'stats']);
            Route::get('posts/trash', [PostController::class, 'trash']);
            Route::get('posts', [PostController::class, 'index']);
        });
        Route::middleware('permission:community.posts.manage')->group(function () {
            Route::post('posts/bulk-delete', [PostController::class, 'bulkDestroy']);
            Route::patch('posts/{post}/status', [PostController::class, 'updateStatus']);
            Route::patch('posts/{post}/restore', [PostController::class, 'restore']);
            Route::delete('posts/{id}/force-delete', [PostController::class, 'forceDestroy']);
            Route::delete('posts/{post}', [PostController::class, 'destroy']);
        });

        // blogs
        Route::middleware('permission:community.blogs.view')->group(function () {
            Route::get('blogs/stats', [BlogController::class, 'stats']);
            Route::get('blogs', [BlogController::class, 'index']);
            Route::get('blogs/{blog}', [BlogController::class, 'show']);
        });
        Route::middleware('permission:community.blogs.manage')->group(function () {
            Route::post('blogs', [BlogController::class, 'store']);
            Route::patch('blogs/{blog}/status', [BlogController::class, 'updateStatus']);
            Route::patch('blogs/{blog}/highlight', [BlogController::class, 'toggleHighlight']);
            Route::delete('blogs/{blog}', [BlogController::class, 'destroy']);
        });

        // comments
        Route::middleware('permission:community.comments.view')->group(function () {
            Route::get('comments/stats', [CommentController::class, 'stats']);
            Route::get('comments', [CommentController::class, 'index']);
        });
        Route::middleware('permission:community.comments.manage')->group(function () {
            Route::patch('comments/{comment}/visibility', [CommentController::class, 'updateVisibility']);
            Route::delete('comments/{comment}', [CommentController::class, 'destroy']);
        });

        // chat rooms
        Route::middleware('permission:community.chat.view')->group(function () {
            Route::get('chat-rooms/stats', [ChatRoomController::class, 'stats']);
            Route::get('chat-rooms/trash', [ChatRoomController::class, 'trash']);
            Route::get('chat-rooms', [ChatRoomController::class, 'index']);
            Route::get('chat-rooms/{room}/system-messages', [ChatRoomController::class, 'systemMessages']);
        });
        Route::middleware('permission:community.chat.manage')->group(function () {
            Route::post('chat-rooms', [ChatRoomController::class, 'store']);
            Route::put('chat-rooms/{room}', [ChatRoomController::class, 'update']);
            Route::patch('chat-rooms/{room}', [ChatRoomController::class, 'update']);
            Route::delete('chat-rooms/{room}', [ChatRoomController::class, 'destroy']);
            Route::delete('chat-rooms/{room}/messages/{message}', [ChatRoomController::class, 'destroyMessage']);
            Route::patch('chat-rooms/{id}/restore', [ChatRoomController::class, 'restore']);
            Route::delete('chat-rooms/{id}/force-delete', [ChatRoomController::class, 'forceDestroy']);
        });

        // tags
        Route::middleware('permission:community.tags.manage')->group(function () {
            Route::get('tags', [TagController::class, 'index']);
            Route::post('tags', [TagController::class, 'store']);
            Route::put('tags/{tag}', [TagController::class, 'update']);
            Route::patch('tags/{tag}', [TagController::class, 'update']);
            Route::delete('tags/{tag}', [TagController::class, 'destroy']);
        });

        // media files
        Route::middleware('permission:community.media.view')->group(function () {
            Route::get('media-files/stats', [MediaFileController::class, 'stats']);
            Route::get('media-files', [MediaFileController::class, 'index']);
            Route::delete('media-files/{mediaFile}', [MediaFileController::class, 'destroy']);
        });

        // skills
        Route::middleware('permission:community.skills.manage')->group(function () {
            Route::get('skills', [SkillController::class, 'index']);
            Route::post('skills', [SkillController::class, 'store']);
            Route::patch('skills/reorder', [SkillController::class, 'reorder']);
            Route::put('skills/{skill}', [SkillController::class, 'update']);
            Route::patch('skills/{skill}', [SkillController::class, 'update']);
            Route::patch('skills/{skill}/toggle-status', [SkillController::class, 'toggleStatus']);
            Route::delete('skills/{skill}', [SkillController::class, 'destroy']);
        });

        // events (admin)
        Route::middleware('permission:events.view')->group(function () {
            Route::get('events/stats', [AdminEventController::class, 'stats']);
            Route::get('events', [AdminEventController::class, 'index']);
            Route::get('events/{event}', [AdminEventController::class, 'show']);
        });
        Route::middleware('permission:events.manage')->group(function () {
            Route::post('events', [AdminEventController::class, 'store']);
            Route::put('events/{event}', [AdminEventController::class, 'update']);
            Route::patch('events/{event}', [AdminEventController::class, 'update']);
            Route::patch('events/{event}/status', [AdminEventController::class, 'updateStatus']);
            Route::delete('events/{event}', [AdminEventController::class, 'destroy']);
        });

        // post reports
        Route::middleware('permission:community.reports.view')->group(function () {
            Route::get('reports/stats', [ReportController::class, 'stats']);
            Route::get('reports', [ReportController::class, 'index']);
            Route::patch('reports/{report}/status', [ReportController::class, 'updateStatus']);
            Route::post('reports/{report}/hide-post', [ReportController::class, 'hidePost']);
        });

        // blog reports
        Route::middleware('permission:community.reports.view')->group(function () {
            Route::get('blog-reports/stats', [BlogReportController::class, 'stats']);
            Route::get('blog-reports', [BlogReportController::class, 'index']);
            Route::patch('blog-reports/{report}/status', [BlogReportController::class, 'updateStatus']);
            Route::post('blog-reports/{report}/hide-blog', [BlogReportController::class, 'hideBlog']);
        });

        // unified reports (post + blog)
        Route::middleware('permission:community.reports.view')->group(function () {
            Route::get('unified-reports/stats', [UnifiedReportController::class, 'stats']);
            Route::get('unified-reports', [UnifiedReportController::class, 'index']);
            Route::patch('unified-reports/{type}/{id}/status', [UnifiedReportController::class, 'updateStatus']);
            Route::post('unified-reports/{type}/{id}/hide', [UnifiedReportController::class, 'hideContent']);
            Route::post('unified-reports/{type}/{id}/dismiss', [UnifiedReportController::class, 'dismiss']);
        });

        // mail templates
        Route::middleware('permission:mail_templates.view')->group(function () {
            Route::get('mail-template-types', [MailTemplateController::class, 'index']);
            Route::get('mail-template-types/{typeId}', [MailTemplateController::class, 'show']);
            Route::get('mail-settings/email-notification', [MailTemplateController::class, 'getEmailNotificationSetting']);
        });
        Route::middleware('permission:mail_templates.manage')->group(function () {
            Route::post('mail-template-types/{typeId}/templates', [MailTemplateController::class, 'storeTemplate']);
            Route::put('mail-template-types/{typeId}/templates/{templateId}', [MailTemplateController::class, 'updateTemplate']);
            Route::patch('mail-template-types/{typeId}/templates/{templateId}/default', [MailTemplateController::class, 'setDefaultTemplate']);
            Route::delete('mail-template-types/{typeId}/templates/{templateId}', [MailTemplateController::class, 'destroyTemplate']);
            Route::patch('mail-settings/email-notification', [MailTemplateController::class, 'toggleEmailNotification']);
        });
    });
});
