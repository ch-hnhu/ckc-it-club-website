<?php

use App\Http\Controllers\Api\V1\Admin\NotificationController;
use App\Http\Controllers\Api\V1\Admin\PermissionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Admin\ClubInformationController;
use App\Http\Controllers\Api\V1\User\ContactController as PublicContactController;
use App\Http\Controllers\Api\V1\Admin\ContactController as AdminContactController;
use App\Http\Controllers\Api\V1\Admin\ApplicationQuestionController;
use App\Http\Controllers\Api\V1\Admin\AcademicStructureController;
use App\Http\Controllers\Api\V1\Admin\ClubApplicationController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\DepartmentController;
use App\Http\Controllers\Api\V1\Admin\FacultyController;
use App\Http\Controllers\Api\V1\Admin\MajorController;
use App\Http\Controllers\Api\V1\Admin\RoleController;
use App\Http\Controllers\Api\V1\Admin\SchoolClassController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\CredentialAuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;

Route::prefix('v1')->group(function () {

    // public
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

    // admin routes
    Route::middleware(['auth:sanctum', 'permission:admin_panel.access'])->group(function () {

        // dashboard
        Route::middleware('permission:dashboard.view')
            ->get('/', [DashboardController::class, 'index']);

        // notifications
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
            Route::patch('/read-all', [NotificationController::class, 'markAllAsRead']);
            Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
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
            Route::apiResource('faculties', FacultyController::class)->except(['create', 'edit', 'store', 'update', 'destroy']);
            Route::apiResource('majors', MajorController::class)->except(['create', 'edit', 'store', 'update', 'destroy']);
            Route::apiResource('school-classes', SchoolClassController::class)->except(['create', 'edit', 'store', 'update', 'destroy']);
        });
        Route::middleware('permission:academic_structure.import')->group(function () {
            Route::post('faculties/bulk-delete', [FacultyController::class, 'bulkDestroy']);
            Route::apiResource('faculties', FacultyController::class)->only(['store', 'update', 'destroy']);
            Route::apiResource('majors', MajorController::class)->only(['store', 'update', 'destroy']);
            Route::apiResource('school-classes', SchoolClassController::class)->only(['store', 'update', 'destroy']);
        });
    });
});
