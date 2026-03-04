import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Background Glow Effect - Mimicking the blue ambient light in the image */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      
      {/* Secondary accent glow */}
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Content Container */}
      <div className="relative z-10 text-center max-w-5xl mx-auto space-y-6">
        
        {/* University Badge */}
        <div className="animate-[fadeInUp_0.8s_ease-out_forwards] opacity-0">
          <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs md:text-sm font-medium tracking-wider text-slate-300 uppercase shadow-lg shadow-black/20">
            Trường Cao đẳng Kỹ thuật Cao Thắng
          </span>
        </div>

        {/* Main Title Group */}
        <div className="space-y-2 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards] opacity-0">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            CKC
          </h1>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-blue-100 drop-shadow-[0_0_35px_rgba(59,130,246,0.5)]">
            IT CLUB
          </h1>
        </div>

        {/* Subtitle */}
        <div className="animate-[fadeInUp_0.8s_ease-out_0.4s_forwards] opacity-0 pt-4">
          <p className="text-sm md:text-base font-medium tracking-[0.2em] text-slate-400 uppercase">
           Cao Thang Technical College Information Technology Club
          </p>
        </div>

        {/* Description */}
        <div className="animate-[fadeInUp_0.8s_ease-out_0.6s_forwards] opacity-0 max-w-3xl mx-auto pt-4">
          <p className="text-base md:text-lg text-slate-300 font-light leading-relaxed">
            CKC IT Club là một cộng đồng dành cho sinh viên đam mê khám phá, nghiên cứu và ứng dụng các công nghệ tiên tiến để tạo ra những giải pháp mang tính sáng tạo và thực tiễn.
          </p>
        </div>

        {/* Decorative Lines/Tech Elements */}
        <div className="absolute bottom-[-100px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
        <div className="absolute top-[-50px] left-10 w-[1px] h-40 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent opacity-50"></div>
        <div className="absolute bottom-[-50px] right-10 w-[1px] h-40 bg-gradient-to-t from-transparent via-blue-500/20 to-transparent opacity-50"></div>
      </div>
    </div>
  );
};

export default Hero;