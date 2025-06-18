'use client';

import React from 'react';
import Link from 'next/link';
import { useMobileDetect } from '@/hooks/useMobileDetect';

const DashboardFooter: React.FC = () => {
  const { isMobile } = useMobileDetect();

  return (
    <footer className="border-t py-4 bg-background">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} KonBase</div>
          {!isMobile && <span className="hidden md:inline">·</span>}
          <div>Open Source Supply Chain Management</div>
        </div>

        <div className={`flex gap-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          <Link
            href="/terms"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <a
            href="https://github.com/KonBase/KonBase"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
