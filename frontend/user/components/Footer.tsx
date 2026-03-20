import React from 'react';
import { Facebook, Instagram, Mail, Github, Globe } from 'lucide-react';
import type { SocialLink } from '../src/types/index';

const SOCIAL_LINKS: SocialLink[] = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Mail, href: '#', label: 'Email' },
  { icon: Github, href: '#', label: 'Github' },
  { icon: Globe, href: '#', label: 'Website' },
];

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-slate-950 py-12 border-t border-white/5 overflow-hidden">
      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[100px] bg-blue-900/20 blur-[80px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6">
          
          {/* Social Links */}
          <div className="flex space-x-8">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-slate-500 hover:text-blue-400 transform hover:scale-110 transition-all duration-300"
                aria-label={item.label}
              >
                <item.icon className="h-6 w-6" />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} HCMUTE RTIC. All rights reserved.
            </p>
            <p className="text-xs text-slate-600">
              Made with passion for Technology & Innovation.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
