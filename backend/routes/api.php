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
use App\Http\Controllers\Api\V1\Admin\FacultyController;
use App\Http\Controllers\Api\V1\Admin\MajorController;
use App\Http\Controllers\Api\V1\Admin\MediaFileController;
use App\Http\Controllers\Api\V1\Admin\NotificationController;
use App\Http\Controllers\Api\V1\Admin\PermissionController;
use App\Http\Controllers\Api\V1\Admin\PostController;
use App\Http\Controllers\Api\V1\Admin\RoleController;
use App\Http\Controllers\Api\V1\Admin\SchoolClassController;
use App\Http\Controllers\Api\V1\Admin\TagController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\User\AcademicController;
use App\Http\Controllers\Api\V1\User\BlogController as UserBlogController;
use App\Http\Controllers\Api\V1\User\ChannelController as UserChannelController;
use App\Http\Controllers\Api\V1\User\ContactController as PublicContactController;
use App\Http\Controllers\Api\V1\User\PostController as UserPostController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\CredentialAuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

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
    Route::post('/auth/register', [CredentialAuthController::class, 'registerUser']);
    Route::post('/auth/login', [CredentialAuthController::class, 'loginUser']);
    Route::post('/auth/admin/login', [CredentialAuthController::class, 'loginAdmin']);
    Route::post('/contacts', [PublicContactController::class, 'store']);
    Route::get('/community/channels', [ChannelController::class, 'index']);

    // Community routes
    Route::prefix('community')->group(function () {
        // Public (read-only, published posts only)
        Route::get('/posts', [UserPostController::class, 'index']);
        Route::get('/posts/{id}', [UserPostController::class, 'show']);
        Route::get('/posts/{id}/comments', [UserPostController::class, 'comments']);
        Route::get('/channels', [UserChannelController::class, 'index']);

        // Public blog routes
        Route::get('/blogs', [UserBlogController::class, 'index']);
        Route::get('/blog-tags', [UserBlogController::class, 'tags']);
        Route::get('/blogs/{slug}', [UserBlogController::class, 'show']);
        Route::get('/blogs/{id}/comments', [UserBlogController::class, 'comments']);

        // Authenticated actions
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/posts', [UserPostController::class, 'store']);
            Route::post('/posts/{id}/reactions', [UserPostController::class, 'react']);
            Route::post('/posts/{id}/comments', [UserPostController::class, 'comment']);
            Route::post('/blogs', [UserBlogController::class, 'store']);
            Route::post('/blogs/{id}/reactions', [UserBlogController::class, 'react']);
            Route::post('/blogs/{id}/comments', [UserBlogController::class, 'comment']);
        });
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
    });

    // user loged in routes
    Route::middleware('auth:sanctum')->group(function () {
        // academic structure
        Route::get('/faculties', [AcademicController::class, 'faculties']);
        Route::get('/majors', [AcademicController::class, 'majors']);
        Route::get('/school-classes', [AcademicController::class, 'schoolClasses']);
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
            Route::get('channels', [ChannelController::class, 'index']);
            Route::post('channels', [ChannelController::class, 'store']);
            Route::put('channels/{channel}', [ChannelController::class, 'update']);
            Route::patch('channels/{channel}', [ChannelController::class, 'update']);
            Route::delete('channels/{channel}', [ChannelController::class, 'destroy']);
        });

        // posts
        Route::middleware('permission:community.posts.view')->group(function () {
            Route::get('posts/stats', [PostController::class, 'stats']);
            Route::get('posts', [PostController::class, 'index']);
        });
        Route::middleware('permission:community.posts.manage')->group(function () {
            Route::patch('posts/{post}/status', [PostController::class, 'updateStatus']);
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
            Route::get('chat-rooms', [ChatRoomController::class, 'index']);
            Route::get('chat-rooms/{room}/system-messages', [ChatRoomController::class, 'systemMessages']);
        });
        Route::middleware('permission:community.chat.manage')->group(function () {
            Route::delete('chat-rooms/{room}/messages/{message}', [ChatRoomController::class, 'destroyMessage']);
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
    });
});
