'use client';

import { Github, MessageCircle, Coffee, Heart } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-konbase-navy-blue text-konbase-light-gray py-3 mt-auto">
      <div className="container px-4 mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-4 text-center">
          {/* Logo and Name */}
          <a
            href="https://konbase.cfd"
            target="_blank"
            rel="noopener noreferrer"
            className="text-konbase-light-gray/80 hover:text-konbase-pastel-yellow transition-colors"
            aria-label="KonBase"
          >
            <div className="flex items-center space-x-2">
              <img
                src="/uploads/23ec7a1d-12fd-47d9-b8eb-080c0d7c18e5.png"
                alt="KonBase Logo"
                className="h-6 w-6"
              />
              <span className="font-bold text-sm text-konbase-pastel-yellow">
                KonBase
              </span>
            </div>
          </a>
          {/* Social icons */}
          <div className="flex space-x-3">
            <a
              href="https://github.com/KonBase/konbase-open-source"
              target="_blank"
              rel="noopener noreferrer"
              className="text-konbase-light-gray/80 hover:text-konbase-pastel-yellow transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://discord.gg/wt6JYqBRzU"
              target="_blank"
              rel="noopener noreferrer"
              className="text-konbase-light-gray/80 hover:text-konbase-pastel-yellow transition-colors"
              aria-label="Discord"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="https://buymeacoffee.com/konbase"
              target="_blank"
              rel="noopener noreferrer"
              className="text-konbase-light-gray/80 hover:text-konbase-pastel-yellow transition-colors"
              aria-label="Buy Me a Coffee"
            >
              <Coffee className="h-4 w-4" />
            </a>
          </div>

          {/* Copyright and links */}
          <div className="flex items-center flex-wrap gap-3 text-xs text-konbase-light-gray/70">
            <span>&copy; {currentYear} KonBase</span>
            <a
              href="https://konbase.cfd/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-konbase-pastel-yellow transition-colors"
            >
              Terms
            </a>
            <a
              href="https://konbase.cfd/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-konbase-pastel-yellow transition-colors"
            >
              Privacy
            </a>
            <span className="flex items-center">
              Built with <Heart className="mx-1 h-3 w-3 text-konbase-bright-pink" />{' '}
              by the Community
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
