import React, { useEffect, useRef } from "react";
import { ArrowRight, Zap } from "lucide-react";

const FinalCTA: React.FC = () => {
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
    <section ref={sectionRef} id="join" className="neo-section bg-white">
      <div className="neo-container">
        <div
          className="fade-in-up relative overflow-hidden rounded-3xl border-2 border-black p-16 text-center"
          style={{
            background: "var(--color-primary)",
            boxShadow: "8px 8px 0px #111",
          }}
        >
          {/* Background decorative shapes */}
          <div
            className="absolute top-[-40px] left-[-40px] w-48 h-48 rounded-full border-2 border-black/20 opacity-30"
          />
          <div
            className="absolute bottom-[-60px] right-[-40px] w-64 h-64 rounded-full border-2 border-black/20 opacity-20"
          />
          <div
            className="absolute top-8 right-12 w-24 h-24 rounded-xl rotate-12 border-2 border-black/20 opacity-30"
          />

          <div className="relative z-10 space-y-6">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black bg-white text-sm font-bold"
              style={{ boxShadow: "2px 2px 0px #111" }}
            >
              <Zap className="w-4 h-4 text-yellow-500" />
              Miễn phí — Không cần kinh nghiệm
            </div>

            {/* Main headline */}
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-black leading-tight"
              style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}
            >
              Tham gia cộng đồng{" "}
              <span
                className="inline-block px-2 py-1 bg-white rounded-xl border-2 border-black"
                style={{ boxShadow: "3px 3px 0px #111" }}
              >
                1000+ sinh viên IT
              </span>{" "}
              ngay hôm nay
            </h2>

            {/* Sub text */}
            <p
              className="text-gray-800 text-xl max-w-2xl mx-auto"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Chỉ cần đam mê. Mọi thứ khác — tài nguyên, mentor, cộng đồng — chúng tôi đã có sẵn cho bạn.
            </p>

            {/* CTA Button */}
            <div>
              <a
                href="#"
                className="inline-flex items-center gap-3 px-10 py-4 bg-black text-white rounded-xl border-2 border-black text-lg font-bold transition-all hover:scale-105 hover:-translate-y-1 active:scale-95"
                style={{
                  fontFamily: "var(--font-heading)",
                  boxShadow: "4px 4px 0px rgba(0,0,0,0.3)",
                }}
              >
                Tham gia ngay miễn phí
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>

            {/* Trust micro-text */}
            <p className="text-sm text-black/60 font-medium">
              ✓ Không spam &nbsp;·&nbsp; ✓ Không mất tiền &nbsp;·&nbsp; ✓ Hủy bất cứ lúc nào
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
