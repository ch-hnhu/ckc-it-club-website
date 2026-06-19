import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type {
	Course,
	CourseCategory,
	CourseTrack,
	CourseDetail,
	CourseLesson,
	CourseListParams,
	LessonDetail,
	VideoDetail,
} from "@/types/learning.types";

// ─── DỮ LIỆU MẪU (tạm thời) ─────────────────────────────────────────────────────
// TODO: Khi backend Learning Center sẵn sàng, thay phần mock bên dưới bằng:
//   getCourses: (params) => api.get<PaginatedResponse<Course>>("/learning/courses", params)
//   getCategories: () => api.get<ApiResponse<CourseCategory[]>>("/learning/categories")

const MOCK_CATEGORIES: CourseCategory[] = [
	{ id: 1, name: "Frontend", color: null },
	{ id: 2, name: "Backend", color: null },
	{ id: 3, name: "Ngôn ngữ", color: null },
	{ id: 4, name: "Design", color: null },
	{ id: 5, name: "Công cụ", color: null },
	{ id: 6, name: "Kỹ năng mềm", color: null },
];

const author = (id: number, full_name: string): Course["instructor"] => ({
	id,
	full_name,
	avatar: null,
	username: null,
});

const MOCK_COURSES: Course[] = [
	{
		id: 1,
		slug: "nhap-mon-lap-trinh-web",
		title: "Nhập môn Lập trình Web",
		excerpt:
			"Bắt đầu hành trình lập trình web từ con số 0: HTML, CSS và những khái niệm nền tảng để dựng giao diện đầu tiên của bạn.",
		thumbnail:
			"https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=1200&q=70",
		level: "beginner",
		instructor: author(1, "Nguyễn Văn A"),
		lessons_count: 18,
		duration_minutes: 240,
		enrolled_count: 132,
		categories: [MOCK_CATEGORIES[0]],
		is_featured: true,
		progress: null,
		created_at: "2026-06-01T08:00:00Z",
		updated_at: "2026-06-10T08:00:00Z",
	},
	{
		id: 2,
		slug: "javascript-tu-co-ban-den-nang-cao",
		title: "JavaScript từ cơ bản đến nâng cao",
		excerpt:
			"Nắm vững JavaScript hiện đại (ES6+): biến, hàm, bất đồng bộ, DOM và cách tư duy như một lập trình viên thực thụ.",
		thumbnail:
			"https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=1200&q=70",
		level: "intermediate",
		instructor: author(2, "Trần Thị B"),
		lessons_count: 26,
		duration_minutes: 420,
		enrolled_count: 98,
		categories: [MOCK_CATEGORIES[0], MOCK_CATEGORIES[2]],
		progress: null,
		created_at: "2026-05-20T08:00:00Z",
		updated_at: "2026-06-05T08:00:00Z",
	},
	{
		id: 3,
		slug: "react-cho-nguoi-moi",
		title: "React cho người mới bắt đầu",
		excerpt:
			"Xây dựng ứng dụng web tương tác với React 19: component, hooks, state và cách tổ chức dự án thực tế.",
		thumbnail:
			"https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=70",
		level: "intermediate",
		instructor: author(3, "Lê Văn C"),
		lessons_count: 22,
		duration_minutes: 360,
		enrolled_count: 76,
		categories: [MOCK_CATEGORIES[0]],
		progress: null,
		created_at: "2026-05-15T08:00:00Z",
		updated_at: "2026-06-02T08:00:00Z",
	},
	{
		id: 4,
		slug: "python-nhap-mon",
		title: "Python nhập môn",
		excerpt:
			"Làm quen ngôn ngữ lập trình phổ biến nhất hiện nay qua các ví dụ thực tế và bài tập tương tác.",
		thumbnail:
			"https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=70",
		level: "beginner",
		instructor: author(4, "Phạm Thị D"),
		lessons_count: 20,
		duration_minutes: 300,
		enrolled_count: 145,
		categories: [MOCK_CATEGORIES[2]],
		progress: null,
		created_at: "2026-05-10T08:00:00Z",
		updated_at: "2026-05-28T08:00:00Z",
	},
	{
		id: 5,
		slug: "git-va-github-cho-team",
		title: "Git & GitHub cho làm việc nhóm",
		excerpt:
			"Quản lý mã nguồn chuyên nghiệp: commit, branch, pull request và quy trình cộng tác trong dự án CLB.",
		thumbnail: null,
		level: "beginner",
		instructor: author(5, "Hoàng Văn E"),
		lessons_count: 12,
		duration_minutes: 150,
		enrolled_count: 67,
		categories: [MOCK_CATEGORIES[4]],
		progress: null,
		created_at: "2026-05-05T08:00:00Z",
		updated_at: "2026-05-22T08:00:00Z",
	},
	{
		id: 6,
		slug: "ui-ux-design-can-ban",
		title: "UI/UX Design căn bản",
		excerpt:
			"Nguyên tắc thiết kế giao diện, trải nghiệm người dùng và cách dùng Figma để tạo prototype.",
		thumbnail:
			"https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=70",
		level: "beginner",
		instructor: author(6, "Đỗ Thị F"),
		lessons_count: 15,
		duration_minutes: 200,
		enrolled_count: 54,
		categories: [MOCK_CATEGORIES[3]],
		progress: null,
		created_at: "2026-04-28T08:00:00Z",
		updated_at: "2026-05-18T08:00:00Z",
	},
	{
		id: 7,
		slug: "laravel-xay-dung-api",
		title: "Laravel: Xây dựng REST API",
		excerpt:
			"Thiết kế và xây dựng backend API với Laravel: route, controller, eloquent, xác thực và phân quyền.",
		thumbnail:
			"https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=1200&q=70",
		level: "advanced",
		instructor: author(2, "Trần Thị B"),
		lessons_count: 24,
		duration_minutes: 480,
		enrolled_count: 41,
		categories: [MOCK_CATEGORIES[1]],
		progress: null,
		created_at: "2026-04-20T08:00:00Z",
		updated_at: "2026-05-12T08:00:00Z",
	},
	{
		id: 8,
		slug: "ky-nang-thuyet-trinh",
		title: "Kỹ năng thuyết trình kỹ thuật",
		excerpt:
			"Trình bày ý tưởng và demo dự án thuyết phục: cấu trúc nội dung, slide và cách làm chủ sân khấu.",
		thumbnail: null,
		level: "beginner",
		instructor: author(6, "Đỗ Thị F"),
		lessons_count: 10,
		duration_minutes: 120,
		enrolled_count: 38,
		categories: [MOCK_CATEGORIES[5]],
		progress: null,
		created_at: "2026-04-15T08:00:00Z",
		updated_at: "2026-05-08T08:00:00Z",
	},
	{
		id: 9,
		slug: "typescript-thuc-chien",
		title: "TypeScript thực chiến",
		excerpt:
			"Viết JavaScript an toàn hơn với TypeScript: kiểu dữ liệu, generic, và tích hợp vào dự án React.",
		thumbnail:
			"https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1200&q=70",
		level: "intermediate",
		instructor: author(3, "Lê Văn C"),
		lessons_count: 16,
		duration_minutes: 260,
		enrolled_count: 49,
		categories: [MOCK_CATEGORIES[0], MOCK_CATEGORIES[2]],
		progress: null,
		created_at: "2026-04-10T08:00:00Z",
		updated_at: "2026-05-01T08:00:00Z",
	},
];

/** Lọc + phân trang trên dữ liệu mẫu (mô phỏng API thật). */
function paginate(items: Course[], page: number, perPage: number): PaginatedResponse<Course> {
	const total = items.length;
	const lastPage = Math.max(1, Math.ceil(total / perPage));
	const from = (page - 1) * perPage;
	const data = items.slice(from, from + perPage);
	return {
		success: true,
		message: "OK",
		data,
		meta: {
			current_page: page,
			from: from + 1,
			last_page: lastPage,
			per_page: perPage,
			to: from + data.length,
			total,
		},
		links: { first: "", last: "", prev: null, next: null },
	};
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Buổi học (lessons) ──────────────────────────────────────────────────────────

// Session dates cho khoá laravel: buổi 1-3 đã qua, buổi 4 sắp tới (không lock nhưng panel "chưa diễn ra"), 5-6 locked
const LARAVEL_SESSIONS = [
	"2026-06-01T08:00:00Z",
	"2026-06-08T08:00:00Z",
	"2026-06-15T08:00:00Z",
	"2026-06-22T08:00:00Z", // buổi gần nhất chưa tới — mở để click, nhưng hiện panel "chưa diễn ra"
	"2026-06-29T08:00:00Z", // locked (frontend)
	"2026-07-06T08:00:00Z", // locked (frontend)
];

const LESSON_BLUEPRINT: { title: string; summary: string; clubOnly?: boolean }[] = [
	{ title: "Giới thiệu & Cài đặt", summary: "Làm quen khóa học và chuẩn bị môi trường." },
	{ title: "Kiến thức nền tảng", summary: "Các khái niệm cơ bản đầu tiên." },
	{ title: "Cấu trúc & Logic", summary: "Điều kiện, rẽ nhánh và cách tư duy.", clubOnly: true },
	{ title: "Thực hành nâng cao", summary: "Vòng lặp và xử lý dữ liệu.", clubOnly: true },
	{ title: "Dự án Checkpoint", summary: "Vận dụng kiến thức vào một dự án nhỏ.", clubOnly: true },
	{
		title: "Tổng kết & Dự án cuối",
		summary: "Hoàn thiện và nhận chứng chỉ nội bộ.",
		clubOnly: true,
	},
];

/** Sinh danh sách buổi học; sessionStarts truyền vào để gán session_start/end cho từng buổi. */
function buildLessons(course: Course, sessionStarts?: string[]): CourseLesson[] {
	const doneCount =
		course.progress !== null
			? Math.round((course.progress / 100) * LESSON_BLUEPRINT.length)
			: 0;

	return LESSON_BLUEPRINT.map((bp, idx) => {
		const order = idx + 1;
		const completed = idx < doneCount;
		const start = sessionStarts?.[idx] ?? null;
		return {
			id: course.id * 100 + order,
			slug: `buoi-${order}`,
			order,
			title: bp.title,
			summary: bp.summary,
			club_only: bp.clubOnly,
			is_locked: false,
			completed,
			items_count: 10,
			session_start: start,
			// session_end = session_start + 3 giờ
			session_end: start
				? new Date(new Date(start).getTime() + 3 * 60 * 60 * 1000).toISOString()
				: null,
		};
	});
}

/** Danh sách video của một buổi học (dùng chung cho getLesson & getVideo). */
function buildLessonVideos(lesson: CourseLesson) {
	const done = Boolean(lesson.completed);
	return [
		{
			id: lesson.id + 1,
			slug: "video-1",
			title: "Giới thiệu buổi học",
			meta: "6 phút",
			duration: "6:00",
			completed: done,
		},
		{
			id: lesson.id + 2,
			slug: "video-2",
			title: "Bài giảng chính #1",
			meta: "18 phút",
			duration: "18:00",
			completed: done,
		},
		{
			id: lesson.id + 3,
			slug: "video-3",
			title: "Bài giảng chính #2",
			meta: "22 phút",
			duration: "22:00",
			completed: false,
		},
	];
}

function buildStats(course: Course): CourseDetail["stats"] {
	const ratio = course.progress !== null ? course.progress / 100 : 0;
	const attendanceTotal = LESSON_BLUEPRINT.length;
	const exercisesTotal = 43;
	const quizzesTotal = LESSON_BLUEPRINT.length;
	const xpTotal = 685;
	return {
		attendance_done: Math.round(attendanceTotal * ratio),
		attendance_total: attendanceTotal,
		exercises_done: Math.round(exercisesTotal * ratio),
		exercises_total: exercisesTotal,
		projects_done: ratio >= 0.5 ? 1 : 0,
		projects_total: 2,
		quizzes_done: Math.round(quizzesTotal * ratio),
		quizzes_total: quizzesTotal,
		xp_earned: Math.round(xpTotal * ratio),
		xp_total: xpTotal,
		badges_earned: Math.floor(LESSON_BLUEPRINT.length * ratio),
		badges_total: 8,
	};
}

// ── Cấu hình enrollment cho từng khoá — demo 4 trạng thái nút CTA ───────────────
//
//  nhap-mon-lap-trinh-web         → upcoming        → nút "Quan tâm"
//  javascript-tu-co-ban-den-nang-cao → enrollment_open → nút "Đăng ký"
//  react-cho-nguoi-moi            → closed + có lesson → nút "Bắt đầu học"
//  git-va-github-cho-team         → closed + chưa có lesson → nút "Quan tâm"
//  laravel-xay-dung-api           → enrolled offline + lesson locking theo session_start

type CourseConfig = {
	enrollment_track: CourseTrack | null;
	enrollment_start: string | null;
	enrollment_deadline: string | null;
	course_end: string | null;
	is_interested: boolean;
	emptyLessons?: boolean;
};

const COURSE_CONFIGS: Record<string, CourseConfig> = {
	"nhap-mon-lap-trinh-web": {
		enrollment_track: null,
		enrollment_start: "2026-07-01T00:00:00Z",
		enrollment_deadline: "2026-07-15T00:00:00Z",
		course_end: null,
		is_interested: true,
		emptyLessons: true,
	},
	"javascript-tu-co-ban-den-nang-cao": {
		enrollment_track: null,
		enrollment_start: "2026-06-10T00:00:00Z",
		enrollment_deadline: "2026-06-28T00:00:00Z",
		course_end: null,
		is_interested: false,
	},
	"react-cho-nguoi-moi": {
		enrollment_track: null,
		enrollment_start: "2026-05-15T00:00:00Z",
		enrollment_deadline: "2026-06-01T00:00:00Z",
		course_end: null,
		is_interested: false,
	},
	"git-va-github-cho-team": {
		enrollment_track: null,
		enrollment_start: "2026-05-05T00:00:00Z",
		enrollment_deadline: "2026-05-20T00:00:00Z",
		course_end: null,
		is_interested: false,
		emptyLessons: true, // đóng đăng ký nhưng chưa có bài học
	},
	"laravel-xay-dung-api": {
		enrollment_track: "offline",
		enrollment_start: "2026-05-01T00:00:00Z",
		enrollment_deadline: "2026-06-01T00:00:00Z",
		course_end: null,
		is_interested: false,
	},
};

const DEFAULT_CONFIG: CourseConfig = {
	enrollment_track: null,
	enrollment_start: null,
	enrollment_deadline: null,
	course_end: null,
	is_interested: false,
};

export const learningService = {
	getCourses: async (params?: CourseListParams): Promise<PaginatedResponse<Course>> => {
		await delay();
		const page = params?.page ?? 1;
		const perPage = params?.per_page ?? 9;
		const search = params?.search?.toLowerCase().trim();
		const category = params?.category;

		let result = [...MOCK_COURSES];
		if (search) {
			result = result.filter(
				(c) =>
					c.title.toLowerCase().includes(search) ||
					(c.excerpt ?? "").toLowerCase().includes(search),
			);
		}
		if (category) {
			result = result.filter((c) => c.categories.some((cat) => cat.name === category));
		}
		return paginate(result, page, perPage);
	},

	getCategories: async (): Promise<ApiResponse<CourseCategory[]>> => {
		await delay(100);
		return { success: true, message: "OK", data: MOCK_CATEGORIES };
	},

	getCourse: async (slug: string): Promise<ApiResponse<CourseDetail>> => {
		await delay();
		const course = MOCK_COURSES.find((c) => c.slug === slug);
		if (!course) {
			throw new Error("Không tìm thấy khóa học.");
		}

		const config = COURSE_CONFIGS[slug] ?? DEFAULT_CONFIG;
		const sessions = slug === "laravel-xay-dung-api" ? LARAVEL_SESSIONS : undefined;
		const lessons = config.emptyLessons ? [] : buildLessons(course, sessions);

		const detail: CourseDetail = {
			...course,
			description:
				`${course.excerpt ?? ""} Khóa học được thiết kế cho thành viên CLB với lộ trình rõ ràng: ` +
				"xem video bài giảng, đọc tài liệu tham khảo, luyện bài tập thực hành và kiểm tra kiến thức qua quiz. " +
				"Hoàn thành đầy đủ nội dung để nhận điểm và mở chứng chỉ nội bộ.",
			enrollment_track: config.enrollment_track,
			enrollment_start: config.enrollment_start,
			enrollment_deadline: config.enrollment_deadline,
			course_end: config.course_end,
			is_interested: config.is_interested,
			lessons,
			stats: buildStats(course),
		};

		return { success: true, message: "OK", data: detail };
	},

	getLesson: async (
		courseSlug: string,
		lessonSlug: string,
	): Promise<ApiResponse<LessonDetail>> => {
		await delay();
		const course = MOCK_COURSES.find((c) => c.slug === courseSlug);
		if (!course) {
			throw new Error("Không tìm thấy khóa học.");
		}
		const sessions = courseSlug === "laravel-xay-dung-api" ? LARAVEL_SESSIONS : undefined;
		const lessons = buildLessons(course, sessions);
		const idx = lessons.findIndex((l) => l.slug === lessonSlug);
		if (idx === -1) {
			throw new Error("Không tìm thấy buổi học.");
		}
		const lesson = lessons[idx];

		const done = Boolean(lesson.completed);
		const firstVideo = buildLessonVideos(lesson)[0];
		const detail: LessonDetail = {
			id: lesson.id,
			slug: lesson.slug,
			order: lesson.order,
			title: lesson.title,
			summary: lesson.summary,
			session_start: lesson.session_start ?? null,
			progress: done ? 100 : lesson.order === idx + 1 && idx === 0 ? 30 : null,
			course: { slug: course.slug, title: course.title, level: course.level },
			prev: idx > 0 ? { slug: lessons[idx - 1].slug, title: lessons[idx - 1].title } : null,
			next:
				idx < lessons.length - 1
					? { slug: lessons[idx + 1].slug, title: lessons[idx + 1].title }
					: null,
			video: {
				id: firstVideo.id,
				slug: firstVideo.slug,
				title: firstVideo.title,
				meta: firstVideo.meta,
				completed: firstVideo.completed,
			},
			reference: {
				id: lesson.id + 4,
				title: "Tài nguyên của buổi " + lesson.order,
				meta: "Google Drive",
				url: "",
				completed: done,
			},
			exercise: {
				id: lesson.id + 5,
				title: "Bài tập thực hành buổi " + lesson.order,
				meta: "Google Forms",
				url: "https://forms.google.com",
				completed: false,
			},
			quiz: {
				id: lesson.id + 6,
				slug: "quiz-1",
				title: "Quiz kiểm tra buổi " + lesson.order,
				meta: "10 câu hỏi",
				completed: done,
			},
		};

		return { success: true, message: "OK", data: detail };
	},

	getVideo: async (
		courseSlug: string,
		lessonSlug: string,
		videoSlug: string,
	): Promise<ApiResponse<VideoDetail>> => {
		await delay();
		const course = MOCK_COURSES.find((c) => c.slug === courseSlug);
		if (!course) {
			throw new Error("Không tìm thấy khóa học.");
		}
		const sessions = courseSlug === "laravel-xay-dung-api" ? LARAVEL_SESSIONS : undefined;
		const lessons = buildLessons(course, sessions);
		const lessonIdx = lessons.findIndex((l) => l.slug === lessonSlug);
		if (lessonIdx === -1) {
			throw new Error("Không tìm thấy buổi học.");
		}
		const lesson = lessons[lessonIdx];
		const videos = buildLessonVideos(lesson);
		const vIdx = videos.findIndex((v) => v.slug === videoSlug);
		if (vIdx === -1) {
			throw new Error("Không tìm thấy video.");
		}
		const current = videos[vIdx];
		const isLastVideo = vIdx === videos.length - 1;

		const detail: VideoDetail = {
			id: current.id,
			slug: current.slug,
			title: current.title,
			// Video mẫu (YouTube embed) — thay bằng URL thật khi có backend
			url: "https://www.youtube.com/embed/rfscVS0vtbw",
			duration: current.duration,
			xp: 30,
			completed: current.completed,
			course: { slug: course.slug, title: course.title },
			lesson: { slug: lesson.slug, title: lesson.title, order: lesson.order },
			playlist: videos.map((v) => ({
				id: v.id,
				slug: v.slug,
				title: v.title,
				duration: v.duration,
				completed: v.completed,
				current: v.slug === videoSlug,
			})),
			next_video: !isLastVideo
				? { slug: videos[vIdx + 1].slug, title: videos[vIdx + 1].title }
				: null,
			next_lesson:
				isLastVideo && lessonIdx < lessons.length - 1
					? { slug: lessons[lessonIdx + 1].slug, title: lessons[lessonIdx + 1].title }
					: null,
			chapters: [
				{ time: "00:00", seconds: 0, label: "Mở đầu" },
				{ time: "03:20", seconds: 200, label: "Khái niệm chính" },
				{ time: "09:45", seconds: 585, label: "Ví dụ thực hành" },
				{ time: "15:10", seconds: 910, label: "Tổng kết" },
			],
			attachments: [
				{ id: 1, title: "Slide bài giảng (PDF)", kind: "pdf" },
				{ id: 2, title: "Code mẫu (ZIP)", kind: "zip" },
			],
		};

		return { success: true, message: "OK", data: detail };
	},
};
