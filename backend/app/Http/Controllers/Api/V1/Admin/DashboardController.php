<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ApiMessage;
use App\Enums\HttpStatus;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\Blog;
use App\Models\Board;
use App\Models\BoardTask;
use App\Models\ClubApplication;
use App\Models\Comment;
use App\Models\Contact;
use App\Models\Course;
use App\Models\CourseCertificate;
use App\Models\CourseEnrollment;
use App\Models\Event;
use App\Models\EventRegistration;
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

        // Xu hướng theo tháng (6 hoặc 12 tháng gần nhất, tính cả tháng hiện tại)
        $months = (int) $request->query('months', 6);
        $months = in_array($months, [6, 12], true) ? $months : 6;
        $trendStart = now()->startOfMonth()->subMonths($months - 1);

        $newMembersByMonth = $this->countByMonth(User::query(), $trendStart);
        $postsByMonth = $this->countByMonth(Post::query(), $trendStart);
        $registrationsByMonth = $this->countByMonth(EventRegistration::query(), $trendStart);

        $trends = [];
        for ($i = 0; $i < $months; $i++) {
            $month = $trendStart->copy()->addMonths($i);
            $key = $month->format('Y-m');
            $trends[] = [
                'month' => $key,
                'new_members' => (int) ($newMembersByMonth[$key] ?? 0),
                'posts' => (int) ($postsByMonth[$key] ?? 0),
                'event_registrations' => (int) ($registrationsByMonth[$key] ?? 0),
            ];
        }

        $enrollmentsTotal = CourseEnrollment::count();
        $enrollmentsCompleted = CourseEnrollment::whereNotNull('completed_at')->count();

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
            'learning' => [
                'enrollments_total' => $enrollmentsTotal,
                'enrollments_completed' => $enrollmentsCompleted,
                'completion_rate' => $enrollmentsTotal > 0
                    ? (int) round($enrollmentsCompleted / $enrollmentsTotal * 100)
                    : 0,
                'certificates_issued' => CourseCertificate::whereNull('revoked_at')->count(),
            ],
            'projecthub' => [
                'boards_active' => Board::where('is_archived', false)->count(),
                'tasks_open' => BoardTask::whereNull('completed_at')->count(),
                'tasks_completed' => BoardTask::whereNotNull('completed_at')->count(),
            ],
            'trends' => $trends,
        ], ApiMessage::SUCCESS);
    }

    /**
     * Đếm số bản ghi theo tháng tạo (key dạng YYYY-MM) kể từ $start.
     */
    private function countByMonth(\Illuminate\Database\Eloquent\Builder $query, \Carbon\Carbon $start): \Illuminate\Support\Collection
    {
        return $query
            ->where('created_at', '>=', $start)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as ym, COUNT(*) as count")
            ->groupBy('ym')
            ->pluck('count', 'ym');
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
