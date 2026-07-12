<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\HttpStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Blog;
use App\Models\ClubApplication;
use App\Models\Comment;
use App\Models\Contact;
use App\Models\Course;
use App\Models\Event;
use App\Models\Post;
use App\Models\PostReport;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends BaseApiController
{
    /**
     * Thống kê tổng quan cho trang Dashboard.
     *
     * Trả về đầy đủ số liệu của mọi module cho bất kỳ tài khoản nào có
     * quyền `dashboard.view` — chỉ là số liệu tổng hợp (không phải danh
     * sách chi tiết), nên không cần thêm quyền riêng từng module. Việc
     * điều hướng vào trang quản lý chi tiết vẫn do quyền của module đó quyết định.
     */
    public function index(Request $request): JsonResponse
    {
        // Additional check to ensure user is authenticated
        if (! auth()->check()) {
            return $this->errorResponse(
                false,
                ApiMessage::UNAUTHORIZED->value,
                HttpStatus::UNAUTHORIZED
            );
        }

        Event::syncStatuses();

        $eventCounts = DB::table('events')
            ->whereNull('deleted_at')
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $upcomingEvents = Event::query()
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('start_at')->orWhere('start_at', '>=', now());
            })
            ->withCount('registrations')
            ->orderBy('start_at')
            ->limit(4)
            ->get()
            ->map(fn (Event $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'start_at' => $event->start_at,
                'registrations_count' => $event->registrations_count,
                'max_attendees' => $event->max_attendees,
            ]);

        return $this->successResponse(true, [
            'members' => [
                'total' => User::count(),
            ],
            'courses' => [
                'total' => Course::count(),
            ],
            'events' => [
                'total' => $eventCounts->sum(),
                'published' => (int) ($eventCounts['published'] ?? 0),
                'ongoing' => (int) ($eventCounts['ongoing'] ?? 0),
                'upcoming' => $upcomingEvents,
            ],
            'community' => [
                'posts_total' => Post::count(),
                'blogs_total' => Blog::count(),
                'comments_total' => Comment::count(),
                'resources_total' => Resource::count(),
            ],
            'queue' => [
                'reports_pending' => PostReport::where('status', 'pending')->count(),
                'resources_pending_review' => Resource::where('status', 'pending_review')->count(),
                'applications_pending' => ClubApplication::where('status', 'pending')->count(),
                'contacts_pending' => Contact::where('status', 'pending')->count(),
            ],
        ], ApiMessage::SUCCESS);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
