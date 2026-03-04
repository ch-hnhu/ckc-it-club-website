import React, { useState, useEffect } from 'react';
import { Flame, LogIn } from 'lucide-react';
import type { NavItem } from '../types/index';

const NAV_ITEMS: NavItem[] = [
  { label: 'Hành Trình', href: '#journey' },
  { label: 'Dự Án', href: '#projects' },
  { label: 'Điểm Đến Của Bạn', href: '#destination' },
  { label: 'Sự Kiện', href: '#events' },
  { label: 'Bài Viết', href: '#articles' },
  { label: 'Định hướng phát triển', href: '#orientation' },
  { label: 'Minigame', href: '#minigame' },
];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/90 backdrop-blur-md border-b border-white/5 py-2'
          : 'bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between h-auto lg:h-16">
          
          {/* LEFT: Logo Section */}
          <div className="flex items-center justify-between w-full lg:w-1/4">
            <div className="flex items-center cursor-pointer group">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300 rounded-full"></div>
                <Flame className="h-8 w-8 text-blue-400 relative z-10" />
              </div>
              <span className="ml-2 text-xl font-bold tracking-wider text-white">CKC IT CLUB</span>
            </div>

            {/* Mobile Login Button (Visible only on mobile) */}
            <button className="lg:hidden flex items-center px-4 py-1.5 rounded-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-100 text-xs font-medium transition-all">
              <LogIn className="w-4 h-4 mr-1.5" />
              Đăng nhập
            </button>
          </div>

          {/* CENTER: Navigation Items */}
          <div className="mt-4 lg:mt-0 w-full lg:w-2/4 flex justify-center overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            <div className="flex items-center space-x-1 lg:space-x-4 min-w-max">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="
                    relative px-3 py-2 rounded-full lg:rounded-md 
                    text-sm font-medium 
                    text-slate-300 hover:text-white 
                    hover:bg-white/10 lg:hover:bg-transparent
                    transition-all duration-300 group whitespace-nowrap
                  "
                >
                  {item.label}
                  <span className="hidden lg:block absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                </a>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex lg:w-1/4 justify-end">
            <button className="group relative flex items-center px-6 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:bg-blue-500 transition-all duration-300 overflow-hidden">
              <span className="relative z-10 flex items-center">
                <LogIn className="w-4 h-4 mr-2" />
                Đăng nhập
              </span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out"></div>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
