import React, { useEffect, useRef } from "react";
import { Calendar, Clock, MapPin, BookOpen, User, Tag, ArrowRight } from "lucide-react";

const BLOG_POSTS = [
  {
    title: "Xây dựng REST API với Node.js và Express từ A đến Z",
    date: "24 tháng 3, 2025",
    tag: "Web Dev",
    tagBg: "var(--color-pastel-blue)",
    excerpt: "Hướng dẫn chi tiết từng bước xây dựng API backend cho dự án thực tế...",
    readTime: "8 phút đọc",
  },
  {
    title: "Giới thiệu Machine Learning cho người mới bắt đầu",
    date: "20 tháng 3, 2025",
    tag: "AI/ML",
    tagBg: "var(--color-pastel-green)",
    excerpt: "Bắt đầu hành trình AI không khó như bạn nghĩ. Cùng khám phá các khái niệm cơ bản...",
    readTime: "12 phút đọc",
  },
  {
    title: "Docker & Kubernetes: Containerize ứng dụng đơn giản",
    date: "16 tháng 3, 2025",
    tag: "DevOps",
    tagBg: "var(--color-pastel-yellow)",
    excerpt: "Container hóa ứng dụng giúp deploy nhanh hơn, ổn định hơn. Tìm hiểu ngay...",
    readTime: "10 phút đọc",
  },
];

const UPCOMING_EVENT = {
  title: "Hackathon CKC 2025 — Build for Impact",
  date: "15 tháng 4, 2025",
  time: "08:00 – 20:00",
  location: "Hội trường A — Cao Thắng",
  desc: "48 giờ để xây dựng sản phẩm giải quyết vấn đề thực tế. Giải thưởng 10 triệu đồng!",
  tag: "Hackathon",
  daysLeft: 18,
};

const COURSES = [
  {
    title: "React & TypeScript từ cơ bản đến nâng cao",
    instructor: "Nguyễn Văn An",
    level: "Intermediate",
    levelBg: "var(--color-pastel-blue)",
    students: 234,
    lessons: 32,
  },
  {
    title: "Python Data Science & Machine Learning",
    instructor: "Phạm Minh Châu",
    level: "Beginner",
    levelBg: "var(--color-pastel-green)",
    students: 189,
    lessons: 24,
  },
];

const FeaturedContent: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const items = el.querySelectorAll(".fade-in-up");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="blog" className="neo-section bg-white">
      <div className="neo-container">
        {/* Header */}
        <div className="text-center mb-14 fade-in-up">
          <div className="section-divider" />
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-black mt-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Nội dung nổi bật
          </h2>
          <p className="text-gray-500 mt-3">Blog, sự kiện và khóa học được cộng đồng yêu thích nhất</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Col 1: Blog posts */}
          <div className="fade-in-up space-y-5">
            <h3
              className="font-bold text-xl text-black pb-3 border-b-2 border-black"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              ✍️ Blog nổi bật
            </h3>
            {BLOG_POSTS.map((post, i) => (
              <a
                key={i}
                href="#blog"
                className="block neo-card bg-white p-5 no-underline"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <span
                  className="neo-tag text-[10px] mb-3 inline-block"
                  style={{ background: post.tagBg }}
                >
                  {post.tag}
                </span>
                <h4
                  className="font-bold text-sm text-black mb-2 line-clamp-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {post.title}
                </h4>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                  <span>{post.date}</span>
                </div>
              </a>
            ))}
            <a href="#blog" className="neo-btn neo-btn-secondary w-full justify-center text-sm">
              Xem tất cả bài viết <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Col 2: Event */}
          <div className="fade-in-up" style={{ transitionDelay: "0.1s" }}>
            <h3
              className="font-bold text-xl text-black pb-3 border-b-2 border-black mb-5"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              🎉 Event sắp diễn ra
            </h3>
            <div
              className="neo-card p-6 flex flex-col gap-4 h-full"
              style={{ background: "var(--color-pastel-pink)" }}
            >
              {/* Date badge */}
              <div className="flex items-start justify-between">
                <div
                  className="px-3 py-2 rounded-xl text-center border-2 border-black bg-white"
                  style={{ boxShadow: "2px 2px 0px #111" }}
                >
                  <div className="text-2xl font-extrabold text-black" style={{ fontFamily: "var(--font-heading)" }}>
                    15
                  </div>
                  <div className="text-xs font-bold uppercase text-gray-500">Tháng 4</div>
                </div>
                <span
                  className="neo-tag"
                  style={{ background: "var(--color-primary)" }}
                >
                  {UPCOMING_EVENT.tag}
                </span>
              </div>

              <h4
                className="text-lg font-extrabold text-black"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {UPCOMING_EVENT.title}
              </h4>
              <p className="text-sm text-gray-700">{UPCOMING_EVENT.desc}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-3.5 h-3.5" /> {UPCOMING_EVENT.time}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="w-3.5 h-3.5" /> {UPCOMING_EVENT.location}
                </div>
              </div>

              {/* Countdown */}
              <div
                className="mt-auto rounded-xl p-3 text-center border-2 border-black bg-white"
                style={{ boxShadow: "2px 2px 0px #111" }}
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Còn lại</span>
                <div className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", WebkitTextStroke: "1px #111" }}>
                  {UPCOMING_EVENT.daysLeft} ngày
                </div>
              </div>

              <a href="#events" className="neo-btn neo-btn-primary w-full justify-center text-sm">
                <Calendar className="w-4 h-4" /> Đăng ký tham gia
              </a>
            </div>
          </div>

          {/* Col 3: Courses */}
          <div className="fade-in-up space-y-5" style={{ transitionDelay: "0.2s" }}>
            <h3
              className="font-bold text-xl text-black pb-3 border-b-2 border-black"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              🎓 Course nổi bật
            </h3>
            {COURSES.map((course, i) => (
              <a
                key={i}
                href="#courses"
                className="block neo-card bg-white p-5 no-underline"
              >
                {/* Course thumbnail placeholder */}
                <div
                  className="w-full h-28 rounded-xl mb-4 flex items-center justify-center border-2 border-black"
                  style={{ background: `var(--color-pastel-${i === 0 ? 'blue' : 'green'})` }}
                >
                  <BookOpen className="w-10 h-10 text-black/40" />
                </div>
                <span
                  className="neo-tag text-[10px] mb-2 inline-block"
                  style={{ background: course.levelBg }}
                >
                  {course.level}
                </span>
                <h4
                  className="font-bold text-sm text-black mb-2 line-clamp-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {course.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{course.instructor}</span>
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{course.lessons} bài</span>
                </div>
              </a>
            ))}
            <a href="#courses" className="neo-btn neo-btn-secondary w-full justify-center text-sm">
              Xem tất cả khóa học <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedContent;
